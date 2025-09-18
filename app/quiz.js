import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GalaxyAnimation from "../components/GalaxyAnimation";
import { GalaxyColors } from "../constants/GalaxyColors";
import { GlobalStyles } from "../constants/GlobalStyles";
import { auth, db } from "../firebase/firebaseConfig";

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const uid = auth.currentUser?.uid;
  const [quiz, setQuiz] = useState(null);
  const [isTutor, setIsTutor] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const me = await getDoc(doc(db, "users", uid));
        const profile = me.exists() ? me.data() : {};
        setIsTutor(!!profile.isTutor);

        const qd = await getDoc(doc(db, "quizzes", String(id)));
        if (qd.exists()) setQuiz({ id: qd.id, ...qd.data() });

        if (profile.isTutor) {
          const ss = await getDocs(collection(db, "quizzes", String(id), "submissions"));
          const list = [];
          for (const d of ss.docs) {
            const sub = d.data();
            const uDoc = await getDoc(doc(db, "users", sub.userId));
            const name = uDoc.exists()
              ? (uDoc.data().fullName || uDoc.data().email || sub.userId)
              : sub.userId;
            list.push({ id: d.id, name, ...sub });
          }
          setSubmissions(list);
        }
      } catch {}
    };
    if (uid && id) run();
  }, [uid, id]);

  if (!quiz) {
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
            <Text style={styles.headerTitle}>Quiz</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
        <View style={{ padding: 16 }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>{quiz.title || "Quiz"}</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 12 }}>
          {quiz.description || "No description"}
        </Text>

        {isTutor && submissions.length > 0 && (
          <View>
            <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
              Student Submissions
            </Text>
            {submissions.map((s) => (
              <View key={s.id} style={styles.subCard}>
                <Text style={styles.subName}>{s.name}</Text>
                <Text style={styles.subScore}>{s.score}/{s.max}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GalaxyColors.light.backgroundSecondary },
  galaxyAnimation: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  headerGradient: { paddingTop: 0 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: GalaxyColors.light.surface, borderBottomWidth: 1, borderBottomColor: GalaxyColors.light.border, ...GlobalStyles.shadow },
  headerTitle: { fontSize: 20, fontWeight: "700", color: GalaxyColors.light.text },
  subCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: GalaxyColors.light.card, borderRadius: 12, padding: 16, marginBottom: 12, ...GlobalStyles.shadow, borderWidth: 1, borderColor: GalaxyColors.light.cardBorder },
  subName: { fontWeight: "700", color: GalaxyColors.light.text },
  subScore: { color: GalaxyColors.light.primary, fontWeight: "700", fontSize: 16 },
});
