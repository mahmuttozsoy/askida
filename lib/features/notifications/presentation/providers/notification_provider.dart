import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/notification_api_service.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../domain/models/notification_model.dart';

final notificationApiServiceProvider = Provider((ref) => NotificationApiService());

// Canlı bildirim akışı (5 saniyede bir C# backend'den kullanıcının bildirimlerini çeker)
final notificationsStreamProvider = StreamProvider<List<NotificationModel>>((ref) async* {
  final service = ref.watch(notificationApiServiceProvider);
  final user = ref.watch(authProvider).userProfile;

  if (user == null || user.uid.isEmpty) {
    yield [];
    return;
  }

  while (true) {
    try {
      final notifsJson = await service.getNotifications(user.uid);
      final notifsList = notifsJson.map((json) => NotificationModel.fromJson(json)).toList();
      
      // Sort notifications by date descending so newest are on top
      notifsList.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      
      yield notifsList;
    } catch (e) {
      debugPrint("[NotificationProvider] Error fetching notifications: $e");
    }
    await Future.delayed(const Duration(seconds: 5));
  }
});

// Okunmamış bildirim sayısı
final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notifsAsync = ref.watch(notificationsStreamProvider);
  return notifsAsync.maybeWhen(
    data: (notifs) => notifs.where((n) => !n.isRead).length,
    orElse: () => 0,
  );
});

class NotificationNotifier extends Notifier<void> {
  late final NotificationApiService _service;

  @override
  void build() {
    _service = ref.watch(notificationApiServiceProvider);
  }

  Future<void> markAsRead(String notificationId) async {
    final response = await _service.markAsRead(notificationId);
    if (response['success'] == true) {
      ref.invalidate(notificationsStreamProvider);
    }
  }

  Future<void> markAllAsRead() async {
    final user = ref.read(authProvider).userProfile;
    if (user == null || user.uid.isEmpty) return;

    final response = await _service.markAllAsRead(user.uid);
    if (response['success'] == true) {
      ref.invalidate(notificationsStreamProvider);
    }
  }
}

final notificationProvider = NotifierProvider<NotificationNotifier, void>(() => NotificationNotifier());
