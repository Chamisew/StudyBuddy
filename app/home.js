import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { AnimatedAppIcon } from "../components/AnimatedAppIcon";
import { GalaxyAnimation } from "../components/GalaxyAnimation";
import GroupChat from "../components/GroupChat";
import StudentGroupChat from "../components/StudentGroupChat";
import { GalaxyColors } from "../constants/GalaxyColors";
import { GlobalStyles } from "../constants/GlobalStyles";
import { auth, db, storage } from "../firebase/firebaseConfig";


export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatIndexBackfilled, setChatIndexBackfilled] = useState(false);
  const [resources, setResources] = useState([]);
  const [videos, setVideos] = useState([]);
  const [userQuestions, setUserQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'resource'|'video', id }
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rateVisible, setRateVisible] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null); // { id, name }
  const [ratingValue, setRatingValue] = useState(0);
  const [tutorMenuVisible, setTutorMenuVisible] = useState(false);
  const [groupChatVisible, setGroupChatVisible] = useState(false);
  const [studentGroupChatVisible, setStudentGroupChatVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportTarget, setReportTarget] = useState(null); // { type, id }
  const [reportExists, setReportExists] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    // initial fetch
    fetchData();
    // realtime listeners for resources/videos updates
    const resQ = query(collection(db, "resources"), orderBy("uploadedAt", "desc"), limit(20));
    const unsubRes = onSnapshot(resQ, () => fetchData(true));
    const vidQ = query(collection(db, "videos"), orderBy("uploadedAt", "desc"), limit(20));
    const unsubVid = onSnapshot(vidQ, () => fetchData(true));
    
    // Real-time listener for user questions
    let unsubQuestions = () => {};
    if (auth.currentUser?.uid) {
      const questionsQ = query(
        collection(db, "userQuestions"),
        where("userId", "==", auth.currentUser.uid)
      );
      unsubQuestions = onSnapshot(questionsQ, (snapshot) => {
        console.log('Questions updated via listener');
        const questions = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt = new Date();
          if (data.createdAt) {
            if (data.createdAt.toDate) {
              createdAt = data.createdAt.toDate();
            } else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt;
            } else {
              createdAt = new Date(data.createdAt);
            }
          }
          
          questions.push({
            id: doc.id,
            question: data.question || '',
            category: data.category || 'General',
            status: data.status || 'pending',
            isUrgent: data.isUrgent || false,
            userId: data.userId,
            createdAt: createdAt,
            aiResponse: data.aiResponse || null,
            adminResponse: data.adminResponse || null
          });
        });
        
        questions.sort((a, b) => b.createdAt - a.createdAt);
        console.log('Setting questions via listener:', questions.length);
        setUserQuestions(questions);
      }, (error) => {
        console.error('Questions listener error:', error);
      });
    }
    
    // skip unread messages listener to avoid collectionGroup index requirement
    setUnreadCount(0);
    return () => {
      try { unsubRes(); } catch {}
      try { unsubVid(); } catch {}
      try { unsubQuestions(); } catch {}
    };
  }, [auth.currentUser?.uid]);

  useEffect(() => {
    console.log('useEffect triggered - activeTab:', activeTab, 'currentUser:', auth.currentUser?.uid);
    // Clear search query when switching tabs
    setSearchQuery("");
    if (auth.currentUser?.uid && activeTab === 'questions') {
      console.log('Calling fetchUserQuestions...');
      fetchUserQuestions();
    }
  }, [activeTab, auth.currentUser?.uid]);

  // Also fetch questions when user profile loads
  useEffect(() => {
    if (auth.currentUser?.uid && userProfile) {
      console.log('User profile loaded, fetching questions...');
      fetchUserQuestions();
    }
  }, [userProfile, auth.currentUser?.uid]);

  // Additional effect to ensure questions are fetched when component mounts
  useEffect(() => {
    if (auth.currentUser?.uid) {
      console.log('Component mounted, fetching questions...');
      fetchUserQuestions();
    }
  }, []);

  // Rehydrate lists after logout/login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserProfile();
        fetchData(true);
      } else {
        setUserProfile(null);
        setStudents([]);
        setChatIndexBackfilled(false);
        setIsAdmin(false);
      }
    });
    return () => { try { unsubscribe(); } catch {} };
  }, []);

  // Remove chat index backfill that used collectionGroup (requires index)
  useEffect(() => {
    // No-op to avoid index requirements
    if (!chatIndexBackfilled) setChatIndexBackfilled(true);
  }, [chatIndexBackfilled]);

  // Live students list for tutors (connections only; skip messages listeners requiring collectionGroup)
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const tutorId = auth.currentUser.uid;
    let isActive = true;
    const studentsMap = new Map();

    const applyStudents = async () => {
      if (!isActive) return;
      setStudents(Array.from(studentsMap.values()));
    };

    const unsubCon = onSnapshot(
      query(collection(db, "connections"), where("tutorId", "==", tutorId), where("status", "==", "accepted")),
      async (snap) => {
        studentsMap.clear();
        for (const d of snap.docs) {
          const sid = d.data()?.studentId;
          if (!sid) continue;
          const sDoc = await getDoc(doc(db, "users", sid));
          const sData = sDoc.exists() ? sDoc.data() : {};
          studentsMap.set(sid, { id: sid, name: sData.fullName || sData.displayName || sData.email || sid, status: 'accepted' });
        }
        applyStudents();
      }
    );

    // pending requests listener
    const unsubPending = onSnapshot(
      query(collection(db, "connections"), where("tutorId", "==", tutorId), where("status", "==", "pending")),
      async (snap) => {
        for (const d of snap.docs) {
          const sid = d.data()?.studentId;
          if (!sid) continue;
          const sDoc = await getDoc(doc(db, "users", sid));
          const sData = sDoc.exists() ? sDoc.data() : {};
          studentsMap.set(sid, { id: sid, name: sData.fullName || sData.displayName || sData.email || sid, status: 'pending' });
        }
        applyStudents();
      }
    );

    return () => {
      isActive = false;
      try { unsubCon(); } catch {}
      try { unsubPending(); } catch {}
    };
  }, [userProfile?.isTutor]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'ai_replied': return '#6366f1';
      case 'answered': return '#059669';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderQuestion = ({ item }) => (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.questionTime}>{formatTimeAgo(item.createdAt)}</Text>
          {item.isUrgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="warning" size={12} color="#fff" />
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>
        <View style={styles.categoryContainer}>
          <Ionicons name="pricetag-outline" size={12} color="#8b5cf6" />
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      
      <Text style={styles.questionText}>{item.question}</Text>
      
      {/* AI Response */}
      {item.aiResponse && (
        <View style={styles.aiResponseContainer}>
          <View style={styles.responseHeader}>
            <Ionicons name="chatbot-outline" size={16} color="#6366f1" />
            <Text style={styles.responseLabel}>AI Response</Text>
            <Text style={styles.confidenceText}>{(item.aiResponse.confidence * 100).toFixed(0)}% confidence</Text>
          </View>
          <Text style={styles.responseText}>{item.aiResponse.message}</Text>
          <Text style={styles.responseTime}>{formatTimeAgo(item.aiResponse.timestamp?.toDate ? item.aiResponse.timestamp.toDate() : item.aiResponse.timestamp)}</Text>
        </View>
      )}
      
      {/* Admin Response */}
      {item.adminResponse && (
        <View style={styles.adminResponseContainer}>
          <View style={styles.responseHeader}>
            <Ionicons name="person-outline" size={16} color="#059669" />
            <Text style={styles.responseLabel}>Admin Response</Text>
            <Text style={styles.adminName}>{item.adminResponse.adminName}</Text>
          </View>
          <Text style={styles.responseText}>{item.adminResponse.message}</Text>
          <Text style={styles.responseTime}>{formatTimeAgo(item.adminResponse.timestamp?.toDate ? item.adminResponse.timestamp.toDate() : item.adminResponse.timestamp)}</Text>
        </View>
      )}
      
      {/* No Response State */}
      {item.status === 'pending' && (
        <View style={styles.pendingContainer}>
          <Ionicons name="time-outline" size={16} color="#f59e0b" />
          <Text style={styles.pendingText}>Waiting for response...</Text>
        </View>
      )}
    </View>
  );

  const fetchUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data);
        try { setIsAdmin(!!data.isAdmin); } catch {}
        // Recompute data once profile (tutor/student) is known
        fetchData(true);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Redirect admins to the Admin Dashboard after sign-in
  useEffect(() => {
    try {
      if (userProfile?.isAdmin) {
        router.replace('/admin');
      }
    } catch {}
  }, [userProfile?.isAdmin]);

  // Fetch user's questions
  const fetchUserQuestions = async () => {
    if (!auth.currentUser?.uid) {
      console.log('No current user, skipping question fetch');
      return;
    }
    
    console.log('Fetching questions for user:', auth.currentUser.uid);
    setLoading(true);
    
    try {
      // Try simple query first
      const questionsQuery = query(
        collection(db, 'userQuestions'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      console.log('Executing query...');
      const questionsSnapshot = await getDocs(questionsQuery);
      const questions = [];
      
      console.log('Questions snapshot size:', questionsSnapshot.size);
      console.log('Questions snapshot empty:', questionsSnapshot.empty);
      
      if (questionsSnapshot.empty) {
        console.log('No questions found for user');
        setUserQuestions([]);
        return;
      }
      
      questionsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Processing question:', doc.id, data);
        
        // Ensure createdAt is a valid date
        let createdAt = new Date();
        if (data.createdAt) {
          if (data.createdAt.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt;
          } else {
            createdAt = new Date(data.createdAt);
          }
        }
        
        questions.push({
          id: doc.id,
          question: data.question || '',
          category: data.category || 'General',
          status: data.status || 'pending',
          isUrgent: data.isUrgent || false,
          userId: data.userId,
          createdAt: createdAt,
          aiResponse: data.aiResponse || null,
          adminResponse: data.adminResponse || null
        });
      });
      
      // Sort questions by creation date (newest first)
      questions.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log('Final questions array:', questions);
      console.log('Setting userQuestions with', questions.length, 'items');
      setUserQuestions(questions);
      
    } catch (error) {
      console.error('Error fetching user questions:', error);
      console.error('Error details:', error.message, error.code);
      setUserQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      // Ensure we know if current user is a tutor to avoid race with setUserProfile
      let localIsTutor = userProfile?.isTutor || false;
      try {
        if (auth.currentUser?.uid) {
          const me = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (me.exists()) {
            const data = me.data();
            localIsTutor = !!data.isTutor;
            // keep state in sync in case it changed
            if (!userProfile || userProfile.isTutor !== data.isTutor) {
              setUserProfile((prev) => ({ ...(prev || {}), ...data }));
            }
          }
        }
      } catch {}
      
      // Load user questions if user is available
      if (auth.currentUser?.uid) {
        await fetchUserQuestions();
      }
      
      // ... existing code ...
      // Helper: get accurate comment count from subcollection (avoids stale parent field)
      const getCommentCount = async (collectionName, parentId) => {
        try {
          const snap = await getDocs(collection(db, collectionName, parentId, 'comments'));
          return snap.size || 0;
        } catch {
          return 0;
        }
      };

      // Fetch posts (resources with descriptions)
      const resourcesQuery = query(
        collection(db, "resources"),
        orderBy("uploadedAt", "desc"),
        limit(20)
      );
      const resourcesSnapshot = await getDocs(resourcesQuery);
      
      const postsData = [];
      for (const docSnapshot of resourcesSnapshot.docs) {
        const resourceData = docSnapshot.data();
        const userDoc = await getDoc(doc(db, "users", resourceData.uploadedBy));
        const userData = userDoc.exists() ? userDoc.data() : {};
        // live comments count
        const liveComments = await getCommentCount('resources', docSnapshot.id);
        // liked state for current user
        let userLiked = false;
        let userCommented = false;
        let userReported = false;
        if (auth.currentUser?.uid) {
          const likeDoc = await getDoc(doc(db, "resources", docSnapshot.id, "likes", auth.currentUser.uid));
          userLiked = likeDoc.exists();
          const myCommentQuery = query(
            collection(db, "resources", docSnapshot.id, "comments"),
            where("userId", "==", auth.currentUser.uid),
            limit(1)
          );
          const myCommentSnap = await getDocs(myCommentQuery);
          userCommented = !myCommentSnap.empty;
          const reportDoc = await getDoc(doc(db, "resources", docSnapshot.id, "reports", auth.currentUser.uid));
          userReported = reportDoc.exists();
          var reportReason = reportDoc.exists() ? (reportDoc.data()?.reason || "") : "";
        }
        
        postsData.push({
          id: docSnapshot.id,
          user: resourceData.uploadedByName || userData.fullName || "Unknown User",
          subject: resourceData.subject,
          content: resourceData.description,
          likes: resourceData.likes || 0,
          comments: liveComments,
          time: formatTime(resourceData.uploadedAt),
          isTutor: userData.isTutor || false,
          resourceId: docSnapshot.id,
          downloadURL: resourceData.downloadURL,
          fileName: resourceData.fileName,
          storagePath: resourceData.storagePath,
          isOwner: resourceData.uploadedBy === auth.currentUser?.uid,
          userLiked,
          userCommented,
          userReported,
          userReportReason: reportReason || "",
        });
      }
      setPosts(postsData);

      // Fetch tutors (student view)
      const tutorsQuery = query(
        collection(db, "users"),
        where("isTutor", "==", true)
      );
      const tutorsSnapshot = await getDocs(tutorsQuery);
      // fetch connections for current user (student)
      let connectedTutorIds = new Set();
      let pendingTutorIds = new Set();
      if (auth.currentUser?.uid) {
        const conSnap = await getDocs(query(collection(db, "connections"), where("studentId", "==", auth.currentUser.uid)));
        conSnap.forEach(c => {
          const d = c.data();
          if ((d?.status || 'pending') === 'accepted') connectedTutorIds.add(d?.tutorId);
          if ((d?.status || 'pending') === 'pending') pendingTutorIds.add(d?.tutorId);
        });
      }

      const tutorsData = tutorsSnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          name: data.fullName,
          subject: data.subjects?.join(", ") || "General",
          rating: data.rating || 0,
          students: data.studentsCount || 0,
          expertiseLevel: data.expertiseLevel,
          connected: connectedTutorIds.has(docSnapshot.id),
          pending: pendingTutorIds.has(docSnapshot.id),
        };
      });
      setTutors(tutorsData);

      // Tutor view: connected + pending students only (skip messages collectionGroup)
      if (localIsTutor && auth.currentUser?.uid) {
        const conSnap = await getDocs(query(collection(db, "connections"), where("tutorId", "==", auth.currentUser.uid), where('status','==','accepted')));
        const studentsMap = new Map();
        for (const c of conSnap.docs) {
          const sid = c.data()?.studentId;
          if (!sid) continue;
          const sDoc = await getDoc(doc(db, "users", sid));
          if (sDoc.exists()) {
            const d = sDoc.data();
            studentsMap.set(sid, { id: sid, name: d.fullName || d.email || 'Student', status: 'accepted' });
          }
        }
        // pending requests on initial load
        const pendingSnap = await getDocs(query(collection(db, 'connections'), where('tutorId','==', auth.currentUser.uid), where('status','==','pending')));
        for (const c of pendingSnap.docs) {
          const sid = c.data()?.studentId;
          if (!sid) continue;
          const sDoc = await getDoc(doc(db, 'users', sid));
          const d = sDoc.exists() ? sDoc.data() : {};
          studentsMap.set(sid, { id: sid, name: d.fullName || d.email || 'Student', status: 'pending' });
        }
        // chatsIndex still included if present (does not require collection group)
        try {
          const idxSnap = await getDocs(collection(db, 'chatsIndex', auth.currentUser.uid, 'rooms'));
          for (const d of idxSnap.docs) {
            const peerId = d.data()?.peerId;
            const peerName = d.data()?.peerName || peerId;
            if (!peerId) continue;
            if (!studentsMap.has(peerId)) {
              studentsMap.set(peerId, { id: peerId, name: peerName, status: 'accepted' });
            }
          }
        } catch {}
        setStudents(Array.from(studentsMap.values()));
      } else {
        setStudents([]);
      }

      // Fetch resources for resources tab
      setResources(postsData);

      // Fetch videos
      const videosQuery = query(
        collection(db, "videos"),
        orderBy("uploadedAt", "desc"),
        limit(20)
      );
      const videosSnapshot = await getDocs(videosQuery);
      
      const videosData = [];
      for (const docSnapshot of videosSnapshot.docs) {
        const videoData = docSnapshot.data();
        const userDoc = await getDoc(doc(db, "users", videoData.uploadedBy));
        const userData = userDoc.exists() ? userDoc.data() : {};
        // live comments count
        const liveComments = await getCommentCount('videos', docSnapshot.id);
        // liked state for current user
        let userLiked = false;
        let userCommented = false;
        let userReported = false;
        if (auth.currentUser?.uid) {
          const likeDoc = await getDoc(doc(db, "videos", docSnapshot.id, "likes", auth.currentUser.uid));
          userLiked = likeDoc.exists();
          const myCommentQuery = query(
            collection(db, "videos", docSnapshot.id, "comments"),
            where("userId", "==", auth.currentUser.uid),
            limit(1)
          );
          const myCommentSnap = await getDocs(myCommentQuery);
          userCommented = !myCommentSnap.empty;
          const reportDoc = await getDoc(doc(db, "videos", docSnapshot.id, "reports", auth.currentUser.uid));
          userReported = reportDoc.exists();
          var reportReason = reportDoc.exists() ? (reportDoc.data()?.reason || "") : "";
        }
        
        videosData.push({
          id: docSnapshot.id,
          user: videoData.uploadedByName || userData.fullName || "Unknown User",
          subject: videoData.subject,
          content: videoData.description,
          likes: videoData.likes || 0,
          comments: liveComments,
          views: videoData.views || 0,
          time: formatTime(videoData.uploadedAt),
          isTutor: userData.isTutor || false,
          videoId: docSnapshot.id,
          videoUrl: videoData.videoUrl,
          title: videoData.title,
          platform: videoData.platform,
          isOwner: videoData.uploadedBy === auth.currentUser?.uid,
          userLiked,
          userCommented,
          userReported,
          userReportReason: reportReason || "",
        });
      }
      setVideos(videosData);

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Unknown time";
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const handleLike = async (postId, type = "resource", currentlyLiked = false) => {
    try {
      if (!auth.currentUser?.uid) {
        Alert.alert("Login required", "Please sign in to like items.");
        return;
      }
      const collectionName = type === "video" ? "videos" : "resources";
      const likeRef = doc(db, collectionName, postId, "likes", auth.currentUser.uid);
      const parentRef = doc(db, collectionName, postId);

      if (currentlyLiked) {
        await deleteDoc(likeRef);
        await updateDoc(parentRef, { likes: increment(-1) });
      } else {
        await setDoc(likeRef, { userId: auth.currentUser.uid, createdAt: serverTimestamp() });
        await updateDoc(parentRef, { likes: increment(1) });
      }
      fetchData(true);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDownload = async (resourceId, downloadURL, fileName) => {
    try {
      // Update download count
      await updateDoc(doc(db, "resources", resourceId), {
        downloads: increment(1)
      });
      
      // Open the URL in browser
      if (downloadURL) {
        await Linking.openURL(downloadURL);
      } else {
        Alert.alert("Download", `Downloading ${fileName}`);
      }
      
      // Refresh data
      fetchData(true);
    } catch (error) {
      console.error("Error downloading resource:", error);
    }
  };

  const handleVideoView = async (videoId, videoUrl) => {
    try {
      // Update view count
      await updateDoc(doc(db, "videos", videoId), {
        views: increment(1)
      });
      
      // Open the video URL
      if (videoUrl) {
        await Linking.openURL(videoUrl);
      }
      
      // Refresh data
      fetchData(true);
    } catch (error) {
      console.error("Error viewing video:", error);
    }
  };

  const confirmDelete = (type, id, storagePath) => {
    Alert.alert(
      "Delete",
      `Are you sure you want to delete this ${type}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDelete(type, id, storagePath) }
      ]
    );
  };

  const handleDelete = async (type, id, storagePath) => {
    try {
      if (!auth.currentUser?.uid) {
        Alert.alert("Login required", "Please sign in to delete.");
        return;
      }
      const collectionName = type === "video" ? "videos" : "resources";
      const itemRef = doc(db, collectionName, id);
      const snap = await getDoc(itemRef);
      if (!snap.exists()) {
        Alert.alert("Already removed", "This item no longer exists.");
        try { fetchData(true); } catch {}
        return;
      }
      const data = snap.data();
      if (!auth.currentUser || data.uploadedBy !== auth.currentUser.uid) {
        Alert.alert("Not allowed", "Only the owner can delete this item.");
        return;
      }

      // Delete subcollections first (likes, comments, reports)
      const subcollections = ["likes", "comments", "reports"];
      for (const sub of subcollections) {
        try {
          const subSnap = await getDocs(collection(db, collectionName, id, sub));
          const deletions = subSnap.docs.map((d) => deleteDoc(doc(db, collectionName, id, sub, d.id)));
          await Promise.allSettled(deletions);
        } catch {}
      }

      // delete firestore doc
      await deleteDoc(itemRef);

      // optimistic local removal so UI updates without relying on re-fetch/indexes
      if (type === 'resource') {
        setPosts((prev) => prev.filter((p) => p.resourceId !== id));
        setResources((prev) => prev.filter((r) => r.resourceId !== id));
      } else {
        setVideos((prev) => prev.filter((v) => v.videoId !== id));
      }

      // delete storage file for resources if present
      const path = storagePath || data?.storagePath;
      if (path) {
        try { await deleteObject(storageRef(storage, path)); } catch (err) { console.warn('Storage delete failed', err); }
      }
      Alert.alert("Deleted", `${type === 'video' ? 'Video' : 'Resource'} deleted.`);
      // background refresh (non-blocking)
      try { fetchData(true); } catch {}
    } catch (e) {
      console.error("Delete error", e);
      const details = (e && (e.code || e.message)) ? `\n(${e.code || ''} ${e.message || ''})` : '';
      Alert.alert("Error", `Failed to delete item${details}`);
    }
  };

  const connectTutor = async (tutorId, tutorName) => {
    try {
      if (!auth.currentUser?.uid) {
        Alert.alert("Login required", "Please sign in to connect.");
        return;
      }
      const connectionRef = doc(db, "connections", `${auth.currentUser.uid}_${tutorId}`);
      await setDoc(connectionRef, {
        studentId: auth.currentUser.uid,
        tutorId,
        status: 'pending',
        createdAt: serverTimestamp(),
      }, { merge: true });
      Alert.alert('Request sent', 'Your connect request was sent to the tutor.');
      fetchData(true);
    } catch (e) {
      console.error("Connect error", e);
      Alert.alert("Error", "Failed to connect");
    }
  };

  const acceptStudent = async (studentId) => {
    try {
      if (!auth.currentUser?.uid) return;
      const tutorId = auth.currentUser.uid;
      const ref = doc(db, 'connections', `${studentId}_${tutorId}`);
      await setDoc(ref, { studentId, tutorId, status: 'accepted', acceptedAt: serverTimestamp() }, { merge: true });
      // optionally backfill chat index so tutor sees the student under chats
      try {
        const uDoc = await getDoc(doc(db, 'users', studentId));
        const uData = uDoc.exists() ? uDoc.data() : {};
        await setDoc(doc(db, 'chatsIndex', tutorId, 'rooms', String(studentId)), {
          peerId: String(studentId),
          peerName: uData.fullName || uData.email || String(studentId),
          lastMessageAt: serverTimestamp(),
        }, { merge: true });
        // also add for student side so they see the tutor without sending a first message
        const tDoc = await getDoc(doc(db, 'users', tutorId));
        const tData = tDoc.exists() ? tDoc.data() : {};
        await setDoc(doc(db, 'chatsIndex', String(studentId), 'rooms', tutorId), {
          peerId: tutorId,
          peerName: tData.fullName || tData.email || tutorId,
          lastMessageAt: serverTimestamp(),
        }, { merge: true });
      } catch {}
      fetchData(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const declineStudent = async (studentId) => {
    try {
      if (!auth.currentUser?.uid) return;
      const tutorId = auth.currentUser.uid;
      const ref = doc(db, 'connections', `${studentId}_${tutorId}`);
      await deleteDoc(ref);
      fetchData(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to decline request');
    }
  };

  const disconnectTutor = async (tutorId) => {
    try {
      if (!auth.currentUser?.uid) return;
      const connectionRef = doc(db, "connections", `${auth.currentUser.uid}_${tutorId}`);
      await deleteDoc(connectionRef);
      setTutorMenuVisible(false);
      fetchData(true);
    } catch (e) {
      Alert.alert("Error", "Failed to disconnect");
    }
  };

  const submitRating = async () => {
    try {
      if (!selectedTutor || !auth.currentUser?.uid) return;
      const tutorId = selectedTutor.id;
      const ratingRef = doc(db, "users", tutorId, "ratings", auth.currentUser.uid);
      await setDoc(ratingRef, {
        studentId: auth.currentUser.uid,
        value: ratingValue,
        createdAt: serverTimestamp(),
      });
      // recompute simple average
      const ratingsSnap = await getDocs(collection(db, "users", tutorId, "ratings"));
      let sum = 0; let count = 0;
      ratingsSnap.forEach(r => { const v = r.data()?.value || 0; sum += v; count += 1; });
      const avg = count ? (sum / count) : 0;
      await updateDoc(doc(db, "users", tutorId), {
        rating: avg,
        studentsCount: count,
      });
      setRateVisible(false);
      fetchData(true);
    } catch (e) {
      console.error("Rating error", e);
      Alert.alert("Error", "Failed to submit rating");
    }
  };

  const handleReport = async (type, id, currentlyReported = false, existingReason = "") => {
    try {
      const collectionName = type === "video" ? "videos" : "resources";
      const itemRef = doc(db, collectionName, id);
      const myReportRef = doc(db, collectionName, id, "reports", auth.currentUser.uid);
      if (!auth.currentUser?.uid) {
        Alert.alert("Login required", "Please sign in to report.");
        return;
      }
      // Open reason modal for both new and existing reports
      setReportTarget({ type, id });
      setReportExists(!!currentlyReported);
      setReportReason(existingReason || "");
      setReportVisible(true);
    } catch (e) {
      console.error("Report error", e);
      const details = (e && (e.code || e.message)) ? `\n(${e.code || ''} ${e.message || ''})` : '';
      Alert.alert("Error", `Failed to report item${details}`);
    }
  };

  const submitReportReason = async () => {
    try {
      const trg = reportTarget;
      if (!trg?.id || !auth.currentUser?.uid) { setReportVisible(false); return; }
      const collectionName = trg.type === 'video' ? 'videos' : 'resources';
      const myReportRef = doc(db, collectionName, trg.id, 'reports', auth.currentUser.uid);
      const itemRef = doc(db, collectionName, trg.id);
      await setDoc(myReportRef, {
        userId: auth.currentUser.uid,
        reason: (reportReason || '').trim() || 'No reason provided',
        createdAt: serverTimestamp(),
      }, { merge: true });
      if (!reportExists) { try { await updateDoc(itemRef, { reports: increment(1) }); } catch {} }
      setReportVisible(false);
      Alert.alert(reportExists ? 'Updated' : 'Reported', reportExists ? 'Your report has been updated.' : 'Thanks for your report. Our admins will review it.');
      fetchData(true);
    } catch (e) {
      console.error('Submit report error', e);
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  const removeMyReport = async () => {
    try {
      const trg = reportTarget;
      if (!trg?.id || !auth.currentUser?.uid) { setReportVisible(false); return; }
      const collectionName = trg.type === 'video' ? 'videos' : 'resources';
      const myReportRef = doc(db, collectionName, trg.id, 'reports', auth.currentUser.uid);
      const itemRef = doc(db, collectionName, trg.id);
      await deleteDoc(myReportRef);
      try { await updateDoc(itemRef, { reports: increment(-1) }); } catch {}
      setReportVisible(false);
      Alert.alert('Removed', 'Your report has been removed.');
      fetchData(true);
    } catch (e) {
      console.error('Remove report error', e);
      Alert.alert('Error', 'Failed to remove report');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/signin");
  };

  const onRefresh = () => {
    fetchData(true);
  };

  const openComments = async (type, id) => {
    try {
      setSelectedItem({ type, id });
      setCommentsVisible(true);
      setCommentsLoading(true);
      const collectionName = type === "video" ? "videos" : "resources";
      const commentsQuery = query(
        collection(db, collectionName, id, "comments"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(commentsQuery);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(list);
    } catch (e) {
      console.error("Error loading comments", e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    try {
      if (!auth.currentUser?.uid) {
        Alert.alert("Login required", "Please sign in to comment.");
        return;
      }
      if (!newComment.trim()) return;
      const { type, id } = selectedItem || {};
      if (!type || !id) return;
      const collectionName = type === "video" ? "videos" : "resources";
      // fetch display name
      let commenterName = auth.currentUser.email || "User";
      try {
        const uDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (uDoc.exists() && uDoc.data()?.fullName) commenterName = uDoc.data().fullName;
      } catch {}

      await addDoc(collection(db, collectionName, id, "comments"), {
        text: newComment.trim(),
        userId: auth.currentUser.uid,
        userName: commenterName,
        createdAt: serverTimestamp(),
      });
      // increment comment count on parent
      await updateDoc(doc(db, collectionName, id), { comments: increment(1) });
      setNewComment("");
      openComments(type, id);
      // refresh lists so counts update
      fetchData(true);
    } catch (e) {
      console.error("Error adding comment", e);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const { type, id } = selectedItem || {};
      if (!type || !id) return;
      const collectionName = type === "video" ? "videos" : "resources";
      const commentRef = doc(db, collectionName, id, "comments", commentId);
      // Optional: verify ownership client-side (rules should also enforce)
      const commentSnap = await getDoc(commentRef);
      if (!commentSnap.exists()) return;
      const commentData = commentSnap.data();
      if (commentData.userId !== auth.currentUser?.uid) {
        Alert.alert("Not allowed", "You can delete only your own comments.");
        return;
      }
      await deleteDoc(commentRef);
      await updateDoc(doc(db, collectionName, id), { comments: increment(-1) });
      // Reload modal list and feed counts
      await openComments(type, id);
      fetchData(true);
    } catch (e) {
      console.error("Delete comment error", e);
      const details = (e && (e.code || e.message)) ? `\n(${e.code || ''} ${e.message || ''})` : '';
      Alert.alert("Error", `Failed to delete comment${details}`);
    }
  };

  const handleShare = async (type, id, title, downloadURL) => {
    try {
      console.log('🔗 Generating share link for:', type, id);
      
      if (!downloadURL) {
        Alert.alert('Error', 'Download link not available for this item.');
        return;
      }
      
      // Use the direct download URL from Firebase Storage
      const shareLink = downloadURL;
      
      // Check if sharing is available on this platform
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Show native share sheet with apps like WhatsApp, Facebook, etc.
        await Sharing.shareAsync(shareLink, {
          mimeType: type === 'video' ? 'video/*' : 'application/*',
          dialogTitle: `Share ${type}: ${title}`,
        });
        console.log('✅ Native sharing opened successfully');
      } else {
        // Fallback to manual options if native sharing not available
        Alert.alert(
          'Share Link',
          `Share this ${type} with others:

"${title}"

Anyone with this link can download the file directly.`,
          [
            {
              text: 'Copy Link',
              onPress: async () => {
                try {
                  await Clipboard.setStringAsync(shareLink);
                  Alert.alert('✅ Copied!', 'Download link copied to clipboard. You can now share it with others.');
                  console.log('✅ Download link copied to clipboard:', shareLink);
                } catch (error) {
                  console.error('❌ Error copying to clipboard:', error);
                  Alert.alert('Error', 'Failed to copy link to clipboard.');
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab !== "feed") return true; // Only filter on feed tab
    return (
      post.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredTutors = tutors.filter(tutor => {
    if (activeTab !== "tutors") return true; // Only filter on tutors tab
    return (
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredResources = resources.filter(resource => {
    if (activeTab !== "resources" && activeTab !== "feed") return true;
    return (
      resource.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.title && resource.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredVideos = videos.filter(video => {
    if (activeTab !== "videos" && activeTab !== "feed") return true;
    return (
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.user.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.user}</Text>
            <Text style={styles.postMeta}>{item.subject} • {item.time}</Text>
          </View>
        </View>
        {item.isTutor && (
          <View style={styles.tutorBadge}>
            <Ionicons name="school" size={16} color="#4CAF50" />
            <Text style={styles.tutorText}>Tutor</Text>
          </View>
        )}
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      
      {/* Resource Info */}
      <View style={styles.resourceInfo}>
        <Ionicons name="document" size={20} color="#007AFF" />
        <Text style={styles.resourceName}>{item.fileName}</Text>
      </View>
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.resourceId, "resource", item.userLiked)}
        >
          <Ionicons name={item.userLiked ? "heart" : "heart-outline"} size={20} color={item.userLiked ? "#e0245e" : "#666"} />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => openComments("resource", item.resourceId)}>
          <Ionicons name={item.userCommented ? "chatbubble" : "chatbubble-outline"} size={20} color={item.userCommented ? "#007AFF" : "#666"} />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDownload(item.resourceId, item.downloadURL, item.fileName)}
        >
          <Ionicons name="download-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare("resource", item.resourceId, item.fileName, item.downloadURL)}
        >
          <Ionicons name="share-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        {!item.isOwner && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleReport("resource", item.resourceId, item.userReported, item.userReportReason)}
          >
            <Ionicons name={item.userReported ? "flag" : "flag-outline"} size={20} color="#ff3b30" />
          </TouchableOpacity>
        )}
        {item.isOwner && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDelete("resource", item.resourceId, item.storagePath)}
          >
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTutor = ({ item }) => (
    <View style={styles.tutorCard}>
      <View style={styles.tutorInfo}>
        <View style={styles.tutorAvatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.tutorDetails}>
          <Text style={styles.tutorName}>{item.name}</Text>
          <Text style={styles.tutorSubject}>{item.subject}</Text>
          <Text style={styles.tutorLevel}>{item.expertiseLevel}</Text>
          <View style={styles.tutorStats}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.studentsText}>{item.students} students</Text>
          </View>
        </View>
      </View>
      {item.connected ? (
        <TouchableOpacity style={styles.actionMenuButton} onPress={() => { setSelectedTutor({ id: item.id, name: item.name }); setTutorMenuVisible(true); }}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#007AFF" />
          <Text style={styles.contactButtonText}>Connected</Text>
        </TouchableOpacity>
      ) : item.pending ? (
        <View style={styles.actionMenuButton}>
          <Ionicons name="time-outline" size={20} color="#999" />
          <Text style={[styles.contactButtonText, { color: '#999', marginLeft: 6 }]}>Pending</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.contactButton} onPress={() => connectTutor(item.id, item.name)}>
          <Text style={styles.contactButtonText}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderResource = ({ item }) => (
    <View style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <Ionicons name="document" size={24} color="#007AFF" />
        <View style={styles.resourceDetails}>
          <Text style={styles.resourceTitle}>{item.fileName}</Text>
          <Text style={styles.resourceSubject}>{item.subject}</Text>
          <Text style={styles.resourceTime}>{item.time}</Text>
        </View>
      </View>
      <Text style={styles.resourceDescription}>{item.content}</Text>
      <View style={styles.resourceActions}>
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => handleDownload(item.resourceId, item.downloadURL, item.fileName)}
        >
          <Ionicons name="download-outline" size={16} color="#007AFF" />
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => handleLike(item.resourceId, "resource", item.userLiked)}
        >
          <Ionicons name={item.userLiked ? "heart" : "heart-outline"} size={16} color={item.userLiked ? "#e0245e" : "#666"} />
          <Text style={styles.likeText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => openComments("resource", item.resourceId)}
        >
          <Ionicons name={item.userCommented ? "chatbubble" : "chatbubble-outline"} size={16} color={item.userCommented ? "#007AFF" : "#666"} />
          <Text style={styles.likeText}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => handleShare("resource", item.resourceId, item.fileName, item.downloadURL)}
        >
          <Ionicons name="share-outline" size={16} color="#666" />
          <Text style={styles.likeText}>Share</Text>
        </TouchableOpacity>
        {!item.isOwner && (
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleReport("resource", item.resourceId, item.userReported)}
          >
            <Ionicons name={item.userReported ? "flag" : "flag-outline"} size={16} color="#ff3b30" />
          </TouchableOpacity>
        )}
        {item.isOwner && (
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleDelete("resource", item.resourceId, item.storagePath)}
          >
            <Ionicons name="trash-outline" size={16} color="#ff3b30" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderVideo = ({ item }) => (
    <View style={styles.videoCard}>
      <View style={styles.videoHeader}>
        <Ionicons name="play-circle" size={24} color="#FF0000" />
        <View style={styles.videoDetails}>
          <Text style={styles.videoTitle}>{item.title}</Text>
          <Text style={styles.videoSubject}>{item.subject}</Text>
          <Text style={styles.videoTime}>{item.time}</Text>
        </View>
      </View>
      <Text style={styles.videoDescription}>{item.content}</Text>
      <View style={styles.videoInfo}>
        <View style={styles.platformBadge}>
          <Text style={styles.platformText}>{item.platform}</Text>
        </View>
        <Text style={styles.videoUrl}>{item.videoUrl}</Text>
      </View>
      <View style={styles.videoActions}>
        <TouchableOpacity 
          style={styles.watchButton}
          onPress={() => handleVideoView(item.videoId, item.videoUrl)}
        >
          <Ionicons name="play-outline" size={16} color="#FF0000" />
          <Text style={styles.watchText}>Watch</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => handleLike(item.videoId, "video", item.userLiked)}
        >
          <Ionicons name={item.userLiked ? "heart" : "heart-outline"} size={16} color={item.userLiked ? "#e0245e" : "#666"} />
          <Text style={styles.likeText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => openComments("video", item.videoId)}
        >
          <Ionicons name={item.userCommented ? "chatbubble" : "chatbubble-outline"} size={16} color={item.userCommented ? "#007AFF" : "#666"} />
          <Text style={styles.likeText}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => handleShare("video", item.videoId, item.title, item.videoUrl)}
        >
          <Ionicons name="share-outline" size={16} color="#666" />
          <Text style={styles.likeText}>Share</Text>
        </TouchableOpacity>
        {!item.isOwner && (
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleReport("video", item.videoId, item.userReported, item.userReportReason)}
          >
            <Ionicons name={item.userReported ? "flag" : "flag-outline"} size={16} color="#ff3b30" />
          </TouchableOpacity>
        )}
        {item.isOwner && (
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleDelete("video", item.videoId)}
          >
            <Ionicons name="trash-outline" size={16} color="#ff3b30" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.viewButton}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.viewText}>{item.views}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[GalaxyColors.light.gradientStart, GalaxyColors.light.gradientEnd]}
          style={styles.loadingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <GalaxyAnimation style={styles.galaxyAnimation} />
          <View style={styles.loadingContainer}>
            <AnimatedAppIcon size={100} showAnimation={true} />
            <View style={styles.loadingCard}>
              <Text style={styles.loadingTitle}>Loading StudyBuddy</Text>
              <Text style={styles.loadingText}>Preparing your cosmic learning experience...</Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Galaxy Animation Background */}
      <GalaxyAnimation style={styles.galaxyAnimation} />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={[GalaxyColors.light.gradientStart, GalaxyColors.light.gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>StudyBuddy</Text>
            <Text style={styles.headerSubtitle}>Learn • Connect • Grow</Text>
          </View>
          <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/chat-menu')} style={styles.profileButton}>
            <Ionicons name="chatbubbles-outline" size={24} color={GalaxyColors.light.textInverse} />
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity onPress={() => router.push('/admin')} style={styles.profileButton}>
              <Ionicons name="settings-outline" size={24} color={GalaxyColors.light.textInverse} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push('/quizzes')} style={styles.profileButton}>
            <Ionicons name="list-circle-outline" size={24} color={GalaxyColors.light.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/profile")} style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={24} color={GalaxyColors.light.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={GalaxyColors.light.textInverse} />
          </TouchableOpacity>
        </View>
      </View>
      </LinearGradient>

      {/* Search Bar - Only show on specific tabs */}
      {(activeTab === "feed" || activeTab === "tutors" || activeTab === "resources" || activeTab === "videos") && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={GalaxyColors.light.icon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === "feed" ? "Search posts, resources, and videos..." :
              activeTab === "tutors" ? "Search tutors by name or subject..." :
              activeTab === "resources" ? "Search resources by name or subject..." :
              activeTab === "videos" ? "Search videos by title or subject..." :
              "Search..."
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")} 
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color={GalaxyColors.light.icon} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "feed" && styles.activeTab]}
          onPress={() => setActiveTab("feed")}
        >
          <Text style={[styles.tabText, activeTab === "feed" && styles.activeTabText]}>
            Feed
          </Text>
        </TouchableOpacity>
        {!userProfile?.isTutor && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "tutors" && styles.activeTab]}
            onPress={() => setActiveTab("tutors")}
          >
            <Text style={[styles.tabText, activeTab === "tutors" && styles.activeTabText]}>
              Tutors
            </Text>
          </TouchableOpacity>
        )}
        {userProfile?.isTutor && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "students" && styles.activeTab]}
            onPress={() => setActiveTab("students")}
          >
            <Text style={[styles.tabText, activeTab === "students" && styles.activeTabText]}>
              Students
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.tab, activeTab === "resources" && styles.activeTab]}
          onPress={() => setActiveTab("resources")}
        >
          <Text style={[styles.tabText, activeTab === "resources" && styles.activeTabText]}>
            Resources
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "videos" && styles.activeTab]}
          onPress={() => setActiveTab("videos")}
        >
          <Text style={[styles.tabText, activeTab === "videos" && styles.activeTabText]}>
            Videos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "questions" && styles.activeTab]}
          onPress={() => setActiveTab("questions")}
        >
          <Text style={[styles.tabText, activeTab === "questions" && styles.activeTabText]}>
            Questions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
          />
        }
      >
        {activeTab === "feed" && (
          <FlatList
            data={[...filteredPosts, ...filteredVideos]}
            renderItem={({ item }) => {
              if (item.videoUrl) {
                return renderVideo({ item });
              } else {
                return renderPost({ item });
              }
            }}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}

        {activeTab === "tutors" && (
          <FlatList
            data={filteredTutors}
            renderItem={renderTutor}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
        {activeTab === "students" && (
          <FlatList
            data={filteredStudents}
            renderItem={renderStudent}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
        {activeTab === "tutors" && (
          <FlatList
            data={filteredTutors}
            renderItem={renderTutor}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
        {activeTab === "students" && (
          <View>
            {/* Group Chats Section */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ marginBottom: 8, marginLeft: 4, color: '#666', fontSize: 16, fontWeight: '600' }}>Group Chats</Text>
              <TouchableOpacity 
                style={styles.groupChatButton}
                onPress={() => setGroupChatVisible(true)}
              >
                <Ionicons name="chatbubbles-outline" size={24} color="#007AFF" />
                <Text style={styles.groupChatButtonText}>Manage Group Chats</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={{ marginBottom: 8, marginLeft: 4, color: '#666' }}>Connected</Text>
            <FlatList
              data={students.filter(s => (s.status || 'accepted') === 'accepted')}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.tutorCard} onPress={() => router.push({ pathname: '/chat', params: { peerId: item.id, peerName: item.name } })}>
                  <View style={styles.tutorInfo}>
                    <View style={styles.tutorAvatar}>
                      <Text style={styles.avatarText}>{item.name?.charAt(0) || 'S'}</Text>
                    </View>
                    <View style={styles.tutorDetails}>
                      <Text style={styles.tutorName}>{item.name}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
            <Text style={{ marginVertical: 8, marginLeft: 4, color: '#666' }}>Requests</Text>
            <FlatList
              data={students.filter(s => (s.status || 'pending') === 'pending')}
              renderItem={({ item }) => (
                <View style={styles.tutorCard}>
                  <View style={styles.tutorInfo}>
                    <View style={styles.tutorAvatar}>
                      <Text style={styles.avatarText}>{item.name?.charAt(0) || 'S'}</Text>
                    </View>
                    <View style={styles.tutorDetails}>
                      <Text style={styles.tutorName}>{item.name}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={[styles.contactButton, { backgroundColor: '#34C759', marginRight: 8 }]} onPress={() => acceptStudent(item.id)}>
                      <Text style={styles.contactButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.contactButton, { backgroundColor: '#ff3b30' }]} onPress={() => declineStudent(item.id)}>
                      <Text style={styles.contactButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
        {activeTab === "resources" && (
          <View style={styles.resourcesContainer}>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => router.push("/upload-resource")}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
              <Text style={styles.uploadButtonText}>Upload Resource</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.uploadButton, { backgroundColor: '#8b5cf6', marginTop: 8 }]}
              onPress={() => router.push("/smart-matching")}
            >
              <Ionicons name="people-outline" size={24} color="#fff" />
              <Text style={[styles.uploadButtonText, { color: '#fff' }]}>🤖 Smart Matching</Text>
            </TouchableOpacity>
            <FlatList
              data={filteredResources.filter(item => item.isOwner)}
              renderItem={renderResource}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
        {activeTab === "videos" && (
          <View style={styles.videosContainer}>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => router.push("/upload-video")}
            >
              <Ionicons name="videocam-outline" size={24} color="#FF0000" />
              <Text style={styles.uploadButtonText}>Upload Video</Text>
            </TouchableOpacity>
            <FlatList
              data={filteredVideos.filter(item => item.isOwner)}
              renderItem={renderVideo}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
        {activeTab === "questions" && (
          <View style={styles.questionsContainer}>
            <TouchableOpacity 
              style={[styles.uploadButton, { backgroundColor: '#10b981' }]}
              onPress={() => router.push("/ask-question")}
            >
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
              <Text style={[styles.uploadButtonText, { color: '#fff' }]}>❓ Ask New Question</Text>
            </TouchableOpacity>
            
            {loading ? (
              <View style={{padding: 20, alignItems: 'center'}}>
                <Text>Loading questions...</Text>
              </View>
            ) : userQuestions.length > 0 ? (
              <FlatList
                data={userQuestions}
                renderItem={renderQuestion}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ListHeaderComponent={() => (
                  <View style={styles.questionsHeader}>
                    <Text style={styles.questionsTitle}>My Questions ({userQuestions.length})</Text>
                    <Text style={styles.questionsSubtitle}>Track your submitted questions and responses</Text>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyQuestionsContainer}>
                <Ionicons name="help-circle-outline" size={60} color="#d1d5db" />
                <Text style={styles.emptyQuestionsTitle}>No Questions Yet</Text>
                <Text style={styles.emptyQuestionsText}>
                  Ask your first question and get instant AI responses!
                </Text>
                <TouchableOpacity 
                  style={styles.askFirstButton}
                  onPress={() => router.push("/ask-question")}
                >
                  <Text style={styles.askFirstButtonText}>Ask Your First Question</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          if (activeTab === "videos") {
            router.push("/upload-video");
          } else if (activeTab === "questions") {
            router.push("/ask-question");
          } else {
            router.push("/upload-resource");
          }
        }}
      >
        <Ionicons 
          name={activeTab === "videos" ? "videocam" : activeTab === "questions" ? "help-circle" : "add"} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>

      {/* Games Button in Bottom Left */}
      <TouchableOpacity 
        style={styles.gamesButton}
        onPress={() => router.push('/escape-room')}
      >
        <Image 
          source={require('../assets/images/gamesImg.png')} 
          style={styles.gamesButtonImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Comments Modal */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentsVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', padding: 16, maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {commentsLoading ? (
              <Text>Loading...</Text>
            ) : (
              <ScrollView style={{ marginBottom: 12 }}>
                {comments.length === 0 ? (
                  <Text style={{ color: '#666' }}>No comments yet.</Text>
                ) : comments.map((c) => (
                  <View key={c.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 14, color: '#333' }}>{c.text}</Text>
                      <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{c.userName || c.userId}</Text>
                    </View>
                    {auth.currentUser?.uid === c.userId && (
                      <TouchableOpacity onPress={() => deleteComment(c.id)}>
                        <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, marginRight: 8 }}
                placeholder="Write a comment..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={submitComment} style={{ backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Reason Modal */}
      <Modal
        visible={reportVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReportVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Report {reportTarget?.type === 'video' ? 'Video' : 'Resource'}</Text>
              <TouchableOpacity onPress={() => setReportVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={{ color:'#666', marginBottom: 8 }}>Please describe the issue:</Text>
            <TextInput
              style={{ height: 100, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, textAlignVertical: 'top' }}
              placeholder="Reason (e.g., inappropriate content, spam, copyright, etc.)"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              {reportExists && (
                <TouchableOpacity onPress={removeMyReport} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: '#ff3b30', marginRight: 8 }}>
                  <Text style={{ color:'#fff', fontWeight: '600' }}>Remove Report</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setReportVisible(false)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f0f0f0' }}>
                <Text style={{ color:'#333' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitReportReason} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: '#007AFF', marginLeft: 8 }}>
                <Text style={{ color:'#fff', fontWeight: '600' }}>{reportExists ? 'Update' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rate Tutor Modal */}
      <Modal
        visible={rateVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRateVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Rate {selectedTutor?.name}</Text>
              <TouchableOpacity onPress={() => setRateVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
              {[1,2,3,4,5].map(v => (
                <TouchableOpacity key={v} onPress={() => setRatingValue(v)} style={{ marginHorizontal: 6 }}>
                  <Ionicons name={ratingValue >= v ? 'star' : 'star-outline'} size={28} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={submitRating} style={{ backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tutor Options Menu */}
      <Modal
        visible={tutorMenuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTutorMenuVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>{selectedTutor?.name}</Text>
            <TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => { setTutorMenuVisible(false); setRateVisible(true); }}>
              <Text>Rate tutor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => { setTutorMenuVisible(false); router.push({ pathname: '/chat', params: { peerId: selectedTutor?.id, peerName: selectedTutor?.name } }); }}>
              <Text>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => disconnectTutor(selectedTutor?.id)}>
              <Text style={{ color: '#ff3b30' }}>Disconnect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => setTutorMenuVisible(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Group Chat Component */}
      <GroupChat
        visible={groupChatVisible}
        onClose={() => setGroupChatVisible(false)}
        tutorId={auth.currentUser?.uid}
      />

      {/* Student Group Chat Component */}
      <StudentGroupChat
        visible={studentGroupChatVisible}
        onClose={() => setStudentGroupChatVisible(false)}
        studentId={auth.currentUser?.uid}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GalaxyColors.light.backgroundSecondary,
  },
  galaxyAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  loadingGradient: {
    flex: 1,
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GalaxyColors.light.textInverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(29, 78, 216, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(29, 78, 216, 0.2)',
  },
  loadingEmoji: {
    fontSize: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: GalaxyColors.light.primary,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  loadingText: {
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  headerGradient: {
    paddingTop: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: GalaxyColors.light.textInverse,
    letterSpacing: -0.5,
  },
  headerLeft: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GalaxyColors.light.surface,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0,
    ...GlobalStyles.shadow,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
    padding: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: GalaxyColors.light.surface,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 6,
    marginBottom: 20,
    ...GlobalStyles.shadow,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 16,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: GalaxyColors.light.primary,
    ...GlobalStyles.shadow,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: GalaxyColors.light.textSecondary,
  },
  activeTabText: {
    color: GalaxyColors.light.textInverse,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: GalaxyColors.light.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GalaxyColors.light.cardBorder,
    ...GlobalStyles.shadowLarge,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GalaxyColors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    ...GlobalStyles.shadow,
  },
  avatarText: {
    color: GalaxyColors.light.textInverse,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: GalaxyColors.light.text,
    letterSpacing: -0.2,
  },
  postMeta: {
    fontSize: 13,
    color: GalaxyColors.light.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  tutorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tutorText: {
    fontSize: 12,
    color: "#16a34a",
    marginLeft: 6,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
    color: GalaxyColors.light.text,
    letterSpacing: -0.1,
  },
  resourceInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resourceName: {
    marginLeft: 12,
    fontSize: 15,
    color: GalaxyColors.light.primary,
    fontWeight: "600",
    flex: 1,
    letterSpacing: -0.1,
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: GalaxyColors.light.border,
    paddingTop: 16,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 28,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    fontWeight: "600",
  },
  tutorCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  tutorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tutorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorDetails: {
    flex: 1,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.3,
  },
  tutorSubject: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "500",
  },
  tutorLevel: {
    fontSize: 12,
    color: "#1e40af",
    marginBottom: 6,
    textTransform: "capitalize",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  tutorStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
    marginRight: 8,
  },
  studentsText: {
    fontSize: 12,
    color: "#666",
  },
  actionMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e40af",
  },
  contactButton: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  contactButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  resourcesContainer: {
    marginBottom: 20,
  },
  videosContainer: {
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1e40af",
    borderStyle: "dashed",
    marginBottom: 20,
    justifyContent: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#1e40af",
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  resourceCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  resourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  resourceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  resourceTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    color: "#1e293b",
    letterSpacing: -0.2,
  },
  resourceSubject: {
    fontSize: 14,
    color: "#1e40af",
    marginBottom: 4,
    fontWeight: "600",
  },
  resourceTime: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  resourceDescription: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  resourceActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  downloadText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#1e40af",
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  likeText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  videoCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  videoDetails: {
    marginLeft: 12,
    flex: 1,
  },
  videoTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    color: "#1e293b",
    letterSpacing: -0.2,
  },
  videoSubject: {
    fontSize: 14,
    color: "#dc2626",
    marginBottom: 4,
    fontWeight: "600",
  },
  videoTime: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  videoDescription: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  videoInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  platformBadge: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  platformText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  videoUrl: {
    fontSize: 12,
    color: "#64748b",
    flex: 1,
    fontWeight: "500",
  },
  videoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  watchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  watchText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  viewText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GalaxyColors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    ...GlobalStyles.shadowLarge,
  },
  gamesButton: {
    position: "absolute",
    bottom: 24,
    left: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GalaxyColors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    ...GlobalStyles.shadowLarge,
  },
  gamesButtonImage: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  groupChatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#1e40af",
    borderStyle: "solid",
    marginBottom: 20,
    justifyContent: "space-between",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupChatButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#1e40af",
    fontWeight: "700",
    flex: 1,
    letterSpacing: -0.1,
  },
  gamesContainer: {
    padding: 20,
  },
  createGameCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#22c55e",
    borderStyle: "dashed",
  },
  gameCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  gameIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  gameDescription: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  gameFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 2,
  },
  featureText: {
    fontSize: 14,
    color: "#334155",
    marginLeft: 10,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  gameAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366f1",
    letterSpacing: 0.2,
  },
  comingSoonBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  comingSoonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  emptyGamesContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    backgroundColor: "white",
    borderRadius: 20,
    marginTop: 24,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyGamesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#475569",
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  emptyGamesText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  // Questions Tab Styles
  questionsContainer: {
    padding: 20,
  },
  questionsHeader: {
    marginBottom: 20,
  },
  questionsTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  questionsSubtitle: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },
  questionCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  questionMeta: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  questionTime: {
    fontSize: 12,
    color: "#64748b",
    marginRight: 10,
    fontWeight: "500",
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  urgentText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
    marginLeft: 3,
    letterSpacing: 0.3,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 12,
    color: "#8b5cf6",
    marginLeft: 6,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  questionText: {
    fontSize: 16,
    color: "#1e293b",
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  aiResponseContainer: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  adminResponseContainer: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginLeft: 8,
    flex: 1,
    letterSpacing: 0.1,
  },
  confidenceText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  adminName: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  responseText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  responseTime: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  pendingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 10,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pendingText: {
    fontSize: 12,
    color: "#92400e",
    marginLeft: 8,
    fontStyle: "italic",
    fontWeight: "500",
  },
  emptyQuestionsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 72,
    paddingHorizontal: 24,
  },
  emptyQuestionsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#374151",
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  emptyQuestionsText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    letterSpacing: -0.1,
  },
  askFirstButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  askFirstButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  
  // Loading Screen Styles
  loadingGradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: GalaxyColors.light.primary,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  loadingText: {
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
});
