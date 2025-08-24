class User {
  final String id;
  final String name;
  final String grade;
  final String email;
  final String username;
  final String password;
  final String role; // 'student' or 'tutor'

  User({
    required this.id,
    required this.name,
    required this.grade,
    required this.email,
    required this.username,
    required this.password,
    required this.role,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'grade': grade,
      'email': email,
      'username': username,
      'password': password,
      'role': role,
    };
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      grade: json['grade'],
      email: json['email'],
      username: json['username'],
      password: json['password'],
      role: json['role'],
    );
  }

  // Create a copy of user with updated fields
  User copyWith({
    String? id,
    String? name,
    String? grade,
    String? email,
    String? username,
    String? password,
    String? role,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      grade: grade ?? this.grade,
      email: email ?? this.email,
      username: username ?? this.username,
      password: password ?? this.password,
      role: role ?? this.role,
    );
  }
}

