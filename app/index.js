import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Dimensions,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { AnimatedAppIcon } from "../components/AnimatedAppIcon";
import { Colors } from "../constants/Colors";

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  const handleSignIn = () => {
    router.push("/signin");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d4ed8', '#1e40af', '#1e3a8a']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <AnimatedAppIcon size={100} showAnimation={true} />
          <Text style={styles.appTitle}>Study Buddy</Text>
          <Text style={styles.appSubtitle}>Your Smart Learning Companion</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="book-outline" size={24} color={Colors.light.textInverse} />
              </View>
              <Text style={styles.featureText}>Interactive Learning</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="people-outline" size={24} color={Colors.light.textInverse} />
              </View>
              <Text style={styles.featureText}>Connect with Tutors</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="trophy-outline" size={24} color={Colors.light.textInverse} />
              </View>
              <Text style={styles.featureText}>Track Progress</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Join thousands of students and tutors in our learning community. 
            Get personalized help, share knowledge, and achieve your academic goals.
          </Text>
        </View>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.light.textInverse} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleSignIn}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternDot,
                {
                  left: (i * 67) % width,
                  top: ((i * 89) % height),
                  opacity: 0.1,
                }
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  
  backgroundGradient: {
    flex: 1,
    position: 'relative',
  },
  
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.textInverse,
  },
  
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  
  appTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.light.textInverse,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    zIndex: 1,
  },
  
  featuresContainer: {
    marginBottom: 40,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  featureText: {
    fontSize: 18,
    color: Colors.light.textInverse,
    fontWeight: '600',
    flex: 1,
  },
  
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    zIndex: 1,
  },
  
  primaryButton: {
    backgroundColor: Colors.light.textInverse,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  primaryButtonText: {
    color: Colors.light.primary,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secondaryButtonText: {
    color: Colors.light.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
};