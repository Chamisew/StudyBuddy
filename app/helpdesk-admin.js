import React, { useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HelpdeskAdminScreen() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Helpdesk Admin</Text>
      </View>

      {!isAdmin ? (
        <View style={styles.noAccessContainer}>
          <Ionicons name="shield-outline" size={64} color="#ccc" />
          <Text style={styles.noAccessTitle}>Access Denied</Text>
          <Text style={styles.noAccessText}>
            You don't have admin privileges to access this page.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Admin content goes here...</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111" },
  noAccessContainer: {
    flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32,
  },
  noAccessTitle: { fontSize: 24, fontWeight: "bold", color: "#666", marginTop: 16 },
  noAccessText: { fontSize: 16, color: "#999", textAlign: "center", marginTop: 8 },
});
