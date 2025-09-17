import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

// Game levels configuration
const GAME_LEVELS = [
  {
    id: 1,
    title: "Science Lab Escape",
    theme: "laboratory",
    icon: "flask",
    color: "#4CAF50",
    points: 100,
    badge: "Lab Master"
  },
  {
    id: 2,
    title: "Treasure Vault",
    theme: "treasure",
    icon: "diamond",
    color: "#FF9800",
    points: 150,
    badge: "Treasure Hunter"
  },
  {
    id: 3,
    title: "Space Station",
    theme: "space",
    icon: "planet",
    color: "#673AB7",
    points: 200,
    badge: "Space Explorer"
  },
  {
    id: 4,
    title: "Ancient Library",
    theme: "library",
    icon: "library",
    color: "#795548",
    points: 175,
    badge: "Scholar"
  },
  {
    id: 5,
    title: "Digital Fortress",
    theme: "cyber",
    icon: "shield-checkmark",
    color: "#F44336",
    points: 250,
    badge: "Cyber Guardian"
  }
];

export default function EscapeRoomQRGenerator() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [generatedQR, setGeneratedQR] = useState(null);

  const generateQRCode = (level) => {
    const qrData = {
      type: 'escape_room',
      levelId: level.id,
      title: level.title,
      theme: level.theme,
      points: level.points,
      badge: level.badge,
      timestamp: new Date().getTime()
    };

    // Also generate a simple format for better compatibility
    const simpleFormat = `ESCAPE_ROOM_LEVEL_${level.id}`;
    
    setSelectedLevel(level);
    setGeneratedQR(JSON.stringify(qrData));
  };

  const shareQRCode = async () => {
    if (!selectedLevel) return;

    try {
      await Share.share({
        message: `Join the Escape Room Challenge: ${selectedLevel.title}!\n\nScan this QR code to start playing and earn ${selectedLevel.points} points!`,
        title: 'Escape Room Challenge'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const generateAllLevelsQR = () => {
    const allLevelsData = {
      type: 'escape_room_all',
      levels: GAME_LEVELS.map(level => ({
        id: level.id,
        title: level.title,
        theme: level.theme,
        points: level.points,
        badge: level.badge
      })),
      timestamp: new Date().getTime()
    };

    setSelectedLevel({ title: 'All Levels Access', id: 'all' });
    setGeneratedQR(JSON.stringify(allLevelsData));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Generator</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionHeader}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.instructionTitle}>How to Use</Text>
          </View>
          <Text style={styles.instructionText}>
            Generate QR codes for students to quickly access specific escape room levels. 
            Students can scan these codes to jump directly to a level or access all levels at once.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.allLevelsButton}
            onPress={generateAllLevelsQR}
          >
            <Ionicons name="apps" size={24} color="#fff" />
            <Text style={styles.allLevelsButtonText}>Generate All Levels QR</Text>
          </TouchableOpacity>
        </View>

        {/* Individual Level QR Codes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Levels</Text>
          <View style={styles.levelsGrid}>
            {GAME_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[styles.levelCard, { borderLeftColor: level.color }]}
                onPress={() => generateQRCode(level)}
              >
                <View style={styles.levelInfo}>
                  <Ionicons name={level.icon} size={24} color={level.color} />
                  <View style={styles.levelDetails}>
                    <Text style={styles.levelTitle}>{level.title}</Text>
                    <Text style={styles.levelMeta}>
                      Level {level.id} • {level.points} points
                    </Text>
                  </View>
                </View>
                <Ionicons name="qr-code" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generated QR Code Display */}
        {generatedQR && selectedLevel && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Generated QR Code</Text>
            <View style={styles.qrContainer}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrTitle}>{selectedLevel.title}</Text>
                <Text style={styles.qrSubtitle}>
                  {selectedLevel.id === 'all' 
                    ? 'Access to all escape room levels' 
                    : `Level ${selectedLevel.id} • ${selectedLevel.points} points`
                  }
                </Text>
              </View>
              
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={generatedQR}
                  size={200}
                  color="#000"
                  backgroundColor="#fff"
                  logo={{uri: 'https://reactnative.dev/img/logo-og.png'}}
                  logoSize={30}
                  logoBackgroundColor="transparent"
                />
              </View>

              <View style={styles.qrActions}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={shareQRCode}
                >
                  <Ionicons name="share" size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>Share QR Code</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.newQRButton}
                  onPress={() => {
                    setGeneratedQR(null);
                    setSelectedLevel(null);
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#007AFF" />
                  <Text style={styles.newQRButtonText}>Generate New</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Usage Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code Benefits</Text>
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="flash" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Instant level access</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="people" size={20} color="#2196F3" />
              <Text style={styles.benefitText}>Easy classroom sharing</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.benefitText}>No login required</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="trophy" size={20} color="#9C27B0" />
              <Text style={styles.benefitText}>Automatic progress tracking</Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Teachers</Text>
          <View style={styles.tipContainer}>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={16} color="#FF9800" />
              <Text style={styles.tipText}>
                Display QR codes on your classroom screen for easy student access
              </Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={16} color="#FF9800" />
              <Text style={styles.tipText}>
                Print QR codes and place them around the classroom for different subjects
              </Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={16} color="#FF9800" />
              <Text style={styles.tipText}>
                Use individual level QR codes for targeted practice sessions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#1a1a2e',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  instructionsContainer: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
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
  allLevelsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
  },
  allLevelsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  levelsGrid: {
    gap: 12,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelDetails: {
    marginLeft: 12,
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  levelMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  qrSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  qrContainer: {
    padding: 16,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  qrCodeContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  qrActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  newQRButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  newQRButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  benefitsContainer: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  tipContainer: {
    gap: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});