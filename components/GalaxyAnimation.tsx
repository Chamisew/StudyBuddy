import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { GalaxyColors } from '../constants/GalaxyColors';

const { width, height } = Dimensions.get('window');

interface GalaxyAnimationProps {
  style?: any;
}

export const GalaxyAnimation: React.FC<GalaxyAnimationProps> = ({ style }) => {
  const star1Opacity = useRef(new Animated.Value(0)).current;
  const star2Opacity = useRef(new Animated.Value(0)).current;
  const star3Opacity = useRef(new Animated.Value(0)).current;
  const star4Opacity = useRef(new Animated.Value(0)).current;
  const star5Opacity = useRef(new Animated.Value(0)).current;
  const star6Opacity = useRef(new Animated.Value(0)).current;
  const star7Opacity = useRef(new Animated.Value(0)).current;
  const star8Opacity = useRef(new Animated.Value(0)).current;
  
  // Ball animations
  const ball1Opacity = useRef(new Animated.Value(0)).current;
  const ball1Scale = useRef(new Animated.Value(0.5)).current;
  const ball2Opacity = useRef(new Animated.Value(0)).current;
  const ball2Scale = useRef(new Animated.Value(0.3)).current;
  const ball3Opacity = useRef(new Animated.Value(0)).current;
  const ball3Scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Animate stars with different timings
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(star1Opacity, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(star2Opacity, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(star3Opacity, {
            toValue: 0.7,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(star1Opacity, {
            toValue: 0.2,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(star2Opacity, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(star3Opacity, {
            toValue: 0.4,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(star1Opacity, {
            toValue: 0.8,
            duration: 1700,
            useNativeDriver: true,
          }),
          Animated.timing(star2Opacity, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(star3Opacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Animate additional stars
    Animated.loop(
      Animated.sequence([
        Animated.timing(star4Opacity, {
          toValue: 0.9,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(star4Opacity, {
          toValue: 0.1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(star5Opacity, {
          toValue: 0.3,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(star5Opacity, {
          toValue: 0.8,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(star6Opacity, {
          toValue: 0.7,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(star6Opacity, {
          toValue: 0.2,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(star7Opacity, {
          toValue: 0.4,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(star7Opacity, {
          toValue: 0.9,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(star8Opacity, {
          toValue: 0.6,
          duration: 1900,
          useNativeDriver: true,
        }),
        Animated.timing(star8Opacity, {
          toValue: 0.1,
          duration: 1900,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Animate balls
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ball1Opacity, {
            toValue: 0.7,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ball1Scale, {
            toValue: 1.2,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ball1Opacity, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ball1Scale, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ball2Opacity, {
            toValue: 0.5,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(ball2Scale, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ball2Opacity, {
            toValue: 0.1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(ball2Scale, {
            toValue: 0.4,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ball3Opacity, {
            toValue: 0.6,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(ball3Scale, {
            toValue: 1.5,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ball3Opacity, {
            toValue: 0.2,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(ball3Scale, {
            toValue: 0.6,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Stars only */}
      <Animated.View style={[styles.star, { opacity: star1Opacity, top: '15%', left: '10%' }]}>
        <Ionicons name="star" size={12} color={GalaxyColors.light.accent} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star2Opacity, top: '25%', left: '85%' }]}>
        <Ionicons name="star" size={8} color={GalaxyColors.light.primary} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star3Opacity, top: '70%', left: '20%' }]}>
        <Ionicons name="star" size={10} color={GalaxyColors.light.secondary} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star4Opacity, top: '40%', left: '70%' }]}>
        <Ionicons name="star" size={6} color={GalaxyColors.light.accent} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star5Opacity, top: '80%', left: '90%' }]}>
        <Ionicons name="star" size={9} color={GalaxyColors.light.primary} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star6Opacity, top: '30%', left: '15%' }]}>
        <Ionicons name="star" size={7} color={GalaxyColors.light.secondary} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star7Opacity, top: '60%', left: '75%' }]}>
        <Ionicons name="star" size={11} color={GalaxyColors.light.accent} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star8Opacity, top: '10%', left: '60%' }]}>
        <Ionicons name="star" size={8} color={GalaxyColors.light.primary} />
      </Animated.View>
      
      {/* Galaxy Balls */}
      <Animated.View 
        style={[
          styles.ball, 
          { 
            opacity: ball1Opacity, 
            transform: [{ scale: ball1Scale }],
            top: '20%', 
            left: '25%',
            backgroundColor: GalaxyColors.light.primary + '40', // Adding transparency
          }
        ]} 
      />
      
      <Animated.View 
        style={[
          styles.ball, 
          { 
            opacity: ball2Opacity, 
            transform: [{ scale: ball2Scale }],
            top: '65%', 
            left: '80%',
            backgroundColor: GalaxyColors.light.secondary + '40',
          }
        ]} 
      />
      
      <Animated.View 
        style={[
          styles.ball, 
          { 
            opacity: ball3Opacity, 
            transform: [{ scale: ball3Scale }],
            top: '50%', 
            left: '10%',
            backgroundColor: GalaxyColors.light.accent + '40',
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  star: {
    position: 'absolute',
  },
  ball: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    // Galaxy-like blur effect can be added with shadow if needed
  },
});

export default GalaxyAnimation;