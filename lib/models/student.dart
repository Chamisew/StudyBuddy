class Student {
  final String id;
  final String name;
  final String email;
  final String subject;

  Student({
    required this.id,
    required this.name,
    required this.email,
    required this.subject,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'subject': subject,
    };
  }

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      subject: json['subject'],
    );
  }
}
