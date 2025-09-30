import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Colors } from "../constants/Colors";

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: "Connect & Learn",
    subtitle: "Find Your Perfect Study Partner",
    description: "Connect with experienced tutors and fellow students. Get personalized help in any subject you need assistance with.",
    icon: "people-outline",
    backgroundColor: ['#1d4ed8', '#1e40af'],
    features: [
      "One-on-one tutoring sessions",
      "Group study rooms",
      "Expert tutors in all subjects"
    ]
  },
  {
    id: 2,
    title: "Interactive Learning",
    subtitle: "Engage with Dynamic Content",
    description: "Access interactive quizzes, educational videos, and comprehensive study materials tailored to your learning style.",
    icon: "library-outline",
    backgroundColor: ['#1e40af', '#1e3a8a'],
    features: [
      "Interactive quizzes & tests",
      "Video learning library",
      "Personalized study plans"
    ]
  },
  {
    id: 3,
    title: "Track Progress",
    subtitle: "Monitor Your Academic Journey",
    description: "Keep track of your learning progress, achievements, and goals. Get insights to improve your study habits.",
    icon: "trophy-outline",
    backgroundColor: ['#1e3a8a', '#475569'],
    features: [
      "Progress tracking dashboard",
      "Achievement badges",
      "Performance analytics"
    ]
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1 && isLayoutReady) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({ 
            index: nextIndex, 
            animated: true,
            viewPosition: 0.5
          });
        } catch (error) {
          console.log('ScrollToIndex error:', error);
          // Fallback to scrollTo
          flatListRef.current.scrollTo({
            x: nextIndex * width,
            animated: true
          });
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && isLayoutReady) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({ 
            index: prevIndex, 
            animated: true,
            viewPosition: 0.5
          });
        } catch (error) {
          console.log('ScrollToIndex error:', error);
          // Fallback to scrollTo
          flatListRef.current.scrollTo({
            x: prevIndex * width,
            animated: true
          });
        }
      }
    }
  };

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_seen', 'true');
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
    router.push("/signin");
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_seen', 'true');
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
    router.push("/signin");
  };

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  });
  
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  });

  const renderOnboardingItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={item.backgroundColor}
        style={styles.slideGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.slideHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name={item.icon} size={60} color={Colors.light.textInverse} />
          </View>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>

        {/* Content */}
        <View style={styles.slideContent}>
          <Text style={styles.slideDescription}>{item.description}</Text>
          
          <View style={styles.featuresContainer}>
            {item.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureBullet} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {onboardingData.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 20, 8],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[styles.paginationDot, { width: dotWidth, opacity }]}
          />
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />
      
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Onboarding Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderOnboardingItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewabilityConfig.current}
        bounces={false}
        scrollEventThrottle={32}
        onLayout={() => setIsLayoutReady(true)}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {renderPagination()}
        
        <View style={styles.navigationButtons}>
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
              <Ionicons name="chevron-back" size={20} color={Colors.light.primary} />
              <Text style={styles.previousButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.spacer} />
          
          {currentIndex < onboardingData.length - 1 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.textInverse} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.light.textInverse} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  
  skipText: {
    color: Colors.light.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  
  slide: {
    flex: 1,
  },
  
  slideGradient: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 50,
  },
  
  slideHeader: {
    alignItems: 'center',
    marginBottom: 60,
  },
  
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  slideTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.textInverse,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  slideSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  slideContent: {
    flex: 1,
    justifyContent: 'center',
  },
  
  slideDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  
  featuresContainer: {
    paddingHorizontal: 20,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.textInverse,
    marginRight: 16,
  },
  
  featureText: {
    fontSize: 16,
    color: Colors.light.textInverse,
    fontWeight: '500',
    flex: 1,
  },
  
  footer: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 30,
    paddingVertical: 30,
  },
  
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  
  paginationDot: {
    height: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 12,
  },
  
  previousButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  spacer: {
    flex: 1,
  },
  
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  nextButtonText: {
    color: Colors.light.textInverse,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  continueButtonText: {
    color: Colors.light.textInverse,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
};