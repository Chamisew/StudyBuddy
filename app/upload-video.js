import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp
} from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../firebase/firebaseConfig";

export default function UploadVideoScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const validateVideoUrl = (url) => {
    // Basic validation for common video platforms
    const validDomains = [
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'dailymotion.com',
      'facebook.com',
      'instagram.com',
      'tiktok.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return validDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const uploadVideo = async () => {
    const cleanedUrl = (videoUrl || "").trim();

    if (!title || !description || !subject || !cleanedUrl) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!validateVideoUrl(cleanedUrl)) {
      Alert.alert("Error", "Please enter a valid video URL from supported platforms (YouTube, Vimeo, etc.)");
      return;
    }

    setUploading(true);

    try {
      const uploaderUid = auth.currentUser?.uid || "unknown";
      let uploadedByName = auth.currentUser?.displayName || auth.currentUser?.email || "User";
      try {
        if (uploaderUid && uploaderUid !== "unknown") {
          const uDoc = await getDoc(doc(db, "users", uploaderUid));
          const uData = uDoc.exists() ? uDoc.data() : null;
          if (uData?.fullName) uploadedByName = uData.fullName;
        }
      } catch {}

      const videoData = {
        title,
        description,
        subject,
        videoUrl: cleanedUrl,
        uploadedBy: uploaderUid,
        uploadedByName,
        uploadedAt: serverTimestamp(),
        likes: 0,
        views: 0,
        type: "video",
        platform: getVideoPlatform(cleanedUrl),
      };

      console.log("Saving video to Firestore:", videoData);

      const docRef = await addDoc(collection(db, "videos"), videoData);
      console.log("Video document written with ID:", docRef.id);

      Alert.alert(
        "Success",
        "Video link uploaded successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setTitle("");
              setDescription("");
              setSubject("");
              setVideoUrl("");
              router.push("/home");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Upload error:", error);
      const details = (error && (error.message || error.code)) ? `\n(${error.code || ''} ${error.message || ''})` : '';
      Alert.alert("Upload Error", `Failed to upload video link${details}`);
    } finally {
      setUploading(false);
    }
  };

  const getVideoPlatform = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        return 'YouTube';
      } else if (urlObj.hostname.includes('vimeo.com')) {
        return 'Vimeo';
      } else if (urlObj.hostname.includes('dailymotion.com')) {
        return 'Dailymotion';
      } else if (urlObj.hostname.includes('facebook.com')) {
        return 'Facebook';
      } else if (urlObj.hostname.includes('instagram.com')) {
        return 'Instagram';
      } else if (urlObj.hostname.includes('tiktok.com')) {
        return 'TikTok';
      }
      return 'Other';
    } catch {
      return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Video</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Video Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter video title"
          />

          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., Mathematics, Physics"
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what this video contains..."
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Video URL *</Text>
          <TextInput
            style={styles.input}
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <View style={styles.supportedPlatforms}>
            <Text style={styles.supportedTitle}>Supported Platforms:</Text>
            <View style={styles.platformList}>
              <Text style={styles.platformItem}>• YouTube</Text>
              <Text style={styles.platformItem}>• Vimeo</Text>
              <Text style={styles.platformItem}>• Dailymotion</Text>
              <Text style={styles.platformItem}>• Facebook</Text>
              <Text style={styles.platformItem}>• Instagram</Text>
              <Text style={styles.platformItem}>• TikTok</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={uploadVideo}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? "Uploading..." : "Upload Video"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: { flex: 1, padding: 16 },
  form: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  supportedPlatforms: {
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  supportedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
  },
  platformList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  platformItem: {
    fontSize: 12,
    color: "#666",
    marginRight: 16,
    marginBottom: 4,
  },
  uploadButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadButtonDisabled: {
    backgroundColor: "#ccc",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
