import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../firebase/firebaseConfig";

export default function ChatScreen() {
  const { peerId, peerName } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [displayName, setDisplayName] = useState(peerName || "Chat");
  const [canChat, setCanChat] = useState(true);

  useEffect(() => {
    if (!auth.currentUser?.uid || !peerId) return;
    const uid = auth.currentUser.uid;
    const normRoom = [uid, String(peerId)].sort().join("_");
    const legacyA = `${uid}_${peerId}`;
    const legacyB = `${peerId}_${uid}`;

    const merged = new Map();

    const handleSnap = async (snap, roomId) => {
      let changed = false;
      for (const d of snap.docs) {
        const m = { id: `${roomId}:${d.id}`, ...d.data() };
        if (!merged.has(m.id)) { merged.set(m.id, m); changed = true; }
        if (m.to === uid && m.seen !== true) {
          try { await updateDoc(doc(db, "chats", roomId, "messages", d.id), { seen: true }); } catch {}
        }
      }
      if (changed) {
        const arr = Array.from(merged.values()).sort((a,b) => (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0));
        setMessages(arr);
      }
    };

    const unsubNorm = onSnapshot(query(collection(db, "chats", normRoom, "messages"), orderBy("createdAt", "asc")), (snap) => handleSnap(snap, normRoom));
    const unsubLegacyA = onSnapshot(query(collection(db, "chats", legacyA, "messages"), orderBy("createdAt", "asc")), (snap) => handleSnap(snap, legacyA));
    const unsubLegacyB = onSnapshot(query(collection(db, "chats", legacyB, "messages"), orderBy("createdAt", "asc")), (snap) => handleSnap(snap, legacyB));

    return () => { try { unsubNorm(); } catch {}; try { unsubLegacyA(); } catch {}; try { unsubLegacyB(); } catch {} };
  }, [peerId]);

  // Gate sending based on accepted connection (either direction) or helpdesk chat
  useEffect(() => {
    (async () => {
      try {
        if (!auth.currentUser?.uid || !peerId) { setCanChat(false); return; }
        const myId = auth.currentUser.uid;
        
        // Check if this is a helpdesk chat
        const myIndexDoc = await getDoc(doc(db, 'chatsIndex', myId, 'rooms', String(peerId)));
        const peerIndexDoc = await getDoc(doc(db, 'chatsIndex', String(peerId), 'rooms', myId));
        
        const isHelpdeskChat = 
          (myIndexDoc.exists() && myIndexDoc.data()?.type === 'helpdesk') ||
          (peerIndexDoc.exists() && peerIndexDoc.data()?.type === 'helpdesk');
        
        if (isHelpdeskChat) {
          setCanChat(true);
          return;
        }
        
        // Check regular connections for non-helpdesk chats
        const conA = await getDoc(doc(db, 'connections', `${myId}_${peerId}`));
        const conB = await getDoc(doc(db, 'connections', `${peerId}_${myId}`));
        const statusA = conA.exists() ? (conA.data()?.status || 'pending') : null;
        const statusB = conB.exists() ? (conB.data()?.status || 'pending') : null;
        const ok = (statusA === 'accepted') || (statusB === 'accepted');
        setCanChat(!!ok);
      } catch {
        setCanChat(true); // fail open to avoid hard lock if rules already protect
      }
    })();
  }, [peerId]);

  // Resolve peer name if not provided
  useEffect(() => {
    (async () => {
      if (peerName) { setDisplayName(String(peerName)); return; }
      try {
        const uRef = doc(db, "users", String(peerId));
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          const d = uSnap.data();
          setDisplayName(d.fullName || d.name || d.displayName || "Chat");
        }
      } catch {}
    })();
  }, [peerId, peerName]);

  const send = async () => {
    if (!canChat) return;
    if (!text.trim()) return;
    const roomId = [auth.currentUser.uid, String(peerId)].sort().join("_");
    await addDoc(collection(db, "chats", roomId, "messages"), {
      text: text.trim(),
      from: auth.currentUser.uid,
      to: peerId,
      seen: false,
      createdAt: serverTimestamp(),
    });
    // Update lightweight chat index for both participants (for listing)
    try {
      const myId = auth.currentUser.uid;
      const myIndexRef = doc(db, "chatsIndex", myId, "rooms", String(peerId));
      await setDoc(myIndexRef, {
        peerId: String(peerId),
        peerName: displayName,
        lastMessageAt: serverTimestamp(),
      }, { merge: true });
      const peerIndexRef = doc(db, "chatsIndex", String(peerId), "rooms", myId);
      const meDoc = await getDoc(doc(db, "users", myId));
      const meData = meDoc.exists() ? meDoc.data() : {};
      await setDoc(peerIndexRef, {
        peerId: myId,
        peerName: meData.fullName || meData.name || meData.displayName || myId,
        lastMessageAt: serverTimestamp(),
      }, { merge: true });
    } catch {}
    setText("");
  };

  const renderItem = ({ item }) => {
    const mine = item.from === auth.currentUser?.uid;
    return (
      <View style={[styles.msg, mine ? styles.mine : styles.theirs]}>
        <Text style={styles.msgText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{displayName}</Text>
        <TouchableOpacity onPress={async () => {
          try {
            const myId = auth.currentUser?.uid;
            if (!myId || !peerId) return;
            
            Alert.alert(
              'Clear Chat', 
              'Delete all messages from this chat? (This will only delete messages from your side)',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Clear', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Delete all messages from all possible room IDs
                      const roomIds = [
                        [myId, String(peerId)].sort().join('_'),
                        `${myId}_${peerId}`,
                        `${peerId}_${myId}`
                      ];
                      
                      for (const roomId of roomIds) {
                        try {
                          const q = query(collection(db, 'chats', roomId, 'messages'), orderBy('createdAt', 'asc'));
                          const snap = await getDocs(q);
                          for (const d of snap.docs) {
                            try { 
                              await deleteDoc(doc(db, 'chats', roomId, 'messages', d.id)); 
                            } catch {}
                          }
                        } catch {}
                      }
                      
                      Alert.alert('Cleared', 'Chat messages have been cleared from your side.');
                    } catch (e) {
                      console.error('Error clearing chat:', e);
                      Alert.alert('Error', 'Failed to clear chat messages.');
                    }
                  }
                }
              ]
            );
          } catch (e) {
            console.error('Error showing clear dialog:', e);
          }
        }}>
          <Ionicons name="trash-outline" size={22} color="#ff3b30" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
      />
      <View style={styles.inputBar}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder={canChat ? "Type a message" : "Connection pending..."} editable={canChat} />
        <TouchableOpacity style={[styles.send, { opacity: canChat ? 1 : 0.5 }]} onPress={send} disabled={!canChat}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 18, fontWeight: "600" },
  msg: { maxWidth: "80%", padding: 10, borderRadius: 10, marginVertical: 4 },
  mine: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  theirs: { backgroundColor: "white", alignSelf: "flex-start" },
  msgText: { fontSize: 16 },
  inputBar: { flexDirection: "row", padding: 8, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#eee" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 12, marginRight: 8, height: 40, backgroundColor: "#fafafa" },
  send: { backgroundColor: "#007AFF", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" }
});


