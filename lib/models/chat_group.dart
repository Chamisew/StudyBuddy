class ChatGroup {
  final String id;
  final String name;
  final String topic;
  final String adminId;
  final String adminName;
  final List<Map<String, String>> members; // [{id,name}]
  final DateTime createdAt;

  ChatGroup({
    required this.id,
    required this.name,
    required this.topic,
    required this.adminId,
    required this.adminName,
    required this.members,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'topic': topic,
        'adminId': adminId,
        'adminName': adminName,
        'members': members,
        'createdAt': createdAt.toIso8601String(),
      };

  factory ChatGroup.fromJson(Map<String, dynamic> json) => ChatGroup(
        id: json['id'],
        name: json['name'],
        topic: json['topic'] ?? '',
        adminId: json['adminId'],
        adminName: json['adminName'],
        members: (json['members'] as List? )
                ?.map((e) => Map<String, String>.from(e as Map))
                .toList() ??
            const [],
        createdAt: DateTime.parse(json['createdAt']),
      );
}

class ChatMessage {
  final String id;
  final String groupId;
  final String senderId;
  final String senderName;
  final String text;
  final DateTime sentAt;

  ChatMessage({
    required this.id,
    required this.groupId,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.sentAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'groupId': groupId,
        'senderId': senderId,
        'senderName': senderName,
        'text': text,
        'sentAt': sentAt.toIso8601String(),
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'],
        groupId: json['groupId'],
        senderId: json['senderId'],
        senderName: json['senderName'],
        text: json['text'],
        sentAt: DateTime.parse(json['sentAt']),
      );
}


