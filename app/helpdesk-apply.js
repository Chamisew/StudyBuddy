import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { GalaxyColors } from "../constants/GalaxyColors";
import { auth, db } from "../firebase/firebaseConfig";
import { smartNavigateBack, safeReplace } from "../utils/navigation";

const SUBJECT_CATEGORIES = [
  "Mathematics",
  "Physics", 
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Computer Science",
  "Economics",
  "Psychology",
  "Art & Design",
  "Music",
  "Languages",
  "Business Studies",
  "Engineering",
  "Other"
];

export default function HelpdeskApplyScreen() {
  const router = useRouter();
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [customSubject, setCustomSubject] = useState("");
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [bio, setBio] = useState("");
  const [existing, setExisting] = useState(null);
  const [isApprovedHelper, setIsApprovedHelper] = useState(false);
  const [helperData, setHelperData] = useState(null);
  const [highestQualification, setHighestQualification] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [isLeaving, setIsLeaving] = useState(false); // Track if user is in leave process
  const [recentlyUpdated, setRecentlyUpdated] = useState(false); // Track if profile was recently updated
  const [isSubmitting, setIsSubmitting] = useState(false); // Track if application is being submitted
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Show success message after submission

  useEffect(() => {
    const run = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        // Check if user is already an approved helper
        const helperSnap = await getDoc(doc(db, "helpdeskHelpers", uid));
        if (helperSnap.exists()) {
          const data = helperSnap.data();
          // Check if helper has left the program
          if (data.left) {
            setIsApprovedHelper(false);
            // Check if they have a previous application
            const appSnap = await getDoc(doc(db, "helpdeskApplicants", uid));
            if (appSnap.exists()) setExisting(appSnap.data());
          } else {
            setIsApprovedHelper(true);
            setHelperData(data);
            setSelectedSubjects(data.subjects || []);
            setBio(data.bio || "");
            setHighestQualification(data.highestQualification || "");
            setYearsExperience(data.yearsExperience?.toString() || "");
            
            // Check if there's a recent pending application for this user
            const appSnap = await getDoc(doc(db, "helpdeskApplicants", uid));
            if (appSnap.exists()) {
              const appData = appSnap.data();
              // If there's a recent subject change request, set the flag
              if (appData.type === "subject_change" && appData.status === "pending") {
                setRecentlyUpdated(true);
              }
            }
          }
        } else {
          // Check application status
          const snap = await getDoc(doc(db, "helpdeskApplicants", uid));
          if (snap.exists()) {
            const appData = snap.data();
            setExisting(appData);
            // If there's a recent application, set the flag
            if (appData.status === "pending") {
              setRecentlyUpdated(true);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    run();
  }, []);

  const toggleSubject = (subject) => {
    // Reset the recently updated flag when user makes changes
    if (recentlyUpdated) {
      setRecentlyUpdated(false);
    }
    
    if (subject === "Other") {
      if (customSubject.trim()) {
        const newSubject = customSubject.trim();
        if (!selectedSubjects.includes(newSubject)) {
          setSelectedSubjects([...selectedSubjects, newSubject]);
        }
        setCustomSubject("");
      }
    } else {
      if (selectedSubjects.includes(subject)) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
      } else {
        setSelectedSubjects([...selectedSubjects, subject]);
      }
    }
  };

  const removeSubject = (subject) => {
    // Reset the recently updated flag when user makes changes
    if (recentlyUpdated) {
      setRecentlyUpdated(false);
    }
    
    setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
  };
  
  // Add functions to reset the recently updated flag when other fields change
  const setBioWithReset = (text) => {
    if (recentlyUpdated) {
      setRecentlyUpdated(false);
    }
    setBio(text);
  };
  
  const setHighestQualificationWithReset = (text) => {
    if (recentlyUpdated) {
      setRecentlyUpdated(false);
    }
    setHighestQualification(text);
  };
  
  const setYearsExperienceWithReset = (text) => {
    if (recentlyUpdated) {
      setRecentlyUpdated(false);
    }
    setYearsExperience(text);
  };
  
  const submit = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      
      if (selectedSubjects.length === 0) {
        Alert.alert("Required", "Please select at least one subject");
        return;
      }
      
      if (!highestQualification.trim()) {
        Alert.alert("Required", "Please enter your highest qualification");
        return;
      }
      const years = Number(yearsExperience);
      if (!Number.isFinite(years) || years < 0) {
        Alert.alert("Invalid", "Enter valid years of experience (0 or more)");
        return;
      }

      // Start loading state
      setIsSubmitting(true);

      // Get user's full name from users collection
      let userFullName = auth.currentUser?.displayName || "";
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userFullName = userData.fullName || userData.name || userData.displayName || auth.currentUser?.displayName || "";
        }
      } catch (error) {
        console.log("Error fetching user data:", error);
      }

      if (isApprovedHelper) {
        // Check if subjects have changed
        const currentSubjects = helperData?.subjects || [];
        const subjectsChanged = JSON.stringify(selectedSubjects.sort()) !== JSON.stringify(currentSubjects.sort());
        
        if (subjectsChanged) {
          // If subjects changed, submit a new application for admin approval
          await setDoc(doc(db, "helpdeskApplicants", uid), {
            subjects: selectedSubjects,
            bio: bio.trim(),
            status: "pending",
            email: auth.currentUser?.email || "",
            name: userFullName,
            highestQualification: highestQualification.trim(),
            yearsExperience: years,
            updatedAt: new Date(),
            type: "subject_change" // Mark this as a subject change request
          }, { merge: true });
          
          // Set recently updated flag even for subject changes
          setRecentlyUpdated(true);
          
          // Show success message
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 4000); // Hide after 4 seconds
          
          Alert.alert(
            "Subject Change Request Submitted", 
            "Your request to change subjects has been submitted and is pending admin approval. You will be notified when it's approved."
          );
        } else {
          // Update existing helper profile (non-subject fields)
          await setDoc(doc(db, "helpdeskHelpers", uid), {
            subjects: selectedSubjects,
            bio: bio.trim(),
            highestQualification: highestQualification.trim(),
            yearsExperience: years,
            updatedAt: new Date(),
          }, { merge: true });
          
          // Set recently updated flag
          setRecentlyUpdated(true);
          
          Alert.alert("Updated", "Your helper profile has been updated successfully.");
        }
      } else {
        // Submit new application
        await setDoc(doc(db, "helpdeskApplicants", uid), {
          subjects: selectedSubjects,
          bio: bio.trim(),
          status: "pending",
          email: auth.currentUser?.email || "",
          name: userFullName,
          highestQualification: highestQualification.trim(),
          yearsExperience: years,
          updatedAt: new Date(),
          type: "new_application" // Mark this as a new application
        }, { merge: true });
        
        // Set recently updated flag for new applications
        setRecentlyUpdated(true);
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 4000); // Hide after 4 seconds
        
        Alert.alert(
          "Application Submitted", 
          "Your application has been submitted and is pending admin approval. You will be notified when it's approved."
        );
      }
    } catch (e) {
      console.error("Error submitting application:", e);
      Alert.alert("Error", isApprovedHelper ? "Failed to update profile" : "Failed to submit application");
    } finally {
      // Stop loading state
      setIsSubmitting(false);
    }
  };

  const leaveHelperProgram = async () => {
    // TEMPORARY: Direct execution for testing - bypassing Alert dialog
    console.log('🚪 [LEAVE HELPER] Button clicked - executing directly (bypassing Alert)');
    
    /* ORIGINAL ALERT CODE - COMMENTED FOR TESTING
    Alert.alert(
      "Leave Helper Program",
      "Are you sure you want to leave the helper program? You will no longer be visible as a helper until you reapply.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
    */
    
    // Execute leave logic directly
    try {
      console.log('🚪 [LEAVE HELPER] Starting leave process...');
              const uid = auth.currentUser?.uid;
              console.log('🚪 [LEAVE HELPER] User ID:', uid);
              if (!uid) {
                console.log('🚪 [LEAVE HELPER] No user ID found, aborting');
                return;
              }
              
              // Instead of deleting, mark as left
              console.log('🚪 [LEAVE HELPER] Updating helper document...');
              await setDoc(doc(db, "helpdeskHelpers", uid), {
                subjects: [],
                bio: "This helper has left the program",
                highestQualification: "",
                yearsExperience: 0,
                leftAt: new Date(),
                left: true,
                updatedAt: new Date()
              }, { merge: true });
              console.log('🚪 [LEAVE HELPER] Helper document updated successfully');
              
              // Also update the application status if exists
              try {
                console.log('🚪 [LEAVE HELPER] Checking for existing application...');
                const appDoc = await getDoc(doc(db, "helpdeskApplicants", uid));
                if (appDoc.exists()) {
                  console.log('🚪 [LEAVE HELPER] Updating application status...');
                  await updateDoc(doc(db, "helpdeskApplicants", uid), {
                    status: "left",
                    leftAt: new Date()
                  });
                  console.log('🚪 [LEAVE HELPER] Application status updated');
                } else {
                  console.log('🚪 [LEAVE HELPER] No existing application found');
                }
              } catch (e) {
                console.log("🚪 [LEAVE HELPER] No existing application to update:", e);
              }
              
              // Update local state to reflect that user is no longer a helper
              console.log('🚪 [LEAVE HELPER] Updating local state...');
              setIsApprovedHelper(false);
              
              // Force refresh the help desk screen by navigating with a timestamp
              console.log('🚪 [LEAVE HELPER] Navigating to helpdesk with refresh parameter...');
              router.replace('/helpdesk?refresh=' + new Date().getTime());
              
              console.log('🚪 [LEAVE HELPER] Process completed successfully');
              Alert.alert("Success", "You have successfully left the helper program. You are no longer visible as an active helper.");
              
    } catch (e) {
      console.error("🚪 [LEAVE HELPER] Error leaving helper program:", e);
      Alert.alert("Error", "Failed to leave helper program: " + e.message);
    }
  };

  // Check if user is in the process of leaving
  if (isLeaving) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={GalaxyColors.light.icon} />
          </TouchableOpacity>
          <Text style={styles.title}>Leave Helper Program</Text>
        </View>
        <View style={styles.messageContainer}>
          <Ionicons name="information-circle-outline" size={64} color={GalaxyColors.light.info} />
          <Text style={styles.messageTitle}>Helper Program Status</Text>
          <Text style={styles.messageText}>
            You have applied to leave the helper program. You are no longer visible as an active helper.
          </Text>
          <Text style={styles.messageText}>
            If you wish to become a helper again, you can reapply through the help desk.
          </Text>
          <TouchableOpacity 
            style={styles.returnButton} 
            onPress={() => router.replace('/helpdesk?refresh=' + new Date().getTime())}
          >
            <Text style={styles.returnButtonText}>Return to Help Desk</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => smartNavigateBack(router, '/helpdesk-apply')}
        >
          <Ionicons name="arrow-back" size={24} color={GalaxyColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isApprovedHelper ? "Update Helper Profile" : "Apply as Helper"}
        </Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isApprovedHelper && (
          <View style={styles.statusBanner}>
            <Ionicons name="checkmark-circle-outline" size={20} color={GalaxyColors.light.success} />
            <Text style={styles.bannerText}>You are an approved helper</Text>
          </View>
        )}
        
        {!isApprovedHelper && existing && (
          <View style={styles.statusBanner}>
            <Ionicons name="information-circle-outline" size={20} color={GalaxyColors.light.info} />
            <Text style={styles.bannerText}>
              {existing.status === "left" 
                ? "You previously left the helper program. Reapply to become a helper again." 
                : `Current status: ${existing.status} ${existing.type === "subject_change" ? "(Subject change request)" : ""}`}
            </Text>
          </View>
        )}
        
        {/* Subjects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={20} color={GalaxyColors.light.primary} />
            <Text style={styles.sectionTitle}>Subjects</Text>
          </View>
          <Text style={styles.helperText}>Select the subjects you can help with</Text>
          
          <TouchableOpacity 
            style={styles.subjectSelector} 
            onPress={() => setShowSubjectModal(true)}
          >
            <Text style={styles.subjectSelectorText}>
              {selectedSubjects.length > 0 ? `${selectedSubjects.length} subject(s) selected` : "Select subjects"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={GalaxyColors.light.icon} />
          </TouchableOpacity>
          
          {selectedSubjects.length > 0 && (
            <View style={styles.selectedSubjectsContainer}>
              {selectedSubjects.map((subject, index) => (
                <View key={index} style={styles.subjectChip}>
                  <Text style={styles.subjectChipText}>{subject}</Text>
                  <TouchableOpacity onPress={() => removeSubject(subject)}>
                    <Ionicons name="close-circle" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Qualification Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color={GalaxyColors.light.primary} />
            <Text style={styles.sectionTitle}>Qualifications</Text>
          </View>
          <Text style={styles.helperText}>Tell us about your academic background</Text>
          
          <Text style={styles.label}>Highest Qualification *</Text>
          <TextInput 
            value={highestQualification} 
            onChangeText={setHighestQualificationWithReset} 
            placeholder="e.g. BSc in Physics, MSc in Math" 
            style={styles.input} 
          />
          
          <Text style={styles.label}>Years of Experience *</Text>
          <TextInput 
            value={yearsExperience} 
            onChangeText={setYearsExperienceWithReset} 
            placeholder="e.g. 2" 
            style={styles.input} 
            keyboardType="numeric" 
          />
        </View>
        
        {/* Bio Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={GalaxyColors.light.primary} />
            <Text style={styles.sectionTitle}>About You</Text>
          </View>
          <Text style={styles.helperText}>Share a brief description of your experience</Text>
          
          <Text style={styles.label}>Bio</Text>
          <TextInput 
            value={bio} 
            onChangeText={setBioWithReset} 
            placeholder="Brief experience" 
            style={[styles.input, styles.textArea]} 
            multiline 
            numberOfLines={4}
          />
        </View>
        
        {/* Success Message */}
        {showSuccessMessage && (
          <View style={styles.successMessageContainer}>
            <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
            <Text style={styles.successMessageTitle}>Request Processing</Text>
            <Text style={styles.successMessageText}>
              Your application has been submitted successfully and is being processed. 
              You will be notified when the admin reviews your request.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Show either the update button or the "still updated" message */}
          {isApprovedHelper && recentlyUpdated ? (
            <View style={styles.updatedMessageContainer}>
              <Ionicons name="checkmark-circle" size={24} color={GalaxyColors.light.success} />
              <Text style={styles.updatedMessageText}>Profile Updated</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              onPress={submit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Ionicons name="hourglass-outline" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {isApprovedHelper ? "Update Profile" : "Submit Application"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {isApprovedHelper && (
            <TouchableOpacity style={styles.leaveButton} onPress={leaveHelperProgram}>
              <Ionicons name="exit-outline" size={20} color={GalaxyColors.light.error} />
              <Text style={styles.leaveButtonText}>Leave Helper Program</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Subjects</Text>
            <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {SUBJECT_CATEGORIES.map((subject, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.subjectOption,
                  subject !== "Other" && selectedSubjects.includes(subject) && styles.subjectOptionSelected
                ]}
                onPress={() => {
                  if (subject === "Other") {
                    // Handle "Other" option - show text input
                  } else {
                    toggleSubject(subject);
                  }
                }}
              >
                <Text style={[
                  styles.subjectOptionText,
                  subject !== "Other" && selectedSubjects.includes(subject) && styles.subjectOptionTextSelected
                ]}>
                  {subject}
                </Text>
                {subject !== "Other" && selectedSubjects.includes(subject) && (
                  <Ionicons name="checkmark" size={20} color={GalaxyColors.light.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            {/* Custom Subject Input */}
            <View style={styles.customSubjectContainer}>
              <Text style={styles.customSubjectLabel}>Add Custom Subject:</Text>
              <View style={styles.customSubjectInputContainer}>
                <TextInput
                  style={styles.customSubjectInput}
                  value={customSubject}
                  onChangeText={setCustomSubject}
                  placeholder="Enter custom subject"
                />
                <TouchableOpacity
                  style={styles.addCustomButton}
                  onPress={() => toggleSubject("Other")}
                  disabled={!customSubject.trim()}
                >
                  <Ionicons name="add" size={20} color={customSubject.trim() ? GalaxyColors.light.primary : GalaxyColors.light.iconSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GalaxyColors.light.border,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: GalaxyColors.light.text,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: GalaxyColors.light.border,
  },
  bannerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: GalaxyColors.light.text,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GalaxyColors.light.text,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    marginBottom: 16,
    marginLeft: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: GalaxyColors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: GalaxyColors.light.input,
    borderWidth: 1,
    borderColor: GalaxyColors.light.inputBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: GalaxyColors.light.text,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  subjectSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: GalaxyColors.light.input,
    borderWidth: 1,
    borderColor: GalaxyColors.light.inputBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  subjectSelectorText: {
    fontSize: 16,
    color: GalaxyColors.light.text,
  },
  selectedSubjectsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GalaxyColors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 4,
  },
  subjectChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 6,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GalaxyColors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  updatedMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GalaxyColors.light.success,
  },
  updatedMessageText: {
    color: GalaxyColors.light.success,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GalaxyColors.light.error,
  },
  leaveButtonText: {
    color: GalaxyColors.light.error,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GalaxyColors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: GalaxyColors.light.text,
  },
  modalCancelText: {
    fontSize: 16,
    color: GalaxyColors.light.error,
    fontWeight: '600',
  },
  modalDoneText: {
    fontSize: 16,
    color: GalaxyColors.light.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  subjectOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: GalaxyColors.light.border,
  },
  subjectOptionSelected: {
    backgroundColor: GalaxyColors.light.backgroundSecondary,
  },
  subjectOptionText: {
    fontSize: 16,
    color: GalaxyColors.light.text,
  },
  subjectOptionTextSelected: {
    color: GalaxyColors.light.primary,
    fontWeight: "600",
  },
  customSubjectContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: GalaxyColors.light.border,
    marginTop: 20,
  },
  customSubjectLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: GalaxyColors.light.text,
    marginBottom: 12,
  },
  customSubjectInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  customSubjectInput: {
    flex: 1,
    backgroundColor: GalaxyColors.light.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: GalaxyColors.light.inputBorder,
    fontSize: 16,
    color: GalaxyColors.light.text,
  },
  addCustomButton: {
    padding: 12,
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    borderRadius: 12,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: GalaxyColors.light.text,
    marginTop: 16,
    textAlign: "center",
  },
  messageText: {
    fontSize: 16,
    color: GalaxyColors.light.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 300,
  },
  returnButton: {
    marginTop: 32,
    backgroundColor: GalaxyColors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#999',
  },
  successMessageContainer: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  successMessageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessageText: {
    fontSize: 14,
    color: '#388E3C',
    textAlign: 'center',
    lineHeight: 20,
  },
});