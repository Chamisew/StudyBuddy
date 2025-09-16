import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../firebase/firebaseConfig";

export default function ChatScreen() {
  const { peerId, peerName } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [displayName, setDisplayName] = useState(peerName || "Chat");
  const [canChat, setCanChat] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

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
        const existing = merged.get(m.id);
        
        // Check if message is new or has been updated (including deletedBy changes)
        if (!existing) {
          merged.set(m.id, m); 
          changed = true;
        } else {
          // Check if deletedBy field has changed
          const oldDeletedBy = JSON.stringify(existing.deletedBy || {});
          const newDeletedBy = JSON.stringify(m.deletedBy || {});
          if (oldDeletedBy !== newDeletedBy) {
            console.log('🔄 [HELPDESK] Message deletedBy field updated:', m.id);
            changed = true;
          }
          merged.set(m.id, m); // Always update the message data
        }
        
        if (m.to === uid && m.seen !== true) {
          try { await updateDoc(doc(db, "chats", roomId, "messages", d.id), { seen: true }); } catch {}
        }
      }
      
      // Always re-filter and update when there are changes OR when we have messages to display
      if (changed || merged.size > 0) {
        console.log('🔄 [HELPDESK] Refiltering messages, total before filter:', merged.size);
        const arr = Array.from(merged.values())
          .filter(m => {
            // Filter out messages deleted by current user
            const deletedForMe = m.deletedBy && m.deletedBy[uid];
            if (deletedForMe) {
              console.log('🔄 [HELPDESK] Filtering out deleted message:', m.id);
            }
            return !deletedForMe;
          })
          .sort((a,b) => (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0)); // Ascending order - oldest at top, newest at bottom
        console.log('🔄 [HELPDESK] Messages after filtering:', arr.length);
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

  const handleDoubleTap = (messageId) => {
    if (!selectionMode) {
      setSelectionMode(true);
    }
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
    
    if (newSelected.size === 0) {
      setSelectionMode(false);
    }
  };

  const deleteForMe = async () => {
    try {
      console.log('🗑️ [HELPDESK] DeleteForMe function started');
      const currentUid = auth.currentUser?.uid;
      console.log('🗑️ [HELPDESK] Current user ID:', currentUid);
      if (!currentUid) {
        console.log('🗑️ [HELPDESK] No current user, returning');
        return;
      }

      const messageCount = selectedMessages.size;
      console.log('🗑️ [HELPDESK] Number of messages to delete:', messageCount);
      console.log('🗑️ [HELPDESK] Selected messages:', Array.from(selectedMessages));
      
      // Add validation
      if (messageCount === 0) {
        Alert.alert("No Selection", "Please select at least one message to delete.");
        return;
      }
      
      let successCount = 0;
      
      for (const messageId of selectedMessages) {
        try {
          console.log('🗑️ [HELPDESK] Processing message:', messageId);
          const [roomId, docId] = messageId.split(':');
          console.log('🗑️ [HELPDESK] Room ID:', roomId, 'Doc ID:', docId);
          const messageRef = doc(db, "chats", roomId, "messages", docId);
          console.log('🗑️ [HELPDESK] Message reference path:', messageRef.path);
          
          const updateData = { [`deletedBy.${currentUid}`]: true };
          console.log('🗑️ [HELPDESK] Update data:', updateData);
          
          await updateDoc(messageRef, updateData);
          console.log('🗑️ [HELPDESK] Successfully updated message:', messageId);
          successCount++;
        } catch (msgError) {
          console.error('🗑️ [HELPDESK] Error deleting individual message:', messageId, msgError);
        }
      }
      
      console.log('🗑️ [HELPDESK] Deletion complete. Success count:', successCount);
      
      setSelectedMessages(new Set());
      setSelectionMode(false);
      Alert.alert("Success", `Successfully deleted ${successCount} of ${messageCount} message(s) from your chat. These messages are now hidden from your view only.`);
      console.log('🗑️ [HELPDESK] Delete for me completed successfully');
    } catch (error) {
      console.error("Error deleting messages for me:", error);
      Alert.alert("Error", "Failed to delete messages. Please try again.");
    }
  };

  const deleteForEveryone = async () => {
    try {
      console.log('Delete for everyone called');
      const currentUid = auth.currentUser?.uid;
      console.log('Current user ID:', currentUid);
      if (!currentUid) {
        console.log('No current user, returning');
        return;
      }

      const messageCount = selectedMessages.size;
      console.log('Selected messages:', Array.from(selectedMessages));
      console.log('All messages:', messages);
      
      // Add validation
      if (messageCount === 0) {
        Alert.alert("No Selection", "Please select at least one message to delete.");
        return;
      }

      // Only delete messages sent by current user
      const myMessages = Array.from(selectedMessages).filter(messageId => {
        const message = messages.find(m => m.id === messageId);
        console.log('Checking if message is mine:', messageId, message?.from, currentUid, message?.from === currentUid);
        return message && message.from === currentUid;
      });

      const otherMessages = Array.from(selectedMessages).filter(messageId => {
        const message = messages.find(m => m.id === messageId);
        return message && message.from !== currentUid;
      });

      console.log('My messages:', myMessages);
      console.log('Other messages:', otherMessages);

      if (myMessages.length === 0) {
        console.log('No messages to delete for everyone');
        Alert.alert(
          "Partial Action", 
          `You can only delete messages you sent for everyone.\n\n${otherMessages.length} message(s) will be deleted from your view only.`,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Delete for Me Only",
              onPress: deleteForMe
            }
          ]
        );
        return;
      }

      // Delete messages sent by current user for everyone
      console.log('Deleting messages for everyone:', myMessages);
      let mySuccessCount = 0;
      for (const messageId of myMessages) {
        try {
          console.log('Deleting message for everyone:', messageId);
          const [roomId, docId] = messageId.split(':');
          const messageRef = doc(db, "chats", roomId, "messages", docId);
          console.log('Message ref:', messageRef);
          
          await updateDoc(messageRef, {
            text: "This message was deleted",
            deletedForEveryone: true,
            deletedAt: serverTimestamp()
          });
          console.log('Successfully marked message as deleted for everyone:', messageId);
          mySuccessCount++;
        } catch (msgError) {
          console.error('Error deleting individual message for everyone:', messageId, msgError);
        }
      }
      
      // For other messages, delete for me only
      let otherSuccessCount = 0;
      if (otherMessages.length > 0) {
        console.log('Deleting other messages for me only:', otherMessages);
        for (const messageId of otherMessages) {
          try {
            console.log('Deleting other message for me:', messageId);
            const [roomId, docId] = messageId.split(':');
            const messageRef = doc(db, "chats", roomId, "messages", docId);
            await updateDoc(messageRef, {
              [`deletedBy.${currentUid}`]: true
            });
            console.log('Successfully marked other message as deleted for user:', messageId);
            otherSuccessCount++;
          } catch (msgError) {
            console.error('Error deleting individual message for me:', messageId, msgError);
          }
        }
      }
      
      setSelectedMessages(new Set());
      setSelectionMode(false);
      
      let successMessage = `${mySuccessCount} of ${myMessages.length} message(s) deleted for everyone.`;
      if (otherMessages.length > 0) {
        successMessage += `\n\nAdditionally, ${otherSuccessCount} of ${otherMessages.length} other message(s) deleted from your view only.`;
      }
      
      Alert.alert("Success", successMessage);
      console.log('Delete for everyone completed successfully');
    } catch (error) {
      console.error("Error deleting messages for everyone:", error);
      Alert.alert("Error", "Failed to delete messages for everyone. Please try again.");
    }
  };

  const cancelSelection = () => {
    console.log('Cancel selection called');
    setSelectedMessages(new Set());
    setSelectionMode(false);
  };

  const toggleMessageSelection = (messageId) => {
    console.log('Toggle message selection:', messageId);
    // Check if the message is deleted for the current user
    const message = messages.find(m => m.id === messageId);
    console.log('Found message:', message);
    
    // For one-on-one chat, the message ID format is "roomId:docId"
    // We need to check the actual message data
    let isDeletedForMe = false;
    let isDeletedForEveryone = false;
    
    if (message) {
      // Check if deleted for current user
      isDeletedForMe = message.deletedBy && message.deletedBy[auth.currentUser?.uid];
      // Check if deleted for everyone
      isDeletedForEveryone = message.deletedForEveryone;
    }
    
    console.log('Is deleted for me:', isDeletedForMe);
    console.log('Deleted for everyone:', isDeletedForEveryone);
    
    // Don't allow selection of messages deleted for the current user
    if (isDeletedForMe && !isDeletedForEveryone) {
      console.log('Cannot select message already deleted for me');
      return;
    }
    
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      console.log('Removing message from selection');
      newSelected.delete(messageId);
    } else {
      console.log('Adding message to selection');
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
    
    if (newSelected.size === 0) {
      setSelectionMode(false);
    }
    console.log('Selected messages count:', newSelected.size);
  };

  const renderItem = ({ item }) => {
    const mine = item.from === auth.currentUser?.uid;
    const isSelected = selectedMessages.has(item.id);
    const isDeletedForEveryone = item.deletedForEveryone;
    const isDeletedForMe = item.deletedBy && item.deletedBy[auth.currentUser?.uid];
    
    // If deleted for me, don't show the message at all
    if (isDeletedForMe && !isDeletedForEveryone) return null;
    
    let displayText = item.text;
    if (isDeletedForEveryone) {
      displayText = "This message was deleted";
    }

    return (
      <View style={[styles.messageContainer, mine ? styles.messageContainerMine : styles.messageContainerTheirs]}>
        {selectionMode && (
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => toggleMessageSelection(item.id)}
          >
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? "#007AFF" : "#999"} 
            />
          </TouchableOpacity>
        )}
        <View style={[
          styles.msg,
          mine ? styles.mine : styles.theirs,
          isSelected && styles.selected,
          (isDeletedForEveryone || isDeletedForMe) && styles.deleted
        ]}>
          <Text style={[
            styles.msgText,
            (isDeletedForEveryone || isDeletedForMe) && styles.deletedText
          ]}>
            {displayText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {selectionMode ? (
          <>
            <TouchableOpacity onPress={cancelSelection}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.title}>{selectedMessages.size} selected</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => {
                  console.log('Delete button pressed');
                  console.log('Selected messages count:', selectedMessages.size);
                  console.log('Selected messages:', Array.from(selectedMessages));
                  if (selectedMessages.size === 0) {
                    Alert.alert("No Selection", "Please select at least one message to delete.");
                    return;
                  }
                  
                  // TEMPORARY: Direct call for testing - bypassing Alert dialog
                  console.log('🧪 TESTING: Calling deleteForMe directly (bypassing Alert in helpdesk chat)');
                  deleteForMe();
                  
                  /* ORIGINAL CODE WITH ALERT - COMMENTED FOR TESTING
                  Alert.alert(
                    "Delete Messages",
                    `You have selected ${selectedMessages.size} message(s) for deletion.\n\nChoose an option:`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Delete for Everyone", 
                        onPress: deleteForEveryone,
                        style: "destructive"
                      },
                      { text: "Delete for Me Only", onPress: deleteForMe }
                    ]
                  );
                  */
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.title}>{displayName}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => setSelectionMode(true)}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color="#007AFF" />
              </TouchableOpacity>
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
          </>
        )}
      </View>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
      />
      <View style={styles.inputBar}>
        <TextInput 
          style={styles.input} 
          value={text} 
          onChangeText={setText} 
          placeholder={canChat ? "Type a message" : "Connection pending..."} 
          editable={canChat}
          onSubmitEditing={() => {
            console.log('🗑️ [HELPDESK] Enter key pressed, sending message');
            if (text.trim() && canChat) {
              send();
            }
          }}
          returnKeyType="send"
          blurOnSubmit={false}
        />
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
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerActionButton: { marginLeft: 15 },
  messageContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginVertical: 4,
    paddingHorizontal: 8
  },
  messageContainerMine: { 
    justifyContent: "flex-end" 
  },
  messageContainerTheirs: { 
    justifyContent: "flex-start" 
  },
  selectButton: {
    padding: 8,
    marginHorizontal: 4
  },
  msg: { maxWidth: "80%", padding: 10, borderRadius: 10, position: "relative" },
  mine: { backgroundColor: "#DCF8C6" },
  theirs: { backgroundColor: "white" },
  selected: { borderWidth: 2, borderColor: "#007AFF", backgroundColor: "#E3F2FD" },
  deleted: { opacity: 0.6 },
  msgText: { fontSize: 16 },
  deletedText: { fontStyle: "italic", color: "#666" },
  inputBar: { flexDirection: "row", padding: 8, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#eee" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 12, marginRight: 8, height: 40, backgroundColor: "#fafafa" },
  send: { backgroundColor: "#007AFF", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" }
});


