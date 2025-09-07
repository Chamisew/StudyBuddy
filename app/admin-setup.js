import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDocs, limit, query, setDoc, where } from "firebase/firestore";

export default function AdminSetupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "users"), where("isAdmin", "==", true), limit(1));
        const snap = await getDocs(q);
        const exists = !snap.empty;
        setAdminExists(exists);
      } catch {}
      setChecking(false);
    })();
  }, []);

  const handleCreate = async () => {
    try {
      if (adminExists) {
        Alert.alert("Admin already exists", "An admin account is already set up. Please sign in.");
        return;
      }
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      if (!trimmedName) {
        Alert.alert("Required", "Please enter a name");
        return;
      }
      if (!trimmedEmail || !trimmedEmail.includes("@")) {
        Alert.alert("Invalid", "Please enter a valid email");
        return;
      }
      if (!password || password.length < 6) {
        Alert.alert("Weak password", "Password must be at least 6 characters");
        return;
      }
      setSubmitting(true);
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const uid = cred.user.uid;
      await setDoc(doc(db, "users", uid), {
        name: trimmedName,
        email: trimmedEmail,
        isAdmin: true,
        isTutor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
      Alert.alert("Success", "Admin account created");
      router.replace("/home");
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to create admin");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8 }}>Checking admin status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>First Admin Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      {adminExists ? (
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={18} color="#007AFF" />
          <Text style={styles.noticeText}>An admin already exists. Please sign in.</Text>
          <TouchableOpacity style={[styles.submit, { marginTop: 12 }]} onPress={() => router.replace('/signin')}>
            <Text style={styles.submitText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Admin Name</Text>
          <TextInput
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Admin Email</Text>
          <TextInput
            placeholder="someone@example.com"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          <TouchableOpacity style={[styles.submit, submitting && { opacity: 0.7 }]} onPress={handleCreate} disabled={submitting}>
            <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Admin'}</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  form: { backgroundColor: "white", borderRadius: 12, padding: 16, margin: 16 },
  label: { fontSize: 14, color: "#333", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: "#fafafa" },
  submit: { backgroundColor: "#007AFF", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "600" },
  notice: { backgroundColor: "#E6F0FF", borderRadius: 12, margin: 16, padding: 12, flexDirection: 'row', alignItems: 'center' },
  noticeText: { marginLeft: 8, color: "#1C5DFF", flex: 1 },
});



