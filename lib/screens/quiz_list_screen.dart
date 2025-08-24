import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/quiz_service.dart';
import '../models/quiz.dart';
import '../services/auth_service.dart';

class QuizListScreen extends StatefulWidget {
  const QuizListScreen({super.key});

  @override
  State<QuizListScreen> createState() => _QuizListScreenState();
}

class _QuizListScreenState extends State<QuizListScreen> {
  final QuizService _service = QuizService();
  bool _loading = true;
  List<Quiz> _quizzes = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    _quizzes = await _service.listActiveQuizzes();
    setState(() => _loading = false);
  }

  Future<void> _openQuiz(Quiz quiz) async {
    final url = Uri.parse(quiz.linkUrl);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      final auth = AuthService();
      final userId = auth.currentUser?.id;
      if (userId != null) {
        await _service.submitQuiz(quiz.id, userId);
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cannot open link')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quizzes'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh))
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _quizzes.isEmpty
              ? const Center(child: Text('No active quizzes'))
              : ListView.builder(
                  itemCount: _quizzes.length,
                  itemBuilder: (context, i) {
                    final q = _quizzes[i];
                    return Card(
                      child: ListTile(
                        title: Text(q.title),
                        subtitle: Text('${q.description}\nOpen: ${q.openAt}\nClose: ${q.closeAt}'),
                        isThreeLine: true,
                        trailing: const Icon(Icons.open_in_new),
                        onTap: () => _openQuiz(q),
                      ),
                    );
                  },
                ),
    );
  }
}


