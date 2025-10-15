import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { GalaxyAnimation } from '../components/GalaxyAnimation';
import { GalaxyColors, cosmicGray, starGold, nebulaPink, cosmicBlue, spacePurple } from '../constants/GalaxyColors';
import { GlobalStyles } from '../constants/GlobalStyles';
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
      {/* Galaxy Background */}
      <LinearGradient
        colors={[spacePurple[900], cosmicBlue[800], cosmicGray[900]]}
        style={styles.backgroundGradient}
      />
      <GalaxyAnimation style={styles.galaxyAnimation} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={starGold[400]} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons 
            name={isEditing ? "create" : "add-circle-outline"} 
            size={28} 
            color={starGold[400]} 
          />
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Cosmic Game' : 'Create Cosmic Game'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowPreview(true)}
          style={styles.headerButton}
        >
          <Ionicons name="eye" size={24} color={starGold[400]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Game Type Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="game-controller" size={24} color={nebulaPink[400]} />
            <Text style={styles.sectionTitle}>Choose Game Type</Text>
          </View>
          <View style={styles.gameTypeContainer}>
            {[
              { 
                type: 'quiz', 
                label: 'Quiz Galaxy', 
                icon: 'help-circle-outline',
                description: 'Interactive Q&A challenges',
                gradient: [cosmicBlue[400], cosmicBlue[600]]
              },
              { 
                type: 'memory', 
                label: 'Memory Nebula', 
                icon: 'grid-outline',
                description: 'Card matching adventures',
                gradient: [spacePurple[400], spacePurple[600]]
              },
              { 
                type: 'puzzle', 
                label: 'Word Constellation', 
                icon: 'extension-puzzle-outline',
                description: 'Word finding mysteries',
                gradient: [starGold[400], starGold[600]]
              }
            ].map(({ type, label, icon, description, gradient }) => (
              <LinearGradient
                key={type}
                colors={gameType === type ? gradient : [cosmicGray[700], cosmicGray[800]]}
                style={[
                  styles.gameTypeButton,
                  gameType === type && styles.selectedGameType
                ]}
              >
                <TouchableOpacity
                  style={styles.gameTypeContent}
                  onPress={() => setGameType(type)}
                >
                  <View style={styles.gameTypeIconContainer}>
                    <Ionicons 
                      name={icon} 
                      size={28} 
                      color={gameType === type ? cosmicGray[50] : cosmicGray[300]} 
                    />
                  </View>
                  <View style={styles.gameTypeTextContainer}>
                    <Text style={[
                      styles.gameTypeText,
                      gameType === type && styles.selectedGameTypeText
                    ]}>
                      {label}
                    </Text>
                    <Text style={[
                      styles.gameTypeDescription,
                      gameType === type && styles.selectedGameTypeDescription
                    ]}>
                      {description}
                    </Text>
                  </View>
                  {gameType === type && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color={starGold[400]} />
                    </View>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </View>
        </View>

        {/* Basic Game Info */}
        <LinearGradient
          colors={[cosmicBlue[800], spacePurple[700]]}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={starGold[400]} />
            <Text style={styles.sectionTitle}>Game Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="text" size={16} color={starGold[400]} /> Game Title
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={gameTitle}
                onChangeText={setGameTitle}
                placeholder="Enter an exciting game title"
                placeholderTextColor={cosmicGray[400]}
                maxLength={50}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="document-text" size={16} color={starGold[400]} /> Description
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={gameDescription}
                onChangeText={setGameDescription}
                placeholder="Describe what this cosmic adventure is about..."
                placeholderTextColor={cosmicGray[400]}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>
                <Ionicons name="school" size={16} color={starGold[400]} /> Subject
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Math, Science, etc."
                  placeholderTextColor={cosmicGray[400]}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>
                <Ionicons name="star" size={16} color={starGold[400]} /> Points
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={points}
                  onChangeText={setPoints}
                  placeholder="50"
                  placeholderTextColor={cosmicGray[400]}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="speedometer" size={16} color={starGold[400]} /> Difficulty Level
            </Text>
            <View style={styles.difficultyContainer}>
              {[
                { level: 'Easy', icon: 'flower', color: nebulaPink[400] },
                { level: 'Medium', icon: 'planet', color: cosmicBlue[400] },
                { level: 'Hard', icon: 'rocket', color: spacePurple[400] }
              ].map(({ level, icon, color }) => (
                <LinearGradient
                  key={level}
                  colors={difficulty === level 
                    ? [color, `${color}CC`]
                    : [cosmicGray[700], cosmicGray[800]]
                  }
                  style={[
                    styles.difficultyButton,
                    difficulty === level && styles.selectedDifficulty
                  ]}
                >
                  <TouchableOpacity
                    style={styles.difficultyContent}
                    onPress={() => setDifficulty(level)}
                  >
                    <Ionicons 
                      name={icon} 
                      size={20} 
                      color={difficulty === level ? cosmicGray[50] : cosmicGray[300]}
                    />
                    <Text style={[
                      styles.difficultyText,
                      difficulty === level && styles.selectedDifficultyText
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Questions Section (only for quiz type) */}
        {gameType === 'quiz' && (
          <View style={styles.section}>
            <View style={styles.questionsHeader}>
              <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
              <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
                <Ionicons name="add-circle" size={18} color={cosmicGray[50]} />
                <Text style={styles.addButtonText}>Add Cosmic Question</Text>
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
                <Ionicons name="planet" size={18} color={cosmicGray[50]} />
                <Text style={styles.addButtonText}>Add Memory Pair</Text>
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
                <Ionicons name="telescope" size={18} color={cosmicGray[50]} />
                <Text style={styles.addButtonText}>Add Puzzle Word</Text>
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
            <LinearGradient
              colors={loading ? [cosmicGray[600], cosmicGray[700]] : [starGold[500], starGold[700]]}
              style={styles.createButtonGradient}
            >
              <Ionicons 
                name={isEditing ? "save" : "rocket"} 
                size={20} 
                color={loading ? cosmicGray[300] : cosmicGray[50]} 
              />
              <Text style={[styles.createButtonText, loading && styles.disabledButtonText]}>
                {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Cosmic Game')}
              </Text>
            </LinearGradient>
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
          <LinearGradient
            colors={[spacePurple[900], cosmicBlue[800], cosmicGray[900]]}
            style={styles.previewModal}
          >
            <View style={styles.previewHeader}>
              <View style={styles.previewTitleContainer}>
                <Ionicons name="eye" size={24} color={starGold[400]} />
                <Text style={styles.previewTitle}>Cosmic Game Preview</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowPreview(false)}
                style={styles.previewCloseButton}
              >
                <Ionicons name="close" size={24} color={starGold[400]} />
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
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cosmicGray[900],
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  galaxyAnimation: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${cosmicGray[800]}80`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: starGold[400],
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: starGold[400],
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: cosmicBlue[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: starGold[400],
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gameTypeContainer: {
    gap: 16,
  },
  gameTypeButton: {
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: spacePurple[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  gameTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  gameTypeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameTypeTextContainer: {
    flex: 1,
  },
  selectedGameType: {
    borderColor: starGold[400],
    borderWidth: 2,
  },
  gameTypeText: {
    fontSize: 16,
    fontWeight: '700',
    color: cosmicGray[300],
    marginBottom: 4,
  },
  selectedGameTypeText: {
    color: cosmicGray[50],
  },
  gameTypeDescription: {
    fontSize: 12,
    color: cosmicGray[400],
  },
  selectedGameTypeDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: starGold[400],
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: cosmicGray[50],
    backgroundColor: 'transparent',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: nebulaPink[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  selectedDifficulty: {
    borderColor: starGold[400],
    borderWidth: 2,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    color: cosmicGray[300],
  },
  selectedDifficultyText: {
    color: cosmicGray[50],
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
    backgroundColor: nebulaPink[500],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: nebulaPink[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: cosmicGray[50],
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  questionCard: {
    backgroundColor: `${cosmicGray[800]}60`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: nebulaPink[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: starGold[400],
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    paddingHorizontal: 20,
  },
  createButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: starGold[400],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  createButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: cosmicGray[50],
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  disabledButtonText: {
    color: cosmicGray[300],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 33, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModal: {
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: nebulaPink[400],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: `${cosmicGray[800]}80`,
  },
  previewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: starGold[400],
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  previewCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${cosmicGray[800]}80`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: starGold[400],
  },
  previewContent: {
    padding: 24,
  },
  previewGameTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: starGold[400],
    marginBottom: 12,
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  previewGameDescription: {
    fontSize: 16,
    color: cosmicGray[50],
    marginBottom: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  previewGameMeta: {
    fontSize: 14,
    color: nebulaPink[400],
    marginBottom: 24,
    fontWeight: '600',
  },
  previewQuestions: {
    backgroundColor: `${cosmicGray[800]}60`,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewQuestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: starGold[400],
    marginBottom: 16,
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  previewQuestion: {
    fontSize: 16,
    color: cosmicGray[50],
    marginBottom: 16,
    lineHeight: 24,
  },
  previewOption: {
    fontSize: 14,
    color: cosmicGray[300],
    marginBottom: 8,
    paddingLeft: 12,
  },
  previewCorrectOption: {
    color: nebulaPink[400],
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
