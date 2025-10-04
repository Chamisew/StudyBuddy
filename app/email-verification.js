import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendEmailVerification, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { GalaxyColors } from "../constants/GalaxyColors";
import { GlobalStyles } from "../constants/GlobalStyles";
import { auth } from "../firebase/firebaseConfig";

const { width } = Dimensions.get('window');

export default function EmailVerificationScreen() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Set user email on component mount
  useEffect(() => {
    if (auth.currentUser) {
      setUserEmail(auth.currentUser.email || "");
    } else {
      // If no user is signed in, redirect to signin
      router.replace("/signin");
    }
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!canResend || isLoading) return;
    
    setIsLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setSuccess(true);
        setCanResend(false);
        setCountdown(60);
      } else {
        setError("No user found. Please sign up again.");
      }
    } catch (err) {
      console.error("Error resending verification email:", err);
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) {
      setError("No user found. Please sign up again.");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      // Reload user to get updated email verification status
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        // Email is verified, navigate to home
        router.replace("/home");
      } else {
        setError("Email not verified yet. Please check your inbox and click the verification link.");
      }
    } catch (err) {
      console.error("Error checking verification status:", err);
      setError("Failed to check verification status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/signin");
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Failed to sign out. Please try again.");
    }
  };

  // If no user is signed in, don't render the component
  if (!auth.currentUser) {
    return (
      <SafeAreaView style={GlobalStyles.container}>
        <View style={styles.loadingContainer}>
          <Text>Redirecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              <Ionicons name="mail-unread-outline" size={60} color={GalaxyColors.light.primary} />
              <Text style={styles.formTitle}>Verify Your Email</Text>
              <Text style={styles.formSubtitle}>
                We've sent a verification email to {userEmail || "your email address"}. 
                Please check your inbox and click the verification link to continue.
              </Text>
            </View>

            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={48} color={GalaxyColors.light.success} />
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  We've resent the verification email. Please check your inbox.
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={20} color={GalaxyColors.light.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionTitle}>Didn't receive the email?</Text>
              <View style={styles.instructionList}>
                <View style={styles.instructionItem}>
                  <Ionicons name="checkmark-circle" size={16} color={GalaxyColors.light.primary} style={styles.instructionIcon} />
                  <Text style={styles.instructionText}>Check your spam or junk folder</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Ionicons name="checkmark-circle" size={16} color={GalaxyColors.light.primary} style={styles.instructionIcon} />
                  <Text style={styles.instructionText}>Verify the email address is correct</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Ionicons name="checkmark-circle" size={16} color={GalaxyColors.light.primary} style={styles.instructionIcon} />
                  <Text style={styles.instructionText}>Try with a different email provider</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[GlobalStyles.buttonLarge, isLoading && styles.buttonDisabled]}
              onPress={handleCheckVerification}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="refresh" size={20} color={GalaxyColors.light.textInverse} style={styles.loadingIcon} />
                  <Text style={GlobalStyles.buttonText}>Checking...</Text>
                </View>
              ) : (
                <Text style={GlobalStyles.buttonText}>I've Verified My Email - Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[GlobalStyles.buttonSecondary, { marginTop: 10 }]}
              onPress={handleResendEmail}
              disabled={isLoading || !canResend}
            >
              <Text style={GlobalStyles.buttonSecondaryText}>
                {canResend ? "Resend Verification Email" : `Resend Email (${countdown}s)`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.linkButton, { marginTop: 20 }]}
              onPress={handleSignOut}
            >
              <Text style={styles.linkText}>Sign Out</Text>
            </TouchableOpacity>
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
    backgroundColor: `${GalaxyColors.light.success}15`,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: GalaxyColors.light.success,
  },
  
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GalaxyColors.light.success,
    marginTop: 8,
    textAlign: 'center',
  },
  
  successText: {
    fontSize: 16,
    color: GalaxyColors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
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
  
  instructionsContainer: {
    backgroundColor: GalaxyColors.light.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: GalaxyColors.light.border,
  },
  
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GalaxyColors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  
  instructionList: {
    marginLeft: 8,
  },
  
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  instructionIcon: {
    marginTop: 3,
    marginRight: 10,
  },
  
  instructionText: {
    fontSize: 15,
    color: GalaxyColors.light.textSecondary,
    flex: 1,
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
  
  linkButton: {
    alignItems: 'center',
  },
  
  linkText: {
    color: GalaxyColors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});