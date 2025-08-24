import 'package:flutter/material.dart';
import '../models/chat_group.dart';
import '../services/chat_service.dart';
import '../services/auth_service.dart';

class GroupChatScreen extends StatefulWidget {
  final ChatGroup group;
  const GroupChatScreen({super.key, required this.group});

  @override
  State<GroupChatScreen> createState() => _GroupChatScreenState();
}

class _GroupChatScreenState extends State<GroupChatScreen> {
  final _msgCtrl = TextEditingController();
  final _service = ChatService();

  @override
  void dispose() {
    _msgCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;
    final auth = AuthService();
    final u = auth.currentUser;
    if (u == null) return;
    final msg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      groupId: widget.group.id,
      senderId: u.id,
      senderName: u.name,
      text: text,
      sentAt: DateTime.now(),
    );
    await _service.sendMessage(widget.group.id, msg);
    _msgCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = AuthService().currentUser?.id == widget.group.adminId;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.group.name),
        actions: [
          if (isAdmin)
            IconButton(
              icon: const Icon(Icons.group),
              onPressed: () async {
                final idCtrl = TextEditingController();
                final nameCtrl = TextEditingController();
                await showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Add member'),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TextField(controller: idCtrl, decoration: const InputDecoration(labelText: 'User ID')),
                        TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'User name')),
                      ],
                    ),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                      ElevatedButton(
                        onPressed: () async {
                          if (idCtrl.text.trim().isEmpty || nameCtrl.text.trim().isEmpty) return;
                          await ChatService().addMember(widget.group.id, idCtrl.text.trim(), nameCtrl.text.trim());
                          if (context.mounted) Navigator.pop(context);
                        },
                        child: const Text('Add'),
                      )
                    ],
                  ),
                );
              },
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder(
              stream: _service.watchMessages(widget.group.id),
              builder: (context, snap) {
                if (!snap.hasData) return const Center(child: CircularProgressIndicator());
                final messages = snap.data!;
                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: messages.length,
                  itemBuilder: (context, i) {
                    final m = messages[i];
                    final mine = AuthService().currentUser?.id == m.senderId;
                    return Align(
                      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: mine ? Colors.blue[100] : Colors.grey[200],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(m.senderName, style: const TextStyle(fontSize: 10, color: Colors.black54)),
                            const SizedBox(height: 2),
                            Text(m.text),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Message',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(onPressed: _send, icon: const Icon(Icons.send))
              ],
            ),
          )
        ],
      ),
    );
  }
}


