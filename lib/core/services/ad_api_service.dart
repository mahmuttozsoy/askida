import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

class AdApiService {
  final Dio _dio = ApiClient.create('/api/aids');

  Future<List<dynamic>> getAds() async {
    try {
      final response = await _dio.get('');
      if (response.data is List) {
        return response.data;
      }
      return [];
    } on DioException catch (e) {
      debugPrint("Error getting ads from API: $e");
      return [];
    }
  }

  Future<Map<String, dynamic>> createAd({
    required String title,
    required String description,
    required String categoryId,
    required String creatorId,
    required double price,
    required String location,
    required int quantity,
  }) async {
    try {
      final response = await _dio.post('', data: {
        'title': title,
        'description': description,
        'categoryId': categoryId,
        'creatorId': creatorId,
        'price': price,
        'location': location,
        'quantity': quantity,
      });
      return {
        'success': true,
        'ad': response.data,
      };
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> claimAd(String adId, String claimerId) async {
    try {
      final response = await _dio.post('/$adId/claim', queryParameters: {
        'claimerId': claimerId,
      });
      return {
        'success': true,
        'ad': response.data,
      };
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> updateAdStatus(String adId, String status) async {
    try {
      // Fetch existing ad first
      final getResponse = await _dio.get('/$adId');
      final adData = Map<String, dynamic>.from(getResponse.data);
      adData['status'] = status;

      await _dio.put('/$adId', data: adData);
      return {
        'success': true,
        'message': 'İlan durumu güncellendi',
      };
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> deleteAd(String adId) async {
    try {
      await _dio.delete('/$adId');
      return {
        'success': true,
        'message': 'İlan başarıyla silindi',
      };
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
