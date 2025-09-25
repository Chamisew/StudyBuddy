/**
 * Galaxy-themed color scheme for Study Buddy app
 * Cosmic colors for a space-inspired user experience
 */

// Cosmic Blue - Deep space blues
const cosmicBlue = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',     // Vibrant cosmic blue
  600: '#0284c7',     // Main cosmic blue
  700: '#0369a1',     // Deep cosmic blue
  800: '#075985',
  900: '#0c4a6e',
};

// Space Purple - Nebula purples
const spacePurple = {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',     // Vibrant space purple
  600: '#7c3aed',     // Main space purple
  700: '#6d28d9',     // Deep space purple
  800: '#5b21b6',
  900: '#4c1d95',
};

// Star Gold - Twinkling star golds
const starGold = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',     // Vibrant star gold
  600: '#d97706',     // Main star gold
  700: '#b45309',     // Deep star gold
  800: '#92400e',
  900: '#78350f',
};

// Nebula Pink - Cosmic pink accents
const nebulaPink = {
  50: '#fdf2f8',
  100: '#fce7f3',
  200: '#fbcfe8',
  300: '#f9a8d4',
  400: '#f472b6',
  500: '#ec4899',     // Vibrant nebula pink
  600: '#db2777',     // Main nebula pink
  700: '#be185d',     // Deep nebula pink
  800: '#9d174d',
  900: '#831843',
};

// Cosmic Gray - Deep space grays
const cosmicGray = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',     // Vibrant cosmic gray
  600: '#475569',     // Main cosmic gray
  700: '#334155',     // Deep cosmic gray
  800: '#1e293b',
  900: '#0f172a',     // Space black
};

export const GalaxyColors = {
  light: {
    // Primary cosmic colors
    primary: cosmicBlue[600],
    primaryLight: cosmicBlue[400],
    primaryDark: cosmicBlue[700],
    
    // Secondary space colors
    secondary: spacePurple[600],
    secondaryLight: spacePurple[400],
    secondaryDark: spacePurple[700],
    
    // Accent star colors
    accent: starGold[500],
    accentLight: starGold[400],
    accentDark: starGold[600],
    
    // Nebula accent
    nebula: nebulaPink[500],
    nebulaLight: nebulaPink[400],
    nebulaDark: nebulaPink[600],
    
    // Status colors
    success: '#22c55e',
    warning: starGold[500],
    error: '#ef4444',
    info: cosmicBlue[500],
    
    // Text colors
    text: cosmicGray[900],
    textSecondary: cosmicGray[600],
    textTertiary: cosmicGray[400],
    textInverse: '#ffffff',
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: cosmicGray[50],
    backgroundTertiary: cosmicGray[100],
    
    // Surface colors
    surface: '#ffffff',
    surfaceSecondary: cosmicGray[50],
    surfaceTertiary: cosmicGray[100],
    
    // Border colors
    border: cosmicGray[200],
    borderSecondary: cosmicGray[300],
    borderTertiary: cosmicGray[400],
    
    // Icon colors
    icon: cosmicGray[600],
    iconSecondary: cosmicGray[400],
    iconInverse: '#ffffff',
    
    // Tab colors
    tint: cosmicBlue[600],
    tabIconDefault: cosmicGray[400],
    tabIconSelected: cosmicBlue[600],
    
    // Card colors
    card: '#ffffff',
    cardBorder: cosmicGray[200],
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    
    // Input colors
    input: '#ffffff',
    inputBorder: cosmicGray[300],
    inputFocus: cosmicBlue[500],
    inputPlaceholder: cosmicGray[400],
    
    // Button colors
    button: cosmicBlue[600],
    buttonHover: cosmicBlue[700],
    buttonDisabled: cosmicGray[300],
    buttonText: '#ffffff',
    
    // Gradient colors for galaxy overlays
    gradientStart: 'rgba(2, 132, 199, 0.9)',      // Cosmic blue
    gradientEnd: 'rgba(125, 211, 252, 0.5)',      // Light cosmic blue
    gradientOverlay: 'rgba(11, 17, 33, 0.7)',     // Deep space
  },
  dark: {
    // Primary cosmic colors
    primary: cosmicBlue[400],
    primaryLight: cosmicBlue[300],
    primaryDark: cosmicBlue[500],
    
    // Secondary space colors
    secondary: spacePurple[400],
    secondaryLight: spacePurple[300],
    secondaryDark: spacePurple[500],
    
    // Accent star colors
    accent: starGold[400],
    accentLight: starGold[300],
    accentDark: starGold[500],
    
    // Nebula accent
    nebula: nebulaPink[400],
    nebulaLight: nebulaPink[300],
    nebulaDark: nebulaPink[500],
    
    // Status colors
    success: '#4ade80',
    warning: starGold[400],
    error: '#f87171',
    info: cosmicBlue[400],
    
    // Text colors
    text: '#ffffff',
    textSecondary: cosmicGray[300],
    textTertiary: cosmicGray[400],
    textInverse: cosmicGray[900],
    
    // Background colors
    background: '#0f172a',        // Deep space black
    backgroundSecondary: '#1e293b', // Dark cosmic gray
    backgroundTertiary: '#334155',  // Medium cosmic gray
    
    // Surface colors
    surface: '#1e293b',           // Dark cosmic gray
    surfaceSecondary: '#334155',   // Medium cosmic gray
    surfaceTertiary: '#475569',    // Light cosmic gray
    
    // Border colors
    border: '#475569',            // Light cosmic gray
    borderSecondary: '#64748b',    // Vibrant cosmic gray
    borderTertiary: '#94a3b8',    // Lighter cosmic gray
    
    // Icon colors
    icon: cosmicGray[300],
    iconSecondary: cosmicGray[400],
    iconInverse: cosmicGray[900],
    
    // Tab colors
    tint: cosmicBlue[400],
    tabIconDefault: cosmicGray[500],
    tabIconSelected: cosmicBlue[400],
    
    // Card colors
    card: '#1e293b',              // Dark cosmic gray
    cardBorder: '#334155',        // Medium cosmic gray
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    
    // Input colors
    input: '#334155',             // Medium cosmic gray
    inputBorder: '#475569',       // Light cosmic gray
    inputFocus: cosmicBlue[400],  // Vibrant cosmic blue
    inputPlaceholder: cosmicGray[400],
    
    // Button colors
    button: cosmicBlue[500],      // Vibrant cosmic blue
    buttonHover: cosmicBlue[400], // Light cosmic blue
    buttonDisabled: cosmicGray[600], // Dark cosmic gray
    buttonText: '#ffffff',
    
    // Gradient colors for galaxy overlays
    gradientStart: 'rgba(11, 17, 33, 0.9)',       // Deep space
    gradientEnd: 'rgba(2, 132, 199, 0.5)',        // Cosmic blue
    gradientOverlay: 'rgba(125, 211, 252, 0.3)',  // Light cosmic blue
  },
};

// Galaxy gradients for cosmic effects
export const GalaxyGradients = {
  // Cosmic gradients
  cosmicBlue: [cosmicBlue[700], cosmicBlue[500], cosmicBlue[300]],
  spacePurple: [spacePurple[700], spacePurple[500], spacePurple[300]],
  starGold: [starGold[700], starGold[500], starGold[300]],
  nebulaPink: [nebulaPink[700], nebulaPink[500], nebulaPink[300]],
  
  // Background gradients
  space: ['#0f172a', '#1e293b', '#334155'],        // Deep space to medium gray
  nebula: ['#8b5cf6', '#0ea5e9', '#f59e0b'],       // Purple to blue to gold
  galaxy: ['#0f172a', '#1e3a8a', '#8b5cf6'],       // Deep space to blue to purple
  cosmic: ['#0f172a', '#0369a1', '#8b5cf6'],       // Deep space to blue to purple
  
  // Overlay gradients for images
  imageOverlay: ['rgba(11, 17, 33, 0.9)', 'rgba(2, 132, 199, 0.5)'],  // Deep space to cosmic blue
  heroOverlay: ['rgba(11, 17, 33, 0.8)', 'rgba(125, 211, 252, 0.3)'], // Deep space to light blue
};