import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GalaxyAnimation } from "../components/GalaxyAnimation";
import { GalaxyColors } from "../constants/GalaxyColors";
import { auth, db } from "../firebase/firebaseConfig";
import { smartNavigateBack } from "../utils/navigation";

export default function GlobalChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    fetchUserProfile();
    fetchMessages();
  }, []);

  const fetchUserProfile = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchMessages = () => {
    try {
      const messagesQuery = query(
        collection(db, "globalChat"),
        orderBy("timestamp", "asc"),
        limit(100)
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const currentUid = auth.currentUser?.uid;
        console.log('📨 Messages snapshot received, total docs:', snapshot.docs.length);
        console.log('📨 Snapshot received at:', new Date().toLocaleTimeString());
        
        const allMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Log messages that have deletedBy field
          if (data.deletedBy && data.deletedBy[currentUid]) {
            console.log('📨 Found message deleted by current user:', doc.id, data.deletedBy);
          }
          return {
            id: doc.id,
            ...data,
          };
        });
        
        console.log('📨 All messages before filtering:', allMessages.length);
        
        const messagesList = allMessages.filter(message => {
          // Filter out messages deleted by current user
          const deletedForMe = message.deletedBy && message.deletedBy[currentUid];
          if (deletedForMe) {
            console.log('📨 Filtering out deleted message:', message.id);
          }
          return !deletedForMe;
        });
        
        console.log('📨 Messages after filtering:', messagesList.length);
        
        // Log message order for debugging
        if (messagesList.length > 0) {
          console.log('📨 [GLOBAL CHAT] Message order check:');
          console.log('📨 First message (oldest):', messagesList[0]?.timestamp?.toDate?.()?.toLocaleString());
          console.log('📨 Last message (newest):', messagesList[messagesList.length - 1]?.timestamp?.toDate?.()?.toLocaleString());
        }
        
        setMessages(messagesList);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !auth.currentUser) return;

    try {
      const displayName = userProfile?.fullName || userProfile?.name || auth.currentUser?.displayName || "User";
      const messageData = {
        text: input.trim(),
        userId: auth.currentUser.uid,
        userName: displayName,
        userType: userProfile?.isTutor ? "Tutor" : "Student",
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "globalChat"), messageData);
      setInput("");
      
      // Scroll to bottom after sending
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  const toggleMessageSelection = (messageId) => {
    console.log('Toggle message selection:', messageId);
    
    // Validate input
    if (!messageId) {
      console.log('Invalid message ID');
      return;
    }
    
    // Check if the message exists
    const message = messages.find(m => m.id === messageId);
    console.log('Found message:', message);
    
    if (!message) {
      console.log('Message not found');
      return;
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

  // Debug function to check message states
  const debugMessages = () => {
    const currentUid = auth.currentUser?.uid;
    console.log('🔍 DEBUG: Current messages state:');
    console.log('🔍 Total messages:', messages.length);
    console.log('🔍 Current user:', currentUid);
    messages.forEach((msg, index) => {
      const deletedForMe = msg.deletedBy && msg.deletedBy[currentUid];
      console.log(`🔍 Message ${index + 1}: ID=${msg.id}, deletedForMe=${deletedForMe}, deletedBy=`, msg.deletedBy);
    });
  };

  const deleteForMe = async () => {
    try {
      console.log('🗑️ DeleteForMe function started');
      const currentUid = auth.currentUser?.uid;
      console.log('🗑️ Current user ID:', currentUid);
      
      // Debug messages before deletion
      console.log('🗑️ Messages state before deletion:');
      debugMessages();
      
      if (!currentUid) {
        console.log('🗑️ No user ID, aborting');
        Alert.alert("Error", "User not authenticated. Please log in again.");
        return;
      }

      if (selectedMessages.size === 0) {
        console.log('🗑️ No messages selected, aborting');
        Alert.alert("No Selection", "Please select at least one message to delete.");
        return;
      }
      
      console.log('🗑️ Starting deletion process for', selectedMessages.size, 'messages');
      console.log('🗑️ Selected message IDs:', Array.from(selectedMessages));
      
      // Process deletions one by one for better error handling
      let successCount = 0;
      for (const messageId of selectedMessages) {
        try {
          console.log('🗑️ Processing message:', messageId);
          const messageRef = doc(db, "globalChat", messageId);
          console.log('🗑️ Message reference created:', messageRef.path);
          
          const updateData = { [`deletedBy.${currentUid}`]: true };
          console.log('🗑️ Update data:', updateData);
          
          await updateDoc(messageRef, updateData);
          console.log('🗑️ Successfully updated message:', messageId);
          successCount++;
        } catch (msgError) {
          console.error('🗑️ Error deleting message:', messageId, msgError);
        }
      }
      
      console.log('🗑️ Deletion complete. Success count:', successCount);
      
      // Debug messages after deletion (with a small delay to allow Firestore to update)
      setTimeout(() => {
        console.log('🗑️ Messages state after deletion:');
        debugMessages();
      }, 1000);
      
      // Clear selection and exit selection mode
      setSelectedMessages(new Set());
      setSelectionMode(false);
      
      Alert.alert("Success", `${successCount} message(s) deleted from your chat. They are now hidden from your view only.`);
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
        console.log('Checking if message is mine:', messageId, message?.userId, currentUid, message?.userId === currentUid);
        return message && message.userId === currentUid;
      });

      const otherMessages = Array.from(selectedMessages).filter(messageId => {
        const message = messages.find(m => m.id === messageId);
        return message && message.userId !== currentUid;
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
          const messageRef = doc(db, "globalChat", messageId);
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
            const messageRef = doc(db, "globalChat", messageId);
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

  const renderMessage = ({ item }) => {
    const isMyMessage = item.userId === auth.currentUser?.uid;
    const isSelected = selectedMessages.has(item.id);
    const isDeletedForEveryone = item.deletedForEveryone;
    
    const displayText = isDeletedForEveryone ? "This message was deleted" : item.text;
    
    return (
      <View style={[
        styles.messageContainer2,
        isMyMessage ? styles.messageContainerMine : styles.messageContainerTheirs
      ]}>
        {selectionMode && (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => toggleMessageSelection(item.id)}
          >
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={isSelected ? "#007AFF" : "#666"}
            />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.messageContainer, 
            isMyMessage ? styles.myMessage : styles.otherMessage,
            isSelected && styles.selected,
            isDeletedForEveryone && styles.deleted
          ]}
          onPress={() => {
            // Enter selection mode when clicking on a message if not already in selection mode
            if (!selectionMode) {
              setSelectionMode(true);
              toggleMessageSelection(item.id);
            } else {
              toggleMessageSelection(item.id);
            }
          }}
          onLongPress={() => {
            // Also enter selection mode on long press for better UX
            if (!selectionMode) {
              setSelectionMode(true);
            }
            toggleMessageSelection(item.id);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.messageHeader}>
            <Text style={[styles.userName, isMyMessage && styles.myMessageText]}>{item.userName}</Text>
            <Text style={[styles.userType, isMyMessage && styles.myMessageUserType]}>{item.userType}</Text>
          </View>
          <Text style={[
            styles.messageText, 
            isMyMessage && styles.myMessageText,
            isDeletedForEveryone && styles.deletedText
          ]}>
            {displayText}
          </Text>
          <Text style={[styles.timestamp, isMyMessage && styles.myMessageText]}>
            {item.timestamp?.toDate?.()?.toLocaleTimeString() || "Now"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GalaxyAnimation style={styles.galaxyBackground} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
        {selectionMode ? (
          <>
            <TouchableOpacity onPress={cancelSelection}>
              <Ionicons name="close" size={24} color={GalaxyColors.light.icon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedMessages.size} selected</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.headerActionButton, selectedMessages.size === 0 && styles.disabledButton]}
                onPress={() => {
                  console.log('Delete for me button pressed');
                  console.log('Selected messages count:', selectedMessages.size);
                  console.log('Selected messages:', Array.from(selectedMessages));
                  if (selectedMessages.size === 0) {
                    Alert.alert("No Selection", "Please select at least one message to delete.");
                    return;
                  }
                  
                  // TEMPORARY: Direct call for testing - bypassing Alert dialog
                  console.log('🧪 TESTING: Calling deleteForMe directly (bypassing Alert)');
                  deleteForMe();
                  
                  /* ORIGINAL CODE WITH ALERT - COMMENTED FOR TESTING
                  Alert.alert(
                    "Delete Messages",
                    `Delete ${selectedMessages.size} message(s) from your view only?\n\nThese messages will only be hidden from your chat and will still be visible to other users.`,
                    [
                      { 
                        text: "Cancel", 
                        style: "cancel",
                        onPress: () => console.log('🚫 User cancelled deletion')
                      },
                      { 
                        text: "Delete for Me", 
                        onPress: () => {
                          console.log('✅ User confirmed deletion, calling deleteForMe()');
                          deleteForMe();
                        },
                        style: "destructive"
                      }
                    ]
                  );
                  */
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => smartNavigateBack(router, '/global-chat')}
            >
              <Ionicons name="arrow-back" size={24} color={GalaxyColors.light.icon} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>🌐 Global Chat</Text>
              <Text style={styles.headerSubtitle}>Connect with everyone in the community</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectionMode(true)}
              style={styles.headerActionButton}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            maxLength={500}
            onSubmitEditing={() => {
              console.log('Enter key pressed, sending message');
              if (input.trim()) {
                sendMessage();
              }
            }}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GalaxyColors.light.background,
  },
  galaxyBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    backgroundColor: GalaxyColors.light.surface + 'CC',
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: GalaxyColors.light.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backdropFilter: 'blur(10px)',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: GalaxyColors.light.backgroundSecondary,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: GalaxyColors.light.text,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: GalaxyColors.light.textSecondary,
    fontWeight: '500',
  },
  messagesList: {
    padding: 20,
    paddingBottom: 8,
  },
  messageContainer: {
    maxWidth: "85%",
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    backdropFilter: 'blur(10px)',
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: GalaxyColors.light.primary,
  },
  myMessageText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: GalaxyColors.light.card,
    borderWidth: 1,
    borderColor: GalaxyColors.light.cardBorder,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: GalaxyColors.light.text,
  },
  userType: {
    fontSize: 11,
    color: GalaxyColors.light.textSecondary,
    backgroundColor: GalaxyColors.light.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontWeight: '600',
  },
  myMessageUserType: {
    color: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  messageText: {
    fontSize: 16,
    color: GalaxyColors.light.text,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    color: GalaxyColors.light.textTertiary,
    marginTop: 8,
    alignSelf: "flex-end",
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 20,
    backgroundColor: GalaxyColors.light.surface + 'CC',
    borderTopWidth: 1,
    borderTopColor: GalaxyColors.light.border,
    backdropFilter: 'blur(10px)',
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: GalaxyColors.light.inputBorder,
    backgroundColor: GalaxyColors.light.input,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 120,
    fontSize: 16,
    color: GalaxyColors.light.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    backgroundColor: GalaxyColors.light.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: GalaxyColors.light.buttonDisabled,
  },
  messageContainer2: { 
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
  selected: { 
    borderWidth: 2, 
    borderColor: "#007AFF", 
    backgroundColor: "#E3F2FD" 
  },
  deleted: { 
    opacity: 0.6 
  },
  deletedText: { 
    fontStyle: "italic", 
    color: "#666" 
  },
  headerActions: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  headerActionButton: { 
    marginLeft: 15,
    padding: 5
  },
  disabledButton: {
    opacity: 0.5
  }
});
