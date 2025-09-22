import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GalaxyAnimation from "../components/GalaxyAnimation";
import { GalaxyColors } from "../constants/GalaxyColors";
import { GlobalStyles } from "../constants/GlobalStyles";
import { auth, db } from "../firebase/firebaseConfig";

export default function QuizzesScreen() {
  const router = useRouter();
  const [isTutor, setIsTutor] = useState(false);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!uid) return;
    let unsub = () => {};
    (async () => {
      try {
        const me = await getDoc(doc(db, 'users', uid));
        const profile = me.exists() ? me.data() : {};
        const tutor = !!profile.isTutor;
        setIsTutor(tutor);
        if (tutor) {
          const q = query(collection(db, 'quizzes'), where('ownerId','==', uid));
          unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMyQuizzes(items);
          });
        } else {
          const q = query(collection(db, 'quizzes'), where('published','==', true));
          unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAvailableQuizzes(items);
          });
        }
      } catch (e) { Alert.alert('Error', e?.message || 'Failed to load quizzes'); }
    })();
    return () => { try { unsub(); } catch {} };
  }, [uid]);

  const createQuickQuiz = async () => {
    try {
      if (!isTutor || !uid) return;
      const qref = await addDoc(collection(db, 'quizzes'), {
        ownerId: uid,
        title: 'Untitled Quiz',
        description: '',
        published: false,
        createdAt: serverTimestamp(),
        questions: [],
      });
      router.push({ pathname: '/quiz', params: { id: qref.id, edit: '1' } });
    } catch (e) {
      Alert.alert('Error', 'Failed to create quiz');
    }
  };

  const deleteQuiz = async (quizId) => {
    try {
      if (!uid) return;
      await deleteDoc(doc(db, 'quizzes', quizId));
      setMyQuizzes(prev => prev.filter(q => q.id !== quizId));
      setAvailableQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to delete quiz');
    }
  };

  const renderQuiz = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardContent} 
        onPress={() => router.push({ pathname: '/quiz', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.title || 'Quiz'}</Text>
        </View>
      </TouchableOpacity>
      {item.ownerId === uid && (
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => deleteQuiz(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GalaxyAnimation style={styles.galaxyAnimation} />
      <LinearGradient
        colors={[GalaxyColors.light.gradientStart, GalaxyColors.light.gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={GalaxyColors.light.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quizzes</Text>
          <View style={{ width: 26 }} />
        </View>
      </LinearGradient>

      {isTutor ? (
        <FlatList data={myQuizzes} renderItem={renderQuiz} keyExtractor={(i) => i.id} />
      ) : (
        <FlatList data={availableQuizzes} renderItem={renderQuiz} keyExtractor={(i) => i.id} />
      )}

      {isTutor && (
        <TouchableOpacity style={styles.fab} onPress={createQuickQuiz}>
          <Ionicons name="add" size={24} color={GalaxyColors.light.textInverse} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GalaxyColors.light.backgroundSecondary },
  galaxyAnimation: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  headerGradient: { paddingTop: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: GalaxyColors.light.surface, borderBottomWidth: 1, borderBottomColor: GalaxyColors.light.border, ...GlobalStyles.shadow },
  headerTitle: { fontSize: 20, fontWeight: '700', color: GalaxyColors.light.text },
  card: { backgroundColor: GalaxyColors.light.card, margin: 16, borderRadius: 16, ...GlobalStyles.shadow },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: GalaxyColors.light.text },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 8 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: GalaxyColors.light.primary, justifyContent: 'center', alignItems: 'center', ...GlobalStyles.shadowLarge },
});
