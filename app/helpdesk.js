import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GalaxyAnimation } from "../components/GalaxyAnimation";
import { GalaxyColors } from "../constants/GalaxyColors";
import { auth, db } from "../firebase/firebaseConfig";
import { smartNavigateBack } from "../utils/navigation";

// Firestore layout:
// helpdeskApplicants/{uid}: { subjects: [..], bio, status: 'pending'|'approved'|'rejected' }
// helpdeskHelpers/{uid}: { subjects, name, rating, bio }
// chatsIndex/{tutorId}/rooms/{studentId}: { peerId: studentId, peerName: studentName, lastMessageAt }

export default function HelpdeskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Get URL parameters
  const [subjects, setSubjects] = useState([
    "All", 
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
    "Engineering"
  ]);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [helpers, setHelpers] = useState([]);
  const [isApprovedHelper, setIsApprovedHelper] = useState(false);
  const [hasLeftProgram, setHasLeftProgram] = useState(false); // Track if user left the program
  const [studentChats, setStudentChats] = useState([]);
  const [viewMode, setViewMode] = useState('chats'); // 'helpers' or 'chats'
  const [refreshKey, setRefreshKey] = useState(0); // Key to force re-render

  const refreshHelperStatus = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      
      const helperDoc = await getDoc(doc(db, "helpdeskHelpers", uid));
      if (helperDoc.exists()) {
        const helperData = helperDoc.data();
        // Check if helper has left the program
        if (helperData.left) {
          setIsApprovedHelper(false);
          setHasLeftProgram(true);
        } else {
          setIsApprovedHelper(true);
          setHasLeftProgram(false);
        }
      } else {
        setIsApprovedHelper(false);
        setHasLeftProgram(false);
      }
    } catch (error) {
      console.error("Error checking helper status:", error);
    }
  };

  const rejoinHelperProgram = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      console.log('📋 [HELPDESK] Rejoining helper program for UID:', uid);
      
      // Remove the 'left' flag to reactivate helper status
      await setDoc(doc(db, "helpdeskHelpers", uid), { 
        left: false,
        rejoinedAt: new Date()
      }, { merge: true });
      
      console.log('📋 [HELPDESK] Helper status reactivated');
      setIsApprovedHelper(true);
      setHasLeftProgram(false);
      Alert.alert("Welcome Back!", "Your helper status has been reactivated. You can now help students again!");
    } catch (error) {
      console.error('📋 [HELPDESK] Error rejoining helper program:', error);
      Alert.alert("Error", "Failed to rejoin helper program. Please try again.");
    }
  };

  // Check if current user is an approved helper (could be student or tutor)
  useEffect(() => {
    const checkHelperStatus = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          console.log('📋 [HELPDESK] No authenticated user');
          return;
        }
        
        console.log('📋 [HELPDESK] Checking helper status for UID:', uid);
        
        // First check if user exists in helpdeskHelpers collection
        const helperDoc = await getDoc(doc(db, "helpdeskHelpers", uid));
        console.log('📋 [HELPDESK] Helper document exists:', helperDoc.exists());
        
        if (helperDoc.exists()) {
          const helperData = helperDoc.data();
          console.log('📋 [HELPDESK] Helper data:', helperData);
          
          // Check if helper has left the program
          if (helperData.left) {
            console.log('📋 [HELPDESK] Helper has left the program');
            setIsApprovedHelper(false);
            setHasLeftProgram(true);
          } else {
            console.log('📋 [HELPDESK] Helper is active - setting isApprovedHelper to true');
            setIsApprovedHelper(true);
            setHasLeftProgram(false);
          }
        } else {
          console.log('📋 [HELPDESK] No helper document found - setting isApprovedHelper to false');
          setIsApprovedHelper(false);
          setHasLeftProgram(false);
        }
      } catch (error) {
        console.error("📋 [HELPDESK] Error checking helper status:", error);
        setIsApprovedHelper(false);
      }
    };
    checkHelperStatus();
  }, [refreshKey]); // Depend on refreshKey to force re-check

  // Listen for refresh parameter changes
  useEffect(() => {
    // When refresh parameter changes, increment refreshKey to force re-render
    setRefreshKey(prev => prev + 1);
  }, [params.refresh]); // Depend on refresh parameter

  // Refresh helper status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📋 [HELPDESK] Screen focused, checking helper status');
      const checkHelperStatusOnFocus = async () => {
        try {
          const uid = auth.currentUser?.uid;
          if (!uid) {
            console.log('📋 [HELPDESK] Focus check - No authenticated user');
            return;
          }
          
          console.log('📋 [HELPDESK] Focus check - UID:', uid);
          const helperDoc = await getDoc(doc(db, "helpdeskHelpers", uid));
          console.log('📋 [HELPDESK] Focus check - Helper document exists:', helperDoc.exists());
          
          if (helperDoc.exists()) {
            const helperData = helperDoc.data();
            console.log('📋 [HELPDESK] Focus check - Helper data:', helperData);
            
            // Check if helper has left the program
            if (helperData.left) {
              console.log('📋 [HELPDESK] Focus check - User has left helper program');
              setIsApprovedHelper(false);
              setHasLeftProgram(true);
            } else {
              console.log('📋 [HELPDESK] Focus check - User is active helper, setting state to true');
              setIsApprovedHelper(true);
              setHasLeftProgram(false);
            }
          } else {
            // Also check applicant status for debugging
            const applicantDoc = await getDoc(doc(db, "helpdeskApplicants", uid));
            if (applicantDoc.exists()) {
              const applicantData = applicantDoc.data();
              console.log('📋 [HELPDESK] Focus check - Applicant status:', applicantData.status);
            }
            
            console.log('📋 [HELPDESK] Focus check - No helper document found, setting state to false');
            setIsApprovedHelper(false);
            setHasLeftProgram(false);
          }
        } catch (error) {
          console.error('📋 [HELPDESK] Error checking helper status on focus:', error);
          setIsApprovedHelper(false);
        }
      };
      checkHelperStatusOnFocus();
    }, [])
  );

  // Load student chats for approved helpers
  useEffect(() => {
    if (!isApprovedHelper) return;
    
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = onSnapshot(
      collection(db, "chatsIndex", uid, "rooms"),
      async (snapshot) => {
        const chats = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const studentId = data.peerId;
          
          // Get student details
          try {
            const studentDoc = await getDoc(doc(db, "users", studentId));
            const studentData = studentDoc.exists() ? studentDoc.data() : {};
            
            chats.push({
              id: studentId,
              studentId: studentId,
              studentName: studentData.fullName || studentData.name || studentData.displayName || studentData.email || studentId,
              lastMessageAt: data.lastMessageAt,
              peerName: data.peerName || studentData.fullName || studentData.name || studentData.displayName || studentData.email || studentId
            });
          } catch (error) {
            console.error("Error fetching student data:", error);
            // Fallback with basic info
            chats.push({
              id: studentId,
              studentId: studentId,
              studentName: data.peerName || studentId,
              lastMessageAt: data.lastMessageAt,
              peerName: data.peerName || studentId
            });
          }
        }
        
        // Sort by last message time
        chats.sort((a, b) => {
          const timeA = a.lastMessageAt?.seconds || 0;
          const timeB = b.lastMessageAt?.seconds || 0;
          return timeB - timeA;
        });
        
        setStudentChats(chats);
      }
    );

    return () => unsubscribe();
  }, [isApprovedHelper]);

  // Load helpers for users (when viewing helpers tab or when user is not a helper)
  useEffect(() => {
    if (isApprovedHelper && viewMode === 'chats') return; // Don't load helpers if helper is viewing chats
    
    const run = async () => {
      try {
        const currentUid = auth.currentUser?.uid;
        const q = selectedSubject === 'All'
          ? query(collection(db, "helpdeskHelpers"))
          : query(collection(db, "helpdeskHelpers"), where("subjects", "array-contains", selectedSubject));
        const snap = await getDocs(q);
        const list = [];
        for (const d of snap.docs) {
          const data = d.data();
          // For helpers, exclude themselves from the list
          if (isApprovedHelper && d.id === currentUid) continue;
          
          // Skip helpers who have left the program
          if (data.left) continue;
          
          // Get user's full name from users collection
          let displayName = data.name || data.email || "Helper";
          try {
            const userDoc = await getDoc(doc(db, "users", d.id));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              displayName = userData.fullName || userData.name || userData.displayName || data.name || data.email || "Helper";
            }
          } catch (error) {
            console.log("Error fetching user data for helper:", error);
          }
          
          list.push({ 
            id: d.id, 
            name: displayName, 
            subjects: data.subjects || [], 
            rating: data.rating || 0, 
            bio: data.bio || "" 
          });
        }
        setHelpers(list);
      } catch (error) {
        console.error("Error loading helpers:", error);
      }
    };
    run();
  }, [selectedSubject, isApprovedHelper, viewMode]);

  const startChat = async (helperId, helperName) => {
    try {
      const myId = auth.currentUser?.uid;
      if (!myId) return;
      
      // Create connection between student and tutor
      const connectionId = `${myId}_${helperId}`;
      await setDoc(doc(db, "connections", connectionId), {
        from: myId,
        to: helperId,
        status: "accepted", // Auto-accept for helpdesk connections
        type: "helpdesk",
        createdAt: new Date(),
        fromName: auth.currentUser?.email || myId,
        toName: helperName
      }, { merge: true });
      
      // Also create reverse connection for tutor
      const reverseConnectionId = `${helperId}_${myId}`;
      await setDoc(doc(db, "connections", reverseConnectionId), {
        from: helperId,
        to: myId,
        status: "accepted", // Auto-accept for helpdesk connections
        type: "helpdesk",
        createdAt: new Date(),
        fromName: helperName,
        toName: auth.currentUser?.email || myId
      }, { merge: true });
      
      // Create chat indexes for both participants
      await setDoc(doc(db, "chatsIndex", myId, "rooms", helperId), { 
        peerId: helperId, 
        peerName: helperName, 
        lastMessageAt: new Date(),
        type: "helpdesk"
      }, { merge: true });
      
      const studentDoc = await getDoc(doc(db, "users", myId));
      const studentData = studentDoc.exists() ? studentDoc.data() : {};
      const studentName = studentData.fullName || studentData.name || auth.currentUser?.email || myId;
      
      await setDoc(doc(db, "chatsIndex", helperId, "rooms", myId), { 
        peerId: myId, 
        peerName: studentName, 
        lastMessageAt: new Date(),
        type: "helpdesk"
      }, { merge: true });
      
      router.push({ pathname: "/chat", params: { peerId: helperId, peerName: helperName } });
    } catch (error) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "Failed to start chat. Please try again.");
    }
  };

  const startStudentChat = async (studentId, studentName) => {
    try {
      router.push({ pathname: "/chat", params: { peerId: studentId, peerName: studentName } });
    } catch (error) {
      console.error("Error starting student chat:", error);
    }
  };

  const renderHelper = ({ item }) => (
    <View style={styles.helperCard}>
      <View style={styles.helperInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.helperDetails}>
          <Text style={styles.helperName}>{item.name}</Text>
          <Text style={styles.helperSubjects} numberOfLines={1}>
            {item.subjects.join(", ")}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={GalaxyColors.light.accent} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.chatBtn} onPress={() => startChat(item.id, item.name)}>
        <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
        <Text style={styles.chatText}>Chat</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStudentChat = ({ item }) => (
    <View style={styles.helperCard}>
      <View style={styles.helperInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.studentName.charAt(0)}</Text>
        </View>
        <View style={styles.helperDetails}>
          <Text style={styles.helperName}>{item.studentName}</Text>
          <Text style={styles.helperSubjects}>Student</Text>
          {item.lastMessageAt && (
            <Text style={styles.lastMessage}>
              Last: {new Date(item.lastMessageAt.seconds * 1000).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.chatBtn} onPress={() => startStudentChat(item.studentId, item.studentName)}>
        <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
        <Text style={styles.chatText}>Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Galaxy Background Animation */}
      <GalaxyAnimation style={styles.galaxyAnimation} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => smartNavigateBack(router, '/helpdesk')}
          >
            <Ionicons name="arrow-back" size={24} color={GalaxyColors.light.icon} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Help Desk</Text>
            <Text style={styles.debugText}>
              Status: {isApprovedHelper ? 'HELPER ✅' : hasLeftProgram ? 'LEFT PROGRAM 🔄' : 'NOT HELPER ❌'}
            </Text>
          </View>
          {!isApprovedHelper ? (
            hasLeftProgram ? (
              <TouchableOpacity 
                style={styles.rejoinButton}
                onPress={rejoinHelperProgram}
              >
                <Ionicons name="return-up-back-outline" size={18} color={GalaxyColors.light.success} />
                <Text style={styles.rejoinButtonText}>Rejoin</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => router.push('/helpdesk-apply')}
              >
                <Ionicons name="briefcase-outline" size={18} color={GalaxyColors.light.primary} />
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={() => router.push('/helpdesk-apply')}
              >
                <Ionicons name="settings-outline" size={18} color={GalaxyColors.light.success} />
                <Text style={styles.updateButtonText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.updateButton, { marginLeft: 8 }]}
                onPress={async () => {
                  try {
                    console.log('📋 [HELPDESK] Manual refresh button pressed');
                    const uid = auth.currentUser?.uid;
                    if (!uid) {
                      console.log('📋 [HELPDESK] No authenticated user');
                      return;
                    }
                    
                    console.log('📋 [HELPDESK] Manual refresh - checking UID:', uid);
                    const helperDoc = await getDoc(doc(db, "helpdeskHelpers", uid));
                    console.log('📋 [HELPDESK] Manual refresh - helper doc exists:', helperDoc.exists());
                    
                    if (helperDoc.exists()) {
                      const helperData = helperDoc.data();
                      console.log('📋 [HELPDESK] Manual refresh - helper data:', helperData);
                      
                      // Check if helper has left the program
                      if (helperData.left) {
                        console.log('📋 [HELPDESK] Manual refresh - helper has left, offering rejoin option');
                        setHasLeftProgram(true);
                        setIsApprovedHelper(false);
                        
                        // Ask if user wants to rejoin as helper
                        Alert.alert(
                          'Rejoin Helper Program',
                          'You previously left the helper program. Would you like to rejoin as a helper?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Rejoin', 
                              onPress: rejoinHelperProgram
                            }
                          ]
                        );
                      } else {
                        console.log('📋 [HELPDESK] Manual refresh - helper is active');
                        setIsApprovedHelper(true);
                        setHasLeftProgram(false);
                      }
                    } else {
                      console.log('📋 [HELPDESK] Manual refresh - no helper document');
                      
                      // Check applicant status
                      const applicantDoc = await getDoc(doc(db, "helpdeskApplicants", uid));
                      if (applicantDoc.exists()) {
                        const applicantData = applicantDoc.data();
                        console.log('📋 [HELPDESK] Manual refresh - applicant status:', applicantData.status);
                      }
                      
                      setIsApprovedHelper(false);
                    }
                  } catch (error) {
                    console.error("📋 [HELPDESK] Error in manual refresh:", error);
                  }
                }}
              >
                <Ionicons name="refresh-outline" size={18} color={GalaxyColors.light.icon} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {isApprovedHelper ? (
          // Helper view with tabs (for both students and tutors who became helpers)
          <>
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, viewMode === 'helpers' && styles.activeTab]}
                onPress={() => setViewMode('helpers')}
              >
                <Ionicons 
                  name="people-outline" 
                  size={20} 
                  color={viewMode === 'helpers' ? GalaxyColors.light.primary : GalaxyColors.light.iconSecondary} 
                />
                <Text style={[styles.tabText, viewMode === 'helpers' && styles.activeTabText]}>
                  Helpers
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, viewMode === 'chats' && styles.activeTab]}
                onPress={() => setViewMode('chats')}
              >
                <Ionicons 
                  name="chatbubbles-outline" 
                  size={20} 
                  color={viewMode === 'chats' ? GalaxyColors.light.primary : GalaxyColors.light.iconSecondary} 
                />
                <Text style={[styles.tabText, viewMode === 'chats' && styles.activeTabText]}>
                  My Chats ({studentChats.length})
                </Text>
              </TouchableOpacity>
            </View>

            {viewMode === 'chats' ? (
              // Show student chats
              <>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerInfoText}>Your Student Chats</Text>
                  <Text style={styles.subHeaderText}>Students you are helping</Text>
                </View>
                <FlatList
                  data={studentChats}
                  keyExtractor={(item) => item.id}
                  renderItem={renderStudentChat}
                  contentContainerStyle={styles.listContainer}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="chatbubbles-outline" size={64} color={GalaxyColors.light.iconSecondary} />
                      <Text style={styles.emptyText}>No student chats yet</Text>
                      <Text style={styles.emptySubText}>Students will appear here when they start chatting with you</Text>
                    </View>
                  }
                />
              </>
            ) : (
              // Show available helpers
              <>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerInfoText}>Available Helpers</Text>
                  <Text style={styles.subHeaderText}>Connect with other tutors and helpers</Text>
                </View>
                <View style={styles.subjectsRow}>
                  {subjects.map((s) => (
                    <TouchableOpacity 
                      key={s} 
                      style={[styles.subjectChip, selectedSubject === s && styles.subjectChipActive]} 
                      onPress={() => setSelectedSubject(s)}
                    >
                      <Text style={[styles.subjectText, selectedSubject === s && styles.subjectTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <FlatList
                  data={helpers}
                  keyExtractor={(item) => item.id}
                  renderItem={renderHelper}
                  contentContainerStyle={styles.listContainer}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="people-outline" size={64} color={GalaxyColors.light.iconSecondary} />
                      <Text style={styles.emptyText}>No other helpers available</Text>
                      <Text style={styles.emptySubText}>Check back later or try a different subject</Text>
                    </View>
                  }
                />
              </>
            )}
          </>
        ) : (
          // Regular user view (students who haven't become helpers yet) - show available helpers
          <>
            <View style={styles.subjectsRow}>
              {subjects.map((s) => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.subjectChip, selectedSubject === s && styles.subjectChipActive]} 
                  onPress={() => setSelectedSubject(s)}
                >
                  <Text style={[styles.subjectText, selectedSubject === s && styles.subjectTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <FlatList
              data={helpers}
              keyExtractor={(item) => item.id}
              renderItem={renderHelper}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="help-buoy-outline" size={64} color={GalaxyColors.light.iconSecondary} />
                  <Text style={styles.emptyText}>No helpers available</Text>
                  <Text style={styles.emptySubText}>Check back later or try a different subject</Text>
                </View>
              }
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: GalaxyColors.light.background,
  },
  galaxyAnimation: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GalaxyColors.light.border,
    backgroundColor: GalaxyColors.light.surface + 'CC', // Adding transparency
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    backdropFilter: 'blur(10px)', // For web blur effect
  },
  backButton: {
    marginRight: 16,
  },
  title: { 
    fontSize: 22,
    fontWeight: "700",
    color: GalaxyColors.light.text,
  },
  debugText: {
    fontSize: 12,
    fontWeight: "600",
    color: GalaxyColors.light.textSecondary,
    marginTop: 2,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GalaxyColors.light.primary,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: GalaxyColors.light.primary,
    marginLeft: 4,
  },
  rejoinButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GalaxyColors.light.success,
  },
  rejoinButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: GalaxyColors.light.success,
    marginLeft: 4,
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GalaxyColors.light.border,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: GalaxyColors.light.text,
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: GalaxyColors.light.surface + 'CC', // Adding transparency
    borderBottomWidth: 1,
    borderBottomColor: GalaxyColors.light.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    backdropFilter: 'blur(10px)', // For web blur effect
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: GalaxyColors.light.primary,
    backgroundColor: GalaxyColors.light.backgroundSecondary + '80', // Adding transparency
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: GalaxyColors.light.textSecondary,
    marginLeft: 8,
    textAlign: "center",
  },
  activeTabText: {
    color: GalaxyColors.light.primary,
    fontWeight: "600",
  },
  headerInfo: {
    backgroundColor: GalaxyColors.light.surface + 'CC', // Adding transparency
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GalaxyColors.light.border,
    backdropFilter: 'blur(10px)', // For web blur effect
  },
  headerInfoText: {
    fontSize: 18,
    fontWeight: "700",
    color: GalaxyColors.light.text,
  },
  subHeaderText: {
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    marginTop: 2,
  },
  subjectsRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    backgroundColor: GalaxyColors.light.surface + 'CC', // Adding transparency
    backdropFilter: 'blur(10px)', // For web blur effect
  },
  subjectChip: { 
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: GalaxyColors.light.border,
  },
  subjectChipActive: { 
    backgroundColor: GalaxyColors.light.primary + '20',
    borderColor: GalaxyColors.light.primary,
  },
  subjectText: { 
    color: GalaxyColors.light.text,
    fontSize: 14,
    fontWeight: '500',
  },
  subjectTextActive: { 
    color: GalaxyColors.light.primary,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  helperCard: { 
    backgroundColor: GalaxyColors.light.card,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 80,
    borderWidth: 1,
    borderColor: GalaxyColors.light.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    backdropFilter: 'blur(10px)', // For web blur effect
  },
  helperInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatar: { 
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: GalaxyColors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { 
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  helperDetails: {
    flex: 1,
    justifyContent: "center",
  },
  helperName: { 
    fontSize: 16,
    fontWeight: "700",
    color: GalaxyColors.light.text,
    marginBottom: 2,
  },
  helperSubjects: { 
    fontSize: 12,
    color: GalaxyColors.light.textSecondary,
    marginBottom: 4,
    maxWidth: 200,
  },
  lastMessage: { 
    fontSize: 11,
    color: GalaxyColors.light.textTertiary,
    marginTop: 2,
  },
  ratingContainer: { 
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  ratingText: { 
    fontSize: 12,
    marginLeft: 3,
    color: GalaxyColors.light.accent,
    fontWeight: "600",
  },
  chatBtn: { 
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GalaxyColors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatText: { 
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: GalaxyColors.light.text,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});