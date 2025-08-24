import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/tutor_video.dart';

class TutorVideoService {
  // In-memory cache
  static final List<TutorVideo> _videos = [];

  // Firestore reference
  static final FirebaseFirestore _db = FirebaseFirestore.instance;
  static const String _collection = 'videos';

  // Initialize sample data into memory (used only if Firestore empty or on error)
  static List<TutorVideo> _buildSampleVideos() {
    return [
      TutorVideo(
        id: 'sample1',
        title: 'Advanced Calculus: Derivatives',
        description:
            'Comprehensive tutorial on finding derivatives of complex functions with step-by-step explanations.',
        videoUrl: 'https://example.com/video1.mp4',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        tutorId: 'tutor1',
        tutorName: 'Dr. Sarah Wilson',
        tutorSubject: 'Mathematics',
        uploaderId: 'user1',
        uploaderName: 'John Doe',
        uploadDate: DateTime.now().subtract(const Duration(days: 2)),
        viewCount: 1250,
        averageRating: 4.8,
      ),
      TutorVideo(
        id: 'sample2',
        title: 'Physics: Newton\'s Laws of Motion',
        description:
            'Understanding the fundamental principles of motion with real-world examples and demonstrations.',
        videoUrl: 'https://example.com/video2.mp4',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        tutorId: 'tutor2',
        tutorName: 'Prof. Michael Chen',
        tutorSubject: 'Physics',
        uploaderId: 'user2',
        uploaderName: 'Jane Smith',
        uploadDate: DateTime.now().subtract(const Duration(days: 5)),
        viewCount: 890,
        averageRating: 4.6,
      ),
    ];
  }

  // Fetch videos from Firestore and update in-memory cache
  Future<void> refreshFromRemote() async {
    try {
      final query = await _db
          .collection(_collection)
          .orderBy('uploadDate', descending: true)
          .get()
          .timeout(const Duration(seconds: 8));

      final List<TutorVideo> fetched = query.docs.map((doc) {
        final data = Map<String, dynamic>.from(doc.data());
        // Normalize uploadDate to ISO string for TutorVideo.fromJson
        final uploadDate = data['uploadDate'];
        if (uploadDate is Timestamp) {
          data['uploadDate'] = uploadDate.toDate().toIso8601String();
        } else if (uploadDate is DateTime) {
          data['uploadDate'] = uploadDate.toIso8601String();
        } else if (uploadDate is! String) {
          data['uploadDate'] = DateTime.now().toIso8601String();
        }
        return TutorVideo.fromJson({
          ...data,
          'id': doc.id,
        });
      }).toList();

      _videos
        ..clear()
        ..addAll(fetched);

      // Seed sample data only if collection empty (first run)
      if (_videos.isEmpty) {
        final samples = _buildSampleVideos();
        for (final vid in samples) {
          await _db.collection(_collection).doc(vid.id).set(vid.toJson());
        }
        _videos.addAll(samples);
      }
    } catch (e) {
      // On error/timeout, fallback to sample data so UI still works
      if (_videos.isEmpty) {
        _videos
          ..clear()
          ..addAll(_buildSampleVideos());
      }
    }
  }

  // Get all videos from cache
  List<TutorVideo> getAllVideos() {
    return List.from(_videos);
  }

  // Get videos by filters from cache
  List<TutorVideo> getVideosBySubject(String subject) {
    return _videos
        .where((video) =>
            video.tutorSubject.toLowerCase().contains(subject.toLowerCase()))
        .toList();
  }

  List<TutorVideo> getTopRatedVideos({int limit = 10}) {
    final sortedVideos = List<TutorVideo>.from(_videos);
    sortedVideos.sort((a, b) => b.averageRating.compareTo(a.averageRating));
    return sortedVideos.take(limit).toList();
  }

  List<TutorVideo> getMostViewedVideos({int limit = 10}) {
    final sortedVideos = List<TutorVideo>.from(_videos);
    sortedVideos.sort((a, b) => b.viewCount.compareTo(a.viewCount));
    return sortedVideos.take(limit).toList();
  }

  Future<bool> addVideo(TutorVideo video) async {
    try {
      // Save to Firestore
      final docRef = _db.collection(_collection).doc(video.id);
      await docRef.set(video.toJson());

      // Update cache
      _videos.insert(0, video);
      return true;
    } catch (e) {
      print('Error adding video: $e');
      return false;
    }
  }

  Future<bool> updateVideo(TutorVideo video) async {
    try {
      await _db.collection(_collection).doc(video.id).update(video.toJson());
      final index = _videos.indexWhere((v) => v.id == video.id);
      if (index != -1) {
        _videos[index] = video;
        return true;
      }
      return false;
    } catch (e) {
      print('Error updating video: $e');
      return false;
    }
  }

  Future<bool> deleteVideo(String videoId) async {
    try {
      await _db.collection(_collection).doc(videoId).delete();
      final index = _videos.indexWhere((v) => v.id == videoId);
      if (index != -1) {
        _videos.removeAt(index);
        return true;
      }
      return false;
    } catch (e) {
      print('Error deleting video: $e');
      return false;
    }
  }

  Future<bool> addRating(String videoId, VideoRating rating) async {
    try {
      final index = _videos.indexWhere((v) => v.id == videoId);
      if (index == -1) return false;
      final video = _videos[index];
      final updatedRatings = List<VideoRating>.from(video.ratings)..add(rating);
      final avg = updatedRatings.isNotEmpty
          ? updatedRatings.map((r) => r.rating).reduce((a, b) => a + b) /
              updatedRatings.length
          : 0.0;
      final updated = video.copyWith(
        ratings: updatedRatings,
        averageRating: avg,
      );

      await _db.collection(_collection).doc(videoId).update({
        'ratings': updatedRatings.map((r) => r.toJson()).toList(),
        'averageRating': avg,
      });
      _videos[index] = updated;
      return true;
    } catch (e) {
      print('Error adding rating: $e');
      return false;
    }
  }

  Future<bool> addComment(String videoId, VideoComment comment) async {
    try {
      final index = _videos.indexWhere((v) => v.id == videoId);
      if (index == -1) return false;
      final video = _videos[index];
      final updatedComments = List<VideoComment>.from(video.comments)
        ..add(comment);
      final updated = video.copyWith(comments: updatedComments);

      await _db.collection(_collection).doc(videoId).update({
        'comments': updatedComments.map((c) => c.toJson()).toList(),
      });
      _videos[index] = updated;
      return true;
    } catch (e) {
      print('Error adding comment: $e');
      return false;
    }
  }

  Future<bool> addCommentReply(
      String videoId, String commentId, CommentReply reply) async {
    try {
      final index = _videos.indexWhere((v) => v.id == videoId);
      if (index == -1) return false;
      final video = _videos[index];
      final comments = List<VideoComment>.from(video.comments);
      final commentIndex = comments.indexWhere((c) => c.id == commentId);
      if (commentIndex == -1) return false;

      final comment = comments[commentIndex];
      final replies = List<CommentReply>.from(comment.replies)..add(reply);
      final updatedComment = VideoComment(
        id: comment.id,
        userId: comment.userId,
        userName: comment.userName,
        comment: comment.comment,
        commentDate: comment.commentDate,
        replies: replies,
      );
      comments[commentIndex] = updatedComment;
      final updated = video.copyWith(comments: comments);

      await _db.collection(_collection).doc(videoId).update({
        'comments': comments.map((c) => c.toJson()).toList(),
      });
      _videos[index] = updated;
      return true;
    } catch (e) {
      print('Error adding comment reply: $e');
      return false;
    }
  }

  Future<bool> incrementViewCount(String videoId) async {
    try {
      final index = _videos.indexWhere((v) => v.id == videoId);
      if (index == -1) return false;
      final current = _videos[index].viewCount + 1;
      _videos[index] = _videos[index].copyWith(viewCount: current);
      await _db
          .collection(_collection)
          .doc(videoId)
          .update({'viewCount': FieldValue.increment(1)});
      return true;
    } catch (e) {
      print('Error incrementing view count: $e');
      return false;
    }
  }

  // Search videos
  List<TutorVideo> searchVideos(String query) {
    if (query.isEmpty) return getAllVideos();

    return _videos
        .where((video) =>
            video.title.toLowerCase().contains(query.toLowerCase()) ||
            video.description.toLowerCase().contains(query.toLowerCase()) ||
            video.tutorName.toLowerCase().contains(query.toLowerCase()) ||
            video.tutorSubject.toLowerCase().contains(query.toLowerCase()))
        .toList();
  }
}
