import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class EmailService {
  // Bu bilgiler kullanıcıdan gelecek, şimdilik placeholder
  final String serviceId = 'service_4dsn0a4';
  final String templateId = 'template_yi0tzoa';
  final String publicKey = 'c82umLzGRFKLhQkpA';

  Future<String> sendOTP({
    required String toEmail,
    required String otpCode,
    required String userName,
  }) async {
    final url = Uri.parse('https://api.emailjs.com/api/v1.0/email/send');
    
    try {
      debugPrint('Sending email to: $toEmail');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'service_id': serviceId,
          'template_id': templateId,
          'user_id': publicKey,
          'template_params': {
            'to_email': toEmail,
            'name': userName,
            'otp_code': otpCode,
          },
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('SUCCESS: Email successfully sent!');
        return 'SUCCESS';
      } else {
        debugPrint('FAILED: EmailJS Error - Code: ${response.statusCode} - Body: ${response.body}');
        return response.body;
      }
    } catch (e) {
      debugPrint('Network/Email Error: $e');
      return e.toString();
    }
  }
}
