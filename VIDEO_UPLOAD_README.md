# Video Upload Feature

## Overview
The video upload functionality has been implemented and is now fully functional. Users can upload videos with metadata including title, description, tutor name, and subject.

## Features
- **Video File Selection**: Choose video files from device storage
- **File Validation**: Supports multiple video formats (MP4, AVI, MOV, WMV, FLV, WebM, MKV)
- **Size Limits**: Maximum file size of 100MB
- **Metadata Input**: Add title, description, tutor name, and subject
- **Permission Handling**: Automatic request for storage and camera permissions
- **Upload Progress**: Visual feedback during upload process

## How to Use

### 1. Access Video Upload
- Navigate to the Dashboard screen
- Tap the orange "Upload Video" floating action button (when on the Videos tab)

### 2. Select Video File
- Tap "Choose Video File" button
- Select a video file from your device
- Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV
- Maximum size: 100MB

### 3. Fill Video Details
- **Video Title**: Enter a descriptive title (minimum 5 characters)
- **Description**: Describe what the video covers (minimum 10 characters)
- **Tutor Name**: Enter the tutor's name
- **Subject**: Select from predefined subjects or choose "Other"

### 4. Upload
- Tap "Upload Video" button
- Wait for upload to complete
- You'll see a success message when done

## Technical Implementation

### Dependencies Added
- `file_picker`: For selecting video files (web and mobile compatible)
- `video_player`: For video playback (future enhancement)
- `path_provider`: For file path management (mobile only)

### Files Created/Modified
- `lib/services/video_upload_service.dart` - New video upload service (web and mobile compatible)
- `lib/screens/video_upload_screen.dart` - New upload UI screen (web and mobile compatible)
- `lib/screens/dashboard_screen.dart` - Updated to use real upload functionality
- `android/app/src/main/AndroidManifest.xml` - Added Android permissions
- `ios/Runner/Info.plist` - Added iOS permissions

### Platform Compatibility
- **Web**: No permissions required, uses browser's native file picker
- **Mobile**: Requires storage and camera permissions (Android/iOS)

### Permissions Required (Mobile Only)
- **Android**: READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE, CAMERA, RECORD_AUDIO
- **iOS**: Camera, Photo Library, Microphone

## Current Limitations
- Video storage is simulated (returns mock URLs)
- Thumbnail generation is placeholder
- No actual cloud storage integration

## Future Enhancements
- Real cloud storage integration (Firebase Storage, AWS S3)
- Video thumbnail generation
- Video compression and optimization
- Progress tracking for large files
- Video preview before upload

## Troubleshooting

### Web Platform
- **No permissions needed**: The web version uses the browser's native file picker
- **File selection**: Click "Choose Video File" to open the browser's file selection dialog
- **Supported browsers**: Modern browsers with HTML5 file input support
- **File size limits**: Browser may have its own file size limits

### Mobile Platform
- **Permission Issues**: Ensure the app has storage and camera permissions
- **Android**: Go to Settings > Apps > Apptest2 > Permissions
- **iOS**: Go to Settings > Privacy & Security > Camera/Photos

### File Selection Issues
- Check if the video file is in a supported format
- Ensure file size is under 100MB
- Try selecting a different video file

### Upload Failures
- Check internet connection
- Ensure all required fields are filled
- Try uploading a smaller video file

## Testing
To test the video upload functionality:
1. Run the app on a device or emulator
2. Navigate to Dashboard
3. Tap the "Upload Video" button
4. Select a video file
5. Fill in the required information
6. Tap "Upload Video"

The uploaded video should appear in the videos list after a successful upload.

