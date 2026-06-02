import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/routing/app_router.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'core/services/notification_manager.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    // Initialize notification manager
    await NotificationManager.initialize();
  } catch (e) {
    debugPrint('Firebase başlatılamadı: $e');
  }

  runApp(const ProviderScope(child: AskidaApp()));
}

class AskidaApp extends StatelessWidget {
  const AskidaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Askıda',
      theme: AppTheme.lightTheme,
      routerConfig: appRouter,
    );
  }
}
