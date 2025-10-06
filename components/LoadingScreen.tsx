import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { GlobalStyles } from '../constants/GlobalStyles';
import { AnimatedAppIcon } from './AnimatedAppIcon';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  visible: boolean;
  message?: string;
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  visible,
  message = "Loading...",
  onComplete
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        opacity: fadeAnim,
      }}
    >
      <LinearGradient
        colors={['#1d4ed8', '#1e40af', '#1e3a8a'] as any}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background pattern */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
          }}
        >
          {/* Create a pattern of dots */}
          {Array.from({ length: 50 }).map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.light.textInverse,
                left: (i * 37) % width,
                top: ((i * 47) % height),
              }}
            />
          ))}
        </View>

        <Animated.View
          style={{
            alignItems: 'center',
            transform: [{ translateY: slideAnim }],
          }}
        >
          <AnimatedAppIcon size={120} showAnimation={true} />
          
          <Text style={[GlobalStyles.heading1, { 
            color: Colors.light.textInverse, 
            marginTop: 30,
            textAlign: 'center',
            fontSize: 32,
            fontWeight: 'bold',
          }]}>
            Study Buddy
          </Text>
          
          <Text style={[GlobalStyles.body, { 
            color: Colors.light.textInverse, 
            marginTop: 10,
            opacity: 0.8,
            textAlign: 'center',
          }]}>
            Your Smart Learning Companion
          </Text>

          <View style={{
            marginTop: 40,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 20,
          }}>
            <Text style={[GlobalStyles.caption, { 
              color: Colors.light.textInverse,
              textAlign: 'center',
            }]}>
              {message}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

export default LoadingScreen;