import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSearchParams } from "expo-router";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { useEffect, useState } from "react";
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oobCode, setOobCode] = useState("");
  const [email, setEmail] = useState("");

  // Extract the oobCode from URL parameters
  useEffect(() => {
    if (params.oobCode) {
      setOobCode(params.oobCode);
    }
    
    if (params.email) {
      setEmail(decodeURIComponent(params.email));
    }
  }, [params]);

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!oobCode) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      // First verify the code is still valid
      await verifyPasswordResetCode(auth, oobCode);
      
      // Then reset the password
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      setSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);
      
      if (err.code === 'auth/invalid-action-code') {
        setError("This password reset link has expired or has already been used. Please request a new password reset.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please use a stronger password.");
      } else if (err.code === 'auth/user-not-found') {
        setError("User not found. Please request a new password reset.");
      } else {
        setError("Failed to reset password. Please try again.");
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
              <Ionicons name="lock-closed-outline" size={60} color={GalaxyColors.light.primary} />
              <Text style={styles.formTitle}>Reset Password</Text>
              {email ? (
                <Text style={styles.formSubtitle}>
                  Set a new password for {email}
                </Text>
              ) : (
                <Text style={styles.formSubtitle}>
                  Set a new password for your account
                </Text>
              )}
            </View>

            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={48} color={GalaxyColors.light.success} />
                <Text style={styles.successTitle}>Password Changed!</Text>
                <Text style={styles.successText}>
                  Your password has been successfully updated.
                </Text>
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
                  <Text style={GlobalStyles.inputLabel}>New Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    error && styles.inputError
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={GalaxyColors.light.icon} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter new password"
                      placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      style={styles.textInput}
                      secureTextEntry={true}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={GlobalStyles.inputLabel}>Confirm Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    error && styles.inputError
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={GalaxyColors.light.icon} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Confirm new password"
                      placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={styles.textInput}
                      secureTextEntry={true}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[GlobalStyles.buttonLarge, isLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Ionicons name="refresh" size={20} color={GalaxyColors.light.textInverse} style={styles.loadingIcon} />
                      <Text style={GlobalStyles.buttonText}>Resetting...</Text>
                    </View>
                  ) : (
                    <Text style={GlobalStyles.buttonText}>Reset Password</Text>
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