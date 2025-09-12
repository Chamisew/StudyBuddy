import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

export default function HelpdeskAdminScreen() {
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('applications'); // 'applications' or 'helpers'

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const me = await getDoc(doc(db, "users", uid));
        const data = me.exists() ? me.data() : {};
        const admin = !!data.isAdmin || /\+admin/.test(auth.currentUser?.email || "");
        setIsAdmin(admin);
        
        if (!admin) return;
        
        // Load applications
        const appsSnap = await getDocs(collection(db, "helpdeskApplicants"));
        const appsList = [];
        appsSnap.forEach((d) => {
          const appData = d.data();
          appsList.push({ 
            id: d.id, 
            ...appData,
            appliedAt: appData.updatedAt || appData.createdAt
          });
        });
        // Sort by application date
        appsList.sort((a, b) => {
          const timeA = a.appliedAt?.seconds || 0;
          const timeB = b.appliedAt?.seconds || 0;
          return timeB - timeA;
        });
        setApps(appsList);
        
        // Load current helpers
        const helpersSnap = await getDocs(collection(db, "helpdeskHelpers"));
        const helpersList = [];
        helpersSnap.forEach((d) => {
          const helperData = d.data();
          helpersList.push({ 
            id: d.id, 
            ...helperData
          });
        });
        // Sort by approval date
        helpersList.sort((a, b) => {
          const timeA = a.approvedAt?.seconds || 0;
          const timeB = b.approvedAt?.seconds || 0;
          return timeB - timeA;
        });
        setHelpers(helpersList);
        
      } catch (error) {
        console.error("Error loading admin data:", error);
      }
    };
    checkAdminAndLoadData();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid || !isAdmin) return;
      
      // Reload applications
      const appsSnap = await getDocs(collection(db, "helpdeskApplicants"));
      const appsList = [];
      appsSnap.forEach((d) => {
        const appData = d.data();
        appsList.push({ 
          id: d.id, 
          ...appData,
          appliedAt: appData.updatedAt || appData.createdAt
        });
      });
      appsList.sort((a, b) => {
        const timeA = a.appliedAt?.seconds || 0;
        const timeB = b.appliedAt?.seconds || 0;
        return timeB - timeA;
      });
      setApps(appsList);
      
      // Reload helpers
      const helpersSnap = await getDocs(collection(db, "helpdeskHelpers"));
      const helpersList = [];
      helpersSnap.forEach((d) => {
        const helperData = d.data();
        helpersList.push({ 
          id: d.id, 
          ...helperData
        });
      });
      helpersList.sort((a, b) => {
        const timeA = a.approvedAt?.seconds || 0;
        const timeB = b.approvedAt?.seconds || 0;
        return timeB - timeA;
      });
      setHelpers(helpersList);
      
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const approve = async (app) => {
    if (!isAdmin) return;
    try {
      // Add to helpdesk helpers
      await setDoc(doc(db, "helpdeskHelpers", app.id), {
        subjects: app.subjects || [],
        bio: app.bio || "",
        email: app.email || "",
        name: app.name || app.email || "",
        highestQualification: app.highestQualification || "",
        yearsExperience: app.yearsExperience || 0,
        rating: 0,
        approvedAt: new Date(),
        approvedBy: auth.currentUser?.uid,
      }, { merge: true });
      
      // Ensure user is marked as tutor
      await setDoc(doc(db, "users", app.id), { isTutor: true }, { merge: true });
      
      // Update application status
      await updateDoc(doc(db, "helpdeskApplicants", app.id), { 
        status: "approved",
        approvedAt: new Date(),
        approvedBy: auth.currentUser?.uid
      });
      
      Alert.alert("Approved", `${app.name || app.email} has been approved as a helper and can now assist students.`);
      
      // Refresh data to show updates
      refreshData();
    } catch (e) {
      console.error("Error approving application:", e);
      Alert.alert("Error", "Failed to approve application. Please try again.");
    }
  };

  const reject = async (app) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "helpdeskApplicants", app.id), { 
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: auth.currentUser?.uid
      });
      Alert.alert("Rejected", `${app.name || app.email}'s application has been rejected.`);
      
      // Refresh data to show updates
      refreshData();
    } catch (e) {
      console.error("Error rejecting application:", e);
      Alert.alert("Error", "Failed to reject application. Please try again.");
    }
  };

  const removeHelper = async (helper) => {
    if (!isAdmin) return;
    
    Alert.alert(
      "Remove Helper",
      `Are you sure you want to remove ${helper.name || helper.email} from the helpdesk? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove from helpers
              await deleteDoc(doc(db, "helpdeskHelpers", helper.id));
              
              // Update user profile to remove tutor status
              await setDoc(doc(db, "users", helper.id), { isTutor: false }, { merge: true });
              
              // Update application status if exists
              try {
                await updateDoc(doc(db, "helpdeskApplicants", helper.id), { 
                  status: "removed",
                  removedAt: new Date(),
                  removedBy: auth.currentUser?.uid
                });
              } catch {} // Application might not exist
              
              Alert.alert("Removed", `${helper.name || helper.email} has been removed from the helpdesk.`);
              
              // Refresh data
              refreshData();
            } catch (e) {
              console.error("Error removing helper:", e);
              Alert.alert("Error", "Failed to remove helper. Please try again.");
            }
          }
        }
      ]
    );
  };

  const renderApplication = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name || item.email || item.id}</Text>
        <Text style={styles.meta}>Email: {item.email}</Text>
        <Text style={styles.meta}>Subjects: {(item.subjects || []).join(", ")}</Text>
        {item.highestQualification ? (
          <Text style={styles.meta}>Qualification: {item.highestQualification}</Text>
        ) : null}
        {item.yearsExperience !== undefined ? (
          <Text style={styles.meta}>Experience: {item.yearsExperience} year(s)</Text>
        ) : null}
        {item.bio ? (
          <Text style={styles.meta}>Bio: {item.bio}</Text>
        ) : null}
        <View style={styles.statusRow}>
          <Text style={[styles.status, { color: item.status === 'approved' ? '#34C759' : item.status === 'rejected' ? '#ff3b30' : '#007AFF' }]}>
            Status: {item.status || 'pending'}
          </Text>
          {item.appliedAt && (
            <Text style={styles.date}>
              Applied: {new Date(item.appliedAt.seconds * 1000).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      {isAdmin && item.status === 'pending' && (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#34C759' }]} onPress={() => approve(item)}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#ff3b30', marginLeft: 8 }]} onPress={() => reject(item)}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderHelper = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name || item.email || item.id}</Text>
        <Text style={styles.meta}>Email: {item.email}</Text>
        <Text style={styles.meta}>Subjects: {(item.subjects || []).join(", ")}</Text>
        {item.highestQualification ? (
          <Text style={styles.meta}>Qualification: {item.highestQualification}</Text>
        ) : null}
        {item.yearsExperience !== undefined ? (
          <Text style={styles.meta}>Experience: {item.yearsExperience} year(s)</Text>
        ) : null}
        <View style={styles.statusRow}>
          <Text style={[styles.status, { color: '#34C759' }]}>Active Helper</Text>
          {item.approvedAt && (
            <Text style={styles.date}>
              Approved: {new Date(item.approvedAt.seconds * 1000).toLocaleDateString()}
            </Text>
          )}
        </View>
        <Text style={styles.meta}>Rating: {(item.rating || 0).toFixed(1)} ⭐</Text>
      </View>
      {isAdmin && (
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#ff3b30' }]} onPress={() => removeHelper(item)}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      )}
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
        <Text style={styles.title}>Helpdesk Admin</Text>
        {isAdmin && (
          <TouchableOpacity 
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'applications' ? 'helpers' : 'applications')}
          >
            <Ionicons 
              name={viewMode === 'applications' ? 'people-outline' : 'document-text-outline'} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {!isAdmin ? (
        <View style={styles.noAccessContainer}>
          <Ionicons name="shield-outline" size={64} color="#ccc" />
          <Text style={styles.noAccessTitle}>Access Denied</Text>
          <Text style={styles.noAccessText}>You don't have admin privileges to access this page.</Text>
        </View>
      ) : (
        <>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, viewMode === 'applications' && styles.activeTab]}
              onPress={() => setViewMode('applications')}
            >
              <Text style={[styles.tabText, viewMode === 'applications' && styles.activeTabText]}>
                Applications ({apps.filter(app => app.status === 'pending').length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, viewMode === 'helpers' && styles.activeTab]}
              onPress={() => setViewMode('helpers')}
            >
              <Text style={[styles.tabText, viewMode === 'helpers' && styles.activeTabText]}>
                Active Helpers ({helpers.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={viewMode === 'applications' ? apps : helpers}
            keyExtractor={(item) => item.id}
            renderItem={viewMode === 'applications' ? renderApplication : renderHelper}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshData}
                colors={['#007AFF']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons 
                  name={viewMode === 'applications' ? 'document-text-outline' : 'people-outline'} 
                  size={64} 
                  color="#ccc" 
                />
                <Text style={styles.emptyText}>
                  {viewMode === 'applications' ? 'No applications' : 'No active helpers'}
                </Text>
                <Text style={styles.emptySubText}>
                  {viewMode === 'applications' 
                    ? 'Tutor applications will appear here when submitted' 
                    : 'Approved helpers will appear here'
                  }
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 16,
  },
  viewToggle: {
    padding: 8,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#111", flex: 1 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  noAccessTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  noAccessText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  card: { 
    backgroundColor: '#f7f7fa', 
    borderRadius: 12, 
    padding: 12, 
    marginVertical: 6, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, color: '#666', marginTop: 2 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  status: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  date: { fontSize: 11, color: '#999' },
  btn: { padding: 8, borderRadius: 10 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
  },
});



