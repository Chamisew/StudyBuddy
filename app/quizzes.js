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
          unsub = onSnapshot(q, async (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const withNames = await Promise.all(items.map(async (it) => {
              try {
                const u = await getDoc(doc(db, 'users', it.ownerId));
                const ownerName = u.exists() ? (u.data().fullName || u.data().email || it.ownerId) : it.ownerId;
                return { ...it, ownerName };
              } catch { return { ...it, ownerName: it.ownerId }; }
            }));
            withNames.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            setMyQuizzes(withNames);
          }, (error) => {
            Alert.alert('Error', error?.message || 'Failed to load quizzes');
          });
        } else {
          const q = query(collection(db, 'quizzes'), where('published','==', true));
          unsub = onSnapshot(q, async (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const withNames = await Promise.all(items.map(async (it) => {
              try {
                const u = await getDoc(doc(db, 'users', it.ownerId));
                const ownerName = u.exists() ? (u.data().fullName || u.data().email || it.ownerId) : it.ownerId;
                return { ...it, ownerName };
              } catch { return { ...it, ownerName: it.ownerId }; }
            }));
            withNames.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

            // Per-quiz submission existence check for this user
            const annotated = await Promise.all(withNames.map(async (qz) => {
              try {
                const mine = await getDoc(doc(db, 'quizzes', qz.id, 'submissions', uid));
                return { ...qz, userDone: mine.exists() };
              } catch {
                return { ...qz, userDone: false };
              }
            }));
            setAvailableQuizzes(annotated);
          }, (error) => {
            Alert.alert('Error', error?.message || 'Failed to load quizzes');
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
        questions: [
          { id: 'q1', type: 'single', text: 'Sample single choice?', options: ['A','B','C'], correct: [0] },
          { id: 'q2', type: 'multi', text: 'Sample multiple choice?', options: ['X','Y','Z'], correct: [0,2] },
        ],
      });
      router.push({ pathname: '/quiz', params: { id: qref.id, edit: '1' } });
    } catch (e) {
      Alert.alert('Error', 'Failed to create quiz');
    }
  };

  const deleteQuiz = async (quizId) => {
    try {
      if (!uid) return;
      const quizRef = doc(db, 'quizzes', quizId);
      const snap = await getDoc(quizRef);
      if (!snap.exists()) {
        Alert.alert('Already removed', 'This quiz no longer exists.');
        return;
      }
      const data = snap.data();
      if (data.ownerId !== uid) {
        Alert.alert('Not allowed', 'Only the owner can delete this quiz.');
        return;
      }
      // delete submissions
      const subs = await getDocs(collection(db, 'quizzes', quizId, 'submissions'));
      const deleteSubmissionPromises = subs.docs.map((d) => deleteDoc(doc(db, 'quizzes', quizId, 'submissions', d.id)));
      await Promise.allSettled(deleteSubmissionPromises);
      // delete quiz doc
      await deleteDoc(quizRef);
      // optimistic removal from lists
      setMyQuizzes(prev => prev.filter(q => q.id !== quizId));
      setAvailableQuizzes(prev => prev.filter(q => q.id !== quizId));
      Alert.alert('Deleted', 'Quiz has been deleted.');
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
          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: item.published 
                ? GalaxyColors.light.success + '20' 
                : GalaxyColors.light.warning + '20' 
            }
          ]}>
            <Text style={[
              styles.statusText, 
              { 
                color: item.published 
                  ? GalaxyColors.light.success 
                  : GalaxyColors.light.warning 
              }
            ]}>
              {item.published ? 'Published' : 'Draft'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.meta} numberOfLines={2}>
          by {item.ownerName || item.ownerId}
          {(!isTutor && item.userDone !== undefined) ? (
            item.userDone ? 
              <Text style={[styles.statusText, { color: GalaxyColors.light.success }]}> • Completed</Text> : 
              <Text style={[styles.statusText, { color: GalaxyColors.light.warning }]}> • Not completed</Text>
          ) : null}
        </Text>
        
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        
        <View style={styles.cardFooter}>
          <Text style={styles.questionCount}>
            <Ionicons name="help-circle-outline" size={14} color={GalaxyColors.light.textSecondary} />
            {(item.questions || []).length} questions
          </Text>
          {item.createdAt && (
            <Text style={styles.dateText}>
              {item.createdAt.toDate ? 
                new Date(item.createdAt.toDate()).toLocaleDateString() : 
                'Unknown date'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      {item.ownerId === uid && (
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => router.push({ pathname: '/quiz', params: { id: item.id, edit: '1' } })}
          >
            <Ionicons name="create-outline" size={20} color={GalaxyColors.light.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => deleteQuiz(item.id)}
          >
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
        <FlatList 
          data={myQuizzes} 
          renderItem={renderQuiz} 
          keyExtractor={(i) => i.id} 
          contentContainerStyle={{ padding: 16 }} 
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="help-circle-outline" size={64} color={GalaxyColors.light.textSecondary} />
              <Text style={styles.emptyTitle}>No Quizzes Created</Text>
              <Text style={styles.emptyText}>Create your first quiz to get started</Text>
            </View>
          }
        />
      ) : (
        <FlatList 
          data={availableQuizzes} 
          renderItem={renderQuiz} 
          keyExtractor={(i) => i.id} 
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="help-circle-outline" size={64} color={GalaxyColors.light.textSecondary} />
              <Text style={styles.emptyTitle}>No Quizzes Available</Text>
              <Text style={styles.emptyText}>Check back later for new quizzes</Text>
            </View>
          }
        />
      )}
      
      {isTutor && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={createQuickQuiz}
        >
          <Ionicons name="add" size={24} color={GalaxyColors.light.textInverse} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: GalaxyColors.light.backgroundSecondary 
  },
  galaxyAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  headerGradient: {
    paddingTop: 0,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: GalaxyColors.light.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: GalaxyColors.light.border,
    ...GlobalStyles.shadow,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700',
    color: GalaxyColors.light.text,
  },
  card: { 
    backgroundColor: GalaxyColors.light.card, 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 16,
    ...GlobalStyles.shadow,
    borderWidth: 1,
    borderColor: GalaxyColors.light.cardBorder,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700',
    color: GalaxyColors.light.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '600',
  },
  meta: { 
    marginTop: 4, 
    color: GalaxyColors.light.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    color: GalaxyColors.light.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  questionCount: {
    color: GalaxyColors.light.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  dateText: {
    color: GalaxyColors.light.textSecondary,
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    backgroundColor: GalaxyColors.light.surface,
    borderTopWidth: 1,
    borderTopColor: GalaxyColors.light.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editButton: {
    padding: 8,
    marginRight: 16,
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GalaxyColors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...GlobalStyles.shadowLarge,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GalaxyColors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: GalaxyColors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

