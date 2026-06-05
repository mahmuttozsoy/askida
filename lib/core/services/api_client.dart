import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static String get baseHost {
    return 'https://api.askidagmtid.com';
  }
  static const String tokenKey = 'auth_token';

  static Dio create(String path) {
    final dio = Dio(
      BaseOptions(
        baseUrl: '$baseHost$path',
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString(tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onResponse: (response, handler) {
          if (response.data is String) {
            try {
              response.data = jsonDecode(response.data);
            } catch (_) {}
          }
          handler.next(response);
        },
        onError: (DioException e, handler) {
          if (e.response?.data is String) {
            try {
              e.response!.data = jsonDecode(e.response!.data);
            } catch (_) {
              e.response!.data = {
                'success': false,
                'message': e.response!.data.toString().isNotEmpty
                    ? 'Sunucu geçersiz yanıt döndürdü (HTML/Text)'
                    : 'Sunucu hatası'
              };
            }
          }
          handler.next(e);
        },
      ),
    );

    return dio;
  }

  static Map<String, dynamic> handleError(DioException e) {
    if (e.response != null) {
      var data = e.response?.data;
      if (data is Map<String, dynamic>) {
        if (data.containsKey('message') && data['message'] != null && data['message'].toString().isNotEmpty) {
          return data;
        }
        // ASP.NET Validation Errors
        if (data.containsKey('errors') && data['errors'] is Map) {
          final errors = data['errors'] as Map;
          final errorMessages = errors.values
              .map((err) => err is List ? err.join('\n') : err.toString())
              .join('\n');
          if (errorMessages.isNotEmpty) {
            return {'success': false, 'message': errorMessages};
          }
        }
        if (data.containsKey('title')) {
          return {'success': false, 'message': data['title']};
        }
        return {'success': false, 'message': 'Sunucu hatası (${e.response?.statusCode})'};
      }
      return {'success': false, 'message': 'Sunucu geçersiz bir yanıt verdi.'};
    }

    String message;
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = 'Sunucu bağlantısı zaman aşımına uğradı. Lütfen internetinizi kontrol edin.';
        break;
      case DioExceptionType.connectionError:
        message = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
        break;
      case DioExceptionType.badCertificate:
        message = 'Güvenli bağlantı kurulamadı (Sertifika hatası).';
        break;
      case DioExceptionType.cancel:
        message = 'İstek iptal edildi.';
        break;
      default:
        message = 'Bir ağ hatası oluştu. Lütfen tekrar deneyin.';
    }
    return {'success': false, 'message': message};
  }
}
