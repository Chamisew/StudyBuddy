import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, FlatList } from "react-native";
import GalaxyAnimation from "../components/GalaxyAnimation";
import { GalaxyColors } from "../constants/GalaxyColors";
import { GlobalStyles } from "../constants/GlobalStyles";

export default function QuizzesScreen() {
  const router = useRouter();
  const myQuizzes = [];
  const availableQuizzes = [];
  const isTutor = false;

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
});
