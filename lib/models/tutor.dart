class Tutor {
  final String id;
  final String name;
  final String email;
  final String subject;

  Tutor({
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

  factory Tutor.fromJson(Map<String, dynamic> json) {
    return Tutor(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      subject: json['subject'],
    );
  }
}
