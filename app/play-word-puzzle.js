import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
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

const { width } = Dimensions.get('window');

export default function PlayWordPuzzle() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { gameId } = params;

  const [gameData, setGameData] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [completedWords, setCompletedWords] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameData();
  }, []);

  useEffect(() => {
    let interval;
    if (gameStarted && !gameComplete) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameComplete]);

  const loadGameData = async () => {
    try {
      const gameDoc = await getDoc(doc(db, 'customGames', gameId));
      if (gameDoc.exists()) {
        const data = gameDoc.data();
        console.log('Loaded game data:', data); // Debug log
        initializeGame(data);
      } else {
        Alert.alert('Error', 'Game not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading game:', error);
      Alert.alert('Error', 'Failed to load game');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const initializeGame = (data) => {
    // Normalize the data structure - handle both puzzleWords and wordPuzzleWords
    const puzzleWords = data.puzzleWords || data.wordPuzzleWords;
    
    // Add validation for game data
    if (!data || !puzzleWords || !Array.isArray(puzzleWords) || puzzleWords.length === 0) {
      console.error('Invalid game data:', data);
      Alert.alert('Error', 'Invalid game data. Please try again.');
      router.back();
      return;
    }

    // Normalize the game data structure
    const normalizedData = {
      ...data,
      puzzleWords: puzzleWords
    };
    setGameData(normalizedData);

    setCurrentWordIndex(0);
    setUserGuess('');
    setCompletedWords([]);
    setAttempts(0);
    setGameComplete(false);
    setShowHint(false);
    setTimer(0);
    setGameStarted(false);
    setShowSuccess(false);
    setEarnedPoints(0);
  };

  const handleGuessSubmit = () => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    // Add null safety check
    if (!gameData || !gameData.puzzleWords || !gameData.puzzleWords[currentWordIndex]) {
      Alert.alert('Error', 'Game data not available');
      return;
    }

    const currentWord = gameData.puzzleWords[currentWordIndex];
    const normalizedGuess = userGuess.toLowerCase().trim();
    const normalizedAnswer = currentWord.word.toLowerCase().trim();

    setAttempts(attempts + 1);

    if (normalizedGuess === normalizedAnswer) {
      const newCompletedWords = [...completedWords, currentWordIndex];
      setCompletedWords(newCompletedWords);
      setUserGuess('');
      setShowHint(false);

      if (newCompletedWords.length === gameData.puzzleWords.length) {
        completeGame();
      } else {
        setCurrentWordIndex(currentWordIndex + 1);
      }
    } else {
      Alert.alert('Incorrect', 'Try again! Use the hint if you need help.');
    }
  };

  const skipWord = () => {
    // Add null safety check
    if (!gameData || !gameData.puzzleWords) {
      Alert.alert('Error', 'Game data not available');
      return;
    }

    if (currentWordIndex < gameData.puzzleWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserGuess('');
      setShowHint(false);
    }
  };

  const completeGame = async () => {
    setGameComplete(true);
    
    // Add null safety check
    if (!gameData || !gameData.puzzleWords) {
      console.error('Game data not available for completion');
      return;
    }
    
    let points = gameData.points || 150;
    const accuracy = gameData.puzzleWords.length / attempts;
    if (accuracy > 0.8) points += 50; // Bonus for high accuracy
    if (timer < 120) points += 30; // Bonus for quick completion
    if (!showHint) points += 20; // Bonus for not using hints

    setEarnedPoints(Math.round(points));

    try {
      await updateDoc(doc(db, 'customGames', gameId), {
        playCount: increment(1)
      });

      const userId = auth.currentUser?.uid;
      if (userId) {
        const escapeRoomDoc = await getDoc(doc(db, 'escapeRoom', userId));
        if (escapeRoomDoc.exists()) {
          await updateDoc(doc(db, 'escapeRoom', userId), {
            totalPoints: increment(Math.round(points))
          });
        }
      }

      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const restartGame = () => {
    setShowSuccess(false);
    if (gameData) {
      // Re-initialize with the original data structure
      const puzzleWords = gameData.puzzleWords || gameData.wordPuzzleWords;
      const normalizedData = {
        ...gameData,
        puzzleWords: puzzleWords
      };
      initializeGame(normalizedData);
    }
  };

  const scrambleWord = (word) => {
    if (!word || typeof word !== 'string') {
      return '';
    }
    return word.split('').sort(() => Math.random() - 0.5).join('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get puzzleWords from either field name for compatibility
  const puzzleWords = gameData?.puzzleWords || gameData?.wordPuzzleWords;
  
  if (!gameData || !puzzleWords || !Array.isArray(puzzleWords) || puzzleWords.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#FF9800" />
          <Text style={styles.errorTitle}>Invalid Game Data</Text>
          <Text style={styles.errorMessage}>This game appears to be corrupted or missing puzzle words.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentWord = puzzleWords[currentWordIndex];
  const progress = ((currentWordIndex + 1) / puzzleWords.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{gameData.title}</Text>
          <Text style={styles.headerSubtitle}>{gameData.subject} • {gameData.difficulty}</Text>
        </View>
        <TouchableOpacity onPress={restartGame}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{formatTime(timer)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Words</Text>
          <Text style={styles.statValue}>{completedWords.length}/{puzzleWords?.length || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Attempts</Text>
          <Text style={styles.statValue}>{attempts}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Word {currentWordIndex + 1} of {puzzleWords?.length || 0}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {!gameComplete && currentWord && (
          <View style={styles.puzzleContainer}>
            <Text style={styles.clueLabel}>Clue:</Text>
            <Text style={styles.clueText}>{currentWord.clue}</Text>

            <View style={styles.scrambledContainer}>
              <Text style={styles.scrambledLabel}>Scrambled Word:</Text>
              <Text style={styles.scrambledWord}>
                {currentWord?.word ? scrambleWord(currentWord.word) : ''}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={userGuess}
                onChangeText={setUserGuess}
                placeholder="Enter your guess..."
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleGuessSubmit}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleGuessSubmit}
                disabled={!userGuess.trim()}
              >
                <Text style={styles.submitButtonText}>Submit Guess</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hintButton}
                onPress={() => setShowHint(!showHint)}
              >
                <Ionicons name="bulb" size={20} color="#FF9800" />
                <Text style={styles.hintButtonText}>
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </Text>
              </TouchableOpacity>

              {currentWordIndex < (puzzleWords?.length || 0) - 1 && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={skipWord}
                >
                  <Text style={styles.skipButtonText}>Skip Word</Text>
                </TouchableOpacity>
              )}
            </View>

            {showHint && currentWord && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  Hint: {currentWord.hint || `The word has ${currentWord.word?.length || 0} letters`}
                </Text>
              </View>
            )}

            {currentWord && (
              <View style={styles.wordLengthContainer}>
                <Text style={styles.wordLengthText}>
                  Word Length: {currentWord.word?.length || 0} letters
                </Text>
              </View>
            )}
          </View>
        )}

        {gameComplete && (
          <View style={styles.completeContainer}>
            <View style={styles.completeHeader}>
              <Ionicons name="trophy" size={60} color="#FFD700" />
              <Text style={styles.completeTitle}>Puzzle Complete!</Text>
            </View>

            <View style={styles.resultsContainer}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Words Solved</Text>
                <Text style={styles.resultValue}>{completedWords.length}/{puzzleWords?.length || 0}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Time Taken</Text>
                <Text style={styles.resultValue}>{formatTime(timer)}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Total Attempts</Text>
                <Text style={styles.resultValue}>{attempts}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Points Earned</Text>
                <Text style={styles.resultValue}>{earnedPoints}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.playAgainButton} onPress={restartGame}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showSuccess}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.successTitle}>Excellent Work!</Text>
            <Text style={styles.successMessage}>
              You earned {earnedPoints} points solving this word puzzle!
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setShowSuccess(false)}
            >
              <Text style={styles.successButtonText}>Continue</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FF9800',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9800',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  puzzleContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  clueText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  scrambledContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  scrambledLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  scrambledWord: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    letterSpacing: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  hintButtonText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  hintContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  hintText: {
    fontSize: 14,
    color: '#1976D2',
    fontStyle: 'italic',
  },
  wordLengthContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  wordLengthText: {
    fontSize: 14,
    color: '#999',
  },
  completeContainer: {
    alignItems: 'center',
    padding: 20,
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9800',
  },
  playAgainButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: width * 0.8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});