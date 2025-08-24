# Peer Learning CRUD App

A Flutter application with authentication and CRUD (Create, Read, Update, Delete) operations for managing students and tutors in a peer learning environment.

## Features

- **User Authentication**: Login and registration system with role-based access
- **Role Management**: Support for both students and tutors
- **Dashboard**: Social media-style dashboard for viewing tutor videos and educational documents with ratings and comments
- **Video Management**: Browse, rate, and comment on tutor videos
- **Document Sharing**: Share and discover educational notes, study guides, and resources
- **Students Management**: Add, view, edit, and delete student records
- **Tutors Management**: Add, view, edit, and delete tutor records
- **User Profiles**: Display user information including name, grade, email, and role
- **Password Reset**: Email-based password reset with verification codes
- **Simple UI**: Clean Material Design interface with custom tab navigation
- **In-Memory Storage**: Data is stored in memory for demonstration purposes

## App Structure

```
lib/
├── main.dart                 # Main app entry point
├── models/
│   ├── student.dart         # Student data model
│   ├── tutor.dart           # Tutor data model
│   ├── user.dart            # User authentication model
│   ├── tutor_video.dart     # Tutor video model with ratings and comments
│   └── educational_document.dart # Educational document model with ratings and comments
├── screens/
│   ├── login_screen.dart    # User login interface
│   ├── registration_screen.dart # User registration interface
│   ├── forgot_password_screen.dart # Password reset initiation
│   ├── verification_code_screen.dart # Email code verification
│   ├── new_password_screen.dart # New password setup
│   ├── dashboard_screen.dart # Main dashboard with tutor videos and documents
│   ├── video_detail_screen.dart # Video details with ratings and comments
│   ├── documents_screen.dart # Documents sharing and discovery
│   ├── document_detail_screen.dart # Document details with ratings and comments
│   └── home_screen.dart     # CRUD operations screen
└── services/
    ├── auth_service.dart    # Authentication service
    ├── password_reset_service.dart # Password reset service
    ├── data_service.dart    # Data management service
    ├── tutor_video_service.dart # Tutor video management service
    └── document_service.dart # Educational document management service
```

## Authentication

### Login
- Username and password authentication
- Role-based access control
- Demo credentials provided for testing
- Beautiful gradient UI with form validation
- **Forgot Password** link for password recovery

### Registration
- Complete user registration with all required fields:
  - Full Name
  - Grade/Level
  - Email (with validation)
  - Username (minimum 3 characters)
  - Role selection (Student or Tutor)
  - Password (minimum 6 characters)
  - Password confirmation
- Form validation and error handling
- Automatic navigation to login after successful registration

### Password Reset
- **Email-based password reset system**
- **Step 1**: Enter username and email address
- **Step 2**: Receive 6-digit verification code via email
- **Step 3**: Enter verification code to verify identity
- **Step 4**: Set new password with confirmation
- **Features**:
  - Resend code functionality with 30-second cooldown
  - Code expiration after use
  - Secure password requirements
  - Automatic cleanup of verification data

### Demo Credentials
- **Student**: `johndoe` / `password123`
- **Tutor**: `sarahwilson` / `password123`

## Dashboard Features

### Video Discovery
- **Social Media Style Layout**: Facebook-like interface for browsing tutor videos
- **Video Cards**: Rich video cards showing thumbnails, titles, descriptions, and stats
- **Filtering Options**: Filter videos by subject (Mathematics, Physics, English, Chemistry, Computer Science)
- **Sorting Options**: Sort by All, Top Rated, Most Viewed, or Recent
- **Search Functionality**: Search videos by title, description, tutor name, or subject

### Video Information
- **Video Details**: Title, description, tutor information, upload date
- **Statistics**: View count, rating count, comment count
- **Tutor Profiles**: Tutor name, subject, and avatar
- **Upload Information**: Uploader details and timestamp

### Ratings and Reviews
- **5-Star Rating System**: Rate videos from 1 to 5 stars
- **Rating Comments**: Optional comments with ratings
- **Average Ratings**: Display average rating for each video
- **Rating History**: Track all ratings given to videos

### Comments and Discussion
- **Comment System**: Add comments to videos
- **Reply System**: Reply to existing comments
- **User Avatars**: Visual representation of commenters
- **Timestamps**: Show when comments and replies were posted
- **Real-time Updates**: Comments and ratings update immediately

### Sample Content
The app comes with sample tutor videos covering various subjects:
- **Mathematics**: Advanced Calculus tutorials
- **Physics**: Newton's Laws of Motion
- **English Literature**: Shakespeare analysis
- **Chemistry**: Organic compounds
- **Computer Science**: Data structures

## Document Sharing Features

### Educational Resources
- **Document Types**: Support for PDF, DOC, DOCX, TXT, PPT, XLS, and image files
- **Rich Metadata**: Title, description, subject, grade level, file size, and tags
- **File Management**: Upload, download, and organize educational materials
- **Search & Discovery**: Find documents by subject, grade, tags, or content

### Document Categories
- **Study Notes**: Comprehensive notes and summaries
- **Lab Reports**: Scientific experiments and findings
- **Study Guides**: Exam preparation materials
- **Tutorials**: Step-by-step learning resources
- **Reference Materials**: Quick access to formulas and concepts

### Document Features
- **Rating System**: 5-star rating with optional comments
- **Comment System**: Discuss and ask questions about documents
- **Reply System**: Nested conversations for better organization
- **Download Tracking**: Monitor document popularity and usage
- **Tag System**: Categorize and organize content effectively

### Sample Documents
The app includes sample educational documents:
- **Mathematics**: Calculus notes, derivatives, and integrals
- **Physics**: Lab reports on Newton's laws and motion
- **English Literature**: Shakespeare analysis and interpretations
- **Chemistry**: Organic chemistry study guides
- **Computer Science**: Data structures and algorithms notes
- **Biology**: Cell biology and cellular processes

## CRUD Operations
- View all students and tutors in separate tabs
- User information displayed at the top of the screen
- Data is automatically loaded when the app starts
- Add, view, edit, and delete records

## User Interface

- **Login Screen**: Gradient background with card-based form and forgot password link
- **Registration Screen**: Multi-step form with role selection
- **Forgot Password Screen**: Username and email input
- **Verification Code Screen**: 6-digit code input with resend functionality
- **New Password Screen**: Password creation with security requirements
- **Dashboard Screen**: 
  - Social media-style video feed
  - Filter chips for subject selection
  - Search and filter options
  - Video upload button (placeholder)
  - User profile and navigation menu
- **Video Detail Screen**: 
  - Full video information
  - Rating and comment system
  - Reply functionality
  - Share button (placeholder)
- **Home Screen**:
  - User profile card showing name, role, grade, and email
  - Custom tab navigation between Students and Tutors
  - Floating action button for adding new records
  - Navigation to dashboard
  - Logout functionality in the app bar

## Navigation Flow

1. **App Start** → Login Screen
2. **Login Success** → Dashboard Screen (main interface)
3. **Dashboard** → Video Detail Screen (when tapping video cards)
4. **Dashboard** → Home Screen (CRUD operations)
5. **Home Screen** → Dashboard Screen (return to videos)
6. **Any Screen** → Login Screen (after logout)

## Getting Started

1. Ensure you have Flutter installed
2. Clone this repository
3. Run `flutter pub get` to install dependencies
4. Run `flutter run` to start the app
5. Use the demo credentials or register a new account

## Sample Data

The app comes with sample data for:
- Users (students and tutors)
- Students and tutors records
- Tutor videos with ratings and comments
- Sample subjects and content

## Future Enhancements

- Database integration (SQLite, Firebase, etc.)
- Real video playback functionality
- Video upload and storage
- Search and filtering capabilities
- Password hashing and security improvements
- Real email service integration for password reset
- Push notifications
- Offline support
- User profile customization
- Video categories and tags
- Advanced analytics and insights
