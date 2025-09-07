import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface AnimatedAppIconProps {
  size?: number;
  showAnimation?: boolean;
  style?: any;
}

export const AnimatedAppIcon: React.FC<AnimatedAppIconProps> = ({
  size = 80,
  showAnimation = true,
  style
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showAnimation) {
      // Create a continuous animation loop
      const createAnimationLoop = () => {
        Animated.loop(
          Animated.sequence([
            // Pulse effect
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Rotation animation
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 8000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();

        // Glow effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ])
        ).start();
      };

      createAnimationLoop();
    }
  }, [showAnimation]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const iconSize = size * 0.9;

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Outer glow ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          opacity: glowOpacity,
          transform: [{ scale: pulseAnim }],
        }}
      >
        <LinearGradient
          colors={[Colors.light.primary + '40', Colors.light.secondary + '40', 'transparent']}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: (size + 20) / 2,
          }}
        />
      </Animated.View>

      {/* Main icon background */}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          elevation: 10,
          shadowColor: Colors.light.primary,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          transform: [{ scale: pulseAnim }],
        }}
      >
        <LinearGradient
          colors={['#1d4ed8', '#1e40af'] as any}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Rotating background pattern */}
          <Animated.View
            style={{
              position: 'absolute',
              width: size * 0.8,
              height: size * 0.8,
              borderRadius: (size * 0.8) / 2,
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              transform: [{ rotate }],
            }}
          />

          {/* App icon - using custom image instead of book icon */}
          <Animated.View
            style={{
              transform: [{ rotate: showAnimation ? rotate : '0deg' }],
              width: iconSize,
              height: iconSize,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={require('../assets/images/logoImg.png')}
              style={{
                width: iconSize,
                height: iconSize,
                resizeMode: 'contain',
                // Modern shadow for web compatibility
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowOffset: { width: 1, height: 1 },
                shadowOpacity: 1,
                shadowRadius: 3,
              }}
            />
          </Animated.View>

          {/* Sparkle effects */}
          <Animated.View
            style={{
              position: 'absolute',
              top: size * 0.15,
              right: size * 0.15,
              opacity: glowAnim,
            }}
          >
            <Ionicons name="sparkles" size={size * 0.15} color="rgba(255, 255, 255, 0.8)" />
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              bottom: size * 0.15,
              left: size * 0.15,
              opacity: glowAnim,
              transform: [{ rotate: '180deg' }],
            }}
          >
            <Ionicons name="sparkles" size={size * 0.12} color="rgba(255, 255, 255, 0.6)" />
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Inner highlight */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.15,
          left: size * 0.15,
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: (size * 0.4) / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          pointerEvents: 'none',
        }}
      />
    </View>
  );
};

export default AnimatedAppIcon;