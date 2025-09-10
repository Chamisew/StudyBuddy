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
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../firebase/firebaseConfig';

const { width } = Dimensions.get('window');

export default function PlayQuizGame() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { gameId } = params;

  const [gameData, setGameData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      const gameDoc = await getDoc(doc(db, 'customGames', gameId));
      if (gameDoc.exists()) {
        const data = gameDoc.data();
        setGameData(data);
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

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const currentQuestion = gameData.questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const questionPoints = Math.round(gameData.points / gameData.questions.length);
    
    setUserAnswers([...userAnswers, {
      questionIndex: currentQuestionIndex,
      selectedAnswer: answerIndex,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      points: isCorrect ? questionPoints : 0
    }]);

    if (isCorrect) {
      setScore(score + 1);
      setTotalPoints(totalPoints + questionPoints);
    }

    setShowResult(true);

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < gameData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      completeGame();
    }
  };

  const completeGame = async () => {
    setGameComplete(true);
    
    try {
      await updateDoc(doc(db, 'customGames', gameId), {
        playCount: increment(1)
      });

      const userId = auth.currentUser?.uid;
      if (userId) {
        const escapeRoomDoc = await getDoc(doc(db, 'escapeRoom', userId));
        if (escapeRoomDoc.exists()) {
          await updateDoc(doc(db, 'escapeRoom', userId), {
            totalPoints: increment(totalPoints)
          });
        }
      }

      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setShowResult(false);
    setGameComplete(false);
    setScore(0);
    setTotalPoints(0);
    setShowSuccess(false);
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

  if (!gameData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Game not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = gameData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / gameData.questions.length) * 100;

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
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{score}/{gameData.questions.length}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {gameData.questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {!gameComplete && currentQuestion && (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                let buttonStyle = [styles.optionButton];
                let textStyle = [styles.optionText];

                if (selectedAnswer !== null) {
                  if (index === currentQuestion.correctAnswer) {
                    buttonStyle.push(styles.correctOption);
                    textStyle.push(styles.correctOptionText);
                  } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
                    buttonStyle.push(styles.wrongOption);
                    textStyle.push(styles.wrongOptionText);
                  } else {
                    buttonStyle.push(styles.disabledOption);
                    textStyle.push(styles.disabledOptionText);
                  }
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={buttonStyle}
                    onPress={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <Text style={textStyle}>{option}</Text>
                    {selectedAnswer !== null && index === currentQuestion.correctAnswer && (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    )}
                    {selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                      <Ionicons name="close-circle" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {showResult && (
              <View style={[
                styles.resultContainer,
                selectedAnswer === currentQuestion.correctAnswer ? styles.correctResult : styles.wrongResult
              ]}>
                <Text style={styles.resultText}>
                  {selectedAnswer === currentQuestion.correctAnswer ? 
                    `Correct! +${Math.round(gameData.points / gameData.questions.length)} points` : 
                    'Incorrect answer'
                  }
                </Text>
              </View>
            )}
          </View>
        )}

        {gameComplete && (
          <View style={styles.completeContainer}>
            <View style={styles.completeHeader}>
              <Ionicons name="trophy" size={60} color="#FFD700" />
              <Text style={styles.completeTitle}>Quiz Complete!</Text>
            </View>

            <View style={styles.resultsContainer}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Score</Text>
                <Text style={styles.resultValue}>{score}/{gameData.questions.length}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Percentage</Text>
                <Text style={styles.resultValue}>{Math.round((score / gameData.questions.length) * 100)}%</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Points Earned</Text>
                <Text style={styles.resultValue}>{totalPoints}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.playAgainButton} onPress={restartQuiz}>
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
            <Text style={styles.successTitle}>Great Job!</Text>
            <Text style={styles.successMessage}>
              You earned {totalPoints} points in this quiz!
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
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
  scoreContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
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
    backgroundColor: '#2196F3',
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
  questionContainer: {
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
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  wrongOption: {
    borderColor: '#F44336',
    backgroundColor: '#F44336',
  },
  disabledOption: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  correctOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  wrongOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledOptionText: {
    color: '#999',
  },
  resultContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  correctResult: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  wrongResult: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
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
    color: '#2196F3',
  },
  playAgainButton: {
    backgroundColor: '#2196F3',
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