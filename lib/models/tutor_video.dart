class TutorVideo {
  final String id;
  final String title;
  final String description;
  final String videoUrl;
  final String thumbnailUrl;
  final String tutorId;
  final String tutorName;
  final String tutorSubject;
  final String uploaderId;
  final String uploaderName;
  final DateTime uploadDate;
  final List<VideoRating> ratings;
  final List<VideoComment> comments;
  final int viewCount;
  final double averageRating;

  TutorVideo({
    required this.id,
    required this.title,
    required this.description,
    required this.videoUrl,
    required this.thumbnailUrl,
    required this.tutorId,
    required this.tutorName,
    required this.tutorSubject,
    required this.uploaderId,
    required this.uploaderName,
    required this.uploadDate,
    this.ratings = const [],
    this.comments = const [],
    this.viewCount = 0,
    this.averageRating = 0.0,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'tutorId': tutorId,
      'tutorName': tutorName,
      'tutorSubject': tutorSubject,
      'uploaderId': uploaderId,
      'uploaderName': uploaderName,
      'uploadDate': uploadDate.toIso8601String(),
      'ratings': ratings.map((rating) => rating.toJson()).toList(),
      'comments': comments.map((comment) => comment.toJson()).toList(),
      'viewCount': viewCount,
      'averageRating': averageRating,
    };
  }

  factory TutorVideo.fromJson(Map<String, dynamic> json) {
    return TutorVideo(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      videoUrl: json['videoUrl'],
      thumbnailUrl: json['thumbnailUrl'],
      tutorId: json['tutorId'],
      tutorName: json['tutorName'],
      tutorSubject: json['tutorSubject'],
      uploaderId: json['uploaderId'],
      uploaderName: json['uploaderName'],
      uploadDate: DateTime.parse(json['uploadDate']),
      ratings: (json['ratings'] as List?)
          ?.map((rating) => VideoRating.fromJson(rating))
          .toList() ?? [],
      comments: (json['comments'] as List?)
          ?.map((comment) => VideoComment.fromJson(comment))
          .toList() ?? [],
      viewCount: json['viewCount'] ?? 0,
      averageRating: (json['averageRating'] ?? 0.0).toDouble(),
    );
  }

  TutorVideo copyWith({
    String? id,
    String? title,
    String? description,
    String? videoUrl,
    String? thumbnailUrl,
    String? tutorId,
    String? tutorName,
    String? tutorSubject,
    String? uploaderId,
    String? uploaderName,
    DateTime? uploadDate,
    List<VideoRating>? ratings,
    List<VideoComment>? comments,
    int? viewCount,
    double? averageRating,
  }) {
    return TutorVideo(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      videoUrl: videoUrl ?? this.videoUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      tutorId: tutorId ?? this.tutorId,
      tutorName: tutorName ?? this.tutorName,
      tutorSubject: tutorSubject ?? this.tutorSubject,
      uploaderId: uploaderId ?? this.uploaderId,
      uploaderName: uploaderName ?? this.uploaderName,
      uploadDate: uploadDate ?? this.uploadDate,
      ratings: ratings ?? this.ratings,
      comments: comments ?? this.comments,
      viewCount: viewCount ?? this.viewCount,
      averageRating: averageRating ?? this.averageRating,
    );
  }
}

class VideoRating {
  final String id;
  final String userId;
  final String userName;
  final int rating; // 1-5 stars
  final String? comment;
  final DateTime ratingDate;

  VideoRating({
    required this.id,
    required this.userId,
    required this.userName,
    required this.rating,
    this.comment,
    required this.ratingDate,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'rating': rating,
      'comment': comment,
      'ratingDate': ratingDate.toIso8601String(),
    };
  }

  factory VideoRating.fromJson(Map<String, dynamic> json) {
    return VideoRating(
      id: json['id'],
      userId: json['userId'],
      userName: json['userName'],
      rating: json['rating'],
      comment: json['comment'],
      ratingDate: DateTime.parse(json['ratingDate']),
    );
  }
}

class VideoComment {
  final String id;
  final String userId;
  final String userName;
  final String comment;
  final DateTime commentDate;
  final List<CommentReply> replies;

  VideoComment({
    required this.id,
    required this.userId,
    required this.userName,
    required this.comment,
    required this.commentDate,
    this.replies = const [],
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'comment': comment,
      'commentDate': commentDate.toIso8601String(),
      'replies': replies.map((reply) => reply.toJson()).toList(),
    };
  }

  factory VideoComment.fromJson(Map<String, dynamic> json) {
    return VideoComment(
      id: json['id'],
      userId: json['userId'],
      userName: json['userName'],
      comment: json['comment'],
      commentDate: DateTime.parse(json['commentDate']),
      replies: (json['replies'] as List?)
          ?.map((reply) => CommentReply.fromJson(reply))
          .toList() ?? [],
    );
  }
}

class CommentReply {
  final String id;
  final String userId;
  final String userName;
  final String reply;
  final DateTime replyDate;

  CommentReply({
    required this.id,
    required this.userId,
    required this.userName,
    required this.reply,
    required this.replyDate,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'reply': reply,
      'replyDate': replyDate.toIso8601String(),
    };
  }

  factory CommentReply.fromJson(Map<String, dynamic> json) {
    return CommentReply(
      id: json['id'],
      userId: json['userId'],
      userName: json['userName'],
      reply: json['reply'],
      replyDate: DateTime.parse(json['replyDate']),
    );
  }
}
