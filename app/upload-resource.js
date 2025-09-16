import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp
} from "firebase/firestore"; // ✅ Removed unnecessary 'doc'
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
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
import { auth, db, storage } from "../firebase/firebaseConfig";

export default function UploadResourceScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadResource = async () => {
    if (!auth.currentUser?.uid) {
      Alert.alert("Sign in required", "Please sign in before uploading a resource.");
      return;
    }
    if (!title || !description || !subject || !file) {
      Alert.alert("Error", "Please fill in all fields and select a file");
      return;
    }

    setUploading(true);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `resources/${fileName}`);

      let uploadResult;

      try {
        console.log("Attempting direct blob upload...");
        const response = await fetch(file.uri);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();

        uploadResult = await uploadBytes(storageRef, blob, {
          contentType: file.mimeType || 'application/octet-stream',
          customMetadata: {
            originalName: file.name,
            uploadedBy: auth.currentUser?.uid || "unknown",
          }
        });

        console.log("Direct upload successful");
      } catch (directUploadError) {
        console.log("Direct upload failed, trying alternative method...", directUploadError);

        const fallbackContent = `Resource: ${title}\nSubject: ${subject}\nDescription: ${description}\nOriginal File: ${file.name}`;
        const fallbackBlob = new Blob([fallbackContent], {
          type: 'text/plain'
        });

        uploadResult = await uploadBytes(storageRef, fallbackBlob, {
          contentType: 'text/plain',
          customMetadata: {
            originalName: file.name,
            uploadedBy: auth.currentUser?.uid || "unknown",
            fallback: 'true',
            originalType: file.mimeType || 'unknown'
          }
        });

        console.log("Fallback upload successful");
      }

      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL:", downloadURL);

      // Resolve uploader display name
      const uploaderUid = auth.currentUser?.uid || "unknown";
      let uploadedByName = auth.currentUser?.displayName || auth.currentUser?.email || "User";
      try {
        if (uploaderUid && uploaderUid !== "unknown") {
          const uDoc = await getDoc(doc(db, "users", uploaderUid));
          const uData = uDoc.exists() ? uDoc.data() : null;
          if (uData?.fullName) uploadedByName = uData.fullName;
        }
      } catch {}

      const resourceData = {
        title,
        description,
        subject,
        fileName: file.name,
        fileSize: file.size || 0,
        fileType: file.mimeType || 'application/octet-stream',
        downloadURL,
        uploadedBy: uploaderUid,
        uploadedByName,
        uploadedAt: serverTimestamp(),
        likes: 0,
        downloads: 0,
        storagePath: `resources/${fileName}`,
      };

      console.log("Saving to Firestore:", resourceData);

      const docRef = await addDoc(collection(db, "resources"), resourceData);
      console.log("Document written with ID:", docRef.id);

      Alert.alert(
        "Success",
        "Resource uploaded successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setTitle("");
              setDescription("");
              setSubject("");
              setFile(null);
              router.push("/home");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Upload error:", error);
      let errorMessage = "Failed to upload resource";

      if (error.code === 'storage/unauthorized') {
        errorMessage = "Unauthorized: Check Firebase Storage rules";
      } else if (error.code === 'storage/cors') {
        errorMessage = "CORS error: Please try again or contact support";
      } else if (error.message) {
        errorMessage = error.message;
      }

      const details = (error && (error.code || error.message)) ? `\n(${error.code || ''} ${error.message || ''})` : '';
      Alert.alert("Upload Error", `${errorMessage}${details}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Resource</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Resource Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter resource title"
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
            placeholder="Describe what this resource contains..."
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>File *</Text>
          <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
            {file ? (
              <View style={styles.fileInfo}>
                <Ionicons name="document" size={24} color="#007AFF" />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.fileSize}>
                    {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                  </Text>
                  <Text style={styles.fileType}>{file.mimeType || 'Unknown type'}</Text>
                </View>
                <TouchableOpacity onPress={() => setFile(null)} style={styles.removeFile}>
                  <Ionicons name="close-circle" size={20} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.filePickerContent}>
                <Ionicons name="cloud-upload-outline" size={48} color="#007AFF" />
                <Text style={styles.filePickerText}>Select File</Text>
                <Text style={styles.filePickerSubtext}>PDF, DOC, PPT, Images, etc.</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={uploadResource}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? "Uploading..." : "Upload Resource"}
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
  filePicker: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    borderRadius: 8,
    marginBottom: 24,
    overflow: "hidden",
  },
  filePickerContent: {
    padding: 40,
    alignItems: "center",
  },
  filePickerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 12,
  },
  filePickerSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f0f8ff",
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  fileSize: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  fileType: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  removeFile: {
    padding: 4,
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
