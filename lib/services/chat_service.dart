import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/chat_group.dart';

class ChatService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<ChatGroup>> watchGroups() {
    return _db
        .collection('chat_groups')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((s) => s.docs.map((d) => ChatGroup.fromJson(d.data())).toList());
  }

  Future<String?> createGroup({
    required String name,
    required String topic,
    required String adminId,
    required String adminName,
  }) async {
    try {
      final id = DateTime.now().millisecondsSinceEpoch.toString();
      final group = ChatGroup(
        id: id,
        name: name,
        topic: topic,
        adminId: adminId,
        adminName: adminName,
        members: [
          {'id': adminId, 'name': adminName},
        ],
        createdAt: DateTime.now(),
      );
      await _db.collection('chat_groups').doc(id).set(group.toJson());
      return id;
    } catch (_) {
      return null;
    }
  }

  Future<bool> addMember(String groupId, String userId, String userName) async {
    try {
      await _db.collection('chat_groups').doc(groupId).update({
        'members': FieldValue.arrayUnion([
          {'id': userId, 'name': userName}
        ])
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> removeMember(String groupId, String userId, String userName) async {
    try {
      await _db.collection('chat_groups').doc(groupId).update({
        'members': FieldValue.arrayRemove([
          {'id': userId, 'name': userName}
        ])
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  Stream<List<ChatMessage>> watchMessages(String groupId) {
    return _db
        .collection('chat_groups')
        .doc(groupId)
        .collection('messages')
        .orderBy('sentAt', descending: false)
        .snapshots()
        .map((s) => s.docs
            .map((d) => ChatMessage.fromJson(d.data()))
            .toList());
  }

  Future<void> sendMessage(String groupId, ChatMessage message) async {
    await _db
        .collection('chat_groups')
        .doc(groupId)
        .collection('messages')
        .doc(message.id)
        .set(message.toJson());
  }
}


