import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { GalaxyAnimation } from '../components/GalaxyAnimation';
import { GalaxyColors, cosmicGray, starGold, nebulaPink, cosmicBlue, spacePurple } from '../constants/GalaxyColors';

// Cosmic escape room levels configuration
const COSMIC_LEVELS = [
  {
    id: 1,
    title: "Nebula Laboratory",
    theme: "nebula_lab", 
    icon: "flask",
    color: nebulaPink[400],
    gradient: [nebulaPink[400], nebulaPink[600]],
    points: 100,
    badge: "Nebula Scientist"
  },
  {
    id: 2,
    title: "Stellar Treasure Vault",
    theme: "star_vault",
    icon: "diamond",
    color: starGold[400], 
    gradient: [starGold[400], starGold[600]],
    points: 150,
    badge: "Cosmic Treasure Hunter"
  },
  {
    id: 3,
    title: "Galactic Space Station",
    theme: "space_station",
    icon: "planet",
    color: spacePurple[400],
    gradient: [spacePurple[400], spacePurple[600]],
    points: 200,
    badge: "Galaxy Explorer"
  },
  {
    id: 4,
    title: "Cosmic Library Archive",
    theme: "cosmic_library",
    icon: "library",
    color: cosmicBlue[400],
    gradient: [cosmicBlue[400], cosmicBlue[600]],
    points: 175,
    badge: "Universal Scholar"
  },
  {
    id: 5,
    title: "Quantum Fortress",
    theme: "quantum_cyber",
    icon: "shield-checkmark",
    color: cosmicGray[400],
    gradient: [cosmicGray[300], cosmicGray[500]],
    points: 250,
    badge: "Quantum Guardian"
  }
];

export default function EscapeRoomQRGenerator() {
  const router = useRouter();
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [generatedQR, setGeneratedQR] = useState(null);

  const generateQRCode = (level) => {
    const qrData = {
      type: 'cosmic_escape_room',
      levelId: level.id,
      title: level.title,
      theme: level.theme,
      points: level.points,
      badge: level.badge,
      color: level.color,
      gradient: level.gradient,
      timestamp: new Date().getTime()
    };

    // Also generate a simple format for better compatibility
    const simpleFormat = `COSMIC_DIMENSION_${level.id}`;
    
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
      type: 'cosmic_escape_room_all',
      levels: COSMIC_LEVELS.map(level => ({
        id: level.id,
        title: level.title,
        theme: level.theme,
        points: level.points,
        badge: level.badge,
        color: level.color
      })),
      timestamp: new Date().getTime()
    };

    setSelectedLevel({ title: 'Universal Cosmic Access', id: 'all' });
    setGeneratedQR(JSON.stringify(allLevelsData));
  };

  // Listen for dimension changes for responsive design
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Responsive variables
  const { width } = dimensions;
  const isMobile = width < 768;

  return (
    <SafeAreaView style={styles.container}>
      {/* Cosmic Background */}
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
          <Ionicons name="qr-code" size={28} color={starGold[400]} />
          <Text style={styles.headerTitle}>Cosmic QR Generator</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="help-circle-outline" size={24} color={starGold[400]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Cosmic Instructions */}
        <View style={styles.instructionsContainer}>
          <LinearGradient
            colors={[`${cosmicBlue[800]}80`, `${spacePurple[700]}60`]}
            style={styles.instructionsGradient}
          >
            <View style={styles.instructionHeader}>
              <Ionicons name="rocket" size={24} color={starGold[400]} />
              <Text style={styles.instructionTitle}>Mission Briefing</Text>
            </View>
            <Text style={styles.instructionText}>
              Generate cosmic QR codes to transport students instantly to escape room dimensions. 
              Each code opens a portal to specific galactic challenges or grants universal access to all cosmic levels.
            </Text>
          </LinearGradient>
        </View>

        {/* Cosmic Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={24} color={starGold[400]} />
            <Text style={styles.sectionTitle}>Instant Portals</Text>
          </View>
          <TouchableOpacity
            style={styles.allLevelsButton}
            onPress={generateAllLevelsQR}
          >
            <LinearGradient
              colors={[starGold[500], starGold[700]]}
              style={styles.allLevelsGradient}
            >
              <Ionicons name="apps" size={24} color={cosmicGray[50]} />
              <Text style={styles.allLevelsButtonText}>Generate Universal Portal QR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Cosmic Dimension Portals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="planet-outline" size={24} color={starGold[400]} />
            <Text style={styles.sectionTitle}>Dimensional Portals</Text>
          </View>
          <View style={styles.levelsGrid}>
            {COSMIC_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={styles.levelCard}
                onPress={() => generateQRCode(level)}
              >
                <LinearGradient
                  colors={level.gradient}
                  style={styles.levelCardGradient}
                >
                  <View style={styles.levelInfo}>
                    <View style={styles.levelIconContainer}>
                      <Ionicons name={level.icon} size={24} color={cosmicGray[50]} />
                    </View>
                    <View style={styles.levelDetails}>
                      <Text style={styles.levelTitle}>{level.title}</Text>
                      <Text style={styles.levelMeta}>
                        Dimension {level.id} • {level.points} cosmic points
                      </Text>
                    </View>
                  </View>
                  <View style={styles.qrIconContainer}>
                    <Ionicons name="qr-code" size={20} color={cosmicGray[50]} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cosmic QR Portal Display */}
        {generatedQR && selectedLevel && (
          <View style={styles.qrSection}>
            <LinearGradient
              colors={[`${spacePurple[800]}80`, `${cosmicBlue[700]}60`]}
              style={styles.qrSectionGradient}
            >
              <View style={styles.qrSectionHeader}>
                <Ionicons name="scan" size={24} color={starGold[400]} />
                <Text style={styles.qrSectionTitle}>Generated Cosmic Portal</Text>
              </View>
              
              <View style={styles.qrContainer}>
                <View style={styles.qrHeader}>
                  <Text style={styles.qrTitle}>{selectedLevel.title}</Text>
                  <Text style={styles.qrSubtitle}>
                    {selectedLevel.id === 'all' 
                      ? 'Universal access to all cosmic dimensions' 
                      : `Dimension ${selectedLevel.id} • ${selectedLevel.points} cosmic points`
                    }
                  </Text>
                </View>
                
                <View style={styles.qrCodeContainer}>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode
                      value={generatedQR}
                      size={180}
                      color={cosmicGray[900]}
                      backgroundColor={cosmicGray[50]}
                      logoBackgroundColor="transparent"
                    />
                  </View>
                </View>

                <View style={styles.qrActions}>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={shareQRCode}
                  >
                    <LinearGradient
                      colors={[nebulaPink[500], nebulaPink[700]]}
                      style={styles.shareButtonGradient}
                    >
                      <Ionicons name="share" size={20} color={cosmicGray[50]} />
                      <Text style={styles.shareButtonText}>Share Portal</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.newQRButton}
                    onPress={() => {
                      setGeneratedQR(null);
                      setSelectedLevel(null);
                    }}
                  >
                    <Ionicons name="refresh" size={20} color={starGold[400]} />
                    <Text style={styles.newQRButtonText}>Generate New</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Cosmic Portal Benefits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color={starGold[400]} />
            <Text style={styles.sectionTitle}>Portal Advantages</Text>
          </View>
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="flash" size={20} color={nebulaPink[400]} />
              <Text style={styles.benefitText}>Instant dimensional travel</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="people" size={20} color={cosmicBlue[400]} />
              <Text style={styles.benefitText}>Universal classroom access</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="time" size={20} color={starGold[400]} />
              <Text style={styles.benefitText}>No cosmic credentials needed</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="trophy" size={20} color={spacePurple[400]} />
              <Text style={styles.benefitText}>Automatic stellar progress sync</Text>
            </View>
          </View>
        </View>

        {/* Galactic Teaching Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="telescope" size={24} color={starGold[400]} />
            <Text style={styles.sectionTitle}>Cosmic Teaching Guide</Text>
          </View>
          <View style={styles.tipContainer}>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={16} color={starGold[400]} />
              <Text style={styles.tipText}>
                Project portal QR codes on your classroom constellation display for instant student transport
              </Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={16} color={starGold[400]} />
              <Text style={styles.tipText}>
                Create cosmic QR stations around your learning galaxy for different subject dimensions
              </Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={16} color={starGold[400]} />
              <Text style={styles.tipText}>
                Use dimensional portal codes for focused stellar practice missions
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
  instructionsContainer: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsGradient: {
    padding: 20,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: starGold[400],
    marginLeft: 12,
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructionText: {
    fontSize: 14,
    color: cosmicGray[50],
    lineHeight: 22,
    opacity: 0.9,
  },
  section: {
    backgroundColor: `${cosmicGray[800]}60`,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: nebulaPink[400],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
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
  allLevelsButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: starGold[400],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  allLevelsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  allLevelsButtonText: {
    color: cosmicGray[50],
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  levelsGrid: {
    gap: 16,
  },
  levelCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: nebulaPink[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  levelCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelDetails: {
    marginLeft: 16,
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: cosmicGray[50],
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  levelMeta: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  qrIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrSection: {
    margin: 20,
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: spacePurple[400],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  qrSectionGradient: {
    padding: 24,
  },
  qrSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  qrSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: starGold[400],
    marginLeft: 12,
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: cosmicGray[50],
    textAlign: 'center',
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  qrSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    padding: 24,
    backgroundColor: cosmicGray[50],
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  qrActions: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  shareButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: nebulaPink[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  shareButtonText: {
    color: cosmicGray[50],
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  newQRButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: cosmicBlue[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  newQRButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  newQRButtonText: {
    color: cosmicGray[50],
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: cosmicGray[900],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  benefitsContainer: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: starGold[400],
  },
  benefitText: {
    fontSize: 14,
    color: cosmicGray[50],
    marginLeft: 12,
    lineHeight: 20,
    flex: 1,
  },
  tipContainer: {
    gap: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});