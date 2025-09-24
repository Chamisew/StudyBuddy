import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebase/firebaseConfig';
import { smartNavigateBack } from '../utils/navigation';

const { width } = Dimensions.get('window');

export default function PlayMemoryGame() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { gameId } = params;

  const [gameData, setGameData] = useState(null);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
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

  useEffect(() => {
    if (flippedCards.length === 2) {
      checkForMatch();
    }
  }, [flippedCards]);

  useEffect(() => {
    if (matchedCards.length === cards.length && cards.length > 0) {
      completeGame();
    }
  }, [matchedCards, cards]);

  const loadGameData = async () => {
    try {
      const gameDoc = await getDoc(doc(db, 'customGames', gameId));
      if (gameDoc.exists()) {
        const data = gameDoc.data();
        setGameData(data);
        initializeGame(data);
      } else {
        Alert.alert('Error', 'Game not found');
        smartNavigateBack(router, '/play-memory-game');
      }
    } catch (error) {
      console.error('Error loading game:', error);
      Alert.alert('Error', 'Failed to load game');
      smartNavigateBack(router, '/play-memory-game');
    } finally {
      setLoading(false);
    }
  };

  const initializeGame = (data) => {
    const pairs = data.memoryPairs || [];
    
    if (!pairs || pairs.length === 0) {
      Alert.alert('Error', 'No question-answer pairs found in this game');
      smartNavigateBack(router, '/play-memory-game');
      return;
    }

    // Create cards for questions and answers
    const gameCards = [];
    pairs.forEach((pair, index) => {
      // Question card
      gameCards.push({
        id: `q_${index}`,
        content: pair.question,
        type: 'question',
        pairId: index,
        isFlipped: false,
        isMatched: false
      });
      // Answer card
      gameCards.push({
        id: `a_${index}`,
        content: pair.answer,
        type: 'answer',
        pairId: index,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle the cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5);

    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setTimer(0);
    setGameComplete(false);
    setGameStarted(false);
    setShowSuccess(false);
    setEarnedPoints(0);
  };

  const flipCard = (cardId) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    if (flippedCards.length === 2) return;
    if (flippedCards.includes(cardId)) return;
    if (matchedCards.includes(cardId)) return;

    setFlippedCards([...flippedCards, cardId]);
  };

  const checkForMatch = () => {
    const [firstCardId, secondCardId] = flippedCards;
    const firstCard = cards.find(card => card.id === firstCardId);
    const secondCard = cards.find(card => card.id === secondCardId);

    setMoves(moves + 1);

    // Check if it's a question-answer pair match
    const isMatch = firstCard.pairId === secondCard.pairId && 
                   firstCard.type !== secondCard.type; // Different types (question vs answer)

    if (isMatch) {
      setMatchedCards([...matchedCards, firstCardId, secondCardId]);
      setFlippedCards([]);
    } else {
      setTimeout(() => {
        setFlippedCards([]);
      }, 1500); // Slightly longer delay to read content
    }
  };

  const completeGame = async () => {
    setGameComplete(true);
    
    let points = gameData.points || 100;
    const totalPairs = gameData.memoryPairs?.length || gameData.memoryCards || 4;
    
    // Bonus points for good performance
    if (moves <= totalPairs * 2.5) points += 50; // Efficient moves
    if (timer <= 90) points += 30; // Good time
    if (moves <= totalPairs * 2) points += 20; // Excellent efficiency

    setEarnedPoints(points);

    try {
      await updateDoc(doc(db, 'customGames', gameId), {
        playCount: increment(1)
      });

      const userId = auth.currentUser?.uid;
      if (userId) {
        const escapeRoomDoc = await getDoc(doc(db, 'escapeRoom', userId));
        if (escapeRoomDoc.exists()) {
          await updateDoc(doc(db, 'escapeRoom', userId), {
            totalPoints: increment(points)
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
    initializeGame(gameData);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => smartNavigateBack(router, '/play-memory-game')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{gameData.title}</Text>
          <Text style={styles.headerSubtitle}>{gameData.subject}</Text>
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
          <Text style={styles.statLabel}>Moves</Text>
          <Text style={styles.statValue}>{moves}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pairs</Text>
          <Text style={styles.statValue}>{matchedCards.length / 2}/{gameData.memoryPairs?.length || gameData.memoryCards || 0}</Text>
        </View>
      </View>

      {!gameStarted && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Play</Text>
          <Text style={styles.instructionsText}>
            • Tap cards to flip them over{'\n'}
            • Match questions with their correct answers{'\n'}
            • Find all question-answer pairs to win{'\n'}
            • Finish quickly with fewer moves for bonus points!
          </Text>
        </View>
      )}

      <View style={styles.gameContainer}>
        <View style={[styles.cardGrid, { 
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }]}>
          {cards.map((card) => {
            const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
            const isMatched = matchedCards.includes(card.id);
            const isQuestion = card.type === 'question';
            
            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.card,
                  isFlipped && styles.flippedCard,
                  isMatched && styles.matchedCard,
                  isQuestion && styles.questionCard,
                  !isQuestion && styles.answerCard
                ]}
                onPress={() => flipCard(card.id)}
                disabled={gameComplete}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardType}>
                    {isQuestion ? '❓' : '💡'}
                  </Text>
                </View>
                <Text style={[
                  styles.cardContent,
                  isFlipped && styles.flippedCardContent
                ]}>
                  {isFlipped ? card.content : '?'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {gameComplete && (
        <View style={styles.completeContainer}>
          <View style={styles.completeContent}>
            <Ionicons name="trophy" size={50} color="#FFD700" />
            <Text style={styles.completeTitle}>Congratulations!</Text>
            <Text style={styles.completeSubtitle}>You matched all question-answer pairs!</Text>
            
            <View style={styles.resultStats}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Time</Text>
                <Text style={styles.resultValue}>{formatTime(timer)}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Moves</Text>
                <Text style={styles.resultValue}>{moves}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Points</Text>
                <Text style={styles.resultValue}>{earnedPoints}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.playAgainButton} onPress={restartGame}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
              You earned {earnedPoints} points!
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
    backgroundColor: '#673AB7',
  },
  headerCenter: {
    alignItems: 'center',
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
    marginBottom: 8,
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
    color: '#673AB7',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  gameContainer: {
    flex: 1,
  },
  gameScrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  card: {
    width: (width - 80) / 4 - 4,
    height: 90,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  questionCard: {
    backgroundColor: '#FF9800',
  },
  answerCard: {
    backgroundColor: '#4CAF50',
  },
  flippedCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  matchedCard: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardHeader: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  cardType: {
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardContent: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  flippedCardContent: {
    color: '#333',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  completeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: width * 0.8,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultStats: {
    width: '100%',
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#673AB7',
  },
  playAgainButton: {
    backgroundColor: '#673AB7',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  playAgainText: {
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