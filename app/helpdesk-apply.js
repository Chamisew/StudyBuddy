import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function HelpdeskApplyScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState("");
  const [bio, setBio] = useState("");
  const [existing, setExisting] = useState(null);
  const [highestQualification, setHighestQualification] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, "helpdeskApplicants", uid));
        if (snap.exists()) setExisting(snap.data());
      } catch {}
    };
    run();
  }, []);

  const submit = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const subjectList = subjects.split(",").map(s => s.trim()).filter(Boolean);
      if (!highestQualification.trim()) {
        Alert.alert("Required", "Please enter your highest qualification");
        return;
      }
      const years = Number(yearsExperience);
      if (!Number.isFinite(years) || years < 0) {
        Alert.alert("Invalid", "Enter valid years of experience (0 or more)");
        return;
      }
      await setDoc(doc(db, "helpdeskApplicants", uid), {
        subjects: subjectList,
        bio: bio.trim(),
        status: "pending",
        email: auth.currentUser?.email || "",
        name: auth.currentUser?.displayName || "",
        highestQualification: highestQualification.trim(),
        yearsExperience: years,
        updatedAt: new Date(),
      }, { merge: true });
      Alert.alert("Submitted", "Your application has been submitted.");
    } catch (e) {
      Alert.alert("Error", "Failed to submit application");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Apply as Helper</Text>
      </View>
      {existing && (
        <View style={styles.banner}>
          <Ionicons name="information-circle-outline" size={18} color="#007AFF" />
          <Text style={styles.bannerText}>Current status: {existing.status}</Text>
        </View>
      )}
      <Text style={styles.label}>Subjects (comma separated)</Text>
      <TextInput value={subjects} onChangeText={setSubjects} placeholder="e.g. Math, Physics" style={styles.input} />
      <Text style={styles.label}>Highest Qualification *</Text>
      <TextInput value={highestQualification} onChangeText={setHighestQualification} placeholder="e.g. BSc in Physics, MSc in Math" style={styles.input} />
      <Text style={styles.label}>Years of Experience *</Text>
      <TextInput value={yearsExperience} onChangeText={setYearsExperience} placeholder="e.g. 2" style={styles.input} keyboardType="numeric" />
      <Text style={styles.label}>Bio</Text>
      <TextInput value={bio} onChangeText={setBio} placeholder="Brief experience" style={[styles.input, { height: 100 }]} multiline />
      <TouchableOpacity style={styles.submit} onPress={submit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 16,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#111" },
  label: { marginHorizontal: 16, marginTop: 12, marginBottom: 6, color: "#333" },
  input: { marginHorizontal: 16, backgroundColor: "#f7f7fa", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  submit: { marginTop: 16, marginHorizontal: 16, backgroundColor: "#34C759", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700" },
  banner: { marginHorizontal: 16, marginBottom: 8, padding: 10, backgroundColor: "#E6F0FF", borderRadius: 8, flexDirection: "row", alignItems: "center" },
  bannerText: { marginLeft: 8, color: "#1C5DFF" },
});



