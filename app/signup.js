import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { AnimatedAppIcon } from "../components/AnimatedAppIcon";
import { GalaxyAnimation } from "../components/GalaxyAnimation";
import { LoadingScreen } from "../components/LoadingScreen";
import { GalaxyColors } from "../constants/GalaxyColors";
import { GlobalStyles } from "../constants/GlobalStyles";
import { auth, db } from "../firebase/firebaseConfig";

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [subjects, setSubjects] = useState("");
  const [expertiseLevel, setExpertiseLevel] = useState("beginner");
  const [isTutor, setIsTutor] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      setError("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");
    setShowLoadingScreen(true);

    try {
      console.log("Creating user with email:", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created successfully:", user.uid);

      // Send email verification using the correct Firebase function
      console.log("Sending email verification...");
      await sendEmailVerification(user);
      console.log("Email verification sent successfully");

      // Create user profile in Firestore
      const userData = {
        email: email,
        fullName: fullName,
        subjects: subjects.split(",").map(s => s.trim()).filter(s => s),
        expertiseLevel: expertiseLevel,
        isTutor: isTutor,
        rating: 0,
        studentsCount: 0,
        createdAt: new Date(),
        profileComplete: true
      };

      await setDoc(doc(db, "users", user.uid), userData);

      // Keep loading screen for smooth transition
      setTimeout(() => {
        setShowLoadingScreen(false);
        setIsLoading(false);
        // Navigate to email verification screen instead of home
        router.replace("/email-verification");
      }, 1000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
      setShowLoadingScreen(false);
      setIsLoading(false);
    }
  };

  // For mobile devices, we'll stack the image and form vertically
  const isMobile = width < 768;

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GalaxyColors.light.secondary} />
      
      {isMobile ? (
        // Mobile layout - stacked with image at top
        <>
          {/* Image Header for Mobile */}
          <View style={styles.mobileImageHeader}>
            <Image 
              source={require('../assets/images/signupImg.png')} 
              style={styles.mobileSignupImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[GalaxyColors.light.gradientStart, GalaxyColors.light.gradientEnd]}
              style={styles.overlayGradient}
            />
            <GalaxyAnimation style={styles.galaxyAnimation} />
            <View style={styles.mobileHeaderContent}>
              <AnimatedAppIcon size={80} showAnimation={true} />
              <Text style={styles.welcomeTitle}>Join StudyBuddy</Text>
              <Text style={styles.welcomeSubtitle}>Connect with fellow learners and tutors</Text>
            </View>
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={GlobalStyles.form}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={20} color={GalaxyColors.light.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={GlobalStyles.inputLabel}>Full Name *</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedInput === 'name' && styles.inputFocused,
                    error && styles.inputError
                  ]}>
                    <Ionicons name="person-outline" size={20} color={focusedInput === 'name' ? GalaxyColors.light.primary : GalaxyColors.light.icon} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter your full name"
                      placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                      value={fullName}
                      onChangeText={setFullName}
                      style={styles.textInput}
                      autoCapitalize="words"
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={GlobalStyles.inputLabel}>Email Address *</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedInput === 'email' && styles.inputFocused,
                    error && styles.inputError
                  ]}>
                    <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? GalaxyColors.light.primary : GalaxyColors.light.icon} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                      value={email}
                      onChangeText={setEmail}
                      style={styles.textInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={GlobalStyles.inputLabel}>Password *</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedInput === 'password' && styles.inputFocused,
                    error && styles.inputError
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? GalaxyColors.light.primary : GalaxyColors.light.icon} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Create a password (min 6 characters)"
                      placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      style={styles.textInput}
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={GalaxyColors.light.icon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Subjects Input */}
                <View style={styles.inputContainer}>
                  <Text style={GlobalStyles.inputLabel}>Subjects (Optional)</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedInput === 'subjects' && styles.inputFocused
                  ]}>
                    <Ionicons name="library-outline" size={20} color={focusedInput === 'subjects' ? GalaxyColors.light.primary : GalaxyColors.light.icon} style={styles.inputIcon} />
                    <TextInput
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                      placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                      value={subjects}
                      onChangeText={setSubjects}
                      style={styles.textInput}
                      multiline
                      numberOfLines={2}
                      onFocus={() => setFocusedInput('subjects')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Expertise Level */}
                <View style={styles.inputContainer}>
                  <Text style={GlobalStyles.inputLabel}>Expertise Level</Text>
                  <View style={styles.levelContainer}>
                    {["beginner", "intermediate", "advanced"].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.levelButton,
                          expertiseLevel === level && styles.selectedLevel
                        ]}
                        onPress={() => setExpertiseLevel(level)}
                      >
                        <Text style={[
                          styles.levelText,
                          expertiseLevel === level && styles.selectedLevelText
                        ]}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Tutor Toggle */}
                <TouchableOpacity
                  style={styles.tutorToggle}
                  onPress={() => setIsTutor(!isTutor)}
                >
                  <View style={[
                    styles.checkbox,
                    isTutor && styles.checkboxSelected
                  ]}>
                    {isTutor && (
                      <Ionicons name="checkmark" size={16} color={GalaxyColors.light.textInverse} />
                    )}
                  </View>
                  <View style={styles.tutorInfo}>
                    <Text style={styles.tutorText}>I want to offer tutoring</Text>
                    <Text style={styles.tutorSubtext}>Help other students learn and earn recognition</Text>
                  </View>
                  <Ionicons name="school" size={24} color={isTutor ? GalaxyColors.light.primary : GalaxyColors.light.icon} />
                </TouchableOpacity>

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={[GlobalStyles.buttonLarge, isLoading && styles.buttonDisabled]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Ionicons name="refresh" size={20} color={GalaxyColors.light.textInverse} style={styles.loadingIcon} />
                      <Text style={GlobalStyles.buttonText}>Creating Account...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons name="person-add" size={20} color={GalaxyColors.light.textInverse} style={styles.buttonIcon} />
                      <Text style={GlobalStyles.buttonText}>Create Account</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.divider} />
                </View>

                <TouchableOpacity
                  style={GlobalStyles.buttonSecondary}
                  onPress={() => router.push("/signin")}
                >
                  <Text style={GlobalStyles.buttonSecondaryText}>Sign In to Existing Account</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Already have an account?{" "}
                  <Text 
                    style={styles.linkText}
                    onPress={() => router.push("/signin")}
                  >
                    Sign In
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </>
      ) : (
        // Desktop layout - two columns
        <View style={styles.twoColumnContainer}>
          {/* Left Column - Signup Image */}
          <View style={styles.imageColumn}>
            <Image 
              source={require('../assets/images/signupImg.png')} 
              style={styles.signupImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[GalaxyColors.light.gradientStart, GalaxyColors.light.gradientEnd]}
              style={styles.overlayGradient}
            />
            <GalaxyAnimation style={styles.galaxyAnimation} />
            
          </View>

          {/* Right Column - Form */}
          <View style={styles.formColumn}>
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formContainer}>
                <View style={GlobalStyles.form}>
                  <View style={styles.logoContainer}>
                    <AnimatedAppIcon size={60} showAnimation={true} />
                    <Text style={styles.formTitle}>Join StudyBuddy</Text>
                    <Text style={styles.formSubtitle}>Connect with fellow learners and tutors</Text>
                  </View>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="warning" size={20} color={GalaxyColors.light.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {/* Full Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={GlobalStyles.inputLabel}>Full Name *</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedInput === 'name' && styles.inputFocused,
                      error && styles.inputError
                    ]}>
                      <Ionicons name="person-outline" size={20} color={focusedInput === 'name' ? GalaxyColors.light.primary : GalaxyColors.light.icon} style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter your full name"
                        placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                        value={fullName}
                        onChangeText={setFullName}
                        style={styles.textInput}
                        autoCapitalize="words"
                        onFocus={() => setFocusedInput('name')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={GlobalStyles.inputLabel}>Email Address *</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedInput === 'email' && styles.inputFocused,
                      error && styles.inputError
                    ]}>
                      <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? GalaxyColors.light.primary : GalaxyColors.light.icon} style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                        value={email}
                        onChangeText={setEmail}
                        style={styles.textInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={GlobalStyles.inputLabel}>Password *</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedInput === 'password' && styles.inputFocused,
                      error && styles.inputError
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? GalaxyColors.light.primary : GalaxyColors.light.icon} style={styles.inputIcon} />
                      <TextInput
                        placeholder="Create a password (min 6 characters)"
                        placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        style={styles.textInput}
                        autoCapitalize="none"
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.passwordToggle}
                      >
                        <Ionicons
                          name={showPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color={GalaxyColors.light.icon}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Subjects Input */}
                  <View style={styles.inputContainer}>
                    <Text style={GlobalStyles.inputLabel}>Subjects (Optional)</Text>
                    <View style={[
                      styles.inputWrapper,
                      focusedInput === 'subjects' && styles.inputFocused
                    ]}>
                      <Ionicons name="library-outline" size={20} color={focusedInput === 'subjects' ? GalaxyColors.light.primary : GalaxyColors.light.icon} style={styles.inputIcon} />
                      <TextInput
                        placeholder="e.g., Mathematics, Physics, Chemistry"
                        placeholderTextColor={GalaxyColors.light.inputPlaceholder}
                        value={subjects}
                        onChangeText={setSubjects}
                        style={styles.textInput}
                        multiline
                        numberOfLines={2}
                        onFocus={() => setFocusedInput('subjects')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  {/* Expertise Level */}
                  <View style={styles.inputContainer}>
                    <Text style={GlobalStyles.inputLabel}>Expertise Level</Text>
                    <View style={styles.levelContainer}>
                      {["beginner", "intermediate", "advanced"].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.levelButton,
                            expertiseLevel === level && styles.selectedLevel
                          ]}
                          onPress={() => setExpertiseLevel(level)}
                        >
                          <Text style={[
                            styles.levelText,
                            expertiseLevel === level && styles.selectedLevelText
                          ]}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Tutor Toggle */}
                  <TouchableOpacity
                    style={styles.tutorToggle}
                    onPress={() => setIsTutor(!isTutor)}
                  >
                    <View style={[
                      styles.checkbox,
                      isTutor && styles.checkboxSelected
                    ]}>
                      {isTutor && (
                        <Ionicons name="checkmark" size={16} color={GalaxyColors.light.textInverse} />
                      )}
                    </View>
                    <View style={styles.tutorInfo}>
                      <Text style={styles.tutorText}>I want to offer tutoring</Text>
                      <Text style={styles.tutorSubtext}>Help other students learn and earn recognition</Text>
                    </View>
                    <Ionicons name="school" size={24} color={isTutor ? GalaxyColors.light.primary : GalaxyColors.light.icon} />
                  </TouchableOpacity>

                  {/* Sign Up Button */}
                  <TouchableOpacity
                    style={[GlobalStyles.buttonLarge, isLoading && styles.buttonDisabled]}
                    onPress={handleSignUp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <Ionicons name="refresh" size={20} color={GalaxyColors.light.textInverse} style={styles.loadingIcon} />
                        <Text style={GlobalStyles.buttonText}>Creating Account...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Ionicons name="person-add" size={20} color={GalaxyColors.light.textInverse} style={styles.buttonIcon} />
                        <Text style={GlobalStyles.buttonText}>Create Account</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.divider} />
                  </View>

                  <TouchableOpacity
                    style={GlobalStyles.buttonSecondary}
                    onPress={() => router.push("/signin")}
                  >
                    <Text style={GlobalStyles.buttonSecondaryText}>Sign In to Existing Account</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Already have an account?{" "}
                    <Text 
                      style={styles.linkText}
                      onPress={() => router.push("/signin")}
                    >
                      Sign In
                    </Text>
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Loading Screen Overlay */}
      <LoadingScreen 
        visible={showLoadingScreen}
        message="Creating your account..."
        onComplete={() => setShowLoadingScreen(false)}
      />
    </SafeAreaView>
  );
}

const styles = {
  // Mobile-specific styles
  mobileImageHeader: {
    height: 280,
    position: 'relative',
  },
  
  mobileSignupImage: {
    width: '100%',
    height: '100%',
  },
  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  
  mobileHeaderContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Two-column layout styles
  twoColumnContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  
  imageColumn: {
    flex: 1,
    minHeight: height,
  },
  
  signupImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  formColumn: {
    flex: 1,
    backgroundColor: GalaxyColors.light.backgroundSecondary,
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
    marginBottom: 30,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  gradientHeader: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: GalaxyColors.light.textInverse,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  scrollContainer: {
    flex: 1,
    backgroundColor: GalaxyColors.light.backgroundSecondary,
  },
  
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  formContainer: {
    paddingHorizontal: 20,
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
    marginBottom: 16,
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
  
  inputFocused: {
    borderColor: GalaxyColors.light.primary,
    borderWidth: 2,
    shadowColor: GalaxyColors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  
  passwordToggle: {
    padding: 4,
  },
  
  levelContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  
  levelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GalaxyColors.light.border,
    alignItems: 'center',
    backgroundColor: GalaxyColors.light.surface,
  },
  
  selectedLevel: {
    backgroundColor: GalaxyColors.light.primary,
    borderColor: GalaxyColors.light.primary,
  },
  
  levelText: {
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    fontWeight: '500',
  },
  
  selectedLevelText: {
    color: GalaxyColors.light.textInverse,
    fontWeight: '600',
  },
  
  tutorToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GalaxyColors.light.surface,
    borderWidth: 1,
    borderColor: GalaxyColors.light.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: GalaxyColors.light.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkboxSelected: {
    backgroundColor: GalaxyColors.light.primary,
    borderColor: GalaxyColors.light.primary,
  },
  
  tutorInfo: {
    flex: 1,
  },
  
  tutorText: {
    fontSize: 16,
    color: GalaxyColors.light.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  tutorSubtext: {
    fontSize: 13,
    color: GalaxyColors.light.textSecondary,
  },
  
  buttonDisabled: {
    backgroundColor: GalaxyColors.light.buttonDisabled,
    opacity: 0.7,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  loadingIcon: {
    marginRight: 8,
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  buttonIcon: {
    marginRight: 8,
  },
  
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: GalaxyColors.light.border,
  },
  
  dividerText: {
    color: GalaxyColors.light.textSecondary,
    fontSize: 14,
    marginHorizontal: 16,
  },
  
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  
  footerText: {
    fontSize: 16,
    color: GalaxyColors.light.textSecondary,
  },
  
  linkText: {
    color: GalaxyColors.light.primary,
    fontWeight: '600',
  },
  
  galaxyAnimation: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  desktopHeaderContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
};