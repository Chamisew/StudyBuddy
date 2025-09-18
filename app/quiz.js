import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GalaxyAnimation from "../components/GalaxyAnimation";
import { GalaxyColors } from "../constants/GalaxyColors";
import { GlobalStyles } from "../constants/GlobalStyles";

export default function QuizScreen() {
  const router = useRouter();

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

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.qcard}>
          <Text style={styles.qtext}>Question text will go here</Text>
          <View style={styles.opt}>
            <Ionicons name="radio-button-off" size={24} color={GalaxyColors.light.textSecondary} />
            <Text style={styles.optText}>Option 1</Text>
          </View>
          <View style={styles.opt}>
            <Ionicons name="radio-button-off" size={24} color={GalaxyColors.light.textSecondary} />
            <Text style={styles.optText}>Option 2</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GalaxyColors.light.backgroundSecondary },
  galaxyAnimation: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  headerGradient: { paddingTop: 0 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: GalaxyColors.light.surface, borderBottomWidth: 1, borderBottomColor: GalaxyColors.light.border, ...GlobalStyles.shadow },
  headerTitle: { fontSize: 20, fontWeight: "700", color: GalaxyColors.light.text },
  qcard: { backgroundColor: GalaxyColors.light.card, padding: 16, borderRadius: 16, marginBottom: 12, ...GlobalStyles.shadow, borderWidth: 1, borderColor: GalaxyColors.light.cardBorder },
  qtext: { fontSize: 17, fontWeight: "700", marginBottom: 12, color: GalaxyColors.light.text },
  opt: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12 },
  optText: { marginLeft: 12, fontSize: 16, color: GalaxyColors.light.text },
});
