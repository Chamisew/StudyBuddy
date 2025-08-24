import 'package:flutter/material.dart';
import '../models/educational_document.dart';
import '../services/document_service.dart';
import '../services/auth_service.dart';
import 'document_detail_screen.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  final DocumentService _documentService = DocumentService();
  final AuthService _authService = AuthService();
  
  List<EducationalDocument> _documents = [];
  List<EducationalDocument> _filteredDocuments = [];
  String _selectedFilter = 'all';
  String _selectedSubject = 'all';
  String _selectedGrade = 'all';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  void _initializeData() {
    setState(() {
      _isLoading = true;
    });

    // Initialize sample data
    DocumentService.initializeSampleData();
    
    // Load documents
    _loadDocuments();
  }

  void _loadDocuments() {
    setState(() {
      _documents = _documentService.getAllDocuments();
      _filteredDocuments = List.from(_documents);
      _isLoading = false;
    });
  }

  void _filterDocuments() {
    setState(() {
      List<EducationalDocument> filtered = List.from(_documents);

      // Apply subject filter
      if (_selectedSubject != 'all') {
        filtered = filtered.where((doc) => doc.subject == _selectedSubject).toList();
      }

      // Apply grade filter
      if (_selectedGrade != 'all') {
        filtered = filtered.where((doc) => doc.grade == _selectedGrade).toList();
      }

      // Apply sorting filter
      switch (_selectedFilter) {
        case 'top_rated':
          filtered.sort((a, b) => b.averageRating.compareTo(a.averageRating));
          break;
        case 'most_downloaded':
          filtered.sort((a, b) => b.downloadCount.compareTo(a.downloadCount));
          break;
        case 'most_viewed':
          filtered.sort((a, b) => b.viewCount.compareTo(a.viewCount));
          break;
        case 'recent':
          filtered.sort((a, b) => b.uploadDate.compareTo(a.uploadDate));
          break;
        default:
          // No additional sorting
          break;
      }

      _filteredDocuments = filtered;
    });
  }

  void _searchDocuments(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredDocuments = List.from(_documents);
      } else {
        _filteredDocuments = _documentService.searchDocuments(query);
      }
    });
  }

  void _navigateToDocumentDetail(EducationalDocument document) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => DocumentDetailScreen(document: document),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = _authService.currentUser;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shared Documents'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(
                context: context,
                delegate: DocumentSearchDelegate(_documentService),
              );
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                _selectedFilter = value;
              });
              _filterDocuments();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'all',
                child: Text('All Documents'),
              ),
              const PopupMenuItem(
                value: 'top_rated',
                child: Text('Top Rated'),
              ),
              const PopupMenuItem(
                value: 'most_downloaded',
                child: Text('Most Downloaded'),
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
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Subject filter
                Row(
                  children: [
                    const Text(
                      'Subject: ',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            FilterChip(
                              label: const Text('All'),
                              selected: _selectedSubject == 'all',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedSubject = 'all';
                                });
                                _filterDocuments();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('Mathematics'),
                              selected: _selectedSubject == 'Mathematics',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedSubject = 'Mathematics';
                                });
                                _filterDocuments();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('Physics'),
                              selected: _selectedSubject == 'Physics',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedSubject = 'Physics';
                                });
                                _filterDocuments();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('English Literature'),
                              selected: _selectedSubject == 'English Literature',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedSubject = 'English Literature';
                                });
                                _filterDocuments();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('Chemistry'),
                              selected: _selectedSubject == 'Chemistry',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedSubject = 'Chemistry';
                                });
                                _filterDocuments();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('Computer Science'),
                              selected: _selectedSubject == 'Computer Science',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedSubject = 'Computer Science';
                                });
                                _filterDocuments();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('Biology'),
                              selected: _selectedSubject == 'Biology',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedSubject = 'Biology';
                                });
                                _filterDocuments();
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Grade filter
                Row(
                  children: [
                    const Text(
                      'Grade: ',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            FilterChip(
                              label: const Text('All'),
                              selected: _selectedGrade == 'all',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedGrade = 'all';
                                });
                                _filterDocuments();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('10th Grade'),
                              selected: _selectedGrade == '10th Grade',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedGrade = '10th Grade';
                                });
                                _filterDocuments();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('11th Grade'),
                              selected: _selectedGrade == '11th Grade',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedGrade = '11th Grade';
                                });
                                _filterDocuments();
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('12th Grade'),
                              selected: _selectedGrade == '12th Grade',
                              onSelected: (selected) {
                                setState(() {
                                  _selectedGrade = '12th Grade';
                                });
                                _filterDocuments();
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Documents list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredDocuments.isEmpty
                    ? const Center(
                        child: Text(
                          'No documents found',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () async {
                          _loadDocuments();
                        },
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredDocuments.length,
                          itemBuilder: (context, index) {
                            final document = _filteredDocuments[index];
                            return DocumentCard(
                              document: document,
                              onTap: () => _navigateToDocumentDetail(document),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab_documents',
        onPressed: () {
          // TODO: Implement document upload functionality
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Document upload feature coming soon!'),
              backgroundColor: Colors.green,
            ),
          );
        },
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.upload_file),
        label: const Text('Share Document'),
      ),
    );
  }
}

class DocumentCard extends StatelessWidget {
  final EducationalDocument document;
  final VoidCallback onTap;

  const DocumentCard({
    super.key,
    required this.document,
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
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with file type icon and rating
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      document.fileTypeIcon,
                      style: const TextStyle(fontSize: 24),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          document.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${document.subject} • ${document.grade}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
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
                          document.averageRating.toStringAsFixed(1),
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
              
              const SizedBox(height: 12),
              
              // Description
              Text(
                document.description,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              
              const SizedBox(height: 12),
              
              // File info and uploader
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '📄 ${document.fileName}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          '📏 ${document.fileSizeFormatted}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'By ${document.uploaderName}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        _formatDate(document.uploadDate),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Tags
              if (document.tags.isNotEmpty) ...[
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: document.tags.take(3).map((tag) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '#$tag',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.blue[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  )).toList(),
                ),
                const SizedBox(height: 12),
              ],
              
              // Stats row
              Row(
                children: [
                  _buildStatItem(
                    Icons.remove_red_eye,
                    '${document.viewCount}',
                    'Views',
                  ),
                  const SizedBox(width: 24),
                  _buildStatItem(
                    Icons.download,
                    '${document.downloadCount}',
                    'Downloads',
                  ),
                  const SizedBox(width: 24),
                  _buildStatItem(
                    Icons.star,
                    '${document.ratings.length}',
                    'Ratings',
                  ),
                  const SizedBox(width: 24),
                  _buildStatItem(
                    Icons.comment,
                    '${document.comments.length}',
                    'Comments',
                  ),
                ],
              ),
            ],
          ),
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

class DocumentSearchDelegate extends SearchDelegate<String> {
  final DocumentService _documentService;

  DocumentSearchDelegate(this._documentService);

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
    
    final results = _documentService.searchDocuments(query);
    
    return ListView.builder(
      itemCount: results.length,
      itemBuilder: (context, index) {
        final document = results[index];
        return ListTile(
          leading: Text(
            document.fileTypeIcon,
            style: const TextStyle(fontSize: 24),
          ),
          title: Text(document.title),
          subtitle: Text('${document.subject} • ${document.grade}'),
          trailing: Text('${document.averageRating.toStringAsFixed(1)} ⭐'),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => DocumentDetailScreen(document: document),
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
    
    final suggestions = _documentService.searchDocuments(query);
    
    return ListView.builder(
      itemCount: suggestions.length,
      itemBuilder: (context, index) {
        final document = suggestions[index];
        return ListTile(
          leading: Text(
            document.fileTypeIcon,
            style: const TextStyle(fontSize: 20),
          ),
          title: Text(document.title),
          subtitle: Text('${document.subject} • ${document.grade} • ${document.uploaderName}'),
          onTap: () {
            query = document.title;
            showResults(context);
          },
        );
      },
    );
  }
}
