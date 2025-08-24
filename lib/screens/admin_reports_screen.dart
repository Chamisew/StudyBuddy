import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/moderation_service.dart';

class AdminReportsScreen extends StatefulWidget {
  const AdminReportsScreen({super.key});

  @override
  State<AdminReportsScreen> createState() => _AdminReportsScreenState();
}

class _AdminReportsScreenState extends State<AdminReportsScreen> {
  final ModerationService _service = ModerationService();
  bool _loading = true;
  List<QueryDocumentSnapshot<Map<String, dynamic>>> _reports = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    _reports = await _service.fetchOpenReports();
    setState(() => _loading = false);
  }

  Future<void> _block(String reportId, String userId) async {
    await _service.blockUser(userId, reason: 'Reported by users');
    await _service.markReportBlocked(reportId);
    await _load();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User blocked')));
    }
  }

  Future<void> _resolve(String reportId) async {
    await _service.resolveReport(reportId);
    await _load();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report resolved')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('User Reports')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _reports.length,
                itemBuilder: (context, i) {
                  final r = _reports[i];
                  final data = r.data();
                  return Card(
                    child: ListTile(
                      title: Text(data['reason'] ?? 'No reason'),
                      subtitle: Text('reportedUserId: ${data['reportedUserId']}\nreporterId: ${data['reporterId']}\nstatus: ${data['status']}'),
                      isThreeLine: true,
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.gavel, color: Colors.red),
                            tooltip: 'Block user',
                            onPressed: () => _block(r.id, data['reportedUserId']),
                          ),
                          IconButton(
                            icon: const Icon(Icons.check_circle, color: Colors.green),
                            tooltip: 'Resolve',
                            onPressed: () => _resolve(r.id),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}


