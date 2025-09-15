import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GalaxyAnimation } from "../components/GalaxyAnimation";
import GroupChat from "../components/GroupChat";
import StudentGroupChat from "../components/StudentGroupChat";
import { GalaxyColors } from "../constants/GalaxyColors";
import { auth, db } from "../firebase/firebaseConfig";
import { smartNavigateBack } from "../utils/navigation";

export default function ChatMenuScreen() {
  const router = useRouter();
  const [isTutor, setIsTutor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [groupChatVisible, setGroupChatVisible] = useState(false);
  const [studentGroupChatVisible, setStudentGroupChatVisible] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data();
          setIsTutor(!!data.isTutor);
          setIsAdmin(!!data.isAdmin || /\+admin/.test(auth.currentUser?.email || ""));
          setUserProfile(data);
        }
      } catch {}
    };
    run();
  }, []);

  return (
    <View style={styles.container}>
      <GalaxyAnimation style={styles.galaxyBackground} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => smartNavigateBack(router, '/chat-menu')}
          >
            <Ionicons name="arrow-back" size={24} color={GalaxyColors.light.icon} />
          </TouchableOpacity>
          <Text style={styles.title}>💬 Chat Menu</Text>
        </View>

        <View style={styles.menuList}>
          {/* Group Chats */}
          <TouchableOpacity 
            style={styles.item} 
            onPress={() => {
              if (userProfile?.isTutor) {
                setGroupChatVisible(true);
              } else {
                setStudentGroupChatVisible(true);
              }
            }}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={24} color={GalaxyColors.light.primary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Group Chats</Text>
              <Text style={styles.itemSubtitle}>Connect with study groups</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GalaxyColors.light.iconSecondary} />
          </TouchableOpacity>

          {/* Global Chat */}
          <TouchableOpacity style={styles.item} onPress={() => router.push("/global-chat")}>
            <View style={styles.iconContainer}>
              <Ionicons name="globe" size={24} color={GalaxyColors.light.success} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Global Chat</Text>
              <Text style={styles.itemSubtitle}>Chat with everyone</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GalaxyColors.light.iconSecondary} />
          </TouchableOpacity>

          {/* AI Chatbot */}
          <TouchableOpacity style={styles.item} onPress={() => router.push("/ai-chatbot")}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={24} color={GalaxyColors.light.secondary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>AI Chatbot</Text>
              <Text style={styles.itemSubtitle}>Get instant help from AI</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GalaxyColors.light.iconSecondary} />
          </TouchableOpacity>

          {/* Help Desk */}
          <TouchableOpacity style={styles.item} onPress={() => router.push("/helpdesk")}>
            <View style={styles.iconContainer}>
              <Ionicons name="help-buoy" size={24} color={GalaxyColors.light.accent} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Help Desk</Text>
              <Text style={styles.itemSubtitle}>Find tutors and helpers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GalaxyColors.light.iconSecondary} />
          </TouchableOpacity>



          {isAdmin && (
            <TouchableOpacity style={styles.item} onPress={() => router.push("/helpdesk-admin")}>
              <View style={styles.itemLeft}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#5856D6" />
                <Text style={styles.itemText}>Helpdesk Admin</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Group Chat Modal for Tutors */}
        <GroupChat 
          visible={groupChatVisible} 
          onClose={() => setGroupChatVisible(false)} 
          tutorId={auth.currentUser?.uid}
        />

        {/* Student Group Chat Modal */}
        <StudentGroupChat 
          visible={studentGroupChatVisible} 
          onClose={() => setStudentGroupChatVisible(false)} 
          studentId={auth.currentUser?.uid}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: GalaxyColors.light.background,
  },
  galaxyBackground: {
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GalaxyColors.light.border,
    backgroundColor: GalaxyColors.light.surface + 'CC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backdropFilter: 'blur(10px)',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: GalaxyColors.light.backgroundSecondary,
  },
  title: { 
    fontSize: 26, 
    fontWeight: "800", 
    color: GalaxyColors.light.text,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  menuList: { 
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  item: {
    backgroundColor: GalaxyColors.light.card,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: GalaxyColors.light.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    backdropFilter: 'blur(10px)',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: GalaxyColors.light.text,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    fontWeight: '500',
  },
});