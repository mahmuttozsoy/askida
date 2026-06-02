import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint("[NotificationManager] Arka planda mesaj alındı: ${message.messageId}");
  // Arka planda gelen mesajlar için gerekirse özel işlemler buraya yazılabilir.
}

class NotificationManager {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotificationsPlugin = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'askida_sound_channel',
    'Askıda Sesli Bildirim Kanalı',
    description: 'Yeni talep veya onay durumunda sesli bildirim gönderir.',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  static Future<void> initialize() async {
    try {
      // 1. İzinleri İste (Android 13+ ve iOS için)
      NotificationSettings settings = await _firebaseMessaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: true,
        provisional: false,
        sound: true,
      );

      debugPrint('[NotificationManager] Kullanıcı bildirim izin durumu: ${settings.authorizationStatus}');

      // 2. Arka plan mesaj dinleyicisini kaydet
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // 3. Android Yerel Bildirim Kanalını Oluştur
      await _localNotificationsPlugin
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);

      // 4. Flutter Yerel Bildirim Ayarları
      const AndroidInitializationSettings androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      const DarwinInitializationSettings iosInit = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const InitializationSettings initSettings = InitializationSettings(
        android: androidInit,
        iOS: iosInit,
      );

      await _localNotificationsPlugin.initialize(
        settings: initSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          debugPrint("[NotificationManager] Bildirime tıklandı: ${response.payload}");
        },
      );

      // 5. Uygulama Açıkken (Foreground) Mesaj Dinleme
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[NotificationManager] Ön planda mesaj alındı: ${message.notification?.title}');
        _showNotification(message);
      });

      // 6. Uygulama Arka Planda veya Kapalıyken Bildirime Tıklayarak Açılma Durumu
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[NotificationManager] Bildirime tıklanarak uygulama açıldı: ${message.data}');
      });

    } catch (e) {
      debugPrint('[NotificationManager] Başlatma hatası: $e');
    }
  }

  // Cihazın FCM Token'ını alma
  static Future<String?> getFcmToken() async {
    try {
      if (kIsWeb) return null;
      final token = await _firebaseMessaging.getToken();
      debugPrint('[NotificationManager] FCM Token: $token');
      return token;
    } catch (e) {
      debugPrint('[NotificationManager] Token alma hatası: $e');
      return null;
    }
  }

  // Yerel sesli bildirim tetikleme
  static Future<void> _showNotification(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification != null && !kIsWeb) {
      await _localNotificationsPlugin.show(
        id: notification.hashCode,
        title: notification.title,
        body: notification.body,
        notificationDetails: NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            icon: android?.smallIcon ?? '@mipmap/ic_launcher',
            importance: Importance.max,
            priority: Priority.high,
            playSound: true,
            enableVibration: true,
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: message.data.toString(),
      );
    }
  }
}
