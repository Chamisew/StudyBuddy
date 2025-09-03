/**
 * Modern, beautiful color scheme for Study Buddy app
 * Includes comprehensive design tokens for consistent theming
 */

// Primary Brand Colors - Professional Corporate Blue
const primary = {
  50: '#f0f9ff',
  100: '#e0f2fe', 
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#1e40af',     // Professional blue
  600: '#1d4ed8',     // Main corporate blue
  700: '#1e3a8a',     // Dark corporate blue
  800: '#1e3a8a',
  900: '#1e293b',
};

// Secondary Colors - Professional Gray
const secondary = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e0',
  400: '#94a3b8',
  500: '#64748b',     // Professional gray
  600: '#475569',     // Main corporate gray
  700: '#334155',     // Dark corporate gray
  800: '#1e293b',
  900: '#0f172a',
};

// Accent Colors - Professional Orange
const accent = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#ea580c',     // Professional orange
  600: '#dc2626',     // Main corporate orange
  700: '#c2410c',     // Dark corporate orange
  800: '#9a3412',
  900: '#7c2d12',
};

// Success Colors
const success = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
};

// Warning Colors
const warning = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
};

// Error Colors
const error = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
};

// Neutral Colors
const gray = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
};

export const Colors = {
  light: {
    // Primary colors
    primary: primary[600],
    primaryLight: primary[400],
    primaryDark: primary[700],
    
    // Secondary colors
    secondary: secondary[600],
    secondaryLight: secondary[400],
    secondaryDark: secondary[700],
    
    // Accent colors
    accent: accent[500],
    accentLight: accent[400],
    accentDark: accent[600],
    
    // Status colors
    success: success[600],
    warning: warning[500],
    error: error[500],
    info: primary[500],
    
    // Text colors
    text: gray[900],
    textSecondary: gray[600],
    textTertiary: gray[400],
    textInverse: '#ffffff',
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: gray[50],
    backgroundTertiary: gray[100],
    
    // Surface colors
    surface: '#ffffff',
    surfaceSecondary: gray[50],
    surfaceTertiary: gray[100],
    
    // Border colors
    border: gray[200],
    borderSecondary: gray[300],
    borderTertiary: gray[400],
    
    // Icon colors
    icon: gray[600],
    iconSecondary: gray[400],
    iconInverse: '#ffffff',
    
    // Tab colors
    tint: primary[600],
    tabIconDefault: gray[400],
    tabIconSelected: primary[600],
    
    // Card colors
    card: '#ffffff',
    cardBorder: gray[200],
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    
    // Input colors
    input: '#ffffff',
    inputBorder: gray[300],
    inputFocus: primary[500],
    inputPlaceholder: gray[400],
    
    // Button colors
    button: primary[600],
    buttonHover: primary[700],
    buttonDisabled: gray[300],
    buttonText: '#ffffff',
    
    // Gradient colors
    gradientStart: primary[500],
    gradientEnd: secondary[500],
    gradientOverlay: 'rgba(0, 0, 0, 0.4)',
  },
  dark: {
    // Primary colors
    primary: primary[400],
    primaryLight: primary[300],
    primaryDark: primary[500],
    
    // Secondary colors
    secondary: secondary[400],
    secondaryLight: secondary[300],
    secondaryDark: secondary[500],
    
    // Accent colors
    accent: accent[400],
    accentLight: accent[300],
    accentDark: accent[500],
    
    // Status colors
    success: success[400],
    warning: warning[400],
    error: error[400],
    info: primary[400],
    
    // Text colors
    text: '#ffffff',
    textSecondary: gray[300],
    textTertiary: gray[400],
    textInverse: gray[900],
    
    // Background colors
    background: gray[900],
    backgroundSecondary: gray[800],
    backgroundTertiary: gray[700],
    
    // Surface colors
    surface: gray[800],
    surfaceSecondary: gray[700],
    surfaceTertiary: gray[600],
    
    // Border colors
    border: gray[600],
    borderSecondary: gray[500],
    borderTertiary: gray[400],
    
    // Icon colors
    icon: gray[300],
    iconSecondary: gray[400],
    iconInverse: gray[900],
    
    // Tab colors
    tint: primary[400],
    tabIconDefault: gray[500],
    tabIconSelected: primary[400],
    
    // Card colors
    card: gray[800],
    cardBorder: gray[600],
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    
    // Input colors
    input: gray[700],
    inputBorder: gray[600],
    inputFocus: primary[400],
    inputPlaceholder: gray[400],
    
    // Button colors
    button: primary[500],
    buttonHover: primary[400],
    buttonDisabled: gray[600],
    buttonText: '#ffffff',
    
    // Gradient colors
    gradientStart: primary[400],
    gradientEnd: secondary[400],
    gradientOverlay: 'rgba(0, 0, 0, 0.6)',
  },
};

// Design tokens for consistent spacing, typography, and effects
export const DesignTokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      display: 48,
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
  },
  
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
    easing: {
      easeOut: 'ease-out',
      easeIn: 'ease-in',
      easeInOut: 'ease-in-out',
    },
  },
};

// Gradients for professional corporate design
export const Gradients = {
  // Professional Corporate Gradients
  primary: ['#1d4ed8', '#1e40af', '#1e3a8a'],     // Professional blue gradient
  secondary: ['#475569', '#64748b', '#94a3b8'],   // Professional gray gradient
  accent: ['#ea580c', '#dc2626', '#c2410c'],      // Professional orange gradient
  success: ['#059669', '#047857', '#065f46'],     // Professional green gradient
  warning: ['#d97706', '#b45309', '#92400e'],     // Professional amber gradient
  error: ['#dc2626', '#b91c1c', '#991b1b'],       // Professional red gradient
  
  // Background gradients
  background: ['#f8fafc', '#f1f5f9', '#e2e8f0'],  // Light gray gradient
  hero: ['#1e40af', '#1d4ed8', '#2563eb'],        // Professional hero gradient
  card: ['#ffffff', '#f8fafc', '#f1f5f9'],        // Card gradient
  
  // Special gradients
  corporate: ['#1e3a8a', '#1d4ed8', '#3b82f6'],   // Corporate branding
  professional: ['#0f172a', '#1e293b', '#334155'], // Professional dark
  elegant: ['#64748b', '#94a3b8', '#cbd5e0'],      // Elegant gray
};
