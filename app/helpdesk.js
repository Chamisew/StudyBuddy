import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "expo-router";

// Firestore layout:
// helpdeskApplicants/{uid}: { subjects: [..], bio, status: 'pending'|'approved'|'rejected' }
// helpdeskHelpers/{uid}: { subjects, name, rating, bio }
// chatsIndex/{tutorId}/rooms/{studentId}: { peerId: studentId, peerName: studentName, lastMessageAt }

export default function HelpdeskScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState(["All", "Math", "Physics", "Chemistry", "Biology", "English", "History"]);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [helpers, setHelpers] = useState([]);
  const [isApprovedTutor, setIsApprovedTutor] = useState(false);
  const [studentChats, setStudentChats] = useState([]);
  const [viewMode, setViewMode] = useState('helpers'); // 'helpers' or 'chats'

  // Check if current user is an approved tutor
  useEffect(() => {
    const checkTutorStatus = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const helperDoc = await getDoc(doc(db, "helpdeskHelpers", uid));
        setIsApprovedTutor(helperDoc.exists());
      } catch (error) {
        console.error("Error checking tutor status:", error);
      }
    };
    checkTutorStatus();
  }, []);

  // Load student chats for approved tutors
  useEffect(() => {
    if (!isApprovedTutor) return;
    
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
              studentName: studentData.fullName || studentData.name || studentData.email || studentId,
              lastMessageAt: data.lastMessageAt,
              peerName: data.peerName || studentData.fullName || studentData.name || studentData.email || studentId
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
  }, [isApprovedTutor]);

  // Load helpers for students
  useEffect(() => {
    if (isApprovedTutor && viewMode === 'chats') return; // Don't load helpers if tutor is viewing chats
    
    const run = async () => {
      try {
        const q = selectedSubject === 'All'
          ? query(collection(db, "helpdeskHelpers"))
          : query(collection(db, "helpdeskHelpers"), where("subjects", "array-contains", selectedSubject));
        const snap = await getDocs(q);
        const list = [];
        for (const d of snap.docs) {
          const data = d.data();
          list.push({ 
            id: d.id, 
            name: data.name || data.email || "Helper", 
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
  }, [selectedSubject, isApprovedTutor, viewMode]);

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
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.helperName}>{item.name}</Text>
          <Text style={styles.helperSubjects}>{item.subjects.join(", ")}</Text>
        </View>
        <View style={styles.rating}><Ionicons name="star" size={14} color="#FFD700" /><Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text></View>
      </View>
      <TouchableOpacity style={styles.chatBtn} onPress={() => startChat(item.id, item.name)}>
        <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
        <Text style={styles.chatText}>Chat</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStudentChat = ({ item }) => (
    <View style={styles.helperCard}>
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.studentName.charAt(0)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.helperName}>{item.studentName}</Text>
          <Text style={styles.helperSubjects}>Student</Text>
          {item.lastMessageAt && (
            <Text style={styles.lastMessage}>
              Last message: {new Date(item.lastMessageAt.seconds * 1000).toLocaleDateString()}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Help Desk</Text>
        {isApprovedTutor && (
          <TouchableOpacity 
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'helpers' ? 'chats' : 'helpers')}
          >
            <Ionicons 
              name={viewMode === 'helpers' ? 'chatbubbles-outline' : 'people-outline'} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {isApprovedTutor && viewMode === 'chats' ? (
        // Tutor view - show student chats
        <>
          <View style={styles.headerInfo}>
            <Text style={styles.headerInfoText}>Your Student Chats</Text>
            <Text style={styles.subHeaderText}>Students you are helping</Text>
          </View>
          <FlatList
            data={studentChats}
            keyExtractor={(item) => item.id}
            renderItem={renderStudentChat}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No student chats yet</Text>
                <Text style={styles.emptySubText}>Students will appear here when they start chatting with you</Text>
              </View>
            }
          />
        </>
      ) : (
        // Student view - show available helpers
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
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="help-buoy-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No helpers available</Text>
                <Text style={styles.emptySubText}>Check back later or try a different subject</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 16,
  },
  viewToggle: {
    padding: 8,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#111", flex: 1 },
  headerInfo: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerInfoText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  subHeaderText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  subjectsRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, marginBottom: 8 },
  subjectChip: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, margin: 4, borderWidth: 1, borderColor: "#e0e0e0" },
  subjectChipActive: { backgroundColor: "#007AFF20", borderColor: "#007AFF" },
  subjectText: { color: "#333" },
  subjectTextActive: { color: "#007AFF", fontWeight: "600" },
  helperCard: { backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 8, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center", marginRight: 10 },
  avatarText: { color: "#fff", fontWeight: "700" },
  helperName: { fontSize: 16, fontWeight: "600" },
  helperSubjects: { fontSize: 12, color: "#666", marginTop: 2 },
  lastMessage: { fontSize: 11, color: "#999", marginTop: 2 },
  rating: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  ratingText: { fontSize: 12, marginLeft: 4 },
  chatBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#007AFF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  chatText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
  },
});



