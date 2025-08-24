import 'package:flutter/material.dart';
import '../models/tutor_video.dart';
import '../services/tutor_video_service.dart';
import '../services/auth_service.dart';
import 'video_detail_screen.dart';
import 'home_screen.dart';
import 'login_screen.dart';
import 'documents_screen.dart';
import 'video_upload_screen.dart';
import 'profile_screen.dart';
import 'admin_reports_screen.dart';
import 'quiz_list_screen.dart';
import 'quiz_create_screen.dart';
import 'chat_groups_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final TutorVideoService _videoService = TutorVideoService();
  final AuthService _authService = AuthService();
  final TextEditingController _searchController = TextEditingController();
  
  List<TutorVideo> _videos = [];
  List<TutorVideo> _filteredVideos = [];
  String _selectedFilter = 'all';
  bool _isLoading = false;
  int _currentTabIndex = 0;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _initializeData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Fetch from Firestore
      await _videoService.refreshFromRemote();
    } finally {
      // Load videos to state and clear loading regardless of success
      _loadVideos();
    }
  }

  void _loadVideos() {
    setState(() {
      _videos = _videoService.getAllVideos();
      _filteredVideos = List.from(_videos);
      _isLoading = false;
    });
  }

  void _filterVideos() {
    setState(() {
      switch (_selectedFilter) {
        case 'top_rated':
          _filteredVideos = _videoService.getTopRatedVideos();
          break;
        case 'most_viewed':
          _filteredVideos = _videoService.getMostViewedVideos();
          break;
        case 'recent':
          _filteredVideos = List.from(_videos)
            ..sort((a, b) => b.uploadDate.compareTo(a.uploadDate));
          break;
        default:
          _filteredVideos = List.from(_videos);
      }
    });
  }

  void _searchVideos(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredVideos = List.from(_videos);
      } else {
        _filteredVideos = _videoService.searchVideos(query);
      }
    });
  }

  void _navigateToVideoDetail(TutorVideo video) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => VideoDetailScreen(video: video),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = _authService.currentUser;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tutor Videos Dashboard'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(
                context: context,
                delegate: VideoSearchDelegate(_videoService),
              );
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                _selectedFilter = value;
              });
              _filterVideos();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'all',
                child: Text('All Videos'),
              ),
              const PopupMenuItem(
                value: 'top_rated',
                child: Text('Top Rated'),
              ),
              const PopupMenuItem(
                value: 'most_viewed',
                child: Text('Most Viewed'),
              ),
              const PopupMenuItem(
                value: 'recent',
                child: Text('Recent'),
              ),
            ],
            child: const Icon(Icons.filter_list),
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'home') {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (context) => const HomeScreen()),
                );
              } else if (value == 'profile') {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const ProfileScreen()),
                );
              } else if (value == 'chat_groups') {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const ChatGroupsScreen()),
                );
              } else if (value == 'admin_reports') {
                if (currentUser?.role.toLowerCase() == 'admin') {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (context) => const AdminReportsScreen()),
                  );
                }
              } else if (value == 'logout') {
                _authService.logout();
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'home',
                child: Row(
                  children: [
                    const Icon(Icons.home),
                    const SizedBox(width: 8),
                    const Text('Home'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    const Icon(Icons.person),
                    const SizedBox(width: 8),
                    const Text('Profile'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'chat_groups',
                child: Row(
                  children: [
                    const Icon(Icons.groups),
                    const SizedBox(width: 8),
                    const Text('Chat Groups'),
                  ],
                ),
              ),
              if (currentUser?.role.toLowerCase() == 'admin')
                PopupMenuItem(
                  value: 'admin_reports',
                  child: Row(
                    children: [
                      const Icon(Icons.report),
                      const SizedBox(width: 8),
                      const Text('User Reports'),
                    ],
                  ),
                ),
              PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    const Icon(Icons.logout),
                    const SizedBox(width: 8),
                    const Text('Logout'),
                  ],
                ),
              ),
            ],
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(
                  currentUser?.name.substring(0, 1).toUpperCase() ?? 'U',
                  style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Tab bar
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(25),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _currentTabIndex = 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _currentTabIndex == 0 ? Colors.blue : Colors.transparent,
                        borderRadius: BorderRadius.circular(25),
                      ),
                      child: Text(
                        'Videos',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _currentTabIndex == 0 ? Colors.white : Colors.grey[600],
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _currentTabIndex = 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _currentTabIndex == 1 ? Colors.green : Colors.transparent,
                        borderRadius: BorderRadius.circular(25),
                      ),
                      child: Text(
                        'Documents',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _currentTabIndex == 1 ? Colors.white : Colors.grey[600],
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _currentTabIndex = 2),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _currentTabIndex == 2 ? Colors.purple : Colors.transparent,
                        borderRadius: BorderRadius.circular(25),
                      ),
                      child: Text(
                        'Quizzes',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _currentTabIndex == 2 ? Colors.white : Colors.grey[600],
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Content based on selected tab
          Expanded(
            child: IndexedStack(
              index: _currentTabIndex,
              children: [
                // Videos Tab
                Column(
                  children: [
                    // Filter chips for videos
                    Container(
                      padding: const EdgeInsets.all(16),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            FilterChip(
                              label: const Text('All'),
                              selected: _selectedFilter == 'all',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedFilter = 'all';
                                });
                                _filterVideos();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('Mathematics'),
                              selected: _selectedFilter == 'mathematics',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedFilter = 'mathematics';
                                });
                                _filteredVideos = _videoService.getVideosBySubject('Mathematics');
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('Physics'),
                              selected: _selectedFilter == 'physics',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedFilter = 'physics';
                                });
                                _filteredVideos = _videoService.getVideosBySubject('Physics');
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('English'),
                              selected: _selectedFilter == 'english',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedFilter = 'english';
                                });
                                _filteredVideos = _videoService.getVideosBySubject('English Literature');
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('Chemistry'),
                              selected: _selectedFilter == 'chemistry',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedFilter = 'chemistry';
                                });
                                _filteredVideos = _videoService.getVideosBySubject('Chemistry');
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('Computer Science'),
                              selected: _selectedFilter == 'computer_science',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedFilter = 'computer_science';
                                });
                                _filteredVideos = _videoService.getVideosBySubject('Computer Science');
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    // Videos list
                    Expanded(
                      child: _isLoading
                          ? const Center(child: CircularProgressIndicator())
                          : _filteredVideos.isEmpty
                              ? const Center(
                                  child: Text(
                                    'No videos found',
                                    style: TextStyle(fontSize: 18, color: Colors.grey),
                                  ),
                                )
                              : RefreshIndicator(
                                  onRefresh: () async {
                                    await _videoService.refreshFromRemote();
                                    _loadVideos();
                                  },
                                  child: ListView.builder(
                                    padding: const EdgeInsets.all(16),
                                    itemCount: _filteredVideos.length,
                                    itemBuilder: (context, index) {
                                      final video = _filteredVideos[index];
                                      return VideoCard(
                                        video: video,
                                        onTap: () => _navigateToVideoDetail(video),
                                      );
                                    },
                                  ),
                                ),
                    ),
                  ],
                ),
                
                // Documents Tab
                const DocumentsScreen(),
                const QuizListScreen(),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab_dashboard',
        onPressed: () async {
          if (_currentTabIndex == 0) {
            // Video upload
            final currentUser = _authService.currentUser;
            if (currentUser != null) {
              if (currentUser.role.toLowerCase() != 'tutor') {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Only tutors can upload videos'),
                    backgroundColor: Colors.red,
                  ),
                );
                return;
              }
              final result = await Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => VideoUploadScreen(
                    uploaderId: currentUser.id,
                    uploaderName: currentUser.name,
                  ),
                ),
              );
              
              // Refresh videos if upload was successful
              if (result == true) {
                await _videoService.refreshFromRemote();
                _loadVideos();
              }
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Please log in to upload videos'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          } else if (_currentTabIndex == 1) {
            // Document upload
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Document upload feature coming soon!'),
                backgroundColor: Colors.green,
              ),
            );
          } else {
            // Quizzes
            final currentUser = _authService.currentUser;
            if (currentUser == null || currentUser.role.toLowerCase() != 'tutor') {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Only tutors can create quizzes'),
                  backgroundColor: Colors.red,
                ),
              );
              return;
            }
            final created = await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const QuizCreateScreen()),
            );
            if (created == true) {
              // No-op; QuizListScreen fetches on open/refresh
            }
          }
        },
        backgroundColor: _currentTabIndex == 0 ? Colors.orange : _currentTabIndex == 1 ? Colors.green : Colors.purple,
        foregroundColor: Colors.white,
        icon: Icon(_currentTabIndex == 0
            ? Icons.add
            : _currentTabIndex == 1
                ? Icons.upload_file
                : Icons.quiz),
        label: Text(_currentTabIndex == 0
            ? 'Upload Video'
            : _currentTabIndex == 1
                ? 'Share Document'
                : 'Create Quiz'),
      ),
    );
  }
}

class VideoCard extends StatelessWidget {
  final TutorVideo video;
  final VoidCallback onTap;

  const VideoCard({
    super.key,
    required this.video,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Video thumbnail
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                color: Colors.grey[300],
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(
                      Icons.play_circle_outline,
                      size: 64,
                      color: Colors.grey[600],
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${video.viewCount} views',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ],
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
                          video.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.orange,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.star,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              video.averageRating.toStringAsFixed(1),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
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
                    video.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Tutor info and upload date
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundColor: Colors.blue[100],
                        child: Text(
                          video.tutorName.split(' ').map((n) => n[0]).join(''),
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              video.tutorName,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              video.tutorSubject,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        _formatDate(video.uploadDate),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Stats row
                  Row(
                    children: [
                      _buildStatItem(
                        Icons.remove_red_eye,
                        '${video.viewCount}',
                        'Views',
                      ),
                      const SizedBox(width: 24),
                      _buildStatItem(
                        Icons.star,
                        '${video.ratings.length}',
                        'Ratings',
                      ),
                      const SizedBox(width: 24),
                      _buildStatItem(
                        Icons.comment,
                        '${video.comments.length}',
                        'Comments',
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value, String label) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: Colors.grey[600],
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(width: 4),
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

class VideoSearchDelegate extends SearchDelegate<String> {
  final TutorVideoService _videoService;

  VideoSearchDelegate(this._videoService);

  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      IconButton(
        icon: const Icon(Icons.clear),
        onPressed: () {
          query = '';
        },
      ),
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () {
        close(context, '');
      },
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    if (query.isEmpty) return const SizedBox.shrink();
    
    final results = _videoService.searchVideos(query);
    
    return ListView.builder(
      itemCount: results.length,
      itemBuilder: (context, index) {
        final video = results[index];
        return ListTile(
          title: Text(video.title),
          subtitle: Text(video.tutorName),
          trailing: Text('${video.averageRating.toStringAsFixed(1)} ⭐'),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => VideoDetailScreen(video: video),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty) return const SizedBox.shrink();
    
    final suggestions = _videoService.searchVideos(query);
    
    return ListView.builder(
      itemCount: suggestions.length,
      itemBuilder: (context, index) {
        final video = suggestions[index];
        return ListTile(
          leading: const Icon(Icons.video_library),
          title: Text(video.title),
          subtitle: Text('${video.tutorName} • ${video.tutorSubject}'),
          onTap: () {
            query = video.title;
            showResults(context);
          },
        );
      },
    );
  }
}
