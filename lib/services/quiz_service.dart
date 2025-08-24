import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/quiz.dart';

class QuizService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<bool> createQuiz(Quiz quiz) async {
    try {
      await _db.collection('quizzes').doc(quiz.id).set(quiz.toJson());
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<List<Quiz>> listActiveQuizzes() async {
    final now = DateTime.now().toIso8601String();
    final q = await _db
        .collection('quizzes')
        .where('openAt', isLessThanOrEqualTo: now)
        .where('closeAt', isGreaterThanOrEqualTo: now)
        .get();
    return q.docs.map((d) => Quiz.fromJson(d.data())).toList();
  }

  Future<bool> submitQuiz(String quizId, String userId, {double score = 0}) async {
    try {
      final id = DateTime.now().millisecondsSinceEpoch.toString();
      final submission = QuizSubmission(
        id: id,
        quizId: quizId,
        userId: userId,
        submittedAt: DateTime.now(),
        score: score,
      );
      await _db.collection('quiz_submissions').doc(id).set(submission.toJson());
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<int> countUserSubmissions(String userId) async {
    final q = await _db
        .collection('quiz_submissions')
        .where('userId', isEqualTo: userId)
        .get();
    return q.size;
  }
}


