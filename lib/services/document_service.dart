import '../models/educational_document.dart';

class DocumentService {
  // In-memory storage for demo purposes
  // In a real app, this would be replaced with database integration
  static final List<EducationalDocument> _documents = [];
  static final Map<String, List<DocumentRating>> _documentRatings = {};
  static final Map<String, List<DocumentComment>> _documentComments = {};

  // Initialize with sample data
  static void initializeSampleData() {
    if (_documents.isNotEmpty) return;

    final sampleDocuments = [
      EducationalDocument(
        id: '1',
        title: 'Calculus Notes - Derivatives and Integrals',
        description: 'Comprehensive notes covering the fundamentals of calculus including derivatives, integrals, and their applications.',
        fileName: 'calculus_notes.pdf',
        fileUrl: 'https://example.com/documents/calculus_notes.pdf',
        fileType: 'pdf',
        fileSize: 2048576, // 2MB
        subject: 'Mathematics',
        grade: '12th Grade',
        uploaderId: 'user1',
        uploaderName: 'John Doe',
        uploadDate: DateTime.now().subtract(const Duration(days: 1)),
        downloadCount: 45,
        viewCount: 120,
        averageRating: 4.7,
        tags: ['calculus', 'derivatives', 'integrals', 'mathematics'],
      ),
      EducationalDocument(
        id: '2',
        title: 'Physics Lab Report - Newton\'s Laws',
        description: 'Detailed lab report on experiments demonstrating Newton\'s three laws of motion with data analysis and conclusions.',
        fileName: 'physics_lab_report.docx',
        fileUrl: 'https://example.com/documents/physics_lab_report.docx',
        fileType: 'docx',
        fileSize: 1048576, // 1MB
        subject: 'Physics',
        grade: '11th Grade',
        uploaderId: 'user2',
        uploaderName: 'Jane Smith',
        uploadDate: DateTime.now().subtract(const Duration(days: 3)),
        downloadCount: 32,
        viewCount: 89,
        averageRating: 4.5,
        tags: ['physics', 'newton laws', 'lab report', 'motion'],
      ),
      EducationalDocument(
        id: '3',
        title: 'English Literature Analysis - Shakespeare',
        description: 'In-depth analysis of Shakespeare\'s Hamlet including character analysis, themes, and literary devices.',
        fileName: 'shakespeare_analysis.pdf',
        fileUrl: 'https://example.com/documents/shakespeare_analysis.pdf',
        fileType: 'pdf',
        fileSize: 1572864, // 1.5MB
        subject: 'English Literature',
        grade: '12th Grade',
        uploaderId: 'user3',
        uploaderName: 'Alex Johnson',
        uploadDate: DateTime.now().subtract(const Duration(hours: 6)),
        downloadCount: 28,
        viewCount: 67,
        averageRating: 4.8,
        tags: ['shakespeare', 'hamlet', 'literature', 'analysis'],
      ),
      EducationalDocument(
        id: '4',
        title: 'Chemistry Study Guide - Organic Compounds',
        description: 'Comprehensive study guide covering organic chemistry including nomenclature, reactions, and mechanisms.',
        fileName: 'organic_chemistry_guide.pdf',
        fileUrl: 'https://example.com/documents/organic_chemistry_guide.pdf',
        fileType: 'pdf',
        fileSize: 3145728, // 3MB
        subject: 'Chemistry',
        grade: '12th Grade',
        uploaderId: 'user4',
        uploaderName: 'Maria Garcia',
        uploadDate: DateTime.now().subtract(const Duration(days: 2)),
        downloadCount: 56,
        viewCount: 134,
        averageRating: 4.6,
        tags: ['chemistry', 'organic', 'nomenclature', 'reactions'],
      ),
      EducationalDocument(
        id: '5',
        title: 'Computer Science Notes - Data Structures',
        description: 'Detailed notes on data structures including arrays, linked lists, stacks, queues, and trees with examples.',
        fileName: 'data_structures_notes.txt',
        fileUrl: 'https://example.com/documents/data_structures_notes.txt',
        fileType: 'txt',
        fileSize: 524288, // 512KB
        subject: 'Computer Science',
        grade: '11th Grade',
        uploaderId: 'user5',
        uploaderName: 'Tom Wilson',
        uploadDate: DateTime.now().subtract(const Duration(days: 4)),
        downloadCount: 41,
        viewCount: 98,
        averageRating: 4.4,
        tags: ['computer science', 'data structures', 'algorithms', 'programming'],
      ),
      EducationalDocument(
        id: '6',
        title: 'Biology Notes - Cell Biology',
        description: 'Comprehensive notes on cell biology including cell structure, organelles, and cellular processes.',
        fileName: 'cell_biology_notes.pdf',
        fileUrl: 'https://example.com/documents/cell_biology_notes.pdf',
        fileType: 'pdf',
        fileSize: 2097152, // 2MB
        subject: 'Biology',
        grade: '10th Grade',
        uploaderId: 'user1',
        uploaderName: 'John Doe',
        uploadDate: DateTime.now().subtract(const Duration(days: 5)),
        downloadCount: 38,
        viewCount: 76,
        averageRating: 4.3,
        tags: ['biology', 'cell biology', 'organelles', 'cellular processes'],
      ),
    ];

    _documents.addAll(sampleDocuments);

    // Add sample ratings and comments
    _addSampleRatingsAndComments();
  }

  static void _addSampleRatingsAndComments() {
    // Sample ratings for document 1
    _documentRatings['1'] = [
      DocumentRating(
        id: 'rating1',
        userId: 'user2',
        userName: 'Jane Smith',
        rating: 5,
        comment: 'Excellent notes! Very clear and well-organized.',
        ratingDate: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      DocumentRating(
        id: 'rating2',
        userId: 'user3',
        userName: 'Alex Johnson',
        rating: 4,
        comment: 'Great resource for studying calculus.',
        ratingDate: DateTime.now().subtract(const Duration(hours: 5)),
      ),
    ];

    // Sample comments for document 1
    _documentComments['1'] = [
      DocumentComment(
        id: 'comment1',
        userId: 'user2',
        userName: 'Jane Smith',
        comment: 'These notes really helped me understand derivatives better!',
        commentDate: DateTime.now().subtract(const Duration(hours: 1)),
        replies: [
          DocumentCommentReply(
            id: 'reply1',
            userId: 'user1',
            userName: 'John Doe',
            reply: 'Thank you! I\'m glad they were helpful.',
            replyDate: DateTime.now().subtract(const Duration(minutes: 30)),
          ),
        ],
      ),
      DocumentComment(
        id: 'comment2',
        userId: 'user3',
        userName: 'Alex Johnson',
        comment: 'Could you add more examples for integration?',
        commentDate: DateTime.now().subtract(const Duration(hours: 3)),
      ),
    ];

    // Sample ratings for document 2
    _documentRatings['2'] = [
      DocumentRating(
        id: 'rating3',
        userId: 'user1',
        userName: 'John Doe',
        rating: 5,
        comment: 'Very detailed lab report with great data analysis!',
        ratingDate: DateTime.now().subtract(const Duration(hours: 1)),
      ),
    ];

    // Sample comments for document 2
    _documentComments['2'] = [
      DocumentComment(
        id: 'comment3',
        userId: 'user1',
        userName: 'John Doe',
        comment: 'The methodology section is very clear and easy to follow.',
        commentDate: DateTime.now().subtract(const Duration(hours: 2)),
      ),
    ];

    // Update documents with ratings and comments
    for (int i = 0; i < _documents.length; i++) {
      final documentId = _documents[i].id;
      final ratings = _documentRatings[documentId] ?? [];
      final comments = _documentComments[documentId] ?? [];
      
      double avgRating = 0.0;
      if (ratings.isNotEmpty) {
        avgRating = ratings.map((r) => r.rating).reduce((a, b) => a + b) / ratings.length;
      }
      
      _documents[i] = _documents[i].copyWith(
        ratings: ratings,
        comments: comments,
        averageRating: avgRating,
      );
    }
  }

  // Get all documents
  List<EducationalDocument> getAllDocuments() {
    return List.from(_documents);
  }

  // Get documents by subject
  List<EducationalDocument> getDocumentsBySubject(String subject) {
    return _documents.where((doc) => 
      doc.subject.toLowerCase().contains(subject.toLowerCase())
    ).toList();
  }

  // Get documents by grade
  List<EducationalDocument> getDocumentsByGrade(String grade) {
    return _documents.where((doc) => doc.grade == grade).toList();
  }

  // Get documents by uploader
  List<EducationalDocument> getDocumentsByUploader(String uploaderId) {
    return _documents.where((doc) => doc.uploaderId == uploaderId).toList();
  }

  // Get top rated documents
  List<EducationalDocument> getTopRatedDocuments({int limit = 10}) {
    final sortedDocuments = List<EducationalDocument>.from(_documents);
    sortedDocuments.sort((a, b) => b.averageRating.compareTo(a.averageRating));
    return sortedDocuments.take(limit).toList();
  }

  // Get most downloaded documents
  List<EducationalDocument> getMostDownloadedDocuments({int limit = 10}) {
    final sortedDocuments = List<EducationalDocument>.from(_documents);
    sortedDocuments.sort((a, b) => b.downloadCount.compareTo(a.downloadCount));
    return sortedDocuments.take(limit).toList();
  }

  // Get most viewed documents
  List<EducationalDocument> getMostViewedDocuments({int limit = 10}) {
    final sortedDocuments = List<EducationalDocument>.from(_documents);
    sortedDocuments.sort((a, b) => b.viewCount.compareTo(a.viewCount));
    return sortedDocuments.take(limit).toList();
  }

  // Get recent documents
  List<EducationalDocument> getRecentDocuments({int limit = 10}) {
    final sortedDocuments = List<EducationalDocument>.from(_documents);
    sortedDocuments.sort((a, b) => b.uploadDate.compareTo(a.uploadDate));
    return sortedDocuments.take(limit).toList();
  }

  // Add new document
  Future<bool> addDocument(EducationalDocument document) async {
    try {
      _documents.add(document);
      return true;
    } catch (e) {
      print('Error adding document: $e');
      return false;
    }
  }

  // Update document
  Future<bool> updateDocument(EducationalDocument document) async {
    try {
      final index = _documents.indexWhere((d) => d.id == document.id);
      if (index != -1) {
        _documents[index] = document;
        return true;
      }
      return false;
    } catch (e) {
      print('Error updating document: $e');
      return false;
    }
  }

  // Delete document
  Future<bool> deleteDocument(String documentId) async {
    try {
      final index = _documents.indexWhere((d) => d.id == documentId);
      if (index != -1) {
        _documents.removeAt(index);
        _documentRatings.remove(documentId);
        _documentComments.remove(documentId);
        return true;
      }
      return false;
    } catch (e) {
      print('Error deleting document: $e');
      return false;
    }
  }

  // Add rating to document
  Future<bool> addRating(String documentId, DocumentRating rating) async {
    try {
      if (!_documentRatings.containsKey(documentId)) {
        _documentRatings[documentId] = [];
      }
      _documentRatings[documentId]!.add(rating);
      
      // Update document's average rating
      final documentIndex = _documents.indexWhere((d) => d.id == documentId);
      if (documentIndex != -1) {
        final ratings = _documentRatings[documentId]!;
        final avgRating = ratings.map((r) => r.rating).reduce((a, b) => a + b) / ratings.length;
        _documents[documentIndex] = _documents[documentIndex].copyWith(
          ratings: ratings,
          averageRating: avgRating,
        );
      }
      
      return true;
    } catch (e) {
      print('Error adding rating: $e');
      return false;
    }
  }

  // Add comment to document
  Future<bool> addComment(String documentId, DocumentComment comment) async {
    try {
      if (!_documentComments.containsKey(documentId)) {
        _documentComments[documentId] = [];
      }
      _documentComments[documentId]!.add(comment);
      
      // Update document's comments
      final documentIndex = _documents.indexWhere((d) => d.id == documentId);
      if (documentIndex != -1) {
        final comments = _documentComments[documentId]!;
        _documents[documentIndex] = _documents[documentIndex].copyWith(comments: comments);
      }
      
      return true;
    } catch (e) {
      print('Error adding comment: $e');
      return false;
    }
  }

  // Add reply to comment
  Future<bool> addCommentReply(String documentId, String commentId, DocumentCommentReply reply) async {
    try {
      final documentIndex = _documents.indexWhere((d) => d.id == documentId);
      if (documentIndex != -1) {
        final comments = List<DocumentComment>.from(_documents[documentIndex].comments);
        final commentIndex = comments.indexWhere((c) => c.id == commentId);
        if (commentIndex != -1) {
          final comment = comments[commentIndex];
          final replies = List<DocumentCommentReply>.from(comment.replies)..add(reply);
          final updatedComment = DocumentComment(
            id: comment.id,
            userId: comment.userId,
            userName: comment.userName,
            comment: comment.comment,
            commentDate: comment.commentDate,
            replies: replies,
          );
          comments[commentIndex] = updatedComment;
          _documents[documentIndex] = _documents[documentIndex].copyWith(comments: comments);
          return true;
        }
      }
      return false;
    } catch (e) {
      print('Error adding comment reply: $e');
      return false;
    }
  }

  // Increment view count
  Future<bool> incrementViewCount(String documentId) async {
    try {
      final documentIndex = _documents.indexWhere((d) => d.id == documentId);
      if (documentIndex != -1) {
        final currentViews = _documents[documentIndex].viewCount;
        _documents[documentIndex] = _documents[documentIndex].copyWith(viewCount: currentViews + 1);
        return true;
      }
      return false;
    } catch (e) {
      print('Error incrementing view count: $e');
      return false;
    }
  }

  // Increment download count
  Future<bool> incrementDownloadCount(String documentId) async {
    try {
      final documentIndex = _documents.indexWhere((d) => d.id == documentId);
      if (documentIndex != -1) {
        final currentDownloads = _documents[documentIndex].downloadCount;
        _documents[documentIndex] = _documents[documentIndex].copyWith(downloadCount: currentDownloads + 1);
        return true;
      }
      return false;
    } catch (e) {
      print('Error incrementing download count: $e');
      return false;
    }
  }

  // Search documents
  List<EducationalDocument> searchDocuments(String query) {
    if (query.isEmpty) return getAllDocuments();
    
    return _documents.where((doc) =>
      doc.title.toLowerCase().contains(query.toLowerCase()) ||
      doc.description.toLowerCase().contains(query.toLowerCase()) ||
      doc.subject.toLowerCase().contains(query.toLowerCase()) ||
      doc.grade.toLowerCase().contains(query.toLowerCase()) ||
      doc.uploaderName.toLowerCase().contains(query.toLowerCase()) ||
      doc.tags.any((tag) => tag.toLowerCase().contains(query.toLowerCase()))
    ).toList();
  }

  // Get documents by tags
  List<EducationalDocument> getDocumentsByTags(List<String> tags) {
    if (tags.isEmpty) return getAllDocuments();
    
    return _documents.where((doc) =>
      tags.any((tag) => doc.tags.any((docTag) => 
        docTag.toLowerCase().contains(tag.toLowerCase())
      ))
    ).toList();
  }

  // Get popular tags
  List<String> getPopularTags({int limit = 10}) {
    final tagCounts = <String, int>{};
    
    for (final doc in _documents) {
      for (final tag in doc.tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }
    
    final sortedTags = tagCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    return sortedTags.take(limit).map((e) => e.key).toList();
  }
}
