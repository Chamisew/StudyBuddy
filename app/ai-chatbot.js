import React, { useRef, useState } from "react";
import { SafeAreaView, View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

// This is a stub using fetch to Google Gemini's free API compatible endpoint.
// Replace GCP project and key with your own. Consider moving the key to env.
const readGeminiKey = () => {
  return (
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    Constants?.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY ||
    (Constants?.manifest?.extra && Constants.manifest.extra.EXPO_PUBLIC_GEMINI_API_KEY) ||
    ""
  );
};

async function fetchGeminiResponse(prompt) {
  const apiKey = readGeminiKey();
  if (!apiKey) {
    return "Gemini API key missing. Set EXPO_PUBLIC_GEMINI_API_KEY.";
  }
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }]}],
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text || "No response";
  } catch (e) {
    return "Error calling Gemini: " + (e?.message || "unknown error");
  }
}

export default function AIChatbotScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now() + "_u", role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    const reply = await fetchGeminiResponse(userMsg.text);
    const aiMsg = { id: Date.now() + "_a", role: "ai", text: reply };
    setMessages((prev) => [...prev, aiMsg]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const renderItem = ({ item }) => (
    <View style={[styles.msg, item.role === "user" ? styles.mine : styles.theirs]}>
      <Text style={styles.msgText}>{item.text}</Text>
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
        <Text style={styles.title}>AI Chatbot</Text>
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Ask anything..."
            value={input}
            onChangeText={setInput}
            style={styles.input}
            multiline
          />
          <TouchableOpacity onPress={send} style={styles.sendBtn}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  title: { fontSize: 20, fontWeight: "700" },
  list: { padding: 12 },
  msg: {
    maxWidth: "85%",
    marginBottom: 10,
    padding: 10,
    borderRadius: 12,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "#f2f2f7",
  },
  msgText: { fontSize: 15, color: "#111" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5ea",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#007AFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});


