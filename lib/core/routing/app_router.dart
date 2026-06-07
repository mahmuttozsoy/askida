import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/onboarding_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/role_selection_screen.dart';
import '../../features/auth/presentation/screens/email_verification_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';

import '../../core/layout/main_layout.dart';
import '../../features/feed/presentation/screens/create_ad_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/profile/presentation/screens/profile_sub_pages.dart';
import '../../features/feed/presentation/screens/ad_detail_screen.dart';
import '../../features/feed/domain/models/ad_model.dart';
import '../../features/profile/presentation/screens/verification_screen.dart';
import '../../features/admin/presentation/screens/admin_panel_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    // ... mevcut rotalar ...
    GoRoute(
      path: '/ad-detail',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>;
        return AdDetailScreen(
          ad: extra['ad'] as FoodAd,
          isStudent: extra['isStudent'] as bool,
        );
      },
    ),
    GoRoute(
      path: '/admin',
      builder: (context, state) => const AdminPanelScreen(),
    ),
    GoRoute(
      path: '/verify-student',
      builder: (context, state) => const VerificationScreen(),
    ),
    GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/role-selection',
      builder: (context, state) => const RoleSelectionScreen(),
    ),
    GoRoute(
      path: '/verify-email',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        return EmailVerificationScreen(
          phone: extra?['phone'] as String?,
          password: extra?['password'] ?? '',
          role: extra?['role'] ?? UserRole.student,
          name: extra?['name'] ?? '',
        );
      },
    ),
    GoRoute(
      path: '/home-student',
      builder: (context, state) => const MainLayout(isStudent: true),
    ),
    GoRoute(
      path: '/home-supporter',
      builder: (context, state) => const MainLayout(isStudent: false),
    ),
    GoRoute(
      path: '/home-business',
      builder: (context, state) => const MainLayout(isStudent: false),
    ),
    GoRoute(
      path: '/create-ad',
      builder: (context, state) => const CreateAdScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
      routes: [
        GoRoute(
          path: 'transaction-history',
          builder: (context, state) => const TransactionHistoryScreen(),
        ),
        GoRoute(
          path: 'help-support',
          builder: (context, state) => const HelpSupportScreen(),
        ),
        GoRoute(
          path: 'privacy-policy',
          builder: (context, state) => const PrivacyPolicyScreen(),
        ),
        GoRoute(
          path: 'settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
    ),
  ],
);
