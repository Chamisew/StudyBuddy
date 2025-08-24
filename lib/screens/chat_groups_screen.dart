import 'package:flutter/material.dart';
import '../services/chat_service.dart';
import '../models/chat_group.dart';
import '../services/auth_service.dart';
import 'group_chat_screen.dart';

class ChatGroupsScreen extends StatelessWidget {
  const ChatGroupsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final service = ChatService();
    final auth = AuthService();
    final user = auth.currentUser;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat Groups'),
      ),
      body: StreamBuilder<List<ChatGroup>>(
        stream: service.watchGroups(),
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final groups = snap.data!;
          if (groups.isEmpty) return const Center(child: Text('No groups yet'));
          return ListView.builder(
            itemCount: groups.length,
            itemBuilder: (context, i) {
              final g = groups[i];
              final isMember = g.members.any((m) => m['id'] == user?.id);
              return Card(
                child: ListTile(
                  title: Text(g.name),
                  subtitle: Text(g.topic.isEmpty ? 'No topic' : g.topic),
                  trailing: isMember ? const Icon(Icons.keyboard_arrow_right) : const SizedBox.shrink(),
                  onTap: isMember
                      ? () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (context) => GroupChatScreen(group: g)),
                          );
                        }
                      : null,
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final nameCtrl = TextEditingController();
          final topicCtrl = TextEditingController();
          await showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Create Group'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
                  TextField(controller: topicCtrl, decoration: const InputDecoration(labelText: 'Topic (optional)')),
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: () async {
                    final u = auth.currentUser;
                    if (u == null || nameCtrl.text.trim().isEmpty) return;
                    final id = await service.createGroup(
                      name: nameCtrl.text.trim(),
                      topic: topicCtrl.text.trim(),
                      adminId: u.id,
                      adminName: u.name,
                    );
                    if (id != null && context.mounted) Navigator.pop(context);
                  },
                  child: const Text('Create'),
                ),
              ],
            ),
          );
        },
        child: const Icon(Icons.group_add),
      ),
    );
  }
}


