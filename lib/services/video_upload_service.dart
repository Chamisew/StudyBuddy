import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/tutor_video.dart';
import 'web_blob_url_stub.dart' if (dart.library.html) 'web_blob_url.dart';

class VideoUploadService {
  static const List<String> _supportedVideoFormats = [
    'mp4',
    'avi',
    'mov',
    'wmv',
    'flv',
    'webm',
    'mkv'
  ];
  
  static const int _maxVideoSizeMB = 100; // 100MB limit

  /// Request necessary permissions for video upload
  static Future<bool> requestPermissions() async {
    try {
      // On web platform, no permissions are needed for file picking
      if (kIsWeb) {
        return true;
      }
      
      // For mobile platforms, we would need permission_handler
      // For now, return true to allow the app to work
      print('Permission checking not implemented for mobile platforms');
      return true;
    } catch (e) {
      print('Error requesting permissions: $e');
      // On web, return true even if permission check fails
      if (kIsWeb) {
        return true;
      }
      return false;
    }
  }

  /// Pick a video file from device storage
  static Future<FilePickerResult?> pickVideo() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowMultiple: false,
        allowedExtensions: _supportedVideoFormats,
        withData: true, // ensure bytes are available for upload on all platforms
      );
      
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        
        // Validate file size
        if (file.size > _maxVideoSizeMB * 1024 * 1024) {
          throw Exception('Video file size exceeds ${_maxVideoSizeMB}MB limit');
        }
        
        // Validate file extension
        final extension = file.extension?.toLowerCase();
        if (extension == null || !_supportedVideoFormats.contains(extension)) {
          throw Exception('Unsupported video format. Supported formats: ${_supportedVideoFormats.join(', ')}');
        }
        
        return result;
      }
      
      return null;
    } catch (e) {
      print('Error picking video: $e');
      rethrow;
    }
  }

  /// Copy video file to app's temporary directory
  static Future<dynamic> copyVideoToTemp(PlatformFile platformFile) async {
    try {
      // On web, we can't create File objects from PlatformFile
      if (kIsWeb) {
        // For web, we'll work with the bytes directly
        return platformFile;
      }
      
      // For mobile platforms, we would need dart:io
      // For now, return the platform file
      return platformFile;
    } catch (e) {
      print('Error copying video to temp: $e');
      return null;
    }
  }

  /// Generate thumbnail from video (placeholder implementation)
  static Future<String?> generateThumbnail(dynamic videoFile) async {
    // This is a placeholder - in a real app, you'd use a video thumbnail generator
    // For now, return a default thumbnail URL
    return 'https://via.placeholder.com/300x200/cccccc/666666?text=Video+Thumbnail';
  }

  /// Upload video to storage (Firebase Storage)
  static Future<String?> uploadVideoToStorage(dynamic videoFile, {PlatformFile? platformFile}) async {
    try {
      if (platformFile == null) {
        throw Exception('No file selected');
      }

      // Prefer bytes upload for cross-platform support
      final bytes = platformFile.bytes;
      if (bytes == null) {
        throw Exception('File bytes unavailable for upload');
      }

      final ext = platformFile.extension ?? 'mp4';
      final mimeType = _inferMimeType(ext);
      final sanitizedName = platformFile.name.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$sanitizedName';
      final ref = FirebaseStorage.instance.ref().child('videos/$fileName');

      final metadata = SettableMetadata(contentType: mimeType);
      await ref.putData(bytes, metadata).timeout(const Duration(seconds: 30));
      final downloadUrl = await ref.getDownloadURL();
      return downloadUrl;
    } catch (e) {
      print('Error uploading video: $e');
      // Fallback for web: create a blob URL so the user can still view/play the video immediately
      if (kIsWeb && platformFile?.bytes != null) {
        final mimeType = _inferMimeType(platformFile!.extension);
        final localUrl = createObjectUrl(platformFile.bytes!, mimeType);
        if (localUrl != null) return localUrl;
      }
      return null;
    }
  }

  /// Create a new TutorVideo object from uploaded video
  static Future<TutorVideo?> createVideoFromUpload({
    dynamic videoFile,
    PlatformFile? platformFile,
    required String title,
    required String description,
    required String tutorId,
    required String tutorName,
    required String tutorSubject,
    required String uploaderId,
    required String uploaderName,
  }) async {
    try {
      // Generate thumbnail
      final thumbnailUrl = await generateThumbnail(videoFile);
      
      // Upload video to storage
      final videoUrl = await uploadVideoToStorage(videoFile, platformFile: platformFile);
      
      if (videoUrl == null) {
        throw Exception('Failed to upload video to storage');
      }
      
      // Create video object
      final video = TutorVideo(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: title,
        description: description,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl ?? 'https://via.placeholder.com/300x200/cccccc/666666?text=No+Thumbnail',
        tutorId: tutorId,
        tutorName: tutorName,
        tutorSubject: tutorSubject,
        uploaderId: uploaderId,
        uploaderName: uploaderName,
        uploadDate: DateTime.now(),
        viewCount: 0,
        averageRating: 0.0,
        ratings: [],
        comments: [],
      );
      
      return video;
    } catch (e) {
      print('Error creating video from upload: $e');
      return null;
    }
  }

  /// Validate video file
  static bool isValidVideoFile(PlatformFile file) {
    if (file.size > _maxVideoSizeMB * 1024 * 1024) return false;
    
    final extension = file.extension?.toLowerCase();
    if (extension == null || !_supportedVideoFormats.contains(extension)) return false;
    
    return true;
  }

  /// Get supported video formats
  static List<String> getSupportedFormats() {
    return List.from(_supportedVideoFormats);
  }

  /// Get maximum video size in MB
  static int getMaxVideoSizeMB() {
    return _maxVideoSizeMB;
  }

  static String _inferMimeType(String? ext) {
    switch ((ext ?? '').toLowerCase()) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'mov':
        return 'video/quicktime';
      case 'mkv':
        return 'video/x-matroska';
      case 'avi':
        return 'video/x-msvideo';
      case 'wmv':
        return 'video/x-ms-wmv';
      case 'flv':
        return 'video/x-flv';
      default:
        return 'application/octet-stream';
    }
  }
}
