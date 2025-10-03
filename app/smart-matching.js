import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../firebase/firebaseConfig';

export default function SmartMatching() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [sentRequests, setSentRequests] = useState(new Set()); // Track sent requests
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(new Map()); // Track unread messages per user
  
  // Debug modal state changes
  useEffect(() => {
    console.log('🖼️ Modal visible state changed:', modalVisible);
    if (modalVisible && selectedUser) {
      console.log('👥 Modal opened for user:', selectedUser.fullName || selectedUser.name);
    }
  }, [modalVisible, selectedUser]);
  const [insights, setInsights] = useState('');
  const auth = getAuth();

  useEffect(() => {
    loadUsers();
    // Add a test function to check connections
    const testConnectionsRead = async () => {
      try {
        console.log('🔍 Testing connections read access...');
        const connectionsSnapshot = await getDocs(collection(db, 'connections'));
        console.log('📊 Total connections in database:', connectionsSnapshot.docs.length);
        connectionsSnapshot.docs.forEach(doc => {
          console.log('🔗 Connection:', doc.id, doc.data());
        });
      } catch (error) {
        console.error('❌ Error reading connections:', error);
      }
    };
    testConnectionsRead();
  }, []);

  // Refresh unread messages periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!chatVisible) { // Only refresh when chat is not open
        loadUnreadMessageCounts();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [chatVisible]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const currentUserId = auth.currentUser?.uid;
      
      // Get current user data
      if (currentUserId) {
        const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
        const currentUserData = { id: currentUserId, ...currentUserDoc.data() };
        setCurrentUser(currentUserData);
        
        // Load existing connections to populate sent requests
        console.log('🔍 Loading existing connections...');
        const connectionsSnapshot = await getDocs(collection(db, 'connections'));
        const userSentRequests = new Set();
        connectionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.fromUserId === currentUserId) {
            userSentRequests.add(data.toUserId);
            console.log('🔗 Found existing connection to:', data.toUserId, 'status:', data.status);
          }
        });
        setSentRequests(userSentRequests);
        console.log('📋 Loaded', userSentRequests.size, 'existing connections');
        
        // Load unread message counts
        loadUnreadMessageCounts();
        
        // Get all users except current user
        const allUsers = [];
        usersSnapshot.forEach((doc) => {
          if (doc.id !== currentUserId) {
            allUsers.push({ id: doc.id, ...doc.data() });
          }
        });
        
        // Calculate match scores and sort
        const usersWithScores = allUsers.map(user => {
          const matchResult = calculateMatchScore(currentUserData, user);
          if (matchResult === null) {
            return null; // No subject overlap, exclude this user
          }
          return {
            ...user,
            ...matchResult
          };
        }).filter(user => user !== null) // Remove users with no subject overlap
          .sort((a, b) => b.matchScore - a.matchScore);
        
        setUsers(usersWithScores);
        generateInsights(currentUserData, usersWithScores);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Load unread message counts for all chats
  const loadUnreadMessageCounts = async () => {
    if (!auth.currentUser?.uid) return;
    
    try {
      console.log('🔔 Loading unread message counts...');
      const currentUserId = auth.currentUser.uid;
      
      // Get all chat rooms for current user
      const chatIndexSnapshot = await getDocs(collection(db, 'chatsIndex', currentUserId, 'rooms'));
      const unreadMap = new Map();
      
      for (const chatDoc of chatIndexSnapshot.docs) {
        const chatData = chatDoc.data();
        const peerId = chatData.peerId;
        const lastSeenAt = chatData.lastSeenAt || new Date(0);
        
        // Create chat ID
        const chatId = [currentUserId, peerId].sort().join('_');
        
        // Count unread messages
        const messagesSnapshot = await getDocs(
          query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'desc')
          )
        );
        
        let unreadCount = 0;
        for (const msgDoc of messagesSnapshot.docs) {
          const msgData = msgDoc.data();
          const msgTime = msgData.createdAt?.toDate() || new Date(0);
          
          // If message is from peer and after last seen time
          if (msgData.senderId === peerId && msgTime > lastSeenAt) {
            unreadCount++;
          } else if (msgData.senderId === currentUserId) {
            // Stop counting when we reach our own message
            break;
          }
        }
        
        if (unreadCount > 0) {
          unreadMap.set(peerId, unreadCount);
          console.log('🔴 Found', unreadCount, 'unread messages from', peerId);
        }
      }
      
      setUnreadMessages(unreadMap);
      console.log('📋 Total users with unread messages:', unreadMap.size);
      
    } catch (error) {
      console.error('❌ Error loading unread messages:', error);
    }
  };

  const calculateMatchScore = (currentUser, otherUser) => {
    let matchScore = 0;
    let matchReasons = [];
    
    // Get registered subjects (from signup)
    const userRegisteredSubjects = currentUser.subjects || [];
    const theirRegisteredSubjects = otherUser.subjects || [];
    
    // Get resource subjects (from uploads)
    const userResourceSubjects = currentUser.resourceSubjects || [];
    const theirResourceSubjects = otherUser.resourceSubjects || [];
    
    // Get all user's subjects (combination of registered and resource subjects)
    const userAllSubjects = [...new Set([...userRegisteredSubjects, ...userResourceSubjects])];
    const theirAllSubjects = [...new Set([...theirRegisteredSubjects, ...theirResourceSubjects])];
    
    // Check if there's any subject overlap - if not, return null to exclude this user
    const hasSubjectOverlap = userAllSubjects.some(subject => theirAllSubjects.includes(subject));
    if (!hasSubjectOverlap) {
      return null; // No common subjects, exclude this user
    }
    
    // Calculate registered subject overlap (higher priority)
    const registeredSubjectOverlap = userRegisteredSubjects.filter(subject => 
      theirRegisteredSubjects.includes(subject)
    );
    
    if (registeredSubjectOverlap.length > 0) {
      matchScore += registeredSubjectOverlap.length * 25; // Higher weight for registered subjects
      matchReasons.push(`Shared interests: ${registeredSubjectOverlap.join(', ')}`);
    }
    
    // Calculate resource subject overlap (lower priority)
    const resourceSubjectOverlap = userResourceSubjects.filter(subject => 
      theirResourceSubjects.includes(subject)
    );
    
    if (resourceSubjectOverlap.length > 0) {
      matchScore += resourceSubjectOverlap.length * 15; // Lower weight for resource subjects
      matchReasons.push(`Shared study materials: ${resourceSubjectOverlap.join(', ')}`);
    }
    
    // Calculate cross-category overlap (registered vs resource)
    const crossOverlap1 = userRegisteredSubjects.filter(subject => 
      theirResourceSubjects.includes(subject)
    );
    const crossOverlap2 = userResourceSubjects.filter(subject => 
      theirRegisteredSubjects.includes(subject)
    );
    
    if (crossOverlap1.length > 0) {
      matchScore += crossOverlap1.length * 20;
      matchReasons.push(`Your interests match their resources: ${crossOverlap1.join(', ')}`);
    }
    
    if (crossOverlap2.length > 0) {
      matchScore += crossOverlap2.length * 20;
      matchReasons.push(`Your resources match their interests: ${crossOverlap2.join(', ')}`);
    }
    
    // Expertise level compatibility
    const userLevel = currentUser.expertise || currentUser.expertiseLevel || 'Beginner';
    const theirLevel = otherUser.expertise || otherUser.expertiseLevel || 'Beginner';
    
    if (userLevel === theirLevel) {
      matchScore += 20;
      matchReasons.push(`Same expertise level: ${userLevel}`);
    } else {
      // Complementary levels (beginner-intermediate, intermediate-advanced)
      const levels = ['Beginner', 'Intermediate', 'Advanced'];
      const userIndex = levels.indexOf(userLevel);
      const theirIndex = levels.indexOf(theirLevel);
      
      if (Math.abs(userIndex - theirIndex) === 1) {
        matchScore += 15;
        matchReasons.push(`Complementary expertise levels`);
      }
    }
    
    // Location proximity
    if (currentUser.location && otherUser.location && 
        currentUser.location.toLowerCase() === otherUser.location.toLowerCase()) {
      matchScore += 10;
      matchReasons.push(`Same location: ${currentUser.location}`);
    }
    
    // Activity level
    const userResourceCount = (currentUser.uploadedResources || []).length;
    const theirResourceCount = (otherUser.uploadedResources || []).length;
    
    if (userResourceCount > 0 && theirResourceCount > 0) {
      matchScore += 5;
      matchReasons.push('Both active contributors');
    }
    
    return {
      matchScore: Math.max(matchScore, 1), // Minimum score of 1
      matchReasons,
      registeredSubjects: theirRegisteredSubjects,
      resourceSubjects: theirResourceSubjects
    };
  };

  const generateInsights = (currentUser, matchedUsers) => {
    const userRegisteredSubjects = currentUser.subjects || [];
    const userResourceSubjects = currentUser.resourceSubjects || [];
    const userAllSubjects = [...new Set([...userRegisteredSubjects, ...userResourceSubjects])];
    const topMatches = matchedUsers.slice(0, 3);
    
    let insightText = `🎯 Based on your subjects (${userAllSubjects.join(', ')}), `;
    
    if (topMatches.length > 0) {
      const commonInterests = [...new Set([...(topMatches[0].registeredSubjects || []), ...(topMatches[0].resourceSubjects || [])])];
      const sharedSubjects = userAllSubjects.filter(subject => 
        commonInterests.includes(subject)
      );
      
      if (sharedSubjects.length > 0) {
        insightText += `you have ${matchedUsers.length} matches with shared subjects in ${sharedSubjects.join(', ')}. `;
      }
      
      insightText += `Your top match has a ${topMatches[0].matchScore}% compatibility score!`;
    } else {
      insightText += 'no matches found. Try adding more subjects to your profile or uploading resources in different subjects to find study partners!';
    }
    
    setInsights(insightText);
  };

  const sendConnectionRequest = async () => {
    console.log('🚀===================================');
    console.log('🚀 SEND CONNECTION REQUEST STARTED');
    console.log('🚀===================================');
    console.log('📝 Selected user:', selectedUser);
    console.log('💬 Connection message:', connectionMessage?.trim());
    console.log('👤 Current user UID:', auth.currentUser?.uid);
    console.log('👤 Current user data:', currentUser);
    
    if (!auth.currentUser?.uid) {
      console.error('❌ No authenticated user');
      Alert.alert('Error', 'You must be logged in to send connection requests');
      return;
    }
    
    if (!selectedUser || !selectedUser.id) {
      console.error('❌ No selected user or user ID');
      Alert.alert('Error', 'Invalid user selection');
      return;
    }
    
    if (!connectionMessage.trim()) {
      console.error('❌ Empty connection message');
      Alert.alert('Error', 'Please enter a connection message');
      return;
    }
    
    try {
      console.log('🔄 Starting connection request process...');
      
      // Test Firebase connection first
      console.log('🧪 Testing Firebase connection...');
      const testDoc = doc(db, 'test', 'connection_test');
      await setDoc(testDoc, { timestamp: new Date(), test: true });
      console.log('✅ Firebase connection working!');
      
      // Check if connection already exists
      const connectionId = `${auth.currentUser.uid}_${selectedUser.id}`;
      console.log('🔍 Checking for existing connection with ID:', connectionId);
      const existingConnection = await getDoc(doc(db, 'connections', connectionId));
      console.log('📋 Existing connection check result:', existingConnection.exists());
      
      if (existingConnection.exists()) {
        const status = existingConnection.data()?.status;
        console.log('⚠️ Found existing connection with status:', status);
        if (status === 'pending') {
          console.log('⚠️ Connection already pending, showing alert');
          Alert.alert('Info', 'You have already sent a connection request to this user.');
          return;
        } else if (status === 'accepted') {
          console.log('⚠️ Already connected, showing alert');
          Alert.alert('Info', 'You are already connected to this user.');
          return;
        }
      }
      
      console.log('✅ No existing connection found, proceeding with creation');
      console.log('✅ Creating connection document with ID:', connectionId);
      
      const connectionData = {
        fromUserId: auth.currentUser.uid,
        toUserId: selectedUser.id,
        fromUserName: currentUser?.fullName || currentUser?.name || 'Anonymous',
        toUserName: selectedUser.fullName || selectedUser.name || 'Anonymous',
        message: connectionMessage.trim(),
        status: 'pending',
        createdAt: new Date(),
        matchScore: selectedUser.matchScore || 0,
        sharedSubjects: (selectedUser.registeredSubjects || []).filter(subject => 
          (currentUser?.subjects || []).includes(subject)
        ),
        // Add fields consistent with other connection patterns in the app
        studentId: auth.currentUser.uid,
        tutorId: selectedUser.id,
        type: 'smart_match'
      };
      
      console.log('📤 Connection data prepared:', JSON.stringify(connectionData, null, 2));
      
      // Use setDoc with specific ID instead of addDoc for consistency
      console.log('💾 Attempting to create connection document...');
      await setDoc(doc(db, 'connections', connectionId), connectionData);
      console.log('✅ CONNECTION DOCUMENT CREATED SUCCESSFULLY!');
      
      // Verify the document was actually created
      const verifyConnection = await getDoc(doc(db, 'connections', connectionId));
      console.log('🔍 Verifying connection was created:', verifyConnection.exists());
      if (verifyConnection.exists()) {
        console.log('📋 Verified connection data:', verifyConnection.data());
      } else {
        console.error('❌ WARNING: Connection document was not found after creation!');
      }
      
      // Add notification to the recipient
      const notificationData = {
        userId: selectedUser.id,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${currentUser?.fullName || currentUser?.name || 'Someone'} wants to connect with you`,
        read: false,
        createdAt: new Date(),
        data: { 
          connectionId: connectionId,
          fromUserId: auth.currentUser.uid,
          fromUserName: currentUser?.fullName || currentUser?.name || 'Anonymous',
          matchScore: selectedUser.matchScore || 0
        }
      };
      
      console.log('🔔 Creating notification for user:', selectedUser.id);
      console.log('📋 Notification data:', JSON.stringify(notificationData, null, 2));
      
      const notificationDoc = await addDoc(collection(db, 'notifications'), notificationData);
      console.log('✅ NOTIFICATION CREATED SUCCESSFULLY with ID:', notificationDoc.id);
      
      // Also create a chat index entry so the users can find each other in chat
      try {
        await setDoc(doc(db, 'chatsIndex', selectedUser.id, 'rooms', auth.currentUser.uid), {
          peerId: auth.currentUser.uid,
          peerName: currentUser?.fullName || currentUser?.name || 'User',
          lastMessageAt: new Date(),
          type: 'smart_match'
        }, { merge: true });
        console.log('✅ Chat index created for recipient');
      } catch (chatIndexError) {
        console.warn('⚠️ Failed to create chat index:', chatIndexError);
      }
      
      Alert.alert(
        'Success', 
        `Connection request sent to ${selectedUser.fullName || selectedUser.name || 'user'} successfully!`,
        [{ 
          text: 'OK', 
          onPress: () => {
            console.log('✅ User acknowledged success');
            // Add the user ID to sent requests
            setSentRequests(prev => new Set([...prev, selectedUser.id]));
            setModalVisible(false);
            setConnectionMessage('');
            setSelectedUser(null);
          }
        }]
      );
      
    } catch (error) {
      console.error('❌ Error sending connection request:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      Alert.alert(
        'Error', 
        `Failed to send connection request: ${error.message || 'Unknown error'}`,
        [{ text: 'OK', onPress: () => console.log('❌ User acknowledged error') }]
      );
    }
  };

  // Chat functionality
  const openChat = async (user) => {
    console.log('💬 Opening chat with user:', user.fullName || user.name);
    setSelectedChatUser(user);
    setChatVisible(true);
    setChatMessage('');
    
    // Mark messages as read by updating lastSeenAt
    if (auth.currentUser?.uid) {
      try {
        await setDoc(doc(db, 'chatsIndex', auth.currentUser.uid, 'rooms', user.id), {
          lastSeenAt: new Date()
        }, { merge: true });
        
        // Remove from unread messages
        setUnreadMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(user.id);
          return newMap;
        });
        
        console.log('✅ Marked messages as read for user:', user.id);
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    }
    
    // Load chat messages
    loadChatMessages(user.id);
  };
  
  const loadChatMessages = (userId) => {
    if (!auth.currentUser?.uid) return;
    
    const chatId = [auth.currentUser.uid, userId].sort().join('_');
    console.log('📥 Loading chat messages for chat ID:', chatId);
    
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📨 Loaded', messages.length, 'chat messages');
      setChatMessages(messages);
      
      // If chat is not currently open, update unread count
      if (!chatVisible || selectedChatUser?.id !== userId) {
        const newMessages = messages.filter(msg => 
          msg.senderId === userId && 
          msg.createdAt?.toDate() > new Date(Date.now() - 60000) // Messages from last minute
        );
        
        if (newMessages.length > 0) {
          setUnreadMessages(prev => {
            const newMap = new Map(prev);
            const currentCount = newMap.get(userId) || 0;
            newMap.set(userId, currentCount + newMessages.length);
            console.log('🔴 Updated unread count for', userId, ':', currentCount + newMessages.length);
            return newMap;
          });
        }
      }
    });
    
    return unsubscribe;
  };
  
  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedChatUser || !auth.currentUser?.uid) {
      return;
    }
    
    try {
      const chatId = [auth.currentUser.uid, selectedChatUser.id].sort().join('_');
      console.log('📤 Sending message to chat:', chatId);
      
      const messageData = {
        senderId: auth.currentUser.uid,
        senderName: currentUser?.fullName || currentUser?.name || 'Anonymous',
        message: chatMessage.trim(),
        timestamp: serverTimestamp(),
        createdAt: new Date()
      };
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      console.log('✅ Message sent successfully');
      
      // Create/update chat index for both users
      await setDoc(doc(db, 'chatsIndex', auth.currentUser.uid, 'rooms', selectedChatUser.id), {
        peerId: selectedChatUser.id,
        peerName: selectedChatUser.fullName || selectedChatUser.name || 'User',
        lastMessageAt: new Date(),
        lastMessage: chatMessage.trim()
      }, { merge: true });
      
      await setDoc(doc(db, 'chatsIndex', selectedChatUser.id, 'rooms', auth.currentUser.uid), {
        peerId: auth.currentUser.uid,
        peerName: currentUser?.fullName || currentUser?.name || 'User',
        lastMessageAt: new Date(),
        lastMessage: chatMessage.trim()
      }, { merge: true });
      
      setChatMessage('');
    } catch (error) {
      console.error('❌ Error sending chat message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };
  
  const closeChat = () => {
    setChatVisible(false);
    setSelectedChatUser(null);
    setChatMessages([]);
  };

  const renderSubjectTags = (registeredSubjects, resourceSubjects) => {
    const allSubjects = [...new Set([...(registeredSubjects || []), ...(resourceSubjects || [])])];
    
    return (
      <View style={styles.subjectContainer}>
        {(registeredSubjects || []).map((subject, index) => (
          <View key={`reg-${index}`} style={[styles.subjectTag, styles.registeredSubjectTag]}>
            <Text style={styles.registeredSubjectText}>{subject}</Text>
            <Ionicons name="person" size={12} color="#059669" style={styles.subjectIcon} />
          </View>
        ))}
        {(resourceSubjects || []).filter(subject => !(registeredSubjects || []).includes(subject)).map((subject, index) => (
          <View key={`res-${index}`} style={[styles.subjectTag, styles.resourceSubjectTag]}>
            <Text style={styles.resourceSubjectText}>{subject}</Text>
            <Ionicons name="library" size={12} color="#2563eb" style={styles.subjectIcon} />
          </View>
        ))}
      </View>
    );
  };

  const renderMatchCard = (user) => (
    <View key={user.id} style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.fullName || user.name || 'Anonymous User'}</Text>
          <Text style={styles.userExpertise}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            {user.expertise || user.expertiseLevel || 'Beginner'}
          </Text>
        </View>
        <View style={styles.matchScoreContainer}>
          <Text style={styles.matchScore}>{user.matchScore}%</Text>
          <Text style={styles.matchLabel}>Match</Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Registered Interests:</Text>
      {renderSubjectTags(user.registeredSubjects, user.resourceSubjects)}
      
      {user.matchReasons && user.matchReasons.length > 0 && (
        <View style={styles.reasonsContainer}>
          <Text style={styles.reasonsTitle}>Why you match:</Text>
          {user.matchReasons.map((reason, index) => (
            <Text key={index} style={styles.reasonText}>• {reason}</Text>
          ))}
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.connectButton,
            sentRequests.has(user.id) && styles.connectButtonSent
          ]}
          onPress={() => {
            if (sentRequests.has(user.id)) {
              Alert.alert('Already Sent', 'You have already sent a connection request to this user.');
              return;
            }
            console.log('👥 Connect button pressed for user:', {
              id: user.id,
              name: user.fullName || user.name,
              subjects: user.registeredSubjects
            });
            console.log('📱 Modal should open now...');
            setSelectedUser(user);
            setModalVisible(true);
          }}
          activeOpacity={0.7}
          disabled={sentRequests.has(user.id)}
        >
          <Ionicons 
            name={sentRequests.has(user.id) ? "checkmark-circle" : "person-add"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.connectButtonText}>
            {sentRequests.has(user.id) ? 'Sent' : 'Connect'}
          </Text>
        </TouchableOpacity>
        
        {sentRequests.has(user.id) && (
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => openChat(user)}
            activeOpacity={0.7}
          >
            <View style={styles.messageButtonContent}>
              <Ionicons name="chatbubble-outline" size={20} color="#8b5cf6" />
              <Text style={styles.messageButtonText}>Message</Text>
              {unreadMessages.has(user.id) && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadMessages.get(user.id)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Finding your perfect study matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8b5cf6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🤖 Smart Matching</Text>
      </View>
      
      {insights ? (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsText}>{insights}</Text>
        </View>
      ) : null}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {users.length > 0 ? (
          users.map(renderMatchCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Subject Matches Found</Text>
            <Text style={styles.emptySubtitle}>
              No users found with matching subjects. Try:
              {"\n"}• Adding more subjects to your profile
              {"\n"}• Uploading resources in different subjects
              {"\n"}• Checking back later for new users
            </Text>
          </View>
        )}
      </ScrollView>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          console.log('🖼️ Modal closing...');
          setModalVisible(false);
        }}
        onShow={() => console.log('🖼️ Modal opened')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect with {selectedUser?.fullName || selectedUser?.name || 'User'}</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Send a personalized message to start your study partnership:
            </Text>
            
            <TextInput
              style={styles.messageInput}
              placeholder="Hi! I'd love to study together and share resources..."
              value={connectionMessage}
              onChangeText={setConnectionMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={async () => {
                  console.log('🚀===========================');
                  console.log('🚀 SEND BUTTON PRESSED!');
                  console.log('🚀===========================');
                  console.log('📝 Selected user in button:', selectedUser);
                  console.log('💬 Connection message in button:', connectionMessage?.length, 'chars');
                  console.log('👤 Current user in button:', auth.currentUser?.uid);
                  console.log('👤 Current user data in button:', currentUser);
                  
                  try {
                    await sendConnectionRequest();
                    console.log('🎉 sendConnectionRequest completed successfully');
                  } catch (error) {
                    console.error('💥 sendConnectionRequest threw error:', error);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.sendButtonText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Chat Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={chatVisible}
        onRequestClose={closeChat}
      >
        <View style={styles.chatModalOverlay}>
          <View style={styles.chatModalContent}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>
                Chat with {selectedChatUser?.fullName || selectedChatUser?.name || 'User'}
              </Text>
              <TouchableOpacity onPress={closeChat} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
              {chatMessages.length === 0 ? (
                <View style={styles.emptyChat}>
                  <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyChatText}>Start your conversation!</Text>
                </View>
              ) : (
                chatMessages.map((message) => (
                  <View 
                    key={message.id} 
                    style={[
                      styles.messageItem,
                      message.senderId === auth.currentUser?.uid 
                        ? styles.myMessage 
                        : styles.theirMessage
                    ]}
                  >
                    <Text style={styles.messageSender}>
                      {message.senderId === auth.currentUser?.uid ? 'You' : message.senderName}
                    </Text>
                    <Text style={styles.messageText}>{message.message}</Text>
                    <Text style={styles.messageTime}>
                      {message.createdAt?.toDate?.()?.toLocaleTimeString() || 'Sending...'}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type your message..."
                value={chatMessage}
                onChangeText={setChatMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={styles.sendMessageButton}
                onPress={sendChatMessage}
                disabled={!chatMessage.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  insightsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  insightsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userExpertise: {
    fontSize: 14,
    color: '#6b7280',
  },
  matchScoreContainer: {
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    padding: 8,
    minWidth: 60,
  },
  matchScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  matchLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  registeredSubjectTag: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  resourceSubjectTag: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  registeredSubjectText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  resourceSubjectText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  subjectIcon: {
    marginLeft: 4,
  },
  reasonsContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  connectButtonSent: {
    backgroundColor: '#10b981',
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    position: 'relative',
  },
  messageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  messageButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  unreadBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 0.45,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  sendButton: {
    flex: 0.45,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // Chat Modal Styles
  chatModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 16,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  messageItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#8b5cf6',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#6b7280',
  },
  messageText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 80,
  },
  sendMessageButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
});