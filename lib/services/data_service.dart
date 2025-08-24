import '../models/student.dart';
import '../models/tutor.dart';

class DataService {
  // In-memory storage for demo purposes
  // In a real app, this would be replaced with database operations
  static final List<Student> _students = [];
  static final List<Tutor> _tutors = [];

  // Student CRUD operations
  List<Student> getAllStudents() {
    return List.from(_students);
  }

  Student? getStudentById(String id) {
    try {
      return _students.firstWhere((student) => student.id == id);
    } catch (e) {
      return null;
    }
  }

  void addStudent(Student student) {
    _students.add(student);
  }

  void updateStudent(Student updatedStudent) {
    final index = _students.indexWhere((student) => student.id == updatedStudent.id);
    if (index != -1) {
      _students[index] = updatedStudent;
    }
  }

  void deleteStudent(String id) {
    _students.removeWhere((student) => student.id == id);
  }

  // Tutor CRUD operations
  List<Tutor> getAllTutors() {
    return List.from(_tutors);
  }

  Tutor? getTutorById(String id) {
    try {
      return _tutors.firstWhere((tutor) => tutor.id == id);
    } catch (e) {
      return null;
    }
  }

  void addTutor(Tutor tutor) {
    _tutors.add(tutor);
  }

  void updateTutor(Tutor updatedTutor) {
    final index = _tutors.indexWhere((tutor) => tutor.id == updatedTutor.id);
    if (index != -1) {
      _tutors[index] = updatedTutor;
    }
  }

  void deleteTutor(String id) {
    _tutors.removeWhere((tutor) => tutor.id == id);
  }

  // Search operations
  List<Student> searchStudents(String query) {
    if (query.isEmpty) return getAllStudents();
    return _students.where((student) {
      return student.name.toLowerCase().contains(query.toLowerCase()) ||
             student.subject.toLowerCase().contains(query.toLowerCase()) ||
             student.email.toLowerCase().contains(query.toLowerCase());
    }).toList();
  }

  List<Tutor> searchTutors(String query) {
    if (query.isEmpty) return getAllTutors();
    return _tutors.where((tutor) {
      return tutor.name.toLowerCase().contains(query.toLowerCase()) ||
             tutor.subject.toLowerCase().contains(query.toLowerCase()) ||
             tutor.email.toLowerCase().contains(query.toLowerCase());
    }).toList();
  }

  // Initialize with sample data
  void initializeSampleData() {
    if (_students.isEmpty) {
      _students.addAll([
        Student(
          id: '1',
          name: 'John Doe',
          email: 'john.doe@email.com',
          subject: 'Mathematics',
        ),
        Student(
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@email.com',
          subject: 'Physics',
        ),
        Student(
          id: '3',
          name: 'Mike Johnson',
          email: 'mike.johnson@email.com',
          subject: 'Chemistry',
        ),
      ]);
    }

    if (_tutors.isEmpty) {
      _tutors.addAll([
        Tutor(
          id: '1',
          name: 'Dr. Sarah Wilson',
          email: 'sarah.wilson@university.edu',
          subject: 'Mathematics',
        ),
        Tutor(
          id: '2',
          name: 'Prof. Robert Chen',
          email: 'robert.chen@university.edu',
          subject: 'Physics',
        ),
        Tutor(
          id: '3',
          name: 'Dr. Emily Davis',
          email: 'emily.davis@university.edu',
          subject: 'Chemistry',
        ),
      ]);
    }
  }
}
