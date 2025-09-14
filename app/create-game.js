import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../firebase/firebaseConfig';

export default function CreateGame() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const gameId = params?.gameId || null;
  const isEditing = !!gameId;
  const [gameType, setGameType] = useState('quiz'); // quiz, memory, puzzle
  const [gameTitle, setGameTitle] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [points, setPoints] = useState('50');
  const [questions, setQuestions] = useState([{
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  }]);
  const [memoryCards, setMemoryCards] = useState(4); // Number of pairs for memory game
  const [memoryPairs, setMemoryPairs] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);
  const [wordPuzzleWords, setWordPuzzleWords] = useState([{
    word: '',
    hint: ''
  }]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load existing game for editing
  useEffect(() => {
    const loadGame = async () => {
      try {
        if (!isEditing) return;
        const snap = await getDoc(doc(db, 'customGames', String(gameId)));
        if (snap.exists()) {
          const data = snap.data();
          setGameType(data.type || 'quiz');
          setGameTitle(data.title || '');
          setGameDescription(data.description || '');
          setSubject(data.subject || '');
          setDifficulty(data.difficulty || 'Easy');
          setPoints(String(data.points || '50'));
          if (data.questions) setQuestions(data.questions);
          if (data.memoryPairs) {
            setMemoryPairs(data.memoryPairs);
            setMemoryCards(data.memoryPairs.length);
          }
          if (data.wordPuzzleWords) setWordPuzzleWords(data.wordPuzzleWords);
        }
      } catch (e) {
        console.error('Failed to load game for editing:', e);
      }
    };
    loadGame();
  }, [gameId]);

  const addWordPuzzle = () => {
    setWordPuzzleWords([...wordPuzzleWords, {
      word: '',
      hint: ''
    }]);
  };

  const updateWordPuzzle = (index, field, value) => {
    const updatedWords = [...wordPuzzleWords];
    updatedWords[index][field] = value;
    setWordPuzzleWords(updatedWords);
  };

  const removeWordPuzzle = (index) => {
    if (wordPuzzleWords.length > 1) {
      const updatedWords = wordPuzzleWords.filter((_, i) => i !== index);
      setWordPuzzleWords(updatedWords);
    }
  };

  const updateMemoryPair = (index, field, value) => {
    const updatedPairs = [...memoryPairs];
    updatedPairs[index][field] = value;
    setMemoryPairs(updatedPairs);
  };

  const addMemoryPair = () => {
    if (memoryPairs.length < 12) {
      setMemoryPairs([...memoryPairs, { question: '', answer: '' }]);
      setMemoryCards(memoryPairs.length + 1);
    }
  };

  const removeMemoryPair = (index) => {
    if (memoryPairs.length > 2) {
      const updatedPairs = memoryPairs.filter((_, i) => i !== index);
      setMemoryPairs(updatedPairs);
      setMemoryCards(updatedPairs.length);
    }
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }]);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions);
    }
  };

  const validateGame = () => {
    if (!gameTitle.trim()) {
      Alert.alert('Error', 'Please enter a game title');
      return false;
    }
    if (!gameDescription.trim()) {
      Alert.alert('Error', 'Please enter a game description');
      return false;
    }
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return false;
    }
    
    if (gameType === 'quiz') {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question.question.trim()) {
          Alert.alert('Error', `Please enter question ${i + 1}`);
          return false;
        }
        for (let j = 0; j < question.options.length; j++) {
          if (!question.options[j].trim()) {
            Alert.alert('Error', `Please fill all options for question ${i + 1}`);
            return false;
          }
        }
      }
    } else if (gameType === 'puzzle') {
      for (let i = 0; i < wordPuzzleWords.length; i++) {
        const wordData = wordPuzzleWords[i];
        if (!wordData.word.trim()) {
          Alert.alert('Error', `Please enter word ${i + 1}`);
          return false;
        }
        if (!wordData.hint.trim()) {
          Alert.alert('Error', `Please enter hint for word ${i + 1}`);
          return false;
        }
      }
    } else if (gameType === 'memory') {
      if (memoryCards < 2 || memoryCards > 12) {
        Alert.alert('Error', 'Memory game must have between 2 and 12 pairs');
        return false;
      }
      for (let i = 0; i < memoryCards; i++) {
        const pair = memoryPairs[i];
        if (!pair || !pair.question.trim()) {
          Alert.alert('Error', `Please enter question for pair ${i + 1}`);
          return false;
        }
        if (!pair.answer.trim()) {
          Alert.alert('Error', `Please enter answer for pair ${i + 1}`);
          return false;
        }
      }
    }
    return true;
  };

  const createGame = async () => {
    if (!validateGame()) return;
    
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Please sign in to create games');
        return;
      }

      const gameData = {
        title: gameTitle.trim(),
        description: gameDescription.trim(),
        subject: subject.trim(),
        difficulty,
        points: parseInt(points),
        type: gameType,
        createdBy: userId,
        createdByName: auth.currentUser?.displayName || auth.currentUser?.email || 'Tutor',
        isActive: true,
        playCount: 0,
        averageScore: 0
      };

      // Add game-specific data
      if (gameType === 'quiz') {
        gameData.questions = questions;
      } else if (gameType === 'memory') {
        gameData.memoryCards = memoryCards;
        gameData.memoryPairs = memoryPairs.slice(0, memoryCards);
      } else if (gameType === 'puzzle') {
        gameData.wordPuzzleWords = wordPuzzleWords;
      }

      if (isEditing) {
        // Do not overwrite createdAt on edit
        await updateDoc(doc(db, 'customGames', String(gameId)), gameData);
        Alert.alert(
          'Saved', 
          'Your changes have been saved successfully.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        await addDoc(collection(db, 'customGames'), { ...gameData, createdAt: serverTimestamp() });
        Alert.alert(
          'Success!', 
          'Your game has been created successfully. Students can now play it!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert('Error', 'Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Game' : 'Create Game'}</Text>
        <TouchableOpacity onPress={() => setShowPreview(true)}>
          <Ionicons name="eye" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Game Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Type</Text>
          <View style={styles.gameTypeContainer}>
            {[
              { type: 'quiz', label: 'Quiz Game', icon: 'help-circle' },
              { type: 'memory', label: 'Memory Challenge', icon: 'brain' },
              { type: 'puzzle', label: 'Word Puzzle', icon: 'grid' }
            ].map(({ type, label, icon }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.gameTypeButton,
                  gameType === type && styles.selectedGameType
                ]}
                onPress={() => setGameType(type)}
              >
                <Ionicons 
                  name={icon} 
                  size={24} 
                  color={gameType === type ? '#fff' : '#4CAF50'} 
                />
                <Text style={[
                  styles.gameTypeText,
                  gameType === type && styles.selectedGameTypeText
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Basic Game Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Game Title</Text>
            <TextInput
              style={styles.textInput}
              value={gameTitle}
              onChangeText={setGameTitle}
              placeholder="Enter an exciting game title"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={gameDescription}
              onChangeText={setGameDescription}
              placeholder="Describe what this game is about"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.textInput}
                value={subject}
                onChangeText={setSubject}
                placeholder="Math, Science, etc."
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Points</Text>
              <TextInput
                style={styles.textInput}
                value={points}
                onChangeText={setPoints}
                placeholder="50"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Difficulty</Text>
            <View style={styles.difficultyContainer}>
              {['Easy', 'Medium', 'Hard'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    difficulty === level && styles.selectedDifficulty
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text style={[
                    styles.difficultyText,
                    difficulty === level && styles.selectedDifficultyText
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Questions Section (only for quiz type) */}
        {gameType === 'quiz' && (
          <View style={styles.section}>
            <View style={styles.questionsHeader}>
              <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
              <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Question</Text>
              </TouchableOpacity>
            </View>

            {questions.map((question, questionIndex) => (
              <View key={questionIndex} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Question {questionIndex + 1}</Text>
                  {questions.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeQuestion(questionIndex)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={[styles.textInput, { marginBottom: 12 }]}
                  value={question.question}
                  onChangeText={(value) => updateQuestion(questionIndex, 'question', value)}
                  placeholder="Enter your question here"
                  multiline
                />

                {question.options.map((option, optionIndex) => (
                  <View key={optionIndex} style={styles.optionRow}>
                    <TouchableOpacity
                      style={[
                        styles.correctButton,
                        question.correctAnswer === optionIndex && styles.correctButtonActive
                      ]}
                      onPress={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                    >
                      <Ionicons 
                        name={question.correctAnswer === optionIndex ? 'checkmark' : 'radio-button-off'} 
                        size={16} 
                        color={question.correctAnswer === optionIndex ? '#fff' : '#4CAF50'} 
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginLeft: 8 }]}
                      value={option}
                      onChangeText={(value) => updateOption(questionIndex, optionIndex, value)}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Memory Game Configuration */}
        {gameType === 'memory' && (
          <View style={styles.section}>
            <View style={styles.questionsHeader}>
              <Text style={styles.sectionTitle}>Question-Answer Pairs ({memoryPairs.length})</Text>
              <TouchableOpacity style={styles.addButton} onPress={addMemoryPair}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Pair</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.memoryDescription}>
              Create question-answer pairs. Students will need to match questions with their corresponding answers.
            </Text>

            {memoryPairs.map((pair, index) => (
              <View key={index} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Pair {index + 1}</Text>
                  {memoryPairs.length > 2 && (
                    <TouchableOpacity 
                      onPress={() => removeMemoryPair(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Question</Text>
                  <TextInput
                    style={styles.textInput}
                    value={pair.question}
                    onChangeText={(value) => updateMemoryPair(index, 'question', value)}
                    placeholder="Enter the question (e.g., What is 2+2?)"
                    multiline
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Answer</Text>
                  <TextInput
                    style={styles.textInput}
                    value={pair.answer}
                    onChangeText={(value) => updateMemoryPair(index, 'answer', value)}
                    placeholder="Enter the answer (e.g., 4)"
                    multiline
                  />
                </View>
              </View>
            ))}
            
            <Text style={styles.memoryHint}>
              💡 Tip: Keep questions and answers concise so they fit well on the cards!
            </Text>
          </View>
        )}

        {/* Word Puzzle Configuration */}
        {gameType === 'puzzle' && (
          <View style={styles.section}>
            <View style={styles.questionsHeader}>
              <Text style={styles.sectionTitle}>Word Puzzles ({wordPuzzleWords.length})</Text>
              <TouchableOpacity style={styles.addButton} onPress={addWordPuzzle}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Word</Text>
              </TouchableOpacity>
            </View>

            {wordPuzzleWords.map((wordData, index) => (
              <View key={index} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Word {index + 1}</Text>
                  {wordPuzzleWords.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeWordPuzzle(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Word</Text>
                  <TextInput
                    style={styles.textInput}
                    value={wordData.word}
                    onChangeText={(value) => updateWordPuzzle(index, 'word', value.toUpperCase())}
                    placeholder="Enter the word (e.g., SCIENCE)"
                    maxLength={15}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Hint</Text>
                  <TextInput
                    style={styles.textInput}
                    value={wordData.hint}
                    onChangeText={(value) => updateWordPuzzle(index, 'hint', value)}
                    placeholder="Give a helpful hint for this word"
                    multiline
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Create Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={createGame}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Game')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModal}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Game Preview</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.previewContent}>
              <Text style={styles.previewGameTitle}>{gameTitle || 'Untitled Game'}</Text>
              <Text style={styles.previewGameDescription}>{gameDescription || 'No description'}</Text>
              <Text style={styles.previewGameMeta}>{subject} • {difficulty} • {points} points</Text>
              
              {gameType === 'quiz' && questions.length > 0 && (
                <View style={styles.previewQuestions}>
                  <Text style={styles.previewQuestionsTitle}>Sample Question:</Text>
                  <Text style={styles.previewQuestion}>{questions[0].question || 'No question text'}</Text>
                  {questions[0].options.map((option, index) => (
                    <Text key={index} style={[
                      styles.previewOption,
                      questions[0].correctAnswer === index && styles.previewCorrectOption
                    ]}>
                      {index + 1}. {option || `Option ${index + 1}`}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  gameTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  gameTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
  },
  selectedGameType: {
    backgroundColor: '#4CAF50',
  },
  gameTypeText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedGameTypeText: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedDifficulty: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  difficultyText: {
    fontSize: 14,
    color: '#666',
  },
  selectedDifficultyText: {
    color: '#fff',
    fontWeight: '600',
  },
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  questionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  removeButton: {
    padding: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  correctButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctButtonActive: {
    backgroundColor: '#4CAF50',
  },
  comingSoonContainer: {
    alignItems: 'center',
    padding: 40,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  previewContent: {
    padding: 16,
  },
  previewGameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  previewGameDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  previewGameMeta: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 20,
  },
  previewQuestions: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  previewQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  previewQuestion: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  previewOption: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewCorrectOption: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  memoryCardsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  memoryCardButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedMemoryCard: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  memoryCardText: {
    fontSize: 14,
    color: '#666',
  },
  selectedMemoryCardText: {
    color: '#fff',
    fontWeight: '600',
  },
  symbolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symbolButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  symbolText: {
    fontSize: 20,
  },
  symbolHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  memoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  memoryHint: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});