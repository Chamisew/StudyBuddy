import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../firebase/firebaseConfig";

// inside component
const [uploading, setUploading] = useState(false);

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

    const response = await fetch(file.uri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob, {
      contentType: file.mimeType || 'application/octet-stream',
      customMetadata: {
        originalName: file.name,
        uploadedBy: auth.currentUser?.uid || "unknown",
      }
    });

    const downloadURL = await getDownloadURL(storageRef);

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

    await addDoc(collection(db, "resources"), resourceData);

    Alert.alert("Success", "Resource uploaded successfully!", [
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
    ]);
  } catch (error) {
    console.error("Upload error:", error);
    Alert.alert("Upload Error", error.message || "Failed to upload resource");
  } finally {
    setUploading(false);
  }
};
