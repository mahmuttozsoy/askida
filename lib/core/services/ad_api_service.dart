import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

class AdApiService {
  // C# Backend'ine (AidsController) istekleri gönderen temel servis.
  // BaseURL olarak ApiClient içinden gelen yapılandırmayı kullanır.
  final Dio _dio = ApiClient.create('/api');

  Future<List<dynamic>> getAds() async {
    try {
      // Backend'den (PostgreSQL'den) tüm aktif ilanları (Aids) çeker.
      // Profil sayfasındaki istatistikler ve Ana sayfadaki feed listesi buradan beslenir.
      final response = await _dio.get('/aids');
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
      final response = await _dio.post('/aids', data: {
        'title': title,
        'description': description,
        'categoryId': categoryId,
        'creatorId': creatorId,
        'price': price,
        'location': location,
        'quantity': quantity,
        'status': 'Available',
        'createdAt': DateTime.now().toIso8601String(),
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
      // Öğrenci bir ilanı "Talep Et" (Claim) butonuna bastığında çalışır.
      // C# tarafındaki Claim metodunu tetikler, eğer çoklu miktarlı ilansa miktarı azaltıp yeni alt-ilan oluşturur.
      final response = await _dio.post('/aids/$adId/claim?claimerId=$claimerId');
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
      // Update aid status
      final getResponse = await _dio.get('/aids/$adId');
      final adData = Map<String, dynamic>.from(getResponse.data);
      adData['status'] = status;

      await _dio.put('/aids/$adId', data: adData);
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
      await _dio.delete('/aids/$adId');
      return {
        'success': true,
        'message': 'İlan başarıyla silindi',
      };
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Map<String, dynamic> _handleError(DioException e) {
    return ApiClient.handleError(e);
  }
}
