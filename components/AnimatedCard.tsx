import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { GlobalStyles } from '../constants/GlobalStyles';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  delay?: number;
  animationType?: 'fadeIn' | 'slideUp' | 'scale' | 'none';
  disabled?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  onPress,
  delay = 0,
  animationType = 'fadeIn',
  disabled = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animations = [];

    switch (animationType) {
      case 'fadeIn':
        animations.push(
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
          })
        );
        break;
      case 'slideUp':
        animations.push(
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            delay,
            useNativeDriver: true,
          })
        );
        break;
      case 'scale':
        animations.push(
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
          })
        );
        break;
      case 'none':
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
        scaleAnim.setValue(1);
        break;
    }

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }, [delay, animationType]);

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(pressAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: animationType === 'scale' ? scaleAnim : pressAnim },
    ],
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        GlobalStyles.card,
        {
          backgroundColor: Colors.light.surface,
          borderWidth: 1,
          borderColor: Colors.light.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Component>
  );
};

export default AnimatedCard;