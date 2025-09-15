import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, doc, getDoc, increment, setDoc, updateDoc } from 'firebase/firestore';
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

const { width, height } = Dimensions.get('window');

// Add isMobile detection for responsive design
const isMobile = width < 768;

// Puzzle configurations for different themes
const PUZZLES_DATA = {
  laboratory: [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'What is the chemical symbol for Gold?',
      options: ['Au', 'Ag', 'Fe', 'Cu'],
      correct: 0,
      hint: 'Think about the Latin name for Gold'
    },
    {
      id: 2,
      type: 'text_input',
      question: 'Complete the equation: H₂ + O₂ → ?',
      answer: 'H2O',
      hint: 'What do you get when hydrogen meets oxygen?'
    },
    {
      id: 3,
      type: 'math',
      question: 'If a solution has a pH of 7, it is:',
      options: ['Acidic', 'Basic', 'Neutral', 'Unknown'],
      correct: 2,
      hint: 'pH 7 is the middle of the scale'
    }
  ],
  treasure: [
    {
      id: 1,
      type: 'math',
      question: 'What is 15 × 8 + 23?',
      answer: '143',
      hint: 'Remember order of operations!'
    },
    {
      id: 2,
      type: 'multiple_choice',
      question: 'Which number comes next in the sequence: 2, 6, 18, 54, ?',
      options: ['108', '162', '144', '216'],
      correct: 1,
      hint: 'Each number is multiplied by 3'
    },
    {
      id: 3,
      type: 'riddle',
      question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
      answer: 'map',
      hint: 'Think about something that shows places but isn\'t real'
    },
    {
      id: 4,
      type: 'multiple_choice',
      question: 'If you buy 3 items for $7.50 each, how much do you spend in total?',
      options: ['$21.50', '$22.50', '$23.00', '$24.00'],
      correct: 1,
      hint: 'Multiply 3 × $7.50'
    },
    {
      id: 5,
      type: 'text_input',
      question: 'What is 25% of 80?',
      answer: '20',
      hint: '25% = 1/4, so divide by 4'
    },
    {
      id: 6,
      type: 'multiple_choice',
      question: 'Which shape has 8 sides?',
      options: ['Hexagon', 'Heptagon', 'Octagon', 'Nonagon'],
      correct: 2,
      hint: 'Think about the prefix "octo-"'
    },
    {
      id: 7,
      type: 'math',
      question: 'If a rectangle has length 12 and width 5, what is its area?',
      answer: '60',
      hint: 'Area = length × width'
    },
    {
      id: 8,
      type: 'riddle',
      question: 'I am a number that when multiplied by myself equals 49. What am I?',
      answer: '7',
      hint: 'Think about square roots'
    }
  ],
  space: [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correct: 1,
      hint: 'It appears red due to iron oxide on its surface'
    },
    {
      id: 2,
      type: 'math',
      question: 'If light travels at 300,000 km/s, how far does it travel in 2 seconds?',
      answer: '600000',
      hint: 'Distance = Speed × Time'
    },
    {
      id: 3,
      type: 'text_input',
      question: 'What force keeps planets in orbit around the Sun?',
      answer: 'gravity',
      hint: 'This force also keeps you on Earth!'
    },
    {
      id: 4,
      type: 'multiple_choice',
      question: 'How many moons does Jupiter have approximately?',
      options: ['12', '32', '79', '150'],
      correct: 2,
      hint: 'Jupiter has the most moons of any planet'
    },
    {
      id: 5,
      type: 'text_input',
      question: 'What is the closest star to Earth?',
      answer: 'sun',
      hint: 'You see it every day!'
    },
    {
      id: 6,
      type: 'multiple_choice',
      question: 'Which planet has the strongest gravity?',
      options: ['Earth', 'Jupiter', 'Saturn', 'Neptune'],
      correct: 1,
      hint: 'The largest planet has the strongest pull'
    },
    {
      id: 7,
      type: 'riddle',
      question: 'I am made of ice and rock, and when I get close to the Sun, I grow a beautiful tail. What am I?',
      answer: 'comet',
      hint: 'Think about objects that visit our solar system'
    },
    {
      id: 8,
      type: 'multiple_choice',
      question: 'What is the temperature of space?',
      options: ['Very hot', 'Freezing cold', 'Room temperature', 'It varies greatly'],
      correct: 1,
      hint: 'Space is mostly empty and very cold'
    },
    {
      id: 9,
      type: 'text_input',
      question: 'What galaxy do we live in?',
      answer: 'milky way',
      hint: 'Named after a candy bar, but it came first!'
    },
    {
      id: 10,
      type: 'multiple_choice',
      question: 'How long does it take for light from the Sun to reach Earth?',
      options: ['8 seconds', '8 minutes', '8 hours', '8 days'],
      correct: 1,
      hint: 'About the time it takes to eat breakfast'
    }
  ],
  library: [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'Who wrote "Romeo and Juliet"?',
      options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
      correct: 1,
      hint: 'This playwright lived in England during the 16th century'
    },
    {
      id: 2,
      type: 'text_input',
      question: 'In which year did World War II end?',
      answer: '1945',
      hint: 'The war ended in the mid-1940s'
    },
    {
      id: 3,
      type: 'riddle',
      question: 'I have a spine but no bones, pages but no face. What am I?',
      answer: 'book',
      hint: 'You\'re surrounded by these in a library'
    },
    {
      id: 4,
      type: 'multiple_choice',
      question: 'Which ancient wonder of the world was located in Alexandria?',
      options: ['Hanging Gardens', 'Lighthouse', 'Colossus', 'Mausoleum'],
      correct: 1,
      hint: 'It helped ships navigate safely to shore'
    },
    {
      id: 5,
      type: 'text_input',
      question: 'Who painted the Mona Lisa?',
      answer: 'leonardo da vinci',
      hint: 'This Renaissance artist was also an inventor'
    },
    {
      id: 6,
      type: 'multiple_choice',
      question: 'Which language has the most native speakers worldwide?',
      options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'],
      correct: 2,
      hint: 'It\'s spoken in the most populous country'
    },
    {
      id: 7,
      type: 'riddle',
      question: 'I was built to keep invaders out, I stretch for thousands of miles, and I can be seen from space. What am I?',
      answer: 'great wall of china',
      hint: 'It\'s one of the most famous structures in China'
    },
    {
      id: 8,
      type: 'multiple_choice',
      question: 'In which century did the Renaissance begin?',
      options: ['12th century', '13th century', '14th century', '15th century'],
      correct: 2,
      hint: 'It began in the 1300s in Italy'
    },
    {
      id: 9,
      type: 'text_input',
      question: 'What is the capital of Australia?',
      answer: 'canberra',
      hint: 'It\'s not Sydney or Melbourne!'
    }
  ],
  cyber: [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'What does "HTML" stand for?',
      options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Management Language'],
      correct: 0,
      hint: 'It\'s used to create web pages'
    },
    {
      id: 2,
      type: 'text_input',
      question: 'Convert binary 1010 to decimal:',
      answer: '10',
      hint: '1×8 + 0×4 + 1×2 + 0×1'
    },
    {
      id: 3,
      type: 'multiple_choice',
      question: 'What is the most common programming language for web development?',
      options: ['Python', 'Java', 'JavaScript', 'C++'],
      correct: 2,
      hint: 'It runs in web browsers'
    },
    {
      id: 4,
      type: 'multiple_choice',
      question: 'What does "CPU" stand for?',
      options: ['Computer Processing Unit', 'Central Processing Unit', 'Core Processing Unit', 'Central Program Unit'],
      correct: 1,
      hint: 'It\'s the brain of the computer'
    },
    {
      id: 5,
      type: 'text_input',
      question: 'What programming language is known as "Write Once, Run Anywhere"?',
      answer: 'java',
      hint: 'It\'s also the name of an island and a type of coffee'
    },
    {
      id: 6,
      type: 'multiple_choice',
      question: 'Which of these is a database management system?',
      options: ['HTML', 'CSS', 'MySQL', 'HTTP'],
      correct: 2,
      hint: 'It\'s used to store and manage data'
    },
    {
      id: 7,
      type: 'riddle',
      question: 'I protect your data from unauthorized access, I scramble information so only you can read it. What am I?',
      answer: 'encryption',
      hint: 'Think about cybersecurity and data protection'
    },
    {
      id: 8,
      type: 'multiple_choice',
      question: 'What does "AI" stand for in technology?',
      options: ['Automated Intelligence', 'Artificial Intelligence', 'Advanced Integration', 'Application Interface'],
      correct: 1,
      hint: 'It\'s about machines that can think and learn'
    },
    {
      id: 9,
      type: 'text_input',
      question: 'What is 8 + 8 in binary?',
      answer: '10000',
      hint: '8 in binary is 1000, so 8 + 8 = 16 in decimal'
    },
    {
      id: 10,
      type: 'multiple_choice',
      question: 'Which protocol is used for secure web browsing?',
      options: ['HTTP', 'HTTPS', 'FTP', 'SMTP'],
      correct: 1,
      hint: 'Look for the "S" that means secure'
    }
  ]
};

const THEME_CONFIGS = {
  laboratory: {
    backgroundColor: '#E8F5E8',
    primaryColor: '#4CAF50',
    icon: 'flask',
    title: 'Science Lab Escape'
  },
  treasure: {
    backgroundColor: '#FFF3E0',
    primaryColor: '#FF9800',
    icon: 'diamond',
    title: 'Treasure Vault'
  },
  space: {
    backgroundColor: '#F3E5F5',
    primaryColor: '#673AB7',
    icon: 'planet',
    title: 'Space Station'
  },
  library: {
    backgroundColor: '#EFEBE9',
    primaryColor: '#795548',
    icon: 'library',
    title: 'Ancient Library'
  },
  cyber: {
    backgroundColor: '#FFEBEE',
    primaryColor: '#F44336',
    icon: 'shield-checkmark',
    title: 'Digital Fortress'
  }
};

export default function EscapeRoomLevel() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { levelId, theme, title, points, badge } = params;

  // Validate required parameters
  if (!levelId || !theme) {
    console.error('❌ Missing required parameters:', { levelId, theme, title, points, badge });
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid level parameters</Text>
          <Text style={styles.errorText}>LevelId: {levelId || 'missing'}</Text>
          <Text style={styles.errorText}>Theme: {theme || 'missing'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [answerSheetData, setAnswerSheetData] = useState([]);
  const [totalEarnedPoints, setTotalEarnedPoints] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedBadge, setEarnedBadge] = useState('');

  const puzzles = PUZZLES_DATA[theme] || [];
  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.laboratory;
  const progress = ((currentPuzzle + 1) / puzzles.length) * 100;
  
  // Debug logging
  console.log(`🎮 Level Debug - LevelId: ${levelId}, Theme: ${theme}, Puzzles: ${puzzles.length}`);
  console.log(`🔧 Theme Config:`, themeConfig);
  console.log(`📊 Progress: ${Math.round(progress)}%`);

  useEffect(() => {
    let mounted = true;
    
    // Only auto-trigger completion if user has answered ALL puzzles AND moved past the last one
    const hasAnsweredAllPuzzles = Object.keys(userAnswers).length === puzzles.length;
    const isOnLastPuzzle = currentPuzzle === puzzles.length - 1;
    
    console.log(`🔄 useEffect - Current puzzle: ${currentPuzzle}/${puzzles.length}, Answers: ${Object.keys(userAnswers).length}/${puzzles.length}`);
    
    // Don't auto-trigger on the last puzzle - let user click finish button
    if (currentPuzzle >= puzzles.length && hasAnsweredAllPuzzles) {
      console.log('🤖 Auto-triggering completion (moved past last puzzle)');
      try {
        if (mounted) {
          checkGameCompletion();
        }
      } catch (error) {
        console.error('Error in game completion check:', error);
        if (mounted) {
          Alert.alert('Error', 'Something went wrong while checking your answers. Please try again.');
        }
      }
    }
    
    return () => {
      mounted = false;
    };
  }, [currentPuzzle, userAnswers]);

  const checkGameCompletion = () => {
    console.log('🎮 Starting game completion check...');
    console.log('📝 User answers:', userAnswers);
    console.log('📚 Total puzzles:', puzzles.length);
    
    // Calculate points per question
    const totalLevelPoints = parseInt(points) || 100;
    const pointsPerQuestion = Math.floor(totalLevelPoints / puzzles.length);
    const bonusPoints = totalLevelPoints % puzzles.length; // Any remaining points as bonus
    
    console.log(`💰 Points breakdown: ${pointsPerQuestion} per question, ${bonusPoints} bonus for completion`);
    
    // Prepare answer sheet data with individual scoring
    const answerSheet = [];
    let earnedQuestionPoints = 0;
    
    const correctAnswers = puzzles.filter((puzzle, index) => {
      const userAnswer = userAnswers[index];
      console.log(`Question ${index + 1}: User: "${userAnswer}", Type: ${puzzle.type}`);
      
      let isCorrect = false;
      let userAnswerDisplay = '';
      let correctAnswerDisplay = '';
      let questionPoints = 0;
      
      // Check if it's a multiple choice question (has options and correct)
      if (puzzle.type === 'multiple_choice' || (puzzle.options && puzzle.correct !== undefined)) {
        isCorrect = userAnswer === puzzle.correct;
        const selectedOption = puzzle.options?.[userAnswer] || 'No answer';
        const correctOption = puzzle.options?.[puzzle.correct] || 'Unknown';
        userAnswerDisplay = selectedOption;
        correctAnswerDisplay = correctOption;
        console.log(`  ✓ Multiple choice - You selected: "${selectedOption}" (${userAnswer}), Correct: "${correctOption}" (${puzzle.correct}), Result: ${isCorrect}`);
      } else {
        // Text input, math, or riddle with answer property
        const userAnswerStr = userAnswer?.toString()?.toLowerCase()?.trim() || '';
        const correctAnswerStr = puzzle.answer?.toLowerCase()?.trim() || '';
        isCorrect = userAnswerStr === correctAnswerStr;
        userAnswerDisplay = userAnswer || 'No answer';
        correctAnswerDisplay = puzzle.answer || 'Unknown';
        console.log(`  ✓ Text answer - Expected: "${correctAnswerStr}", User: "${userAnswerStr}", Result: ${isCorrect}`);
      }
      
      // Award points only for correct answers
      if (isCorrect) {
        questionPoints = pointsPerQuestion;
        earnedQuestionPoints += questionPoints;
        console.log(`  💰 Earned ${questionPoints} points for correct answer`);
      } else {
        console.log(`  ❌ No points for incorrect answer`);
      }
      
      // Add to answer sheet
      answerSheet.push({
        questionNumber: index + 1,
        question: puzzle.question,
        userAnswer: userAnswerDisplay,
        correctAnswer: correctAnswerDisplay,
        isCorrect: isCorrect,
        type: puzzle.type,
        pointsEarned: questionPoints,
        maxPoints: pointsPerQuestion
      });
      
      return isCorrect;
    }).length;

    const scorePercentage = (correctAnswers / puzzles.length) * 100;
    console.log(`🎯 Final score: ${correctAnswers}/${puzzles.length} (${Math.round(scorePercentage)}%)`);
    console.log(`💰 Points earned: ${earnedQuestionPoints}/${totalLevelPoints}`);
    
    // Add completion bonus if passed
    let finalEarnedPoints = earnedQuestionPoints;
    if (scorePercentage >= 75) {
      finalEarnedPoints += bonusPoints;
      console.log(`🎉 Completion bonus: +${bonusPoints} points`);
    }
    
    // Store answer sheet data and points
    setAnswerSheetData(answerSheet);
    setTotalEarnedPoints(finalEarnedPoints);
    setEarnedPoints(finalEarnedPoints); // Keep for compatibility
    
    // Always show answer sheet first
    setShowAnswerSheet(true);
  };

  const completeLevel = async () => {
    setLoading(true);
    
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Please log in to save your progress.');
        return;
      }

      // Always show earned points and badge immediately
      const earnedPointsValue = totalEarnedPoints; // Use calculated points from answer sheet
      const earnedBadgeValue = badge || 'Champion';
      setEarnedPoints(earnedPointsValue);
      setEarnedBadge(earnedBadgeValue);

      const userDocRef = doc(db, 'escapeRoom', userId);
      const userDoc = await getDoc(userDocRef);
      const levelIdInt = parseInt(levelId);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if level already completed
        if (!userData.completedLevels.includes(levelIdInt)) {
          // Calculate streak - increment if completing levels in order
          const currentStreak = userData.currentStreak || 0;
          const maxStreak = userData.maxStreak || 0;
          const lastCompletedLevel = userData.lastCompletedLevel || 0;
          
          // Increment streak if completing next level in sequence
          let newStreak = currentStreak;
          if (levelIdInt === lastCompletedLevel + 1) {
            newStreak = currentStreak + 1;
          } else if (levelIdInt > lastCompletedLevel + 1) {
            // Reset streak if skipping levels
            newStreak = 1;
          } else {
            // Maintain streak if replaying previous levels
            newStreak = currentStreak;
          }
          
          const newMaxStreak = Math.max(maxStreak, newStreak);
          
          // Update user progress for new completion
          const newCurrentLevel = Math.max(userData.currentLevel || 1, levelIdInt + 1);
          console.log(`✅ Level ${levelIdInt} completed! Adding ${earnedPointsValue} points. Streak: ${newStreak}. Unlocking level ${newCurrentLevel}`);
          
          await updateDoc(userDocRef, {
            completedLevels: arrayUnion(levelIdInt),
            currentLevel: newCurrentLevel,
            totalPoints: increment(earnedPointsValue), // Use actual earned points
            badges: arrayUnion(earnedBadgeValue),
            currentStreak: newStreak,
            maxStreak: newMaxStreak,
            lastCompletedLevel: levelIdInt,
            [`level${levelId}CompletedAt`]: new Date(),
            lastUpdated: new Date()
          });
          
          console.log(`🎯 Progress updated: Level ${newCurrentLevel} unlocked, ${earnedPointsValue} points added, Streak: ${newStreak}`);
        } else {
          // Level already completed, but still show success
          console.log('ℹ️ Level already completed, showing completion modal');
        }
      } else {
        // Initialize user document if it doesn't exist
        console.log(`🆕 Creating new escape room progress for level ${levelIdInt}`);
        const newCurrentLevel = levelIdInt + 1;
        
        const initialProgress = {
          completedLevels: [levelIdInt],
          currentLevel: newCurrentLevel,
          totalPoints: earnedPointsValue,
          badges: [earnedBadgeValue],
          currentStreak: 1, // First level completed
          maxStreak: 1,
          lastCompletedLevel: levelIdInt,
          userId: userId,
          createdAt: new Date(),
          lastUpdated: new Date(),
          [`level${levelId}CompletedAt`]: new Date()
        };
        
        await setDoc(userDocRef, initialProgress);
        console.log(`🎯 Initial progress created: Level ${newCurrentLevel} unlocked, ${earnedPointsValue} points earned, Streak: 1`);
      }
        
      // Always show success modal when completing
      setShowAnswerSheet(true); // Show answer sheet first
      setTimeout(() => {
        setShowAnswerSheet(false);
        setShowSuccess(true);
      }, 100); // Small delay to ensure proper modal transition
      
    } catch (error) {
      console.error('❌ Error completing level:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const restartLevel = () => {
    setCurrentPuzzle(0);
    setUserAnswers({});
    setShowHint(false);
    setGameCompleted(false);
  };

  const handleAnswer = (answer) => {
    // Validate answer before storing
    if (answer !== null && answer !== undefined) {
      console.log(`✏️ Saving answer for puzzle ${currentPuzzle + 1}: "${answer}"`);
      setUserAnswers(prev => {
        const newAnswers = {
          ...prev,
          [currentPuzzle]: answer
        };
        console.log('📝 Updated answers:', newAnswers);
        return newAnswers;
      });
    } else {
      console.log(`⚠️ Invalid answer for puzzle ${currentPuzzle + 1}:`, answer);
    }
  };

  const nextPuzzle = () => {
    if (currentPuzzle < puzzles.length - 1 && puzzles.length > 0) {
      setCurrentPuzzle(currentPuzzle + 1);
      setShowHint(false);
    }
  };

  const previousPuzzle = () => {
    if (currentPuzzle > 0) {
      setCurrentPuzzle(currentPuzzle - 1);
      setShowHint(false);
    }
  };

  const renderPuzzle = (puzzle) => {
    // Add validation for puzzle data
    if (!puzzle) {
      return (
        <View style={styles.puzzleContainer}>
          <Text style={styles.errorText}>Puzzle data not available</Text>
        </View>
      );
    }

    const userAnswer = userAnswers[currentPuzzle];

    switch (puzzle.type) {
      case 'multiple_choice':
        // Only for explicit multiple choice questions with options
        if (puzzle.options && Array.isArray(puzzle.options)) {
          return (
            <View style={styles.puzzleContainer}>
              <Text style={styles.question}>{puzzle.question || 'Question not available'}</Text>
              <View style={styles.optionsContainer}>
                {puzzle.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      userAnswer === index && [styles.selectedOption, { borderColor: themeConfig.primaryColor }]
                    ]}
                    onPress={() => handleAnswer(index)}
                  >
                    <Text style={[
                      styles.optionText,
                      userAnswer === index && { color: themeConfig.primaryColor }
                    ]}>
                      {option || `Option ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        }
        break;
      
      case 'math':
        // Math questions can be either multiple choice OR text input
        if (puzzle.options && Array.isArray(puzzle.options)) {
          // Math question with multiple choice options
          return (
            <View style={styles.puzzleContainer}>
              <Text style={styles.question}>{puzzle.question || 'Question not available'}</Text>
              <View style={styles.optionsContainer}>
                {puzzle.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      userAnswer === index && [styles.selectedOption, { borderColor: themeConfig.primaryColor }]
                    ]}
                    onPress={() => handleAnswer(index)}
                  >
                    <Text style={[
                      styles.optionText,
                      userAnswer === index && { color: themeConfig.primaryColor }
                    ]}>
                      {option || `Option ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        } else {
          // Math question with text input
          return (
            <View style={styles.puzzleContainer}>
              <Text style={styles.question}>{puzzle.question || 'Question not available'}</Text>
              <TextInput
                style={[styles.textInput, { borderColor: themeConfig.primaryColor }]}
                value={userAnswer || ''}
                onChangeText={(text) => handleAnswer(text)}
                placeholder="Enter your answer..."
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          );
        }

      case 'text_input':
      case 'riddle':
        return (
          <View style={styles.puzzleContainer}>
            <Text style={styles.question}>{puzzle.question || 'Question not available'}</Text>
            <TextInput
              style={[styles.textInput, { borderColor: themeConfig.primaryColor }]}
              value={userAnswer || ''}
              onChangeText={(text) => handleAnswer(text)}
              placeholder="Enter your answer..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        );

      default:
        return (
          <View style={styles.puzzleContainer}>
            <Text style={styles.errorText}>Unknown puzzle type: {puzzle.type}</Text>
          </View>
        );
    }
};

  if (puzzles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Level not available</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeConfig.backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeConfig.primaryColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name={themeConfig.icon} size={24} color="#fff" />
          <Text style={styles.headerTitle}>{themeConfig.title}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowHint(!showHint)}>
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Puzzle {currentPuzzle + 1} of {puzzles.length}
          </Text>
          <Text style={[styles.pointsText, { color: themeConfig.primaryColor }]}>
            {points} Points
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress}%`, 
                backgroundColor: themeConfig.primaryColor 
              }
            ]} 
          />
        </View>
        
        {/* Add visual puzzle indicators */}
        <View style={styles.puzzleIndicators}>
          {puzzles.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.puzzleIndicator,
                index === currentPuzzle && styles.currentPuzzleIndicator,
                userAnswers[index] !== undefined && styles.completedPuzzleIndicator,
                { backgroundColor: index === currentPuzzle ? themeConfig.primaryColor : '#E0E0E0' }
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Puzzle */}
        {puzzles[currentPuzzle] && renderPuzzle(puzzles[currentPuzzle])}

        {/* Hint Section */}
        {showHint && puzzles[currentPuzzle] && (
          <View style={[styles.hintContainer, { backgroundColor: `${themeConfig.primaryColor}20` }]}>
            <View style={styles.hintHeader}>
              <Ionicons name="bulb" size={16} color={themeConfig.primaryColor} />
              <Text style={[styles.hintTitle, { color: themeConfig.primaryColor }]}>Hint</Text>
            </View>
            <Text style={styles.hintText}>{puzzles[currentPuzzle].hint}</Text>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={[styles.navigationContainer, isMobile && styles.navigationContainerMobile]}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              currentPuzzle === 0 && styles.disabledButton,
              isMobile && styles.navButtonMobile
            ]}
            onPress={previousPuzzle}
            disabled={currentPuzzle === 0}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
            {!isMobile && <Text style={styles.navButtonText}>Previous</Text>}
          </TouchableOpacity>

          {currentPuzzle < puzzles.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton, { backgroundColor: themeConfig.primaryColor }, isMobile && styles.navButtonMobile]}
              onPress={nextPuzzle}
              disabled={userAnswers[currentPuzzle] === undefined}
            >
              {!isMobile && <Text style={styles.navButtonText}>Next</Text>}
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.finishButton,
                { backgroundColor: themeConfig.primaryColor },
                userAnswers[currentPuzzle] === undefined && styles.disabledButton,
                isMobile && styles.navButtonMobile
              ]}
              onPress={() => {
                console.log('📲 FINISH BUTTON CLICKED!');
                console.log('📝 Current answers:', userAnswers);
                console.log('🗺 Current puzzle:', currentPuzzle, '/', puzzles.length);
                checkGameCompletion();
              }}
              disabled={userAnswers[currentPuzzle] === undefined || loading}
            >
              {(() => {
                const isDisabled = userAnswers[currentPuzzle] === undefined || loading;
                console.log(`🔘 Finish button - Current puzzle: ${currentPuzzle}, Answer: ${userAnswers[currentPuzzle]}, Disabled: ${isDisabled}`);
                return loading ? (
                  <>
                    <Text style={styles.navButtonText}>Saving...</Text>
                    <Ionicons name="hourglass" size={20} color="#fff" />
                  </>
                ) : (
                  <>
                    {!isMobile && <Text style={styles.navButtonText}>Finish</Text>}
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </>
                );
              })()}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Answer Sheet Modal */}
      <Modal
        visible={showAnswerSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnswerSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.answerSheetModal, { borderColor: themeConfig.primaryColor }]}>
            <View style={[styles.answerSheetHeader, { backgroundColor: themeConfig.primaryColor }]}>
              <Ionicons name="document-text" size={32} color="#fff" />
              <Text style={styles.answerSheetTitle}>Answer Sheet</Text>
              <Text style={styles.answerSheetSubtitle}>
                {answerSheetData.filter(item => item.isCorrect).length}/{answerSheetData.length} Correct 
                ({Math.round((answerSheetData.filter(item => item.isCorrect).length / answerSheetData.length) * 100)}%)
              </Text>
              <Text style={styles.answerSheetPoints}>
                Points: {answerSheetData.reduce((sum, item) => sum + item.pointsEarned, 0)}/{answerSheetData.reduce((sum, item) => sum + item.maxPoints, 0)} + Bonus
              </Text>
            </View>
            
            <ScrollView style={styles.answerSheetContent}>
              {answerSheetData.map((item, index) => (
                <View key={index} style={[
                  styles.answerSheetItem,
                  { borderLeftColor: item.isCorrect ? '#4CAF50' : '#F44336' }
                ]}>
                  <View style={styles.answerSheetQuestionHeader}>
                    <Text style={styles.answerSheetQuestionNumber}>Q{item.questionNumber}</Text>
                    <View style={styles.questionPointsContainer}>
                      <Text style={[
                        styles.questionPoints,
                        { color: item.isCorrect ? '#4CAF50' : '#F44336' }
                      ]}>
                        {item.pointsEarned}/{item.maxPoints} pts
                      </Text>
                      <Ionicons 
                        name={item.isCorrect ? 'checkmark-circle' : 'close-circle'} 
                        size={20} 
                        color={item.isCorrect ? '#4CAF50' : '#F44336'} 
                      />
                    </View>
                  </View>
                  
                  <Text style={styles.answerSheetQuestion}>{item.question}</Text>
                  
                  <View style={styles.answerSheetAnswers}>
                    <View style={styles.answerRow}>
                      <Text style={styles.answerLabel}>Your Answer:</Text>
                      <Text style={[
                        styles.answerText,
                        { color: item.isCorrect ? '#4CAF50' : '#F44336' }
                      ]}>
                        {item.userAnswer}
                      </Text>
                    </View>
                    
                    {!item.isCorrect && (
                      <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Correct Answer:</Text>
                        <Text style={[styles.answerText, { color: '#4CAF50' }]}>
                          {item.correctAnswer}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.answerSheetActions}>
              {/* Always show Finish Level button */}
              <TouchableOpacity
                style={[styles.answerSheetButton, styles.finishLevelButton, {
                  backgroundColor: answerSheetData.filter(item => item.isCorrect).length / answerSheetData.length >= 0.75 
                    ? '#4CAF50' : '#FF9800'
                }]}
                onPress={() => {
                  setShowAnswerSheet(false);
                  const passed = answerSheetData.filter(item => item.isCorrect).length / answerSheetData.length >= 0.75;
                  if (passed) {
                    completeLevel();
                  } else {
                    // Show success modal even for failed attempts (with limited points)
                    setShowSuccess(true);
                  }
                }}
              >
                <Ionicons name="flag-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.answerSheetButtonText}>
                  Finish Level ({totalEarnedPoints} pts)
                </Text>
              </TouchableOpacity>
              
              {/* Secondary action buttons */}
              {answerSheetData.filter(item => item.isCorrect).length / answerSheetData.length >= 0.75 ? (
                <TouchableOpacity
                  style={[styles.answerSheetButton, styles.reviewButton]}
                  onPress={() => setShowAnswerSheet(false)}
                >
                  <Ionicons name="book" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.answerSheetButtonText}>Review More</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.answerSheetFailedActions, isMobile && styles.answerSheetFailedActionsMobile]}>
                  <TouchableOpacity
                    style={[styles.answerSheetButton, styles.restartButton]}
                    onPress={() => {
                      setShowAnswerSheet(false);
                      restartLevel();
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.answerSheetButtonText}>Try Again</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.answerSheetButton, styles.reviewButton]}
                    onPress={() => setShowAnswerSheet(false)}
                  >
                    <Ionicons name="book" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.answerSheetButtonText}>Review & Study</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, { borderColor: themeConfig.primaryColor }]}>
            <View style={[styles.successHeader, { backgroundColor: themeConfig.primaryColor }]}>
              <Ionicons name="trophy" size={40} color="#FFD700" />
              <Text style={styles.successTitle}>Level Complete!</Text>
            </View>
            
            <View style={styles.successContent}>
              <Text style={styles.successMessage}>
                Congratulations! You've successfully completed {themeConfig.title}!
              </Text>
              
              <View style={styles.rewardsContainer}>
                <View style={styles.rewardItem}>
                  <Ionicons name="star" size={24} color="#FFD700" />
                  <Text style={styles.rewardText}>+{earnedPoints} Points</Text>
                </View>
                
                <View style={styles.rewardItem}>
                  <Ionicons name="ribbon" size={24} color={themeConfig.primaryColor} />
                  <Text style={styles.rewardText}>{earnedBadge} Badge</Text>
                </View>
              </View>
              
              <View style={styles.nextLevelHint}>
                <Ionicons name="arrow-forward-circle" size={20} color="#4CAF50" />
                <Text style={styles.nextLevelText}>
                  Level {parseInt(levelId) + 1} is now unlocked! Return to continue your adventure.
                </Text>
              </View>
            </View>
            
            <View style={styles.successActions}>
              <TouchableOpacity
                style={[styles.successButton, { backgroundColor: themeConfig.primaryColor }]}
                onPress={() => {
                  setShowSuccess(false);
                  // Show brief feedback before returning
                  setTimeout(() => {
                    router.back();
                  }, 300);
                }}
              >
                <Ionicons name="arrow-back" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.successButtonText}>Back to Levels</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Add new puzzle indicators styles
  puzzleIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  puzzleIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  currentPuzzleIndicator: {
    transform: [{ scale: 1.3 }],
  },
  completedPuzzleIndicator: {
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  puzzleContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  question: {
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
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  selectedOption: {
    backgroundColor: '#F0F8FF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  hintContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  // Add mobile navigation styles
  navigationContainerMobile: {
    justifyContent: 'center',
    gap: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  // Add mobile nav button styles
  navButtonMobile: {
    minWidth: 60,
    paddingHorizontal: 12,
  },
  prevButton: {
    backgroundColor: '#666',
  },
  nextButton: {
    backgroundColor: '#007AFF',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
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
    width: width * 0.9,
    maxWidth: 400,
    overflow: 'hidden',
    borderWidth: 3,
  },
  successHeader: {
    alignItems: 'center',
    padding: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  successContent: {
    padding: 24,
  },
  successMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  rewardsContainer: {
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  nextLevelHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  nextLevelText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  successActions: {
    padding: 24,
    paddingTop: 0,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '500',
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Answer Sheet Modal Styles
  answerSheetModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.95,
    maxWidth: 500,
    maxHeight: height * 0.9,
    overflow: 'hidden',
    borderWidth: 3,
  },
  answerSheetHeader: {
    alignItems: 'center',
    padding: 20,
  },
  answerSheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  answerSheetSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  answerSheetPoints: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
    opacity: 0.8,
    fontWeight: '500',
  },
  answerSheetContent: {
    flex: 1,
    padding: 16,
  },
  answerSheetItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  answerSheetQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerSheetQuestionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  questionPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionPoints: {
    fontSize: 12,
    fontWeight: '600',
  },
  answerSheetQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  answerSheetAnswers: {
    gap: 8,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 120,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  answerSheetActions: {
    padding: 20,
    paddingTop: 0,
  },
  answerSheetFailedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  // Add mobile styles for failed actions
  answerSheetFailedActionsMobile: {
    flexDirection: 'column',
  },
  answerSheetPassedActions: {
    gap: 12,
  },
  answerSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  finishLevelButton: {
    marginBottom: 12,
    flex: 0, // Don't stretch
    paddingVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  restartButton: {
    backgroundColor: '#FF5722',
  },
  reviewButton: {
    backgroundColor: '#2196F3',
  },
  answerSheetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});