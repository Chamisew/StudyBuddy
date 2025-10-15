import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
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
import * as Progress from 'react-native-progress';
import { GalaxyAnimation } from '../components/GalaxyAnimation';
import { GalaxyColors, cosmicGray, starGold, nebulaPink, cosmicBlue, spacePurple } from '../constants/GalaxyColors';
import { GlobalStyles } from '../constants/GlobalStyles';
import { auth, db } from '../firebase/firebaseConfig';
import { smartNavigateBack } from '../utils/navigation';

// Galaxy-themed escape room levels
const GAME_LEVELS = [
  {
    id: 1,
    title: "Cosmic Laboratory",
    theme: "laboratory",
    description: "Escape from a mysterious cosmic laboratory by solving quantum equations and stellar puzzles",
    icon: "flask",
    color: nebulaPink[500],
    points: 100,
    badge: "Quantum Master",
    bgColor: nebulaPink[50],
    gradient: [nebulaPink[400], nebulaPink[600]]
  },
  {
    id: 2,
    title: "Nebula Treasure Vault",
    theme: "treasure",
    description: "Unlock an ancient stellar vault by solving mathematical riddles and cosmic logic puzzles",
    icon: "diamond",
    color: starGold[500],
    points: 150,
    badge: "Star Hunter",
    bgColor: starGold[50],
    gradient: [starGold[400], starGold[600]]
  },
  {
    id: 3,
    title: "Deep Space Station",
    theme: "space",
    description: "Fix the space station's systems by solving physics and astronomy challenges in deep space",
    icon: "planet",
    color: spacePurple[500],
    points: 200,
    badge: "Space Explorer",
    bgColor: spacePurple[50],
    gradient: [spacePurple[400], spacePurple[600]]
  },
  {
    id: 4,
    title: "Galactic Archives",
    theme: "library",
    description: "Navigate through ancient galactic archives by solving literature and cosmic history puzzles",
    icon: "library",
    color: cosmicBlue[500],
    points: 175,
    badge: "Cosmic Scholar",
    bgColor: cosmicBlue[50],
    gradient: [cosmicBlue[400], cosmicBlue[600]]
  },
  {
    id: 5,
    title: "Quantum Fortress",
    theme: "cyber",
    description: "Break into a quantum fortress by solving advanced coding and cybersecurity challenges",
    icon: "shield-checkmark",
    color: cosmicGray[400],
    points: 250,
    badge: "Quantum Guardian",
    bgColor: cosmicGray[50],
    gradient: [cosmicGray[300], cosmicGray[500]]
  }
];

export default function EscapeRoomGame() {
  const router = useRouter();
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  const [userProgress, setUserProgress] = useState({
    completedLevels: [],
    currentLevel: 1,
    totalPoints: 0,
    badges: []
  });
  const [customGames, setCustomGames] = useState([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showTutorInfoModal, setShowTutorInfoModal] = useState(false);
  const [selectedTutorInfo, setSelectedTutorInfo] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTutor, setIsTutor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [gamePendingDelete, setGamePendingDelete] = useState(null);

  useEffect(() => {
    loadUserProgress();
    loadCustomGames();
    getBarCodeScannerPermissions();
    // Check tutor/admin role
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          setIsTutor(!!data.isTutor);
          setIsAdmin(!!data.isAdmin || /\+admin/.test(auth.currentUser?.email || ""));
        }
      } catch (e) {
        // ignore role check errors
      }
    })();
  }, []);

  // Listen for dimension changes for responsive design
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Refresh user progress when screen is focused (returning from level)
  useFocusEffect(
    useCallback(() => {
      loadUserProgress();
    }, [])
  );

  const getBarCodeScannerPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'escapeRoom', userId));
      if (userDoc.exists()) {
        setUserProgress(userDoc.data());
      } else {
        // Initialize user progress
        const initialProgress = {
          completedLevels: [],
          currentLevel: 1,
          totalPoints: 0,
          badges: [],
          userId: userId,
          createdAt: new Date()
        };
        await setDoc(doc(db, 'escapeRoom', userId), initialProgress);
        setUserProgress(initialProgress);
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomGames = async () => {
    try {
      // Simplified query to avoid index requirement
      const gamesQuery = query(
        collection(db, 'customGames'),
        where('isActive', '==', true),
        limit(10)
      );
      const gamesSnapshot = await getDocs(gamesQuery);
      const games = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by createdAt client-side to avoid index requirement
      games.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setCustomGames(games);
    } catch (error) {
      console.error('Error loading custom games:', error);
    }
  };

  const fetchTutorInfo = async (tutorId, tutorName) => {
    try {
      setSelectedTutorInfo({ loading: true, tutorName });
      setShowTutorInfoModal(true);
      
      // Fetch tutor's escape room progress
      const tutorEscapeRoomDoc = await getDoc(doc(db, 'escapeRoom', tutorId));
      
      let tutorInfo = {
        tutorName: tutorName,
        maxPoints: 0,
        highestBadge: 'None',
        completedLevels: 0,
        currentStreak: 0,
        maxStreak: 0
      };
      
      if (tutorEscapeRoomDoc.exists()) {
        const data = tutorEscapeRoomDoc.data();
        tutorInfo = {
          tutorName: tutorName,
          maxPoints: data.totalPoints || 0,
          highestBadge: data.badges?.length > 0 ? data.badges[data.badges.length - 1] : 'None',
          completedLevels: data.completedLevels?.length || 0,
          currentStreak: data.currentStreak || 0,
          maxStreak: data.maxStreak || 0,
          allBadges: data.badges || []
        };
      }
      
      setSelectedTutorInfo(tutorInfo);
    } catch (error) {
      console.error('Error fetching tutor info:', error);
      setSelectedTutorInfo({
        tutorName: tutorName,
        maxPoints: 0,
        highestBadge: 'None',
        completedLevels: 0,
        currentStreak: 0,
        maxStreak: 0,
        error: 'Failed to load tutor information'
      });
    }
  };

  const navigateToCustomGame = (game) => {
    if (game.type === 'quiz') {
      router.push({
        pathname: '/play-quiz-game',
        params: { gameId: game.id }
      });
    } else if (game.type === 'memory') {
      router.push({
        pathname: '/play-memory-game',
        params: { gameId: game.id }
      });
    } else if (game.type === 'puzzle') {
      router.push({
        pathname: '/play-word-puzzle',
        params: { gameId: game.id }
      });
    }
  };

  const confirmAndDeleteGame = (game) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid || !(uid === game.createdBy || isAdmin)) {
        Alert.alert('Not allowed', 'Only the creator or an admin can delete this game.');
        return;
      }
      setGamePendingDelete(game);
      setConfirmDeleteVisible(true);
    } catch (e) {
      // noop
    }
  };

  const performDeleteGame = async () => {
    if (!gamePendingDelete) return;
    try {
      await deleteDoc(doc(db, 'customGames', gamePendingDelete.id));
      setCustomGames((prev) => prev.filter((g) => g.id !== gamePendingDelete.id));
      setConfirmDeleteVisible(false);
      setGamePendingDelete(null);
      Alert.alert('Deleted', 'The game has been deleted.');
    } catch (err) {
      console.error('Error deleting game:', err);
      Alert.alert('Error', 'Failed to delete the game. Please try again.');
    }
  };

  const handleQRCodeScanned = ({ type, data }) => {
    setShowQRScanner(false);
    
    // Check if QR code contains escape room level access
    try {
      const qrData = JSON.parse(data);
      if (qrData.type === 'escape_room' && qrData.levelId) {
        navigateToLevel(qrData.levelId);
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not for the Escape Room game.');
      }
    } catch (error) {
      // If it's not JSON, check if it's a simple level ID format
      if (data.startsWith('ESCAPE_ROOM_LEVEL_')) {
        const levelId = parseInt(data.replace('ESCAPE_ROOM_LEVEL_', ''));
        if (levelId >= 1 && levelId <= 5) {
          navigateToLevel(levelId);
        } else {
          Alert.alert('Invalid Level', 'The QR code contains an invalid level number.');
        }
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not for the Escape Room game. Please scan a game QR code.');
      }
    }
  };

  const navigateToLevel = (levelId) => {
    const level = GAME_LEVELS.find(l => l.id === levelId);
    if (!level) {
      Alert.alert('Level Not Found', 'The requested level does not exist.');
      return;
    }

    // Check if user can access this level
    if (levelId > userProgress.currentLevel) {
      Alert.alert(
        'Level Locked',
        `Complete level ${levelId - 1} first to unlock this level.`
      );
      return;
    }

    router.push({
      pathname: '/escape-room-level',
      params: { 
        levelId: levelId,
        theme: level.theme,
        title: level.title,
        points: level.points,
        badge: level.badge
      }
    });
  };

  const getProgressPercentage = () => {
    return (userProgress.completedLevels.length / GAME_LEVELS.length) * 100;
  };

  const getLevelStatus = (levelId) => {
    if (userProgress.completedLevels.includes(levelId)) {
      return 'completed';
    } else if (levelId <= userProgress.currentLevel) {
      return 'available';
    } else {
      return 'locked';
    }
  };

  // Responsive variables
  const { width, height } = dimensions;
  const isMobile = width < 768;

  // Dynamic styles based on current dimensions
  const getResponsiveStyles = () => StyleSheet.create({
    levelCard: {
      width: isMobile ? '100%' : '47%',
      marginBottom: 16,
      borderRadius: 20,
      elevation: isMobile ? 6 : 12,
      shadowColor: spacePurple[400],
      shadowOffset: { width: 0, height: isMobile ? 3 : 6 },
      shadowOpacity: isMobile ? 0.25 : 0.4,
      shadowRadius: isMobile ? 6 : 12,
      minHeight: isMobile ? 180 : 240,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isMobile ? 16 : 20,
      paddingTop: isMobile ? 12 : 16,
      backgroundColor: 'transparent',
      zIndex: 10,
    },
    headerTitle: {
      fontSize: isMobile ? 16 : 20,
      fontWeight: '700',
      color: starGold[400],
      textShadowColor: cosmicGray[900],
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    content: {
      flex: 1,
      paddingHorizontal: isMobile ? 16 : 20,
    },
    sectionTitle: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: '700',
      color: starGold[400],
      marginLeft: 12,
      textShadowColor: cosmicGray[900],
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    progressSection: {
      marginBottom: isMobile ? 20 : 32,
      borderRadius: 20,
      padding: isMobile ? 16 : 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    levelsSection: {
      marginBottom: isMobile ? 20 : 32,
      paddingHorizontal: 0,
    },
    levelsGridContainer: {
      paddingHorizontal: 0,
      width: '100%',
      overflow: 'hidden',
    },
    tutorInfoModal: {
      backgroundColor: '#fff',
      borderRadius: 16,
      width: width * 0.9,
      maxWidth: 400,
      maxHeight: height * 0.8,
      overflow: 'hidden',
    },
    confirmModal: {
      backgroundColor: '#fff',
      borderRadius: 16,
      width: width * 0.9,
      maxWidth: 420,
      padding: 20,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Galaxy Background */}
      <LinearGradient
        colors={[spacePurple[900], cosmicBlue[800], cosmicGray[900]]}
        style={styles.backgroundGradient}
      />
      <GalaxyAnimation style={styles.galaxyAnimation} />
      
      {/* Header */}
      <View style={getResponsiveStyles().header}>
        <TouchableOpacity 
          onPress={() => smartNavigateBack(router, '/escape-room')}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={starGold[400]} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="planet-outline" size={isMobile ? 24 : 28} color={starGold[400]} />
          <Text style={getResponsiveStyles().headerTitle}>Cosmic Escape Rooms</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowQRScanner(true)}
          style={styles.headerButton}
        >
          <Ionicons name="qr-code-outline" size={24} color={starGold[400]} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={getResponsiveStyles().content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Overview */}
        <LinearGradient
          colors={[cosmicBlue[800], spacePurple[700]]}
          style={getResponsiveStyles().progressSection}
        >
          <View style={styles.progressHeader}>
            <Ionicons name="stats-chart" size={24} color={starGold[400]} />
            <Text style={getResponsiveStyles().sectionTitle}>Cosmic Journey Progress</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProgress.completedLevels.length}</Text>
                <Text style={styles.statLabel}>Levels Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProgress.totalPoints}</Text>
                <Text style={styles.statLabel}>Cosmic Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProgress.badges.length}</Text>
                <Text style={styles.statLabel}>Star Badges</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarWrapper}>
                <Progress.Bar
                  progress={getProgressPercentage() / 100}
                  width={width - (isMobile ? 60 : 80)}
                  height={8}
                  color={starGold[400]}
                  unfilledColor={cosmicGray[600]}
                  borderWidth={0}
                  borderRadius={4}
                />
                <Text style={styles.progressPercentage}>
                  {Math.round(getProgressPercentage())}% Complete
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Star Badges Section */}
        {userProgress.badges.length > 0 && (
          <View style={styles.badgesSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={24} color={starGold[400]} />
              <Text style={getResponsiveStyles().sectionTitle}>Star Badge Collection</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.badgesContainer}>
                {userProgress.badges.map((badge, index) => (
                  <LinearGradient
                    key={index}
                    colors={[starGold[400], starGold[600]]}
                    style={styles.badgeItem}
                  >
                    <Ionicons name="trophy" size={28} color={cosmicGray[900]} />
                    <Text style={styles.badgeText}>{badge}</Text>
                  </LinearGradient>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Tutor-Created Cosmic Games Section */}
        {customGames.length > 0 && (
          <View style={getResponsiveStyles().levelsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="telescope" size={24} color={nebulaPink[400]} />
              <Text style={getResponsiveStyles().sectionTitle}>Tutor-Created Cosmic Games</Text>
            </View>
            <View style={[getResponsiveStyles().levelsGridContainer]}>
              <View style={[styles.levelsGrid, isMobile && styles.levelsGridMobile]}>
              {customGames.map((game) => {
                const gameTypeIcons = {
                  quiz: 'help-circle-outline',
                  memory: 'grid-outline',
                  puzzle: 'extension-puzzle-outline'
                };
                const gameTypeColors = {
                  quiz: [cosmicBlue[400], cosmicBlue[600]],
                  memory: [spacePurple[400], spacePurple[600]], 
                  puzzle: [starGold[400], starGold[600]]
                };
                
                return (
                  <LinearGradient
                    key={game.id}
                    colors={gameTypeColors[game.type] || gameTypeColors.quiz}
                    style={getResponsiveStyles().levelCard}
                  >
                    <TouchableOpacity
                      style={styles.levelCardContent}
                      onPress={() => navigateToCustomGame(game)}
                    >
                      <View style={styles.levelHeader}>
                        <View style={styles.levelIconContainer}>
                          <Ionicons
                            name={gameTypeIcons[game.type] || 'game-controller-outline'}
                            size={28}
                            color={cosmicGray[50]}
                          />
                        </View>
                      <View style={styles.gameTypeContainer}>
                        <Text style={[styles.gameTypeText, { color: gameTypeColors[game.type] }]}>
                          {game.type?.toUpperCase() || 'GAME'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.tutorInfoButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          fetchTutorInfo(game.createdBy, game.createdByName);
                        }}
                      >
                        <Ionicons name="help-circle-outline" size={20} color="#666" />
                      </TouchableOpacity>
                      {(auth.currentUser?.uid === game.createdBy || isAdmin) && (
                        <View style={{ flexDirection: 'row' }}>
                          <TouchableOpacity
                            style={[styles.tutorInfoButton, { marginLeft: 6, backgroundColor: 'rgba(25,118,210,0.12)' }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              setGamePendingDelete({ ...game, __action: 'edit' });
                              setConfirmDeleteVisible(true);
                            }}
                          >
                            <Ionicons name="create-outline" size={20} color="#1976D2" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.tutorInfoButton, { marginLeft: 6, backgroundColor: 'rgba(244,67,54,0.12)' }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              confirmAndDeleteGame(game);
                            }}
                          >
                            <Ionicons name="trash-outline" size={20} color="#F44336" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.levelTitle}>
                      {game.title}
                    </Text>
                    
                    <Text style={styles.levelDescription}>
                      {game.description}
                    </Text>
                    
                    <View style={styles.levelFooter}>
                      <View style={styles.gameMetaContainer}>
                        <Text style={styles.gameSubject}>{game.subject}</Text>
                        <Text style={styles.gameDifficulty}>{game.difficulty}</Text>
                      </View>
                      <View style={styles.pointsContainer}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.levelPoints}>
                          {game.points} pts
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.gameStatsContainer}>
                      <Text style={styles.gameStats}>
                        Played {game.playCount || 0} times • By {game.createdByName}
                      </Text>
                    </View>
                    </TouchableOpacity>
                  </LinearGradient>
                );
              })}
              </View>
            </View>
          </View>
        )}
        {/* Galaxy Escape Room Challenges */}
        <View style={getResponsiveStyles().levelsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="rocket" size={24} color={spacePurple[400]} />
            <Text style={getResponsiveStyles().sectionTitle}>Galaxy Escape Challenges</Text>
          </View>
          <View style={getResponsiveStyles().levelsGridContainer}>
            <View style={[styles.levelsGrid, isMobile && styles.levelsGridMobile]}>
            {GAME_LEVELS.map((level) => {
              const status = getLevelStatus(level.id);
              return (
                <LinearGradient
                  key={level.id}
                  colors={status === 'locked' 
                    ? [cosmicGray[700], cosmicGray[800]]
                    : level.gradient
                  }
                  style={[
                    getResponsiveStyles().levelCard,
                    status === 'locked' && styles.lockedCard
                  ]}
                >
                  <TouchableOpacity
                    style={styles.levelCardContent}
                    onPress={() => navigateToLevel(level.id)}
                    disabled={status === 'locked'}
                >
                  <View style={styles.levelHeader}>
                    <View style={styles.levelIconContainer}>
                      <Ionicons
                        name={level.icon}
                        size={28}
                        color={status === 'locked' ? cosmicGray[400] : cosmicGray[50]}
                      />
                    </View>
                    <View style={styles.levelStatusContainer}>
                      {status === 'completed' && (
                        <LinearGradient
                          colors={[starGold[400], starGold[600]]}
                          style={styles.statusBadge}
                        >
                          <Ionicons name="checkmark-circle" size={16} color={cosmicGray[900]} />
                          <Text style={styles.statusText}>Complete</Text>
                        </LinearGradient>
                      )}
                      {status === 'locked' && (
                        <View style={styles.lockedBadge}>
                          <Ionicons name="lock-closed" size={16} color={cosmicGray[400]} />
                          <Text style={styles.lockedStatusText}>Locked</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.levelContent}>
                    <Text style={[
                      styles.levelTitle,
                      status === 'locked' && styles.lockedText
                    ]}>
                      {level.title}
                    </Text>
                    
                    <Text style={[
                      styles.levelDescription,
                      status === 'locked' && styles.lockedText
                    ]}>
                      {level.description}
                    </Text>
                  </View>
                  
                  <View style={styles.levelFooter}>
                    <View style={styles.pointsContainer}>
                      <Ionicons 
                        name="star" 
                        size={18} 
                        color={status === 'locked' ? cosmicGray[400] : starGold[400]} 
                      />
                      <Text style={[
                        styles.levelPoints,
                        status === 'locked' && styles.lockedText
                      ]}>
                        {level.points} pts
                      </Text>
                    </View>
                    <Text style={[
                      styles.levelBadge,
                      status === 'locked' && styles.lockedText
                    ]}>
                      {level.badge}
                    </Text>
                  </View>
                  </TouchableOpacity>
                </LinearGradient>
              );
            })}
          </View>
          </View>
        </View>

        {/* Quick Start Section */}
        <View style={styles.quickStartSection}>
          <Text style={getResponsiveStyles().sectionTitle}>Quick Access</Text>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setShowQRScanner(true)}
          >
            <Ionicons name="qr-code" size={24} color="#fff" />
            <Text style={styles.qrButtonText}>Scan QR Code to Join Game</Text>
          </TouchableOpacity>
          {isTutor && (
            <TouchableOpacity
              style={[styles.qrButton, { backgroundColor: '#2196F3', marginTop: 12 }]}
              onPress={() => router.push('/create-game')}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.qrButtonText}>Create Custom Game</Text>
            </TouchableOpacity>
          )}
          {isTutor && (
            <TouchableOpacity
              style={[styles.qrButton, { backgroundColor: '#607D8B', marginTop: 12 }]}
              onPress={() => router.push('/escape-room-qr')}
            >
              <Ionicons name="qr-code-outline" size={24} color="#fff" />
              <Text style={styles.qrButtonText}>Generate Level QR</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <View style={styles.qrScannerContainer}>
          <View style={styles.qrHeader}>
            <TouchableOpacity onPress={() => setShowQRScanner(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.qrHeaderTitle}>Scan QR Code</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {hasPermission === null ? (
            <Text>Requesting camera permission...</Text>
          ) : hasPermission === false ? (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>
                Camera permission is required to scan QR codes
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={getBarCodeScannerPermissions}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={handleQRCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'pdf417'],
              }}
            />
          )}
          
          <View style={styles.qrOverlay}>
            <View style={styles.qrFrame} />
            <Text style={styles.qrInstructions}>
              Position the QR code within the frame
            </Text>
          </View>
        </View>
      </Modal>

      {/* Tutor Info Modal */}
      <Modal
        visible={showTutorInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTutorInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={getResponsiveStyles().tutorInfoModal}>
            <View style={styles.tutorInfoHeader}>
              <Ionicons name="person-circle" size={40} color="#673AB7" />
              <Text style={styles.tutorInfoTitle}>Tutor Achievement</Text>
              <TouchableOpacity onPress={() => setShowTutorInfoModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedTutorInfo?.loading ? (
              <View style={styles.tutorInfoLoading}>
                <Text>Loading tutor information...</Text>
              </View>
            ) : selectedTutorInfo?.error ? (
              <View style={styles.tutorInfoError}>
                <Text style={styles.errorText}>{selectedTutorInfo.error}</Text>
              </View>
            ) : selectedTutorInfo ? (
              <View style={styles.tutorInfoContent}>
                <Text style={styles.tutorName}>{selectedTutorInfo.tutorName}</Text>
                
                {/* Points Section */}
                <View style={styles.tutorStatSection}>
                  <View style={styles.tutorStatItem}>
                    <Ionicons name="star" size={32} color="#FFD700" />
                    <View style={styles.tutorStatInfo}>
                      <Text style={styles.tutorStatNumber}>{selectedTutorInfo.maxPoints}</Text>
                      <Text style={styles.tutorStatLabel}>Total Points</Text>
                    </View>
                  </View>
                  
                  <View style={styles.tutorStatItem}>
                    <Ionicons name="flash" size={32} color="#FF6B35" />
                    <View style={styles.tutorStatInfo}>
                      <Text style={styles.tutorStatNumber}>{selectedTutorInfo.maxStreak}</Text>
                      <Text style={styles.tutorStatLabel}>Best Streak</Text>
                    </View>
                  </View>
                </View>
                
                {/* Badge Section */}
                <View style={styles.tutorBadgeSection}>
                  <Text style={styles.tutorBadgeTitle}>Highest Badge</Text>
                  <View style={styles.tutorHighestBadge}>
                    <Ionicons name="trophy" size={28} color="#FFD700" />
                    <Text style={styles.tutorBadgeText}>{selectedTutorInfo.highestBadge}</Text>
                  </View>
                </View>
                
                {/* All Badges */}
                {selectedTutorInfo.allBadges?.length > 0 && (
                  <View style={styles.tutorAllBadgesSection}>
                    <Text style={styles.tutorAllBadgesTitle}>All Earned Badges</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.tutorAllBadgesContainer}>
                        {selectedTutorInfo.allBadges.map((badge, index) => (
                          <View key={index} style={styles.tutorBadgeItem}>
                            <Ionicons name="medal" size={20} color="#673AB7" />
                            <Text style={styles.tutorBadgeItemText}>{badge}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
                
                {/* Progress Info */}
                <View style={styles.tutorProgressSection}>
                  <Text style={styles.tutorProgressTitle}>Escape Room Progress</Text>
                  <Text style={styles.tutorProgressText}>
                    Completed {selectedTutorInfo.completedLevels}/5 levels
                  </Text>
                  <Text style={styles.tutorCurrentStreakText}>
                    Current streak: {selectedTutorInfo.currentStreak} levels
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        visible={confirmDeleteVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={getResponsiveStyles().confirmModal}>
            <View style={styles.confirmHeader}>
              {gamePendingDelete?.__action === 'edit' ? (
                <>
                  <Ionicons name="create-outline" size={28} color="#1976D2" />
                  <Text style={styles.confirmTitle}>Edit Game</Text>
                </>
              ) : (
                <>
                  <Ionicons name="warning" size={28} color="#F44336" />
                  <Text style={styles.confirmTitle}>Delete Game</Text>
                </>
              )}
            </View>
            {gamePendingDelete?.__action === 'edit' ? (
              <Text style={styles.confirmMessage}>
                Do you want to edit "{gamePendingDelete?.title}"?
              </Text>
            ) : (
              <Text style={styles.confirmMessage}>
                Are you sure you want to delete "{gamePendingDelete?.title}"? This action cannot be undone.
              </Text>
            )}
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmDeleteVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              {gamePendingDelete?.__action === 'edit' ? (
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: '#1976D2' }]}
                  onPress={() => {
                    setConfirmDeleteVisible(false);
                    const id = gamePendingDelete?.id;
                    setGamePendingDelete(null);
                    if (id) {
                      router.push({ pathname: '/create-game', params: { gameId: id } });
                    }
                  }}
                >
                  <Text style={styles.deleteButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.deleteButton} onPress={performDeleteGame}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: cosmicGray[900],
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
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  progressContainer: {
    gap: 20,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: starGold[400],
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: cosmicBlue[300],
    textAlign: 'center',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: cosmicBlue[600],
    marginHorizontal: 10,
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBarWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: starGold[400],
  },
  badgesSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: 16,
    padding: 16,
    borderRadius: 16,
    minWidth: 80,
    shadowColor: starGold[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: cosmicGray[900],
    marginTop: 8,
    textAlign: 'center',
  },

  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // Add mobile grid styles
  levelsGridMobile: {
    flexDirection: 'column',
  },

  levelCardContent: {
    flex: 1,
    padding: 20,
  },
  lockedCard: {
    opacity: 0.7,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  levelIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelStatusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: cosmicGray[900],
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  lockedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: cosmicGray[400],
  },
  levelContent: {
    flex: 1,
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: cosmicGray[50],
    marginBottom: 8,
    lineHeight: 22,
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  levelDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    flex: 1,
  },
  levelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelPoints: {
    fontSize: 13,
    fontWeight: '600',
    color: starGold[400],
  },
  levelBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
  },
  lockedText: {
    color: cosmicGray[400],
    color: '#333',
    marginLeft: 4,
  },
  lockedText: {
    color: '#999',
  },
  quickStartSection: {
    margin: 16,
    marginTop: 0,
    marginBottom: 8,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  qrScannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  qrHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  qrInstructions: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  gameTypeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gameTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  gameMetaContainer: {
    flex: 1,
  },
  gameSubject: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  gameDifficulty: {
    fontSize: 9,
    color: '#999',
    marginTop: 1,
  },
  gameStatsContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  gameStats: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
  },
  tutorInfoButton: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F44336',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tutorInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tutorInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tutorInfoLoading: {
    padding: 40,
    alignItems: 'center',
  },
  tutorInfoError: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
  },
  tutorInfoContent: {
    padding: 20,
  },
  tutorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  tutorStatSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tutorStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  tutorStatInfo: {
    marginLeft: 12,
  },
  tutorStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tutorStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tutorBadgeSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tutorBadgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tutorHighestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  tutorBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginLeft: 8,
  },
  tutorAllBadgesSection: {
    marginBottom: 20,
  },
  tutorAllBadgesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tutorAllBadgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  tutorBadgeItem: {
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#673AB7',
    minWidth: 70,
  },
  tutorBadgeItemText: {
    fontSize: 10,
    color: '#673AB7',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  tutorProgressSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  tutorProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tutorProgressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tutorCurrentStreakText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
});
