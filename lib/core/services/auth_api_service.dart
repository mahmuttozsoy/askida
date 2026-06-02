import 'package:dio/dio.dart';
import 'api_client.dart';

class AuthApiService {
  final Dio _dio = ApiClient.create('/api');

  Future<Map<String, dynamic>> sendOTP({String? email, String? phone, bool? allowExisting}) async {
    try {
      final response = await _dio.post('/auth/send-otp', data: {
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (allowExisting != null) 'allowExisting': allowExisting,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> verifyOTP({
    String? email,
    String? phone,
    required String code,
  }) async {
    try {
      final response = await _dio.post('/auth/verify-otp', data: {
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'code': code,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> resendOTP({String? email, String? phone}) async {
    try {
      final response = await _dio.post('/auth/resend-otp', data: {
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> register({
    String? email,
    String? phone,
    required String password,
    required String name,
    required String role,
  }) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'password': password,
        'name': name,
        'role': role,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> login({
    String? email,
    String? phone,
    required String password,
    required String role,
  }) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'password': password,
        'role': role,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> resetPassword({
    required String phone,
    required String code,
    required String newPassword,
  }) async {
    try {
      final response = await _dio.post('/auth/reset-password', data: {
        'phone': phone,
        'code': code,
        'newPassword': newPassword,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Map<String, dynamic> _handleError(DioException e) {
    if (e.response != null) {
      return e.response?.data ?? {'success': false, 'message': 'Sunucu hatası'};
    }
    return {'success': false, 'message': 'Bağlantı hatası: ${e.message}'};
  }
}
