import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { GalaxyColors } from '../constants/GalaxyColors';

const { width, height } = Dimensions.get('window');

interface GalaxyBackgroundProps {
  style?: any;
}

export const GalaxyBackground: React.FC<GalaxyBackgroundProps> = ({ style }) => {
  const star1Opacity = useRef(new Animated.Value(0)).current;
  const star2Opacity = useRef(new Animated.Value(0)).current;
  const star3Opacity = useRef(new Animated.Value(0)).current;
  const star4Opacity = useRef(new Animated.Value(0)).current;
  const star5Opacity = useRef(new Animated.Value(0)).current;
  const cometPosition = useRef(new Animated.Value(-100)).current;
  const cometOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate stars with different timings
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(star1Opacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(star2Opacity, {
            toValue: 0.4,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(star3Opacity, {
            toValue: 0.8,
            duration: 2200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(star1Opacity, {
            toValue: 0.3,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(star2Opacity, {
            toValue: 1,
            duration: 1900,
            useNativeDriver: true,
          }),
          Animated.timing(star3Opacity, {
            toValue: 0.5,
            duration: 1700,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(star1Opacity, {
            toValue: 0.9,
            duration: 2100,
            useNativeDriver: true,
          }),
          Animated.timing(star2Opacity, {
            toValue: 0.7,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(star3Opacity, {
            toValue: 1,
            duration: 2300,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Animate additional stars
    Animated.loop(
      Animated.sequence([
        Animated.timing(star4Opacity, {
          toValue: 0.5,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(star4Opacity, {
          toValue: 0.2,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(star5Opacity, {
          toValue: 0.6,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(star5Opacity, {
          toValue: 0.9,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animate comet with opacity for fading effect
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(cometPosition, {
            toValue: width + 100,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(cometOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(cometPosition, {
            toValue: -100,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(cometOpacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(cometOpacity, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Background gradient */}
      <View style={styles.gradientBackground} />
      
      {/* Stars */}
      <Animated.View style={[styles.star, { opacity: star1Opacity, top: '10%', left: '5%' }]}>
        <Ionicons name="star" size={8} color={GalaxyColors.light.accent} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star2Opacity, top: '20%', left: '90%' }]}>
        <Ionicons name="star" size={6} color={GalaxyColors.light.primary} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star3Opacity, top: '75%', left: '15%' }]}>
        <Ionicons name="star" size={7} color={GalaxyColors.light.secondary} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star4Opacity, top: '45%', left: '75%' }]}>
        <Ionicons name="star" size={5} color={GalaxyColors.light.accent} />
      </Animated.View>
      
      <Animated.View style={[styles.star, { opacity: star5Opacity, top: '85%', left: '85%' }]}>
        <Ionicons name="star" size={6} color={GalaxyColors.light.primary} />
      </Animated.View>
      
      {/* Comet */}
      <Animated.View 
        style={[
          styles.comet, 
          { 
            transform: [{ translateX: cometPosition }], 
            opacity: cometOpacity,
            top: '15%',
            left: '-5%'
          }
        ]}
      >
        <Ionicons name="arrow-forward" size={20} color={GalaxyColors.light.primary} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GalaxyColors.light.background,
  },
  star: {
    position: 'absolute',
  },
  comet: {
    position: 'absolute',
  },
});

export default GalaxyBackground;