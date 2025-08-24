import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import '../services/video_upload_service.dart';
import '../services/tutor_video_service.dart';
import '../models/tutor_video.dart';

class VideoUploadScreen extends StatefulWidget {
  final String uploaderId;
  final String uploaderName;

  const VideoUploadScreen({
    super.key,
    required this.uploaderId,
    required this.uploaderName,
  });

  @override
  State<VideoUploadScreen> createState() => _VideoUploadScreenState();
}

class _VideoUploadScreenState extends State<VideoUploadScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _tutorNameController = TextEditingController();
  final _tutorSubjectController = TextEditingController();
  
  PlatformFile? _selectedVideo;
  bool _isUploading = false;
  bool _hasPermissions = false;
  
  final List<String> _subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English Literature',
    'History',
    'Geography',
    'Economics',
    'Psychology',
    'Other'
  ];

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _tutorNameController.dispose();
    _tutorSubjectController.dispose();
    super.dispose();
  }

  Future<void> _checkPermissions() async {
    if (kIsWeb) {
      // On web, no permissions are needed for file picking
      setState(() {
        _hasPermissions = true;
      });
      return;
    }
    
    final hasPermissions = await VideoUploadService.requestPermissions();
    setState(() {
      _hasPermissions = hasPermissions;
    });
  }

  Future<void> _pickVideo() async {
    try {
      final result = await VideoUploadService.pickVideo();
      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _selectedVideo = result.files.first;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error picking video: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _uploadVideo() async {
    if (!_formKey.currentState!.validate() || _selectedVideo == null) {
      return;
    }

    setState(() {
      _isUploading = true;
    });

    try {
      // Create video object
      final video = await VideoUploadService.createVideoFromUpload(
        videoFile: null, // We don't need File objects on web
        platformFile: _selectedVideo,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        tutorId: DateTime.now().millisecondsSinceEpoch.toString(),
        tutorName: _tutorNameController.text.trim(),
        tutorSubject: _tutorSubjectController.text.trim(),
        uploaderId: widget.uploaderId,
        uploaderName: widget.uploaderName,
      );

      if (video != null) {
        // Add to video service
        final success = await TutorVideoService().addVideo(video);
        
        if (success) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Video uploaded successfully!'),
                backgroundColor: Colors.green,
              ),
            );
            Navigator.of(context).pop(true); // Return success
          }
        } else {
          throw Exception('Failed to save video to database');
        }
      } else {
        throw Exception('Failed to create video object');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Video'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Video Selection Section
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Select Video',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      
                      if (!_hasPermissions)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.orange.shade200),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.warning, color: Colors.orange.shade700),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  kIsWeb 
                                    ? 'Click "Choose Video File" to select a video from your device.'
                                    : 'Storage and camera permissions are required to upload videos.',
                                  style: TextStyle(color: Colors.orange.shade700),
                                ),
                              ),
                            ],
                          ),
                        ),
                      
                      const SizedBox(height: 16),
                      
                      ElevatedButton.icon(
                        onPressed: (kIsWeb || _hasPermissions) ? _pickVideo : null,
                        icon: const Icon(Icons.video_library),
                        label: const Text('Choose Video File'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      if (_selectedVideo != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.green.shade200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.check_circle, color: Colors.green.shade700),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Video Selected',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.green.shade700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('File: ${_selectedVideo!.name}'),
                              Text('Size: ${_formatFileSize(_selectedVideo!.size)}'),
                              Text('Type: ${_selectedVideo!.extension?.toUpperCase()}'),
                            ],
                          ),
                        ),
                      ],
                      
                      const SizedBox(height: 8),
                      Text(
                        'Supported formats: ${VideoUploadService.getSupportedFormats().join(', ').toUpperCase()}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                      Text(
                        'Maximum size: ${VideoUploadService.getMaxVideoSizeMB()}MB',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Video Details Form
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Video Details',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      
                      TextFormField(
                        controller: _titleController,
                        decoration: const InputDecoration(
                          labelText: 'Video Title *',
                          hintText: 'Enter a descriptive title for your video',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter a video title';
                          }
                          if (value.trim().length < 5) {
                            return 'Title must be at least 5 characters long';
                          }
                          return null;
                        },
                      ),
                      
                      const SizedBox(height: 16),
                      
                      TextFormField(
                        controller: _descriptionController,
                        decoration: const InputDecoration(
                          labelText: 'Description *',
                          hintText: 'Describe what this video covers',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 3,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter a description';
                          }
                          if (value.trim().length < 10) {
                            return 'Description must be at least 10 characters long';
                          }
                          return null;
                        },
                      ),
                      
                      const SizedBox(height: 16),
                      
                      TextFormField(
                        controller: _tutorNameController,
                        decoration: const InputDecoration(
                          labelText: 'Tutor Name *',
                          hintText: 'Enter the tutor\'s name',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter the tutor\'s name';
                          }
                          return null;
                        },
                      ),
                      
                      const SizedBox(height: 16),
                      
                      DropdownButtonFormField<String>(
                        value: _tutorSubjectController.text.isEmpty ? null : _tutorSubjectController.text,
                        decoration: const InputDecoration(
                          labelText: 'Subject *',
                          border: OutlineInputBorder(),
                        ),
                        items: _subjects.map((subject) {
                          return DropdownMenuItem(
                            value: subject,
                            child: Text(subject),
                          );
                        }).toList(),
                        onChanged: (value) {
                          if (value != null) {
                            _tutorSubjectController.text = value;
                          }
                        },
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please select a subject';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Upload Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (_selectedVideo != null && !_isUploading) ? _uploadVideo : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isUploading
                      ? const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            ),
                            SizedBox(width: 12),
                            Text('Uploading...'),
                          ],
                        )
                      : const Text(
                          'Upload Video',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
