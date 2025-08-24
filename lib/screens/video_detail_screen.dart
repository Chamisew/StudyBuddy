import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../models/tutor_video.dart';
import '../services/tutor_video_service.dart';
import '../services/auth_service.dart';

class VideoDetailScreen extends StatefulWidget {
  final TutorVideo video;

  const VideoDetailScreen({
    super.key,
    required this.video,
  });

  @override
  State<VideoDetailScreen> createState() => _VideoDetailScreenState();
}

class _VideoDetailScreenState extends State<VideoDetailScreen> {
  final TutorVideoService _videoService = TutorVideoService();
  final AuthService _authService = AuthService();
  final TextEditingController _commentController = TextEditingController();
  final TextEditingController _replyController = TextEditingController();
  
  bool _isLoading = false;
  String? _replyingToCommentId;
  String? _replyingToUserName;
  
  VideoPlayerController? _player;
  Future<void>? _initializePlayerFuture;

  @override
  void initState() {
    super.initState();
    // Increment view count when video is opened
    _videoService.incrementViewCount(widget.video.id);
    _player = VideoPlayerController.networkUrl(Uri.parse(widget.video.videoUrl));
    _initializePlayerFuture = _player!.initialize();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _replyController.dispose();
    _player?.dispose();
    super.dispose();
  }

  Future<void> _addComment() async {
    if (_commentController.text.trim().isEmpty) return;

    final currentUser = _authService.currentUser;
    if (currentUser == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final comment = VideoComment(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        comment: _commentController.text.trim(),
        commentDate: DateTime.now(),
      );

      final success = await _videoService.addComment(widget.video.id, comment);
      if (success) {
        _commentController.clear();
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Comment added successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _addReply(String commentId, String userName) async {
    if (_replyController.text.trim().isEmpty) return;

    final currentUser = _authService.currentUser;
    if (currentUser == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final reply = CommentReply(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        reply: _replyController.text.trim(),
        replyDate: DateTime.now(),
      );

      final success = await _videoService.addCommentReply(widget.video.id, commentId, reply);
      if (success) {
        _replyController.clear();
        setState(() {
          _replyingToCommentId = null;
          _replyingToUserName = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Reply added successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showRatingDialog() {
    final currentUser = _authService.currentUser;
    if (currentUser == null) return;

    int selectedRating = 5;
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rate this video'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('How would you rate "${widget.video.title}"?'),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                return IconButton(
                  icon: Icon(
                    index < selectedRating ? Icons.star : Icons.star_border,
                    color: Colors.orange,
                    size: 32,
                  ),
                  onPressed: () {
                    setState(() {
                      selectedRating = index + 1;
                    });
                  },
                );
              }),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: commentController,
              decoration: const InputDecoration(
                labelText: 'Comment (optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final rating = VideoRating(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                userId: currentUser.id,
                userName: currentUser.name,
                rating: selectedRating,
                comment: commentController.text.trim().isEmpty ? null : commentController.text.trim(),
                ratingDate: DateTime.now(),
              );

              final success = await _videoService.addRating(widget.video.id, rating);
              if (success) {
                Navigator.of(context).pop();
                setState(() {});
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Rating added successfully!'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
            child: const Text('Submit Rating'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Video Details'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Video player
            AspectRatio(
              aspectRatio: _player?.value.aspectRatio == 0
                  ? 16 / 9
                  : (_player?.value.aspectRatio ?? 16 / 9),
              child: FutureBuilder(
                future: _initializePlayerFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return Container(
                      color: Colors.black12,
                      child: const Center(child: CircularProgressIndicator()),
                    );
                  }
                  return Stack(
                    alignment: Alignment.bottomCenter,
                    children: [
                      VideoPlayer(_player!),
                      _PlaybackControls(controller: _player!),
                    ],
                  );
                },
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and rating
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          widget.video.title,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.orange,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.star,
                              color: Colors.white,
                              size: 20,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              widget.video.averageRating.toStringAsFixed(1),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Description
                  Text(
                    widget.video.description,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[700],
                      height: 1.5,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Tutor info
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: Colors.blue[100],
                        child: Text(
                          widget.video.tutorName.split(' ').map((n) => n[0]).join(''),
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.video.tutorName,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 18,
                              ),
                            ),
                            Text(
                              widget.video.tutorSubject,
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                            Text(
                              'Uploaded by ${widget.video.uploaderName}',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        _formatDate(widget.video.uploadDate),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _showRatingDialog,
                          icon: const Icon(Icons.star),
                          label: const Text('Rate Video'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Share feature coming soon!'),
                                backgroundColor: Colors.blue,
                              ),
                            );
                          },
                          icon: const Icon(Icons.share),
                          label: const Text('Share'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Stats
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatItem(
                          Icons.remove_red_eye,
                          '${widget.video.viewCount}',
                          'Views',
                        ),
                        _buildStatItem(
                          Icons.star,
                          '${widget.video.ratings.length}',
                          'Ratings',
                        ),
                        _buildStatItem(
                          Icons.comment,
                          '${widget.video.comments.length}',
                          'Comments',
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Comments section
                  Text(
                    'Comments (${widget.video.comments.length})',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Add comment
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _commentController,
                          decoration: const InputDecoration(
                            hintText: 'Add a comment...',
                            border: OutlineInputBorder(),
                          ),
                          maxLines: 3,
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _addComment,
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Post'),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Comments list
                  if (widget.video.comments.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Text(
                          'No comments yet. Be the first to comment!',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                    )
                  else
                    ...widget.video.comments.map((comment) => _buildCommentCard(comment)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommentCard(VideoComment comment) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: Colors.blue[100],
                  child: Text(
                    comment.userName.split(' ').map((n) => n[0]).join(''),
                    style: TextStyle(
                      color: Colors.blue[700],
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        comment.userName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        _formatDate(comment.commentDate),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _replyingToCommentId = comment.id;
                      _replyingToUserName = comment.userName;
                    });
                  },
                  child: const Text('Reply'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(comment.comment),
            
            // Replies
            if (comment.replies.isNotEmpty) ...[
              const SizedBox(height: 12),
              ...comment.replies.map((reply) => Padding(
                padding: const EdgeInsets.only(left: 24, top: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundColor: Colors.green[100],
                          child: Text(
                            reply.userName.split(' ').map((n) => n[0]).join(''),
                            style: TextStyle(
                              color: Colors.green[700],
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                reply.userName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                              Text(
                                _formatDate(reply.replyDate),
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      reply.reply,
                      style: const TextStyle(fontSize: 14),
                    ),
                  ],
                ),
              )),
            ],

            // Reply input
            if (_replyingToCommentId == comment.id) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _replyController,
                      decoration: InputDecoration(
                        hintText: 'Reply to ${_replyingToUserName}...',
                        border: const OutlineInputBorder(),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _isLoading ? null : () => _addReply(comment.id, comment.userName),
                    child: _isLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Reply'),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _replyingToCommentId = null;
                        _replyingToUserName = null;
                        _replyController.clear();
                      });
                    },
                    child: const Text('Cancel'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(
          icon,
          size: 24,
          color: Colors.grey[600],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return '${difference.inMinutes}m ago';
      }
      return '${difference.inHours}h ago';
    } else if (difference.inDays == 1) {
      return '1 day ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

class _PlaybackControls extends StatelessWidget {
  final VideoPlayerController controller;
  const _PlaybackControls({required this.controller});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      iconSize: 56,
      color: Colors.white,
      icon: Icon(controller.value.isPlaying ? Icons.pause_circle : Icons.play_circle),
      onPressed: () {
        if (controller.value.isPlaying) {
          controller.pause();
        } else {
          controller.play();
        }
      },
    );
  }
}
