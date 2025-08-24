import '../models/user.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:async';

class AuthService {
  // In-memory cache (mirrors Firestore)
  static final List<User> _users = [];
  static User? _currentUser;
  static final FirebaseFirestore _db = FirebaseFirestore.instance;
  static bool _loaded = false;

  // Get current logged in user
  User? get currentUser => _currentUser;

  // Check if user is logged in
  bool get isLoggedIn => _currentUser != null;

  Future<void> ensureInitialized() async {
    if (_loaded) return;
    try {
      await _loadUsersFromRemote().timeout(const Duration(seconds: 8));
    } catch (_) {
      // ignore network errors; fallback to seeding below if needed
    }
    if (_users.isEmpty) {
      // Seed sample including admin on first run
      final seed = [
        User(
          id: '1',
          name: 'John Doe',
          grade: '12th Grade',
          email: 'john.doe@email.com',
          username: 'johndoe',
          password: 'password123',
          role: 'student',
        ),
        User(
          id: '2',
          name: 'Jane Smith',
          grade: '11th Grade',
          email: 'jane.smith@email.com',
          username: 'janesmith',
          password: 'password123',
          role: 'student',
        ),
        User(
          id: '3',
          name: 'Dr. Sarah Wilson',
          grade: 'Professor',
          email: 'sarah.wilson@university.edu',
          username: 'sarahwilson',
          password: 'password123',
          role: 'tutor',
        ),
        User(
          id: 'admin',
          name: 'Administrator',
          grade: 'N/A',
          email: 'admin@system.local',
          username: 'admin',
          password: 'admin123',
          role: 'admin',
        ),
      ];
      for (final u in seed) {
        try {
          await _db.collection('users').doc(u.id).set(u.toJson()).timeout(const Duration(seconds: 5));
        } catch (_) {
          // ignore if cannot seed remotely (rules/network). Keep local cache.
        }
        _users.add(u);
      }
    }
    _loaded = true;
  }

  Future<void> _loadUsersFromRemote() async {
    try {
      final snap = await _db.collection('users').get();
      _users
        ..clear()
        ..addAll(snap.docs.map((d) => User.fromJson(d.data())));
    } catch (_) {
      // ignore and keep any existing cache
    }
  }

  // Registration
  Future<bool> register({
    required String name,
    required String grade,
    required String email,
    required String username,
    required String password,
    required String role,
  }) async {
    await ensureInitialized();

    // Check if username or email already exists
    if (_users.any((user) => user.username == username || user.email == email)) {
      return false; // User already exists
    }

    // Create new user
    final user = User(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      grade: grade,
      email: email,
      username: username,
      password: password, // In real app, hash this password
      role: role,
    );

    try {
      await _db.collection('users').doc(user.id).set(user.toJson()).timeout(const Duration(seconds: 10));
      _users.add(user);
      return true;
    } catch (e) {
      // As a fallback, avoid hanging the UI; do not persist locally if remote failed
      return false;
    }
  }

  // Login
  Future<bool> login({
    required String username,
    required String password,
  }) async {
    await ensureInitialized();
    try {
      final user = _users.firstWhere(
        (user) => user.username == username && user.password == password,
      );
      // Check blocklist
      try {
        final blk = await _db.collection('blocked_users').doc(user.id).get().timeout(const Duration(seconds: 5));
        if (blk.exists && (blk.data()?['blocked'] == true)) {
          return false;
        }
      } catch (_) {}
      _currentUser = user;
      return true;
    } catch (e) {
      return false; // Invalid credentials
    }
  }

  // Logout
  void logout() {
    _currentUser = null;
  }

  // Get user by ID
  User? getUserById(String id) {
    try {
      return _users.firstWhere((user) => user.id == id);
    } catch (e) {
      return null;
    }
  }

  // Update user profile
  Future<bool> updateUser(User updatedUser) async {
    final index = _users.indexWhere((user) => user.id == updatedUser.id);
    if (index != -1) {
      try {
        await _db.collection('users').doc(updatedUser.id).update(updatedUser.toJson()).timeout(const Duration(seconds: 8));
        _users[index] = updatedUser;
        if (_currentUser?.id == updatedUser.id) {
          _currentUser = updatedUser;
        }
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  // Deprecated: kept for backwards calls
  void initializeSampleUsers() {
    // no-op; using ensureInitialized instead
    // left for compatibility with existing screens
    // triggers background load without await
    // ignore: discarded_futures
    ensureInitialized();
  }
}

