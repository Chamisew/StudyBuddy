import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { getResponsiveValue, GlobalStyles, isDesktop, isTablet } from '../constants/GlobalStyles';
import { AnimatedAppIcon } from './AnimatedAppIcon';

interface EnhancedHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  gradientColors?: string[];
  showAppIcon?: boolean;
  actions?: Array<{
    icon: string;
    onPress: () => void;
    color?: string;
  }>;
}

export const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightComponent,
  gradientColors = ['#667eea', '#764ba2'],
  showAppIcon = false,
  actions = [],
}) => {
  // Responsive values
  const headerPadding = getResponsiveValue(16, 20, 24);
  const headerHeight = getResponsiveValue(50, 60, 70);
  const titleFontSize = getResponsiveValue(18, 22, 26);
  const subtitleFontSize = getResponsiveValue(12, 14, 16);
  const iconSize = getResponsiveValue(18, 20, 24);
  const buttonSize = getResponsiveValue(36, 40, 44);
  const appIconSize = getResponsiveValue(32, 36, 40);
  const bottomPadding = getResponsiveValue(16, 18, 20);
  
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={gradientColors[0]} />
      <LinearGradient
        colors={gradientColors as any}
        style={{
          paddingTop: StatusBar.currentHeight || (isDesktop ? 44 : isTablet ? 40 : 36),
          paddingBottom: bottomPadding,
          paddingHorizontal: headerPadding,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header content */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: headerHeight,
        }}>
          {/* Left side */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            flex: 1,
            maxWidth: isDesktop ? '70%' : '75%'
          }}>
            {showBackButton && (
              <TouchableOpacity
                onPress={onBackPress}
                style={{
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: buttonSize / 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: getResponsiveValue(10, 12, 15),
                }}
              >
                <Ionicons name="arrow-back" size={iconSize} color={Colors.light.textInverse} />
              </TouchableOpacity>
            )}
            
            {showAppIcon && (
              <View style={{ marginRight: getResponsiveValue(10, 12, 15) }}>
                <AnimatedAppIcon size={appIconSize} showAnimation={true} />
              </View>
            )}
            
            <View style={{ flex: 1 }}>
              <Text 
                style={[GlobalStyles.heading3, {
                  color: Colors.light.textInverse,
                  fontSize: titleFontSize,
                  fontWeight: 'bold',
                  marginBottom: 0,
                }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              
              {subtitle && !isTablet && (
                <Text 
                  style={[GlobalStyles.bodySmall, {
                    color: Colors.light.textInverse,
                    opacity: 0.9,
                    marginTop: 2,
                    fontSize: subtitleFontSize,
                  }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {subtitle}
                </Text>
              )}
              
              {subtitle && isTablet && !isDesktop && (
                <Text 
                  style={[GlobalStyles.bodySmall, {
                    color: Colors.light.textInverse,
                    opacity: 0.9,
                    marginTop: 2,
                    fontSize: subtitleFontSize,
                  }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {subtitle}
                </Text>
              )}
              
              {subtitle && isDesktop && (
                <Text 
                  style={[GlobalStyles.bodySmall, {
                    color: Colors.light.textInverse,
                    opacity: 0.9,
                    marginTop: 2,
                    fontSize: subtitleFontSize,
                  }]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Right side */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexShrink: 0,
            maxWidth: isDesktop ? '30%' : '25%'
          }}>
            {actions.slice(0, isDesktop ? actions.length : isTablet ? 3 : 2).map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.onPress}
                style={{
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: buttonSize / 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: index > 0 ? getResponsiveValue(6, 8, 10) : 0,
                }}
              >
                <Ionicons 
                  name={action.icon as any} 
                  size={getResponsiveValue(16, 18, 20)} 
                  color={action.color || Colors.light.textInverse} 
                />
              </TouchableOpacity>
            ))}
            
            {/* Overflow menu for mobile when too many actions */}
            {!isTablet && actions.length > 2 && (
              <TouchableOpacity
                style={{
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: buttonSize / 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 6,
                }}
              >
                <Ionicons 
                  name="ellipsis-horizontal" 
                  size={16} 
                  color={Colors.light.textInverse} 
                />
              </TouchableOpacity>
            )}
            
            {rightComponent}
          </View>
        </View>

        {/* Decorative bottom border */}
        <View style={{
          height: getResponsiveValue(1.5, 2, 2.5),
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          marginTop: getResponsiveValue(8, 10, 12),
          borderRadius: 1,
        }} />
      </LinearGradient>
    </>
  );
};

export default EnhancedHeader;