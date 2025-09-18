import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
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
import { auth, db } from '../firebase/firebaseConfig';

const { width, height } = Dimensions.get('window');

// Add isMobile detection for responsive design
const isMobile = width < 768;

// Game levels configuration
const GAME_LEVELS = [
  {
    id: 1,
    title: "Science Lab Escape",
    theme: "laboratory",
    description: "Escape from a mysterious science laboratory by solving chemical equations and lab puzzles",
    icon: "flask",
    color: "#4CAF50",
    points: 100,
    badge: "Lab Master",
    bgColor: "#E8F5E8"
  },
  {
    id: 2,
    title: "Treasure Vault",
    theme: "treasure",
    description: "Unlock an ancient treasure vault by solving mathematical riddles and logic puzzles",
    icon: "diamond",
    color: "#FF9800",
    points: 150,
    badge: "Treasure Hunter",
    bgColor: "#FFF3E0"
  },
  {
    id: 3,
    title: "Space Station",
    theme: "space",
    description: "Fix the space station's systems by solving physics and astronomy challenges",
    icon: "planet",
    color: "#673AB7",
    points: 200,
    badge: "Space Explorer",
    bgColor: "#F3E5F5"
  },
  {
    id: 4,
    title: "Ancient Library",
    theme: "library",
    description: "Navigate through an ancient library by solving literature and history puzzles",
    icon: "library",
    color: "#795548",
    points: 175,
    badge: "Scholar",
    bgColor: "#EFEBE9"
  },
  {
    id: 5,
    title: "Digital Fortress",
    theme: "cyber",
    description: "Break into a digital fortress by solving coding and cybersecurity challenges",
    icon: "shield-checkmark",
    color: "#F44336",
    points: 250,
    badge: "Cyber Guardian",
    bgColor: "#FFEBEE"
  }
];

export default function EscapeRoomGame() {
  const router = useRouter();
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escape Room Challenge</Text>
        <TouchableOpacity onPress={() => setShowQRScanner(true)}>
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Overview */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {userProgress.completedLevels.length} / {GAME_LEVELS.length} Levels
              </Text>
              <Text style={styles.pointsText}>
                {userProgress.totalPoints} Points
              </Text>
            </View>
            <Progress.Bar
              progress={getProgressPercentage() / 100}
              width={width - 64}
              height={10}
              color="#4CAF50"
              unfilledColor="#E0E0E0"
              borderWidth={0}
              borderRadius={5}
            />
          </View>
        </View>

        {/* Badges Section */}
        {userProgress.badges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Your Badges</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.badgesContainer}>
                {userProgress.badges.map((badge, index) => (
                  <View key={index} style={styles.badgeItem}>
                    <Ionicons name="trophy" size={24} color="#FFD700" />
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Custom Games Section */}
        {customGames.length > 0 && (
          <View style={styles.levelsSection}>
            <Text style={styles.sectionTitle}>Tutor-Created Games</Text>
            <View style={[styles.levelsGrid, isMobile && styles.levelsGridMobile]}>
              {customGames.map((game) => {
                const gameTypeIcons = {
                  quiz: 'help-circle',
                  memory: 'grid',
                  puzzle: 'text'
                };
                const gameTypeColors = {
                  quiz: '#2196F3',
                  memory: '#673AB7', 
                  puzzle: '#FF9800'
                };
                
                return (
                  <TouchableOpacity
                    key={game.id}
                    style={[
                      styles.levelCard,
                      { backgroundColor: `${gameTypeColors[game.type] || '#2196F3'}15` },
                      isMobile && styles.levelCardMobile
                    ]}
                    onPress={() => navigateToCustomGame(game)}
                  >
                    <View style={styles.levelHeader}>
                      <Ionicons
                        name={gameTypeIcons[game.type] || 'game-controller'}
                        size={24}
                        color={gameTypeColors[game.type] || '#2196F3'}
                      />
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
                );
              })}
            </View>
          </View>
        )}
        {/* Built-in Escape Room Levels */}
        <View style={styles.levelsSection}>
          <Text style={styles.sectionTitle}>Escape Room Challenges</Text>
          <View style={[styles.levelsGrid, isMobile && styles.levelsGridMobile]}>
            {GAME_LEVELS.map((level) => {
              const status = getLevelStatus(level.id);
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelCard,
                    { backgroundColor: level.bgColor },
                    status === 'locked' && styles.lockedCard,
                    isMobile && styles.levelCardMobile
                  ]}
                  onPress={() => navigateToLevel(level.id)}
                  disabled={status === 'locked'}
                >
                  <View style={styles.levelHeader}>
                    <Ionicons
                      name={level.icon}
                      size={24}
                      color={status === 'locked' ? '#999' : level.color}
                    />
                    {status === 'completed' && (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    )}
                    {status === 'locked' && (
                      <Ionicons name="lock-closed" size={20} color="#999" />
                    )}
                  </View>
                  
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
                  
                  <View style={styles.levelFooter}>
                    <View style={styles.pointsContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={[
                        styles.levelPoints,
                        status === 'locked' && styles.lockedText
                      ]}>
                        {level.points} pts
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Start Section */}
        <View style={styles.quickStartSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
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
          <View style={styles.tutorInfoModal}>
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
          <View style={styles.confirmModal}>
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
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  progressSection: {
    backgroundColor: '#16213e',
    margin: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  pointsText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  badgesSection: {
    backgroundColor: '#16213e',
    margin: 16,
    marginTop: 0,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: 16,
    padding: 10,
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
    minWidth: 70,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  levelsSection: {
    margin: 16,
    marginTop: 0,
    marginBottom: 12,
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
  levelCard: {
    width: (width - 48) / 2,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 140,
  },
  // Add mobile card styles
  levelCardMobile: {
    width: '100%',
    minHeight: 120,
  },
  lockedCard: {
    opacity: 0.5,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 16,
  },
  levelDescription: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
    marginBottom: 8,
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
  },
  levelPoints: {
    fontSize: 11,
    fontWeight: '600',
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