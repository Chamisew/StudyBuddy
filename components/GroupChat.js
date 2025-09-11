import { Ionicons } from '@expo/vector-icons';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebase/firebaseConfig';

export default function GroupChat({ visible, onClose, tutorId }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [availableStudentsForGroup, setAvailableStudentsForGroup] = useState([]);
  const [selectedNewStudents, setSelectedNewStudents] = useState([]);

  useEffect(() => {
    if (visible && tutorId) {
      fetchGroups();
      fetchAvailableStudents();
    }
  }, [visible, tutorId]);

  useEffect(() => {
    if (selectedGroup) {
      console.log('=== SELECTED GROUP CHANGED ===');
      console.log('Selected Group:', selectedGroup);
      console.log('Calling fetchMessages and fetchGroupMembers...');
      fetchMessages();
      fetchGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  // Add effect to fetch group members when modal opens
  useEffect(() => {
    if (showGroupInfoModal && selectedGroup) {
      console.log('=== GROUP INFO MODAL OPENED ===');
      console.log('Modal opened, fetching group members...');
      fetchGroupMembers(selectedGroup.id);
    }
  }, [showGroupInfoModal, selectedGroup]);

  const fetchGroups = async () => {
    try {
      const groupsQuery = query(
        collection(db, 'groupChats'),
        where('tutorId', '==', tutorId)
      );
      
      const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
        const groupsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort locally instead of using orderBy to avoid index requirement
        groupsList.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });
        setGroups(groupsList);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      // Fetch students connected to this tutor
      const connectionsQuery = query(
        collection(db, 'connections'),
        where('tutorId', '==', tutorId),
        where('status', '==', 'accepted')
      );
      
      const connectionsSnapshot = await getDocs(connectionsQuery);
      const studentIds = connectionsSnapshot.docs.map(doc => doc.data().studentId);
      
      // Fetch student details (include even if user doc missing with sensible fallbacks)
      const students = [];
      for (const studentId of studentIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', studentId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            students.push({
              id: studentId,
              name: userData.fullName || userData.name || userData.displayName || userData.firstName || studentId,
              email: userData.email || '',
            });
          } else {
            // Fallback entry if no user profile document exists
            students.push({ id: studentId, name: studentId, email: '' });
          }
        } catch (error) {
          console.error('Error fetching student:', error);
          // Still include minimal entry to allow selection
          students.push({ id: studentId, name: studentId, email: '' });
        }
      }
      
      setAvailableStudents(students);
    } catch (error) {
      console.error('Error fetching available students:', error);
    }
  };

  const fetchAvailableStudentsForGroup = async (groupId) => {
    try {
      // Get current group data
      const groupDoc = await getDoc(doc(db, 'groupChats', groupId));
      if (!groupDoc.exists()) return;
      
      const groupData = groupDoc.data();
      const currentStudentIds = groupData.studentIds || [];
      
      // Fetch students connected to this tutor
      const connectionsQuery = query(
        collection(db, 'connections'),
        where('tutorId', '==', tutorId),
        where('status', '==', 'accepted')
      );
      
      const connectionsSnapshot = await getDocs(connectionsQuery);
      const allStudentIds = connectionsSnapshot.docs.map(doc => doc.data().studentId);
      
      // Filter out students already in the group
      const availableStudentIds = allStudentIds.filter(id => !currentStudentIds.includes(id));
      
      // Fetch student details for available students (with fallbacks)
      const students = [];
      for (const studentId of availableStudentIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', studentId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            students.push({
              id: studentId,
              name: userData.fullName || userData.name || userData.displayName || userData.firstName || studentId,
              email: userData.email || '',
            });
          } else {
            students.push({ id: studentId, name: studentId, email: '' });
          }
        } catch (error) {
          console.error('Error fetching student:', error);
          students.push({ id: studentId, name: studentId, email: '' });
        }
      }
      
      setAvailableStudentsForGroup(students);
      setSelectedNewStudents([]);
    } catch (error) {
      console.error('Error fetching available students for group:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedGroup) return;
    
    try {
      const messagesQuery = query(
        collection(db, 'groupChats', selectedGroup.id, 'messages'),
        limit(50)
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort locally instead of using orderBy to avoid index requirement
        messagesList.sort((a, b) => {
          const aTime = a.timestamp?.toDate?.() || new Date(0);
          const bTime = b.timestamp?.toDate?.() || new Date(0);
          return aTime - bTime; // Ascending order for messages
        });
        setMessages(messagesList);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchGroupMembers = async (groupId) => {
    console.log('🚀 === fetchGroupMembers FUNCTION CALLED ===');
    console.log('🚀 Group ID:', groupId);
    console.log('🚀 Function execution started');
    
    try {
      console.log('=== FETCHING GROUP MEMBERS ===');
      console.log('Group ID:', groupId);
      
      const groupDoc = await getDoc(doc(db, 'groupChats', groupId));
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        console.log('Group Data:', groupData);
        console.log('Student IDs:', groupData.studentIds);
        console.log('Student Names:', groupData.studentNames);
        
        const members = [];
        
        // Add tutor with validation
        if (groupData.tutorId && groupData.tutorName) {
          members.push({
            id: groupData.tutorId,
            name: groupData.tutorName || 'Unknown Tutor',
            type: 'tutor',
            role: 'Admin'
          });
        }
        
        // Add students with proper names from users collection
        if (groupData.studentIds && Array.isArray(groupData.studentIds)) {
          console.log('Processing', groupData.studentIds.length, 'students');
          
          for (let i = 0; i < groupData.studentIds.length; i++) {
            try {
              const studentId = groupData.studentIds[i];
              console.log(`\n--- Processing Student ${i + 1} ---`);
              console.log('Student ID:', studentId);
              
              if (!studentId) {
                console.log('Skipping invalid student ID');
                continue;
              }
              
              // Always try to fetch fresh name from users collection
              console.log('Fetching user document for student ID:', studentId);
              const userDoc = await getDoc(doc(db, 'users', studentId));
              console.log('User document exists:', userDoc.exists());
              
              let studentName = 'Unknown Student';
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('User data:', userData);
                // Try multiple possible field names for the user's name
                studentName = userData.fullName || userData.name || userData.displayName || userData.firstName || 'Unknown Student';
                console.log(`✅ Fetched name for student ${studentId}: "${studentName}"`);
                console.log('Used field:', userData.fullName ? 'fullName' : userData.name ? 'name' : userData.displayName ? 'displayName' : userData.firstName ? 'firstName' : 'fallback');
              } else {
                console.log(`❌ User document not found for student ${studentId}`);
                console.log('Trying fallback to stored name...');
                // Fallback to stored name if user doc doesn't exist
                const fallbackName = groupData.studentNames && groupData.studentNames[i] ? groupData.studentNames[i] : 'Unknown Student';
                studentName = fallbackName;
                console.log(`Fallback name: "${fallbackName}"`);
              }
              
              members.push({
                id: studentId,
                name: studentName,
                type: 'student',
                role: 'Member'
              });
              
              console.log(`Added student: ${studentName} (${studentId})`);
              
            } catch (error) {
              console.error('❌ Error fetching student name for ID:', groupData.studentIds[i], error);
              // Add student with fallback name
              const fallbackName = groupData.studentNames && groupData.studentNames[i] ? groupData.studentNames[i] : 'Unknown Student';
              members.push({
                id: groupData.studentIds[i] || 'unknown',
                name: fallbackName,
                type: 'student',
                role: 'Member'
              });
              console.log(`Added student with fallback: ${fallbackName}`);
            }
          }
        } else {
          console.log('No student IDs found in group data');
        }
        
        console.log('\n=== FINAL MEMBERS LIST ===');
        console.log('Total members:', members.length);
        members.forEach((member, index) => {
          console.log(`${index + 1}. ${member.name} (${member.id}) - ${member.type}`);
        });
        
        setGroupMembers(members);
      } else {
        console.log('❌ Group document does not exist');
        setGroupMembers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching group members:', error);
      setGroupMembers([]);
    }
  };

  const removeStudentFromGroup = async (studentId, studentName) => {
    console.log('=== REMOVE STUDENT FUNCTION CALLED ===');
    console.log('Student ID:', studentId);
    console.log('Student Name:', studentName);
    console.log('Selected Group:', selectedGroup);
    
    // Simple confirmation approach - same as group deletion
    const confirmed = window.confirm(`Are you sure you want to remove ${studentName} from this group?`);
    if (!confirmed) {
      console.log('Remove student cancelled by user');
      return;
    }
    
    console.log('=== REMOVE STUDENT CONFIRMED ===');
    console.log('Starting student removal process...');
    
    try {
      console.log('Remove confirmed for student:', studentName, 'from group:', selectedGroup.id);
      console.log('Current user:', auth.currentUser?.uid);
      console.log('Tutor ID:', tutorId);
      
      // Check if user is authorized to remove students from this group
      if (auth.currentUser?.uid !== tutorId) {
        console.log('Authorization failed - user mismatch');
        Alert.alert('Error', 'You are not authorized to remove students from this group.');
        return;
      }
      console.log('Authorization check passed');
      
      // Check if group exists and get its data
      console.log('Checking if group exists...');
      const groupDoc = await getDoc(doc(db, 'groupChats', selectedGroup.id));
      if (!groupDoc.exists()) {
        console.log('Group does not exist');
        Alert.alert('Error', 'Group no longer exists.');
        return;
      }
      console.log('Group exists, getting data...');
      
      const groupData = groupDoc.data();
      console.log('Group data:', groupData);
      
      // Verify the group belongs to this tutor
      if (groupData.tutorId !== tutorId) {
        console.log('Group ownership verification failed');
        Alert.alert('Error', 'You can only remove students from groups you created.');
        return;
      }
      console.log('Group ownership verified');
      
      // Simple remove approach - just update the group document
      const updatedStudentIds = groupData.studentIds.filter(id => id !== studentId);
      const updatedStudentNames = groupData.studentNames.filter((_, index) => 
        groupData.studentIds[index] !== studentId
      );
      
      console.log('Updated student IDs:', updatedStudentIds);
      console.log('Updated student names:', updatedStudentNames);
      
      console.log('Updating group document...');
      await updateDoc(doc(db, 'groupChats', selectedGroup.id), {
        studentIds: updatedStudentIds,
        studentNames: updatedStudentNames,
        updatedAt: serverTimestamp()
      });
      console.log('Group document updated successfully');
      
      // Add system message about student removal
      const tutorDoc = await getDoc(doc(db, 'users', tutorId));
      const tutorDisplay = tutorDoc.exists() ? (tutorDoc.data().fullName || tutorDoc.data().name || tutorDoc.data().displayName || 'Tutor') : (auth.currentUser?.displayName || 'Tutor');
      await addDoc(collection(db, 'groupChats', selectedGroup.id, 'messages'), {
        text: `${studentName} was removed from the group by ${tutorDisplay}`,
        senderId: tutorId,
        senderName: tutorDisplay,
        senderType: 'tutor',
        timestamp: serverTimestamp(),
        type: 'system'
      });
      console.log('System message added');
      
      // Update local state immediately
      setSelectedGroup(prev => ({
        ...prev,
        studentIds: updatedStudentIds,
        studentNames: updatedStudentNames
      }));
      
      // Update local groups list
      setGroups(prev => prev.map(g => 
        g.id === selectedGroup.id 
          ? { ...g, studentIds: updatedStudentIds, studentNames: updatedStudentNames }
          : g
      ));
      
      console.log('Local state updated');
      
      // Refresh group members display
      fetchGroupMembers(selectedGroup.id);
      
      Alert.alert('Success', `${studentName} has been removed from the group.`);
    } catch (error) {
      console.error('=== STUDENT REMOVAL ERROR ===');
      console.error('Error removing student:', error);
      console.error('Error details:', error.code, error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Failed to remove student from group: ${error.message}`);
    }
  };

  const handleStudentLeaveGroup = async (studentId, studentName) => {
    // Simple confirmation approach - same as other functions
    const confirmed = window.confirm('Are you sure you want to leave this group?');
    if (!confirmed) {
      console.log('Leave group cancelled by user');
      return;
    }
    
    console.log('=== LEAVE GROUP CONFIRMED ===');
    console.log('Student leaving group:', studentName, 'from group:', selectedGroup.id);
    
    try {
      console.log('Starting leave group process...');
      
      // Check if group exists and get its data
      const groupDoc = await getDoc(doc(db, 'groupChats', selectedGroup.id));
      if (!groupDoc.exists()) {
        Alert.alert('Error', 'Group no longer exists.');
        return;
      }
      
      const groupData = groupDoc.data();
      const updatedStudentIds = groupData.studentIds.filter(id => id !== studentId);
      const updatedStudentNames = groupData.studentNames.filter((_, index) => 
        groupData.studentIds[index] !== studentId
      );
      
      console.log('Updated student IDs:', updatedStudentIds);
      console.log('Updated student names:', updatedStudentNames);
      
      await updateDoc(doc(db, 'groupChats', selectedGroup.id), {
        studentIds: updatedStudentIds,
        studentNames: updatedStudentNames,
        updatedAt: serverTimestamp()
      });
      
      console.log('Group document updated successfully');
      
      // Add system message about student leaving
      await addDoc(collection(db, 'groupChats', selectedGroup.id, 'messages'), {
        text: `${studentName} left the group`,
        senderId: studentId,
        senderName: studentName,
        senderType: 'student',
        timestamp: serverTimestamp(),
        type: 'system'
      });
      
      console.log('System message added');
      
      // Update local state
      setSelectedGroup(prev => ({
        ...prev,
        studentIds: updatedStudentIds,
        studentNames: updatedStudentNames
      }));
      
      console.log('Local state updated');
      
      // Refresh group members
      fetchGroupMembers(selectedGroup.id);
      
      Alert.alert('Success', 'You have left the group.');
    } catch (error) {
      console.error('=== LEAVE GROUP ERROR ===');
      console.error('Error leaving group:', error);
      console.error('Error details:', error.code, error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Failed to leave the group: ${error.message}`);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    if (selectedStudents.length === 0) {
      Alert.alert('Error', 'Please select at least one student.');
      return;
    }

    setLoading(true);
    try {
      // Resolve tutor display name from users profile with fallbacks
      let tutorDisplayName = auth.currentUser?.displayName || '';
      try {
        if (tutorId) {
          const tutorDoc = await getDoc(doc(db, 'users', String(tutorId)));
          if (tutorDoc.exists()) {
            const t = tutorDoc.data();
            tutorDisplayName = t.fullName || t.name || t.displayName || t.firstName || tutorDisplayName || 'Tutor';
          }
        }
      } catch {}

      const groupData = {
        name: groupName.trim(),
        tutorId,
        tutorName: tutorDisplayName || 'Tutor',
        studentIds: selectedStudents,
        studentNames: selectedStudents.map(id => {
          const student = availableStudents.find(s => s.id === id);
          return student ? (student.name || student.id) : 'Unknown Student';
        }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const groupRef = await addDoc(collection(db, 'groupChats'), groupData);

      // Add initial system message
      await addDoc(collection(db, 'groupChats', groupRef.id, 'messages'), {
        text: `Group "${groupName.trim()}" created by ${tutorDisplayName || 'Tutor'}`,
        senderId: tutorId,
        senderName: tutorDisplayName || 'Tutor',
        senderType: 'tutor',
        timestamp: serverTimestamp(),
        type: 'system'
      });

      setGroupName('');
      setSelectedStudents([]);
      setShowCreateModal(false);
      Alert.alert('Success', 'Group chat created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', `Failed to create group chat: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedGroup) return;

    try {
      await addDoc(collection(db, 'groupChats', selectedGroup.id, 'messages'), {
        text: message.trim(),
        senderId: tutorId,
        senderName: auth.currentUser?.displayName || 'Tutor',
        senderType: 'tutor',
        timestamp: serverTimestamp(),
        type: 'message'
      });

      // Update group's last activity
      await updateDoc(doc(db, 'groupChats', selectedGroup.id), {
        updatedAt: serverTimestamp(),
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp()
      });

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const deleteGroup = async (groupId) => {
    console.log('Attempting to delete group:', groupId);
    
    // Simple confirmation approach
    const confirmed = window.confirm('Are you sure you want to delete this group? All messages will be lost.');
    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }
    
    console.log('=== DELETE CONFIRMED ===');
    console.log('Starting deletion process...');
    
    try {
      console.log('Delete confirmed for group:', groupId);
      console.log('Current user:', auth.currentUser?.uid);
      console.log('Tutor ID:', tutorId);
      
      // Check if user is authorized to delete this group
      if (auth.currentUser?.uid !== tutorId) {
        console.log('Authorization failed - user mismatch');
        Alert.alert('Error', 'You are not authorized to delete this group.');
        return;
      }
      console.log('Authorization check passed');
      
      // Check if group exists and get its data
      console.log('Checking if group exists...');
      const groupDoc = await getDoc(doc(db, 'groupChats', groupId));
      if (!groupDoc.exists()) {
        console.log('Group does not exist');
        Alert.alert('Error', 'Group no longer exists.');
        return;
      }
      console.log('Group exists, getting data...');
      
      const groupData = groupDoc.data();
      console.log('Group data:', groupData);
      
      // Verify the group belongs to this tutor
      if (groupData.tutorId !== tutorId) {
        console.log('Group ownership verification failed');
        Alert.alert('Error', 'You can only delete groups you created.');
        return;
      }
      console.log('Group ownership verified');
      
      // Simple delete approach - just delete the group document
      // Firebase will automatically handle subcollection cleanup
      console.log('Deleting group document...');
      await deleteDoc(doc(db, 'groupChats', groupId));
      console.log('Group document deleted successfully');
      
      // Update local state
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setShowGroupModal(false);
      }
      
      // Remove from local groups list
      setGroups(prev => prev.filter(g => g.id !== groupId));
      console.log('Local state updated');
      
      Alert.alert('Success', 'Group deleted successfully!');
    } catch (error) {
      console.error('=== DELETION ERROR ===');
      console.error('Error deleting group:', error);
      console.error('Error details:', error.code, error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Failed to delete group: ${error.message}`);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleNewStudentSelection = (studentId) => {
    setSelectedNewStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const testFirebase = async () => {
    try {
      console.log('Testing Firebase connection...');
      
      // Test reading from groupChats collection
      const groupsSnapshot = await getDocs(collection(db, 'groupChats'));
      console.log('Firebase read test successful. Groups count:', groupsSnapshot.size);
      
      // Test if we can access the first group
      if (groupsSnapshot.size > 0) {
        const firstGroup = groupsSnapshot.docs[0];
        console.log('First group data:', firstGroup.data());
      }
      
    } catch (error) {
      console.error('Firebase test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  };

  const testUserDocument = async (userId) => {
    try {
      console.log('=== TESTING USER DOCUMENT ===');
      console.log('User ID:', userId);
      
      // Test 'users' collection first
      console.log('\n--- Testing "users" collection ---');
      const userDoc = await getDoc(doc(db, 'users', userId));
      console.log('User document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data:', userData);
        console.log('User name:', userData.name);
        console.log('User email:', userData.email);
        console.log('All user fields:', Object.keys(userData));
        
        // Test the name extraction logic
        const testName = userData.fullName || userData.name || userData.displayName || userData.firstName || 'Unknown Student';
        console.log('Extracted name using our logic:', testName);
        console.log('fullName value:', userData.fullName);
        console.log('name value:', userData.name);
        console.log('displayName value:', userData.displayName);
        console.log('firstName value:', userData.firstName);
      } else {
        console.log('❌ User document not found in "users" collection');
        
        // Try 'user' collection (singular)
        console.log('\n--- Testing "user" collection ---');
        const userDoc2 = await getDoc(doc(db, 'user', userId));
        console.log('User document exists in "user":', userDoc2.exists());
        
        if (userDoc2.exists()) {
          const userData = userDoc2.data();
          console.log('User data from "user":', userData);
          console.log('User name:', userData.name);
          console.log('User email:', userData.email);
        }
        
        // Try 'students' collection
        console.log('\n--- Testing "students" collection ---');
        const studentDoc = await getDoc(doc(db, 'students', userId));
        console.log('Student document exists:', studentDoc.exists());
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          console.log('Student data:', studentData);
          console.log('Student name:', studentData.name);
        }
        
        // List all collections to see what's available
        console.log('\n--- Listing all collections ---');
        try {
          const collections = await getDocs(collection(db, 'users'));
          console.log('Users collection size:', collections.size);
          if (collections.size > 0) {
            console.log('First user in users collection:', collections.docs[0].data());
          }
        } catch (error) {
          console.log('Error accessing users collection:', error.message);
        }
      }
    } catch (error) {
      console.error('Error testing user document:', error);
    }
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => {
        setSelectedGroup(item);
        setShowGroupModal(true);
      }}
    >
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupMeta}>
          {item.studentIds.length} student{item.studentIds.length !== 1 ? 's' : ''}
        </Text>
        {item.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          console.log('=== DELETE BUTTON PRESSED ===');
          console.log('Group ID:', item.id);
          console.log('Group Name:', item.name);
          console.log('Current User:', auth.currentUser?.uid);
          console.log('Tutor ID:', tutorId);
          Alert.alert('Debug', `Delete button pressed for group: ${item.name}`);
          deleteGroup(item.id);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.senderId === tutorId ? styles.tutorMessage : styles.studentMessage
    ]}>
      <Text style={styles.senderName}>{item.senderName}</Text>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>
        {item.timestamp?.toDate?.()?.toLocaleTimeString() || 'Now'}
      </Text>
    </View>
  );

  const renderStudentItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.studentItem,
        selectedStudents.includes(item.id) && styles.selectedStudent
      ]}
      onPress={() => toggleStudentSelection(item.id)}
    >
      <Ionicons
        name={selectedStudents.includes(item.id) ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={selectedStudents.includes(item.id) ? "#007AFF" : "#666"}
      />
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  const addStudentsToGroup = async () => {
    if (selectedNewStudents.length === 0) {
      Alert.alert('Error', 'Please select at least one student to add.');
      return;
    }

    try {
      // Get current group data
      const groupDoc = await getDoc(doc(db, 'groupChats', selectedGroup.id));
      if (!groupDoc.exists()) {
        Alert.alert('Error', 'Group no longer exists.');
        return;
      }

      const groupData = groupDoc.data();
      const currentStudentIds = groupData.studentIds || [];
      const currentStudentNames = groupData.studentNames || [];

      // Get names for selected students
      const newStudentNames = selectedNewStudents.map(id => {
        const student = availableStudentsForGroup.find(s => s.id === id);
        return student ? student.name : 'Unknown Student';
      });

      // Combine current and new students
      const updatedStudentIds = [...currentStudentIds, ...selectedNewStudents];
      const updatedStudentNames = [...currentStudentNames, ...newStudentNames];

      // Update group document
      await updateDoc(doc(db, 'groupChats', selectedGroup.id), {
        studentIds: updatedStudentIds,
        studentNames: updatedStudentNames,
        updatedAt: serverTimestamp()
      });

      // Add system message about new students
      const studentNamesList = newStudentNames.join(', ');
      await addDoc(collection(db, 'groupChats', selectedGroup.id, 'messages'), {
        text: `${studentNamesList} ${selectedNewStudents.length === 1 ? 'was' : 'were'} added to the group by ${auth.currentUser?.displayName || 'Tutor'}`,
        senderId: tutorId,
        senderName: auth.currentUser?.displayName || 'Tutor',
        senderType: 'tutor',
        timestamp: serverTimestamp(),
        type: 'system'
      });

      // Update local state
      setSelectedGroup(prev => ({
        ...prev,
        studentIds: updatedStudentIds,
        studentNames: updatedStudentNames
      }));

      // Update local groups list
      setGroups(prev => prev.map(g => 
        g.id === selectedGroup.id 
          ? { ...g, studentIds: updatedStudentIds, studentNames: updatedStudentNames }
          : g
      ));

      // Refresh group members display
      fetchGroupMembers(selectedGroup.id);

      // Close modal and show success
      setShowAddStudentsModal(false);
      setSelectedNewStudents([]);
      Alert.alert('Success', `${selectedNewStudents.length} student${selectedNewStudents.length !== 1 ? 's' : ''} added to the group.`);

    } catch (error) {
      console.error('Error adding students to group:', error);
      Alert.alert('Error', `Failed to add students to group: ${error.message}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Chats</Text>
          <View style={styles.headerButtons}>
            
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.createButton}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Groups List */}
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.groupsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No group chats yet</Text>
              <Text style={styles.emptySubtext}>Create your first group to start chatting with students</Text>
            </View>
          }
        />

        {/* Create Group Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Group Chat</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
              />

              <Text style={styles.sectionTitle}>Select Students</Text>
              <FlatList
                data={availableStudents}
                renderItem={renderStudentItem}
                keyExtractor={(item) => item.id}
                extraData={selectedStudents}
                style={styles.studentsList}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={{ color: '#666' }}>No connected students found. Accept connections to add students.</Text>
                  </View>
                }
              />

              <TouchableOpacity
                style={[styles.createGroupButton, loading && styles.disabledButton]}
                onPress={createGroup}
                disabled={loading}
              >
                <Text style={styles.createGroupButtonText}>
                  {loading ? 'Creating...' : 'Create Group'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Group Chat Modal */}
        <Modal
          visible={showGroupModal}
          animationType="slide"
          onRequestClose={() => setShowGroupModal(false)}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.chatHeader}>
              <TouchableOpacity
                onPress={() => setShowGroupModal(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <View style={styles.chatHeaderInfo}>
                <Text style={styles.chatHeaderTitle}>{selectedGroup?.name}</Text>
                <Text style={styles.chatHeaderSubtitle}>
                  {selectedGroup?.studentIds?.length || 0} students
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  console.log('=== GROUP INFO BUTTON PRESSED ===');
                  console.log('Current selectedGroup:', selectedGroup);
                  console.log('Current groupMembers:', groupMembers);
                  console.log('Opening group info modal...');
                  setShowGroupInfoModal(true);
                }}
                style={styles.groupInfoButton}
              >
                <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              inverted
            />

            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={!message.trim()}
              >
                <Ionicons name="send" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Group Info Modal */}
        <Modal
          visible={showGroupInfoModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowGroupInfoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Group Info</Text>
                <View style={styles.modalHeaderActions}>
                  <TouchableOpacity
                    onPress={() => {
                      fetchAvailableStudentsForGroup(selectedGroup.id);
                      setShowAddStudentsModal(true);
                    }}
                    style={styles.addStudentsButtonHeader}
                  >
                    <Text style={styles.addStudentsButtonTextHeader}>Add Students</Text>
                  </TouchableOpacity>
                  
                  
                  
                  
                </View>
              </View>

              <Text style={styles.sectionTitle}>Group Members ({groupMembers.length})</Text>
              <FlatList
                data={groupMembers.filter(member => member && member.id && member.name)}
                renderItem={({ item }) => {
                  // Additional safety check
                  if (!item || !item.id || !item.name) {
                    console.log('Skipping invalid member:', item);
                    return null;
                  }
                  
                  console.log('=== RENDERING MEMBER ITEM ===');
                  console.log('Member data:', item);
                  console.log('Member name:', item.name);
                  console.log('Member ID:', item.id);
                  console.log('Member type:', item.type);
                  
                  return (
                    <View style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {item.name && item.name.length > 0 ? item.name.charAt(0).toUpperCase() : '?'}
                          </Text>
                        </View>
                        <View style={styles.memberDetails}>
                          <Text style={styles.memberName}>{item.name || 'Unknown User'}</Text>
                          <Text style={styles.memberRole}>{item.role || 'Member'}</Text>
                        </View>
                      </View>
                      {item.type === 'student' && (
                        <View style={styles.memberActions}>
                          {console.log('Rendering student member:', item.name, 'Type:', item.type, 'Current User:', auth.currentUser?.uid, 'Item ID:', item.id)}
                         
                          {auth.currentUser?.uid === item.id ? (
                            <TouchableOpacity
                              style={styles.leaveButton}
                              onPress={() => handleStudentLeaveGroup(item.id, item.name)}
                            >
                              <Text style={styles.leaveButtonText}>Leave</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => {
                                console.log('=== REMOVE BUTTON PRESSED ===');
                                console.log('Student ID:', item.id);
                                console.log('Student Name:', item.name);
                                console.log('Current User:', auth.currentUser?.uid);
                                console.log('Tutor ID:', tutorId);
                                console.log('Selected Group:', selectedGroup?.id);
                                console.log('Selected Group Data:', selectedGroup);
                                removeStudentFromGroup(item.id, item.name);
                              }}
                            >
                              <Text style={styles.removeButtonText}>Remove</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                }}
                keyExtractor={(item) => item?.id || Math.random().toString()}
                style={styles.membersList}
              />
            </View>
          </View>
        </Modal>

        {/* Add Students Modal */}
        <Modal
          visible={showAddStudentsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddStudentsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Students to Group</Text>
                <TouchableOpacity onPress={() => setShowAddStudentsModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Available Students</Text>
              <FlatList
                data={availableStudentsForGroup}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.studentItem,
                      selectedNewStudents.includes(item.id) && styles.selectedStudent
                    ]}
                    onPress={() => toggleNewStudentSelection(item.id)}
                  >
                    <Ionicons
                      name={selectedNewStudents.includes(item.id) ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={selectedNewStudents.includes(item.id) ? "#007AFF" : "#666"}
                    />
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{item.name}</Text>
                      <Text style={styles.studentEmail}>{item.email}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                style={styles.studentsList}
                extraData={selectedNewStudents}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={{ color: '#666' }}>No more available students to add.</Text>
                  </View>
                }
              />

              <TouchableOpacity
                style={[styles.addStudentsButton, loading && styles.disabledButton]}
                onPress={addStudentsToGroup}
                disabled={loading}
              >
                <Text style={styles.addStudentsButtonText}>
                  {loading ? 'Adding...' : 'Add Selected Students'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  createButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    padding: 8,
  },
  groupsList: {
    padding: 16,
  },
  groupItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  studentsList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedStudent: {
    backgroundColor: '#f0f8ff',
  },
  studentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  studentEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  createGroupButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createGroupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  groupInfoButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  tutorMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  studentMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 12,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: '#666',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  membersList: {
    maxHeight: 300,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  addStudentsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addStudentsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addStudentsButtonHeader: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  addStudentsButtonTextHeader: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  testUserButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  testUserButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  directTestButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  directTestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  manualFetchButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  manualFetchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stateTestButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  stateTestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
