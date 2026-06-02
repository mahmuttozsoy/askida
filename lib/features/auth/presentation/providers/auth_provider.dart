import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/services/auth_api_service.dart';
import '../../../../core/services/user_api_service.dart';
import '../../../../core/services/api_client.dart';
import '../../domain/models/user_model.dart';
import '../../../../core/services/notification_manager.dart';

enum UserRole { student, supporter, business, admin }

class AuthState {
  final bool isAuthenticated;
  final UserRole role;
  final UserModel? userProfile;
  final bool isLoading;

  AuthState({
    this.isAuthenticated = false,
    this.role = UserRole.student,
    this.userProfile,
    this.isLoading = false,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    UserRole? role,
    UserModel? userProfile,
    bool? isLoading,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      role: role ?? this.role,
      userProfile: userProfile ?? this.userProfile,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  final AuthApiService _apiService = AuthApiService();
  final UserApiService _userApiService = UserApiService();
  static const String _roleKey = 'user_role';
  static const String _userIdKey = 'user_id';
  static const String _tokenKey = ApiClient.tokenKey;

  Future<void> _saveSession({
    required UserRole role,
    required String? userId,
    String? token,
    UserModel? profile,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_roleKey, role.index);
    await prefs.setBool('is_authenticated', true);
    if (userId != null) {
      await prefs.setString(_userIdKey, userId);
      _registerFcmToken(userId);
    }
    if (token != null) await prefs.setString(_tokenKey, token);

    state = state.copyWith(
      isAuthenticated: true,
      role: role,
      userProfile: profile,
      isLoading: false,
    );
    _checkPollingState();
  }

  Future<String?> sendRegistrationOtp({String? email, String? phone, bool? allowExisting}) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _apiService.sendOTP(email: email, phone: phone, allowExisting: allowExisting);
      if (response['success'] != true) {
        throw response['message'] ?? 'Kod gönderilemedi';
      }
      state = state.copyWith(isLoading: false);
      final data = response['data'];
      if (data is Map && data.containsKey('devOtp')) {
        return data['devOtp']?.toString();
      }
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Timer? _profilePollTimer;

  void _checkPollingState() {
    final user = state.userProfile;
    if (user != null) {
      debugPrint(
        "[AuthNotifier] _checkPollingState - status: ${user.verificationStatus}, isAuthenticated: ${state.isAuthenticated}",
      );
    }
    if (state.isAuthenticated &&
        user != null &&
        user.isStudent &&
        user.verificationStatus == VerificationStatus.pending) {
      if (_profilePollTimer == null || !_profilePollTimer!.isActive) {
        debugPrint("[AuthNotifier] Starting periodic profile polling timer...");
        _profilePollTimer = Timer.periodic(const Duration(seconds: 3), (
          timer,
        ) async {
          debugPrint("[AuthNotifier] Polling timer ticked");
          await refreshProfile();
        });
      }
    } else {
      if (_profilePollTimer != null) {
        debugPrint("[AuthNotifier] Cancelling periodic profile polling timer...");
        _profilePollTimer?.cancel();
        _profilePollTimer = null;
      }
    }
  }

  @override
  AuthState build() {
    _init();
    return AuthState(isLoading: true);
  }

  void _init() async {
    final prefs = await SharedPreferences.getInstance();
    final roleIndex = prefs.getInt(_roleKey) ?? 0;
    final isAuthenticated = prefs.getBool('is_authenticated') ?? false;
    final userId = prefs.getString(_userIdKey);

    UserModel? profile;
    if (isAuthenticated && userId != null) {
      final response = await _userApiService.getUserProfile(userId);
      if (response['success'] == true && response['user'] != null) {
        profile = UserModel.fromJson(response['user']);
        _registerFcmToken(userId);
      }
    }

    // Defer the state assignment to the next event loop iteration to prevent
    // modifying state during the build frame of another widget
    Future.delayed(Duration.zero, () {
      state = AuthState(
        isAuthenticated: isAuthenticated,
        userProfile: profile,
        role: UserRole.values[roleIndex],
        isLoading: false,
      );
      _checkPollingState();
    });
  }

  Future<void> _registerFcmToken(String userId) async {
    try {
      final token = await NotificationManager.getFcmToken();
      if (token != null && token.isNotEmpty) {
        debugPrint("[AuthNotifier] Registering FCM token to API: $token");
        await _userApiService.updateFcmToken(userId, token);
      }
    } catch (e) {
      debugPrint("[AuthNotifier] Error registering FCM token: $e");
    }
  }

  Future<void> login(
    UserRole role, {
    String? email,
    String? phone,
    String? password,
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      if (password == null || (email == null && phone == null)) {
        throw 'E-posta/telefon ve şifre gerekli';
      }

      String? userId;
      UserModel? profile;

      final response = await _apiService.login(
        email: email,
        phone: phone,
        password: password,
        role: role.name,
      );

      if (response['success'] != true) {
        throw response['message'] ?? 'Giriş başarısız';
      }

      final data = response['data'];
      Map<String, dynamic>? userData;
      String? token;

      if (data is Map<String, dynamic>) {
        token = data['token'] as String?;
        final nestedUser = data['user'];
        userData = nestedUser is Map<String, dynamic> ? nestedUser : data;
      } else {
        userData = response['user'] as Map<String, dynamic>?;
        token = response['token'] as String?;
      }

      if (userData != null) {
        userId = userData['id'];
        final profileResponse = await _userApiService.getUserProfile(userId!);
        if (profileResponse['success'] == true &&
            profileResponse['user'] != null) {
          profile = UserModel.fromJson(profileResponse['user']);
        } else {
          profile = UserModel.fromJson(userData);
        }
      }

      await _saveSession(
        role: role,
        userId: userId,
        token: token,
        profile: profile,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<String?> resendOTP({String? email, String? phone}) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _apiService.resendOTP(email: email, phone: phone);
      if (response['success'] != true) {
        throw response['message'] ?? 'Kod tekrar gönderilemedi';
      }
      state = state.copyWith(isLoading: false);
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> completeRegistration({
    String? email,
    String? phone,
    required String password,
    required UserRole role,
    required String name,
    required String code,
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      final verifyResponse = await _apiService.verifyOTP(
        email: email,
        phone: phone,
        code: code,
      );
      if (verifyResponse['success'] != true) {
        throw verifyResponse['message'] ?? 'Doğrulama kodu geçersiz';
      }

      final capitalizedRole =
          role.name[0].toUpperCase() + role.name.substring(1);
      final registerResponse = await _apiService.register(
        email: email,
        phone: phone,
        password: password,
        name: name,
        role: capitalizedRole,
      );

      if (registerResponse['success'] != true) {
        throw registerResponse['message'] ?? 'Kayıt başarısız';
      }

      String? userId;
      UserModel? profile;
      final userData = registerResponse['data'];
      if (userData != null) {
        userId = userData['id'];
        profile = UserModel.fromJson(userData as Map<String, dynamic>);
      }

      await _saveSession(role: role, userId: userId, profile: profile);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> logout() async {
    _profilePollTimer?.cancel();
    _profilePollTimer = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_roleKey);
    await prefs.remove('is_authenticated');
    await prefs.remove(_userIdKey);
    await prefs.remove(_tokenKey);
    state = AuthState(isAuthenticated: false);
  }

  Future<void> refreshProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString(_userIdKey);
      debugPrint("[AuthNotifier] refreshProfile called for userId: $userId");
      if (userId != null) {
        final response = await _userApiService.getUserProfile(userId);
        debugPrint(
          "[AuthNotifier] refreshProfile API response success: ${response['success']}",
        );
        if (response['success'] == true && response['user'] != null) {
          final profile = UserModel.fromJson(response['user']);
          debugPrint(
            "[AuthNotifier] Refreshed profile verification status: ${profile.verificationStatus}",
          );
          state = state.copyWith(userProfile: profile);
          _checkPollingState();
        }
      }
    } catch (e, stack) {
      debugPrint("[AuthNotifier] Error refreshing profile: $e");
      debugPrint(stack.toString());
    }
  }

  Future<void> resetPassword({
    required String phone,
    required String code,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _apiService.resetPassword(
        phone: phone,
        code: code,
        newPassword: newPassword,
      );
      if (response['success'] != true) {
        throw response['message'] ?? 'Şifre sıfırlama başarısız';
      }
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> setRole(UserRole role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_roleKey, role.index);
    state = state.copyWith(role: role);
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
