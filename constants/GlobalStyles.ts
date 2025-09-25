import { Dimensions, StyleSheet } from 'react-native';
import { Colors, DesignTokens } from './Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Get colors based on theme (defaulting to light for now)
const getColors = (isDark = false) => isDark ? Colors.dark : Colors.light;

export const createGlobalStyles = (isDark = false) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
    // Layout Styles
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    safeContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: DesignTokens.spacing.lg,
    },
    
    scrollContainer: {
      flexGrow: 1,
      backgroundColor: colors.background,
    },
    
    content: {
      flex: 1,
      padding: DesignTokens.spacing.lg,
    },
    
    section: {
      marginBottom: DesignTokens.spacing.xl,
    },
    
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    spaceBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    
    // Card Styles
    card: {
      backgroundColor: colors.card,
      borderRadius: DesignTokens.borderRadius.lg,
      padding: DesignTokens.spacing.lg,
      marginBottom: DesignTokens.spacing.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      // Modern shadow for web compatibility
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    
    cardSmall: {
      backgroundColor: colors.card,
      borderRadius: DesignTokens.borderRadius.md,
      padding: DesignTokens.spacing.md,
      marginBottom: DesignTokens.spacing.sm,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    
    cardLarge: {
      backgroundColor: colors.card,
      borderRadius: DesignTokens.borderRadius.xl,
      padding: DesignTokens.spacing.xl,
      marginBottom: DesignTokens.spacing.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: DesignTokens.spacing.md,
      paddingBottom: DesignTokens.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: DesignTokens.spacing.md,
      paddingTop: DesignTokens.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    
    // Button Styles
    button: {
      backgroundColor: colors.button,
      paddingVertical: DesignTokens.spacing.md,
      paddingHorizontal: DesignTokens.spacing.lg,
      borderRadius: DesignTokens.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    
    buttonLarge: {
      backgroundColor: colors.button,
      paddingVertical: DesignTokens.spacing.lg,
      paddingHorizontal: DesignTokens.spacing.xl,
      borderRadius: DesignTokens.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    
    buttonSmall: {
      backgroundColor: colors.button,
      paddingVertical: DesignTokens.spacing.sm,
      paddingHorizontal: DesignTokens.spacing.md,
      borderRadius: DesignTokens.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    buttonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.button,
      paddingVertical: DesignTokens.spacing.md,
      paddingHorizontal: DesignTokens.spacing.lg,
      borderRadius: DesignTokens.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: DesignTokens.spacing.md,
      paddingHorizontal: DesignTokens.spacing.lg,
      borderRadius: DesignTokens.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    buttonText: {
      color: colors.buttonText,
      fontSize: DesignTokens.typography.fontSizes.md,
      fontWeight: '600',
    },
    
    buttonSecondaryText: {
      color: colors.button,
      fontSize: DesignTokens.typography.fontSizes.md,
      fontWeight: '600',
    },
    
    buttonOutlineText: {
      color: colors.text,
      fontSize: DesignTokens.typography.fontSizes.md,
      fontWeight: '500',
    },
    
    // Input Styles
    input: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: DesignTokens.borderRadius.md,
      paddingVertical: DesignTokens.spacing.md,
      paddingHorizontal: DesignTokens.spacing.lg,
      fontSize: DesignTokens.typography.fontSizes.md,
      color: colors.text,
      marginBottom: DesignTokens.spacing.md,
    },
    
    inputFocused: {
      borderColor: colors.inputFocus,
      borderWidth: 2,
      shadowColor: colors.inputFocus,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    
    inputError: {
      borderColor: colors.error,
      borderWidth: 2,
    },
    
    inputLabel: {
      fontSize: DesignTokens.typography.fontSizes.sm,
      fontWeight: '600',
      color: colors.text,
      marginBottom: DesignTokens.spacing.xs,
    },
    
    inputHelperText: {
      fontSize: DesignTokens.typography.fontSizes.sm,
      color: colors.textSecondary,
      marginTop: DesignTokens.spacing.xs,
    },
    
    inputErrorText: {
      fontSize: DesignTokens.typography.fontSizes.sm,
      color: colors.error,
      marginTop: DesignTokens.spacing.xs,
    },
    
    // Typography Styles
    heading1: {
      fontSize: DesignTokens.typography.fontSizes.display,
      fontWeight: '700',
      color: colors.text,
      lineHeight: DesignTokens.typography.lineHeights.tight * DesignTokens.typography.fontSizes.display,
      marginBottom: DesignTokens.spacing.lg,
    },
    
    heading2: {
      fontSize: DesignTokens.typography.fontSizes.xxxl,
      fontWeight: '700',
      color: colors.text,
      lineHeight: DesignTokens.typography.lineHeights.tight * DesignTokens.typography.fontSizes.xxxl,
      marginBottom: DesignTokens.spacing.md,
    },
    
    heading3: {
      fontSize: DesignTokens.typography.fontSizes.xxl,
      fontWeight: '600',
      color: colors.text,
      lineHeight: DesignTokens.typography.lineHeights.normal * DesignTokens.typography.fontSizes.xxl,
      marginBottom: DesignTokens.spacing.md,
    },
    
    heading4: {
      fontSize: DesignTokens.typography.fontSizes.xl,
      fontWeight: '600',
      color: colors.text,
      lineHeight: DesignTokens.typography.lineHeights.normal * DesignTokens.typography.fontSizes.xl,
      marginBottom: DesignTokens.spacing.sm,
    },
    
    bodyLarge: {
      fontSize: DesignTokens.typography.fontSizes.lg,
      fontWeight: '400',
      color: colors.text,
      lineHeight: DesignTokens.typography.lineHeights.normal * DesignTokens.typography.fontSizes.lg,
    },
    
    body: {
      fontSize: DesignTokens.typography.fontSizes.md,
      fontWeight: '400',
      color: colors.text,
      lineHeight: DesignTokens.typography.lineHeights.normal * DesignTokens.typography.fontSizes.md,
    },
    
    bodySmall: {
      fontSize: DesignTokens.typography.fontSizes.sm,
      fontWeight: '400',
      color: colors.textSecondary,
      lineHeight: DesignTokens.typography.lineHeights.normal * DesignTokens.typography.fontSizes.sm,
    },
    
    caption: {
      fontSize: DesignTokens.typography.fontSizes.xs,
      fontWeight: '400',
      color: colors.textTertiary,
      lineHeight: DesignTokens.typography.lineHeights.normal * DesignTokens.typography.fontSizes.xs,
    },
    
    // Badge Styles
    badge: {
      backgroundColor: colors.primary,
      paddingVertical: DesignTokens.spacing.xs,
      paddingHorizontal: DesignTokens.spacing.sm,
      borderRadius: DesignTokens.borderRadius.full,
      alignSelf: 'flex-start',
    },
    
    badgeSuccess: {
      backgroundColor: colors.success,
      paddingVertical: DesignTokens.spacing.xs,
      paddingHorizontal: DesignTokens.spacing.sm,
      borderRadius: DesignTokens.borderRadius.full,
      alignSelf: 'flex-start',
    },
    
    badgeWarning: {
      backgroundColor: colors.warning,
      paddingVertical: DesignTokens.spacing.xs,
      paddingHorizontal: DesignTokens.spacing.sm,
      borderRadius: DesignTokens.borderRadius.full,
      alignSelf: 'flex-start',
    },
    
    badgeError: {
      backgroundColor: colors.error,
      paddingVertical: DesignTokens.spacing.xs,
      paddingHorizontal: DesignTokens.spacing.sm,
      borderRadius: DesignTokens.borderRadius.full,
      alignSelf: 'flex-start',
    },
    
    badgeText: {
      color: colors.textInverse,
      fontSize: DesignTokens.typography.fontSizes.xs,
      fontWeight: '600',
    },
    
    // Tab Styles
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: DesignTokens.borderRadius.md,
      padding: DesignTokens.spacing.xs,
      marginBottom: DesignTokens.spacing.lg,
    },
    
    tab: {
      flex: 1,
      paddingVertical: DesignTokens.spacing.sm,
      paddingHorizontal: DesignTokens.spacing.md,
      borderRadius: DesignTokens.borderRadius.sm,
      alignItems: 'center',
    },
    
    tabActive: {
      backgroundColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    
    tabText: {
      fontSize: DesignTokens.typography.fontSizes.sm,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    
    tabTextActive: {
      color: colors.textInverse,
      fontWeight: '600',
    },
    
    // Divider Styles
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: DesignTokens.spacing.md,
    },
    
    dividerThick: {
      height: 2,
      backgroundColor: colors.borderSecondary,
      marginVertical: DesignTokens.spacing.lg,
    },
    
    // Icon Styles
    iconSmall: {
      width: 16,
      height: 16,
    },
    
    iconMedium: {
      width: 24,
      height: 24,
    },
    
    iconLarge: {
      width: 32,
      height: 32,
    },
    
    // Avatar Styles
    avatar: {
      width: 40,
      height: 40,
      borderRadius: DesignTokens.borderRadius.full,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    avatarLarge: {
      width: 64,
      height: 64,
      borderRadius: DesignTokens.borderRadius.full,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    avatarSmall: {
      width: 28,
      height: 28,
      borderRadius: DesignTokens.borderRadius.full,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // Status Styles
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: DesignTokens.borderRadius.full,
      marginRight: DesignTokens.spacing.xs,
    },
    
    statusOnline: {
      backgroundColor: colors.success,
    },
    
    statusOffline: {
      backgroundColor: colors.textTertiary,
    },
    
    statusBusy: {
      backgroundColor: colors.warning,
    },
    
    // Loading Styles
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    
    loadingText: {
      marginTop: DesignTokens.spacing.md,
      fontSize: DesignTokens.typography.fontSizes.md,
      color: colors.textSecondary,
    },
    
    // Empty State Styles
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: DesignTokens.spacing.xl,
    },
    
    emptyIcon: {
      marginBottom: DesignTokens.spacing.lg,
      opacity: 0.5,
    },
    
    emptyTitle: {
      fontSize: DesignTokens.typography.fontSizes.lg,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: DesignTokens.spacing.sm,
    },
    
    emptyDescription: {
      fontSize: DesignTokens.typography.fontSizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: DesignTokens.typography.lineHeights.relaxed * DesignTokens.typography.fontSizes.md,
    },
    
    // Form Styles
    form: {
      backgroundColor: colors.card,
      borderRadius: DesignTokens.borderRadius.lg,
      padding: DesignTokens.spacing.lg,
      ...DesignTokens.shadows.md,
    },
    
    formSection: {
      marginBottom: DesignTokens.spacing.lg,
    },
    
    formTitle: {
      fontSize: DesignTokens.typography.fontSizes.xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: DesignTokens.spacing.md,
      textAlign: 'center',
    },
    
    formSubtitle: {
      fontSize: DesignTokens.typography.fontSizes.md,
      color: colors.textSecondary,
      marginBottom: DesignTokens.spacing.lg,
      textAlign: 'center',
    },
    
    // Utility Styles
    shadow: DesignTokens.shadows.md,
    shadowLarge: DesignTokens.shadows.lg,
    
    // Spacing Utilities
    mt: { marginTop: DesignTokens.spacing.md },
    mb: { marginBottom: DesignTokens.spacing.md },
    ml: { marginLeft: DesignTokens.spacing.md },
    mr: { marginRight: DesignTokens.spacing.md },
    mx: { marginHorizontal: DesignTokens.spacing.md },
    my: { marginVertical: DesignTokens.spacing.md },
    
    pt: { paddingTop: DesignTokens.spacing.md },
    pb: { paddingBottom: DesignTokens.spacing.md },
    pl: { paddingLeft: DesignTokens.spacing.md },
    pr: { paddingRight: DesignTokens.spacing.md },
    px: { paddingHorizontal: DesignTokens.spacing.md },
    py: { paddingVertical: DesignTokens.spacing.md },
  });
};

// Export default light theme styles
export const GlobalStyles = createGlobalStyles(false);

// Helper functions for responsive design
export const isTablet = screenWidth >= 768;
export const isDesktop = screenWidth >= 1024;

export const getResponsiveValue = (mobile: any, tablet?: any, desktop?: any) => {
  if (isDesktop && desktop !== undefined) return desktop;
  if (isTablet && tablet !== undefined) return tablet;
  return mobile;
};

// Animation presets
export const AnimationPresets = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { transform: [{ translateY: 50 }], opacity: 0 },
    to: { transform: [{ translateY: 0 }], opacity: 1 },
  },
  slideDown: {
    from: { transform: [{ translateY: -50 }], opacity: 0 },
    to: { transform: [{ translateY: 0 }], opacity: 1 },
  },
  scale: {
    from: { transform: [{ scale: 0.8 }], opacity: 0 },
    to: { transform: [{ scale: 1 }], opacity: 1 },
  },
};