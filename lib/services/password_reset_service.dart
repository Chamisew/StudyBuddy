import 'dart:math';
import '../models/user.dart';

class PasswordResetService {
  // In-memory storage for demo purposes
  // In a real app, this would be replaced with actual email service integration
  static final Map<String, String> _verificationCodes = {};
  static final Map<String, String> _userEmails = {};

  // Generate a 6-digit verification code
  String _generateVerificationCode() {
    Random random = Random();
    String code = '';
    for (int i = 0; i < 6; i++) {
      code += random.nextInt(10).toString();
    }
    return code;
  }

  // Send verification code via email (simulated)
  Future<bool> sendVerificationCode(String username, String email) async {
    try {
      // In a real app, this would integrate with email service (SendGrid, AWS SES, etc.)
      // For demo purposes, we'll simulate the process
      
      // Check if user exists
      // This would typically query your user database
      if (username.isEmpty || email.isEmpty) {
        return false;
      }

      // Generate verification code
      String verificationCode = _generateVerificationCode();
      
      // Store the code and email
      _verificationCodes[username] = verificationCode;
      _userEmails[username] = email;

      // Simulate sending email
      print('Email sent to $email: Your verification code is $verificationCode');
      
      // In real app, you would:
      // 1. Call email service API (SendGrid, AWS SES, etc.)
      // 2. Send the verification code via email
      // 3. Handle delivery status
      
      return true;
    } catch (e) {
      print('Error sending verification code: $e');
      return false;
    }
  }

  // Verify the code entered by user
  bool verifyCode(String username, String code) {
    String? storedCode = _verificationCodes[username];
    if (storedCode != null && storedCode == code) {
      // Remove the used code
      _verificationCodes.remove(username);
      return true;
    }
    return false;
  }

  // Reset password for verified user
  Future<bool> resetPassword(String username, String newPassword) async {
    try {
      // In a real app, this would update the user's password in the database
      // For demo purposes, we'll simulate the process
      
      if (username.isEmpty || newPassword.isEmpty) {
        return false;
      }

      // Simulate password update
      print('Password reset for user: $username');
      
      // In real app, you would:
      // 1. Hash the new password
      // 2. Update user record in database
      // 3. Invalidate any existing sessions
      
      return true;
    } catch (e) {
      print('Error resetting password: $e');
      return false;
    }
  }

  // Get stored email for a user
  String? getUserEmail(String username) {
    return _userEmails[username];
  }

  // Check if verification code exists for user
  bool hasVerificationCode(String username) {
    return _verificationCodes.containsKey(username);
  }

  // Get the current verification code for a user (for demo purposes only)
  String? getCurrentVerificationCode(String username) {
    return _verificationCodes[username];
  }

  // Clear verification data (for cleanup)
  void clearVerificationData(String username) {
    _verificationCodes.remove(username);
    _userEmails.remove(username);
  }
}
