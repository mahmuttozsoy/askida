import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

class NotificationApiService {
  final Dio _dio = ApiClient.create('/api/notifications');

  Future<List<dynamic>> getNotifications(String userId) async {
    try {
      final response = await _dio.get('/user/$userId');
      if (response.data is List) {
        return response.data;
      }
      return [];
    } on DioException catch (e) {
      debugPrint("Error getting notifications from API: $e");
      return [];
    }
  }

  Future<Map<String, dynamic>> markAsRead(String notificationId) async {
    try {
      final response = await _dio.post('/$notificationId/read');
      return {
        'success': true,
        'data': response.data,
      };
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> markAllAsRead(String userId) async {
    try {
      final response = await _dio.post('/user/$userId/read-all');
      return {
        'success': true,
        'data': response.data,
      };
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Map<String, dynamic> _handleError(DioException e) {
    return ApiClient.handleError(e);
  }
}
