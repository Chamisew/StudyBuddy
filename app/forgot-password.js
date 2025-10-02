import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { GalaxyColors } from "../constants/GalaxyColors";
import { GlobalStyles } from "../constants/GlobalStyles";
import { auth } from "../firebase/firebaseConfig";

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      console.log("Attempting to send password reset email to:", email);
      
      // Log Firebase auth state
      console.log("Firebase auth object:", auth);
      console.log("Current user:", auth.currentUser);
      
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent successfully");
      setSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      let errorMessage = "Failed to send password reset email. Please try again.";
      
      // More detailed error handling
      if (err.code === 'auth/user-not-found') {
        // For security reasons, Firebase doesn't reveal if user exists
        // But we can show a generic message
        console.log("User not found, but showing success for security");
        setSuccess(true); // Still show success to prevent email enumeration
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please wait a while before trying again.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.code === 'auth/internal-error') {
        errorMessage = "Internal error. Please try again later.";
      } else {
        // Log the specific error for debugging
        console.log("Unknown error occurred:", err.code, err.message);
      }
      
      // Only show error if it's not user-not-found (for security)
      if (err.code !== 'auth/user-not-found') {
        setError(errorMessage);
      } else {
        // For user-not-found, still show success for security
        setSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    router.replace("/signin");
  };

  // For mobile devices, we'll stack the image and form vertically
  const isMobile = width < 768;

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <View style={GlobalStyles.form}>
            <View style={styles.logoContainer}>
              <Ionicons name="key-outline" size={60} color={GalaxyColors.light.primary} />
              <Text style={styles.formTitle}>Forgot Password?</Text>
              <Text style={styles.formSubtitle}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>
            </View>

            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={48} color={GalaxyColors.light.success} />
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  We've sent a password reset link to {email}. Please check your inbox and spam/junk folder.
                </Text>
                <Text style={styles.successNote}>
                  Note: If you don't receive the email within a few minutes:
                </Text>
                <View style={styles.troubleshootingList}>
                  <Text style={styles.troubleshootingItem}>• Check your spam/junk folder</Text>
                  <Text style={styles.troubleshootingItem}>• Verify the email address is correct</Text>
                  <Text style={styles.troubleshootingItem}>• Try with a different email provider</Text>
                </View>
                <TouchableOpacity
                  style={[GlobalStyles.buttonLarge, { marginTop: 20 }]}
                  onPress={handleBackToSignIn}
                >
                  <Text style={GlobalStyles.buttonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={20} color={GalaxyColors.light.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputContainer}>
                  <Text style={GlobalStyles.inputLabel}>Email Address</Text>
                  <View style={[
                    styles.inputWrapper,
                    error && styles.inputError
                  ]}>
                    <Ionicons name="mail-outline" size={20} color={GalaxyColors.light.icon} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                      value={email}
                      onChangeText={setEmail}
                      style={styles.textInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[GlobalStyles.buttonLarge, isLoading && styles.buttonDisabled]}
                  onPress={handlePasswordReset}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Ionicons name="refresh" size={20} color={GalaxyColors.light.textInverse} style={styles.loadingIcon} />
                      <Text style={GlobalStyles.buttonText}>Sending...</Text>
                    </View>
                  ) : (
                    <Text style={GlobalStyles.buttonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={GlobalStyles.buttonSecondary}
                  onPress={handleBackToSignIn}
                  disabled={isLoading}
                >
                  <Text style={GlobalStyles.buttonSecondaryText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: GalaxyColors.light.backgroundSecondary,
  },
  
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  
  formContainer: {
    paddingHorizontal: 20,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: GalaxyColors.light.text,
    marginTop: 16,
    textAlign: 'center',
  },
  
  formSubtitle: {
    fontSize: 16,
    color: GalaxyColors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
    maxWidth: 300,
    alignSelf: 'center',
  },
  
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: GalaxyColors.light.success,
    marginTop: 16,
    textAlign: 'center',
  },
  
  successText: {
    fontSize: 16,
    color: GalaxyColors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
    maxWidth: 300,
  },
  
  successNote: {
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 20,
    maxWidth: 300,
  },
  
  troubleshootingList: {
    marginTop: 15,
    padding: 15,
    backgroundColor: `${GalaxyColors.light.primary}10`,
    borderRadius: 8,
    alignSelf: 'center',
    maxWidth: 300,
  },
  
  troubleshootingItem: {
    fontSize: 13,
    color: GalaxyColors.light.textSecondary,
    marginBottom: 5,
    textAlign: 'left',
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${GalaxyColors.light.error}15`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: GalaxyColors.light.error,
  },
  
  errorText: {
    color: GalaxyColors.light.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  
  inputContainer: {
    marginBottom: 20,
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GalaxyColors.light.input,
    borderWidth: 1,
    borderColor: GalaxyColors.light.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 52,
  },
  
  inputError: {
    borderColor: GalaxyColors.light.error,
    borderWidth: 2,
  },
  
  inputIcon: {
    marginRight: 12,
  },
  
  textInput: {
    flex: 1,
    fontSize: 16,
    color: GalaxyColors.light.text,
    paddingVertical: 12,
  },
  
  buttonDisabled: {
    backgroundColor: GalaxyColors.light.buttonDisabled,
    opacity: 0.7,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingIcon: {
    marginRight: 8,
  },
});