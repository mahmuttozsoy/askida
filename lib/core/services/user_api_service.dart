import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import 'api_client.dart';

class UserApiService {
  final Dio _dio = ApiClient.create('/api/users');

  Future<Map<String, dynamic>> uploadVerificationDocument(String userId, File file) async {
    try {
      final fileName = file.path.split('/').last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path, filename: fileName),
      });

      final response = await _dio.post(
        '/$userId/upload-document',
        data: formData,
      );
      
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> verifyStudent({
    required String userId,
    required String fullName,
    required String phone,
    required String email,
    required String studentCategory,
    required String schoolName,
    required String grade,
    required File file,
  }) async {
    try {
      final fileName = file.path.split('/').last;
      final formData = FormData.fromMap({
        'FullName': fullName,
        'Phone': phone,
        'Email': email,
        'StudentCategory': studentCategory,
        'SchoolName': schoolName,
        'Grade': grade,
        'File': await MultipartFile.fromFile(file.path, filename: fileName),
      });

      final response = await _dio.post(
        '/$userId/verify-student',
        data: formData,
      );
      
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getUserProfile(String userId) async {
    try {
      final response = await _dio.get('/$userId');
      return {
        'success': true,
        'user': response.data,
      };
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> updateFcmToken(String userId, String token) async {
    try {
      final response = await _dio.put(
        '/$userId/fcm-token',
        data: {'Token': token},
      );
      return {
        'success': true,
        'data': response.data,
      };
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<List<dynamic>> getAllUsers() async {
    try {
      final response = await _dio.get('');
      if (response.data is List) {
        return response.data;
      }
      return [];
    } catch (e) {
      debugPrint("Error getting all users: $e");
      return [];
    }
  }

  Future<Map<String, dynamic>> approveUser(String userId) async {
    try {
      final response = await _dio.post('/$userId/approve');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> rejectUser(String userId) async {
    try {
      final response = await _dio.post('/$userId/reject');
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
