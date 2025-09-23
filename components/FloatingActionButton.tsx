import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    Text,
    TouchableOpacity
} from 'react-native';
import { Colors } from '../constants/Colors';
import { GlobalStyles } from '../constants/GlobalStyles';

const { width, height } = Dimensions.get('window');

interface FloatingActionButtonProps {
  icon?: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  gradientColors?: string[];
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  isDraggable?: boolean;
  showPulse?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon = 'add',
  onPress,
  size = 56,
  color = Colors.light.textInverse,
  gradientColors = ['#667eea', '#764ba2'],
  label,
  position = 'bottom-right',
  isDraggable = false,
  showPulse = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  // Position calculation
  const getPosition = () => {
    const margin = 20;
    switch (position) {
      case 'bottom-right':
        return { bottom: margin, right: margin };
      case 'bottom-left':
        return { bottom: margin, left: margin };
      case 'top-right':
        return { top: margin + 50, right: margin };
      case 'top-left':
        return { top: margin + 50, left: margin };
      default:
        return { bottom: margin, right: margin };
    }
  };

  // Pulse animation
  useEffect(() => {
    if (showPulse) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [showPulse]);

  // Pan responder for dragging
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => isDraggable,
    onPanResponderGrant: () => {
      pan.setOffset({
        // @ts-ignore
        x: pan.x._value,
        // @ts-ignore
        y: pan.y._value,
      });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: () => {
      pan.flattenOffset();
      
      // Snap to edges
      // @ts-ignore
      const currentX = pan.x._value;
      // @ts-ignore
      const currentY = pan.y._value;
      
      let newX = currentX;
      let newY = currentY;
      
      // Keep within screen bounds
      if (currentX < -(width / 2 - size)) newX = -(width / 2 - size);
      if (currentX > width / 2 - size) newX = width / 2 - size;
      if (currentY < -(height / 2 - size - 100)) newY = -(height / 2 - size - 100);
      if (currentY > height / 2 - size - 100) newY = height / 2 - size - 100;
      
      Animated.spring(pan, {
        toValue: { x: newX, y: newY },
        useNativeDriver: false,
      }).start();
    },
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
    
    if (label) {
      Animated.timing(labelOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    
    if (label) {
      Animated.timing(labelOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    // Haptic feedback effect with animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onPress) onPress();
  };

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          ...getPosition(),
          zIndex: 1000,
        },
        isDraggable && {
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...(isDraggable ? panResponder.panHandlers : {})}
    >
      {/* Label */}
      {label && (
        <Animated.View
          style={{
            position: 'absolute',
            right: size + 10,
            top: size / 2 - 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            opacity: labelOpacity,
            ...GlobalStyles.card,
          }}
        >
          <Text style={[GlobalStyles.bodySmall, { color: Colors.light.text }]}>
            {label}
          </Text>
        </Animated.View>
      )}

      {/* Pulse ring */}
      {showPulse && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: gradientColors[0] + '30',
            transform: [{ scale: pulseAnim }],
            top: -10,
            left: -10,
          }}
        />
      )}

      {/* Main button */}
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Animated.View
          style={{
            width: '100%',
            height: '100%',
            borderRadius: size / 2,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <LinearGradient
            colors={gradientColors as any}
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
            <Ionicons 
              name={icon as any} 
              size={size * 0.4} 
              color={color}
              style={{
                // Modern shadow for web compatibility
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowOffset: { width: 1, height: 1 },
                shadowOpacity: 1,
                shadowRadius: 3,
              }}
            />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingActionButton;