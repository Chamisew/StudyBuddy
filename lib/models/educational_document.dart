class EducationalDocument {
  final String id;
  final String title;
  final String description;
  final String fileName;
  final String fileUrl;
  final String fileType; // pdf, doc, docx, txt, etc.
  final int fileSize; // in bytes
  final String subject;
  final String grade;
  final String uploaderId;
  final String uploaderName;
  final DateTime uploadDate;
  final List<DocumentRating> ratings;
  final List<DocumentComment> comments;
  final int downloadCount;
  final int viewCount;
  final double averageRating;
  final List<String> tags;

  EducationalDocument({
    required this.id,
    required this.title,
    required this.description,
    required this.fileName,
    required this.fileUrl,
    required this.fileType,
    required this.fileSize,
    required this.subject,
    required this.grade,
    required this.uploaderId,
    required this.uploaderName,
    required this.uploadDate,
    this.ratings = const [],
    this.comments = const [],
    this.downloadCount = 0,
    this.viewCount = 0,
    this.averageRating = 0.0,
    this.tags = const [],
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'fileName': fileName,
      'fileUrl': fileUrl,
      'fileType': fileType,
      'fileSize': fileSize,
      'subject': subject,
      'grade': grade,
      'uploaderId': uploaderId,
      'uploaderName': uploaderName,
      'uploadDate': uploadDate.toIso8601String(),
      'ratings': ratings.map((rating) => rating.toJson()).toList(),
      'comments': comments.map((comment) => comment.toJson()).toList(),
      'downloadCount': downloadCount,
      'viewCount': viewCount,
      'averageRating': averageRating,
      'tags': tags,
    };
  }

  factory EducationalDocument.fromJson(Map<String, dynamic> json) {
    return EducationalDocument(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      fileName: json['fileName'],
      fileUrl: json['fileUrl'],
      fileType: json['fileType'],
      fileSize: json['fileSize'],
      subject: json['subject'],
      grade: json['grade'],
      uploaderId: json['uploaderId'],
      uploaderName: json['uploaderName'],
      uploadDate: DateTime.parse(json['uploadDate']),
      ratings: (json['ratings'] as List?)
          ?.map((rating) => DocumentRating.fromJson(rating))
          .toList() ?? [],
      comments: (json['comments'] as List?)
          ?.map((comment) => DocumentComment.fromJson(comment))
          .toList() ?? [],
      downloadCount: json['downloadCount'] ?? 0,
      viewCount: json['viewCount'] ?? 0,
      averageRating: (json['averageRating'] ?? 0.0).toDouble(),
      tags: (json['tags'] as List?)?.cast<String>() ?? [],
    );
  }

  EducationalDocument copyWith({
    String? id,
    String? title,
    String? description,
    String? fileName,
    String? fileUrl,
    String? fileType,
    int? fileSize,
    String? subject,
    String? grade,
    String? uploaderId,
    String? uploaderName,
    DateTime? uploadDate,
    List<DocumentRating>? ratings,
    List<DocumentComment>? comments,
    int? downloadCount,
    int? viewCount,
    double? averageRating,
    List<String>? tags,
  }) {
    return EducationalDocument(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      fileName: fileName ?? this.fileName,
      fileUrl: fileUrl ?? this.fileUrl,
      fileType: fileType ?? this.fileType,
      fileSize: fileSize ?? this.fileSize,
      subject: subject ?? this.subject,
      grade: grade ?? this.grade,
      uploaderId: uploaderId ?? this.uploaderId,
      uploaderName: uploaderName ?? this.uploaderName,
      uploadDate: uploadDate ?? this.uploadDate,
      ratings: ratings ?? this.ratings,
      comments: comments ?? this.comments,
      downloadCount: downloadCount ?? this.downloadCount,
      viewCount: viewCount ?? this.viewCount,
      averageRating: averageRating ?? this.averageRating,
      tags: tags ?? this.tags,
    );
  }

  String get fileSizeFormatted {
    if (fileSize < 1024) {
      return '${fileSize} B';
    } else if (fileSize < 1024 * 1024) {
      return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    } else {
      return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
  }

  String get fileTypeIcon {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'xls':
      case 'xlsx':
        return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📁';
    }
  }
}

class DocumentRating {
  final String id;
  final String userId;
  final String userName;
  final int rating; // 1-5 stars
  final String? comment;
  final DateTime ratingDate;

  DocumentRating({
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

  factory DocumentRating.fromJson(Map<String, dynamic> json) {
    return DocumentRating(
      id: json['id'],
      userId: json['userId'],
      userName: json['userName'],
      rating: json['rating'],
      comment: json['comment'],
      ratingDate: DateTime.parse(json['ratingDate']),
    );
  }
}

class DocumentComment {
  final String id;
  final String userId;
  final String userName;
  final String comment;
  final DateTime commentDate;
  final List<DocumentCommentReply> replies;

  DocumentComment({
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

  factory DocumentComment.fromJson(Map<String, dynamic> json) {
    return DocumentComment(
      id: json['id'],
      userId: json['userId'],
      userName: json['userName'],
      comment: json['comment'],
      commentDate: DateTime.parse(json['commentDate']),
      replies: (json['replies'] as List?)
          ?.map((reply) => DocumentCommentReply.fromJson(reply))
          .toList() ?? [],
    );
  }
}

class DocumentCommentReply {
  final String id;
  final String userId;
  final String userName;
  final String reply;
  final DateTime replyDate;

  DocumentCommentReply({
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

  factory DocumentCommentReply.fromJson(Map<String, dynamic> json) {
    return DocumentCommentReply(
      id: json['id'],
      userId: json['userId'],
      userName: json['userName'],
      reply: json['reply'],
      replyDate: DateTime.parse(json['replyDate']),
    );
  }
}
