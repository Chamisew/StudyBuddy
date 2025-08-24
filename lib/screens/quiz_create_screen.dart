import 'package:flutter/material.dart';
import '../services/quiz_service.dart';
import '../models/quiz.dart';
import '../services/auth_service.dart';

class QuizCreateScreen extends StatefulWidget {
  const QuizCreateScreen({super.key});

  @override
  State<QuizCreateScreen> createState() => _QuizCreateScreenState();
}

class _QuizCreateScreenState extends State<QuizCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _link = TextEditingController();
  DateTime _openAt = DateTime.now();
  DateTime _closeAt = DateTime.now().add(const Duration(days: 7));
  bool _saving = false;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final auth = AuthService();
    final user = auth.currentUser;
    if (user == null || user.role.toLowerCase() != 'tutor') {
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Only tutors can create quizzes')));
      return;
    }
    final quiz = Quiz(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: _title.text.trim(),
      description: _desc.text.trim(),
      linkUrl: _link.text.trim(),
      openAt: _openAt,
      closeAt: _closeAt,
      creatorId: user.id,
      creatorName: user.name,
    );
    final ok = await QuizService().createQuiz(quiz);
    setState(() => _saving = false);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Quiz created')));
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to create quiz')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Quiz')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _title,
                decoration: const InputDecoration(labelText: 'Title', border: OutlineInputBorder()),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _desc,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _link,
                decoration: const InputDecoration(labelText: 'Quiz link (URL)', border: OutlineInputBorder()),
                validator: (v) => (v == null || !v.contains('http')) ? 'Enter valid URL' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Opens'),
                      subtitle: Text(_openAt.toLocal().toString()),
                      onTap: () async {
                        final d = await showDatePicker(context: context, initialDate: _openAt, firstDate: DateTime(2020), lastDate: DateTime(2100));
                        if (d != null) setState(() => _openAt = DateTime(d.year, d.month, d.day, _openAt.hour, _openAt.minute));
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Closes'),
                      subtitle: Text(_closeAt.toLocal().toString()),
                      onTap: () async {
                        final d = await showDatePicker(context: context, initialDate: _closeAt, firstDate: DateTime(2020), lastDate: DateTime(2100));
                        if (d != null) setState(() => _closeAt = DateTime(d.year, d.month, d.day, _closeAt.hour, _closeAt.minute));
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  child: _saving ? const CircularProgressIndicator() : const Text('Create Quiz'),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}


