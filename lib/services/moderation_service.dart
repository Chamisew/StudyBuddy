import 'package:cloud_firestore/cloud_firestore.dart';

class ModerationService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<bool> submitReport({
    required String reporterId,
    required String reportedUserId,
    required String reason,
    String? details,
  }) async {
    try {
      await _db.collection('reports').add({
        'reporterId': reporterId,
        'reportedUserId': reportedUserId,
        'reason': reason,
        'details': details,
        'status': 'open',
        'createdAt': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<List<QueryDocumentSnapshot<Map<String, dynamic>>>> fetchOpenReports() async {
    final q = await _db
        .collection('reports')
        .orderBy('createdAt', descending: true)
        .get();
    return q.docs;
  }

  Future<void> blockUser(String userId, {String? reason}) async {
    await _db.collection('blocked_users').doc(userId).set({
      'blocked': true,
      'reason': reason,
      'blockedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> unblockUser(String userId) async {
    await _db.collection('blocked_users').doc(userId).delete();
  }

  Future<bool> isUserBlocked(String userId) async {
    final doc = await _db.collection('blocked_users').doc(userId).get();
    return doc.exists && (doc.data()?['blocked'] == true);
  }

  Future<void> resolveReport(String reportId) async {
    await _db.collection('reports').doc(reportId).update({'status': 'resolved'});
  }

  Future<void> markReportBlocked(String reportId) async {
    await _db.collection('reports').doc(reportId).update({'status': 'blocked'});
  }
}


