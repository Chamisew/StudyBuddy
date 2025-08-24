class Quiz {
  final String id;
  final String title;
  final String description;
  final String linkUrl;
  final DateTime openAt;
  final DateTime closeAt;
  final String creatorId; // tutor id
  final String creatorName;

  Quiz({
    required this.id,
    required this.title,
    required this.description,
    required this.linkUrl,
    required this.openAt,
    required this.closeAt,
    required this.creatorId,
    required this.creatorName,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'linkUrl': linkUrl,
        'openAt': openAt.toIso8601String(),
        'closeAt': closeAt.toIso8601String(),
        'creatorId': creatorId,
        'creatorName': creatorName,
      };

  factory Quiz.fromJson(Map<String, dynamic> json) => Quiz(
        id: json['id'],
        title: json['title'],
        description: json['description'],
        linkUrl: json['linkUrl'],
        openAt: DateTime.parse(json['openAt']),
        closeAt: DateTime.parse(json['closeAt']),
        creatorId: json['creatorId'],
        creatorName: json['creatorName'],
      );
}

class QuizSubmission {
  final String id;
  final String quizId;
  final String userId;
  final DateTime submittedAt;
  final double score; // optional metric

  QuizSubmission({
    required this.id,
    required this.quizId,
    required this.userId,
    required this.submittedAt,
    required this.score,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'quizId': quizId,
        'userId': userId,
        'submittedAt': submittedAt.toIso8601String(),
        'score': score,
      };

  factory QuizSubmission.fromJson(Map<String, dynamic> json) => QuizSubmission(
        id: json['id'],
        quizId: json['quizId'],
        userId: json['userId'],
        submittedAt: DateTime.parse(json['submittedAt']),
        score: (json['score'] ?? 0.0) * 1.0,
      );
}


