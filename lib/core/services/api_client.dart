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
}
