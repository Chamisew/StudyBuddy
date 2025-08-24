import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/tutor_video_service.dart';
import 'report_user_screen.dart';
import '../services/quiz_service.dart';
import '../models/tutor_video.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AuthService();
    final user = auth.currentUser;
    final videoService = TutorVideoService();
    final userVideos = user == null
        ? <TutorVideo>[]
        : videoService.getAllVideos().where((v) => v.uploaderId == user.id).toList();

    if (user == null) {
      return const Scaffold(body: Center(child: Text('Not logged in')));
    }

    final isTutor = user.role.toLowerCase() == 'tutor';
    
    String _gradeFromCount(int c) {
      if (c >= 8) return 'A';
      if (c >= 4) return 'A-';
      if (c >= 1) return 'B';
      return '—';
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: Colors.blue,
                      child: Text(
                        user.name.substring(0, 1).toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                    ),
                    if (isTutor)
                      Positioned(
                        right: -2,
                        bottom: -2,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.orange,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'TUTOR',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('${user.role.toUpperCase()} • ${user.grade}', style: TextStyle(color: Colors.grey[700])),
                      Text(user.email, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                if (!isTutor)
                  OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => ReportUserScreen(
                            reportedUserId: user.id,
                            reportedUserName: user.name,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.report, size: 16),
                    label: const Text('Report'),
                  ),
              ],
            ),
            const SizedBox(height: 24),
            FutureBuilder<int>(
              future: QuizService().countUserSubmissions(user.id),
              builder: (context, snap) {
                final cnt = snap.data ?? 0;
                final grade = _gradeFromCount(cnt);
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.purple.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.grade, color: Colors.purple),
                      const SizedBox(width: 8),
                      Text(snap.connectionState == ConnectionState.waiting
                          ? 'Quiz grade: calculating...'
                          : 'Quiz grade: $grade (completed $cnt)'),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            Text('Your uploads (${userVideos.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (userVideos.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('No uploads yet'),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: userVideos.length,
                itemBuilder: (context, index) {
                  final v = userVideos[index];
                  return ListTile(
                    leading: const Icon(Icons.video_library),
                    title: Text(v.title),
                    subtitle: Text(v.tutorSubject),
                  );
                },
              )
          ],
        ),
      ),
    );
  }
}


