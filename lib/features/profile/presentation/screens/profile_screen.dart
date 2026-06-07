import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/glass_container.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/domain/models/user_model.dart';
import '../../../feed/presentation/providers/feed_provider.dart';
import '../../../feed/domain/models/ad_model.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.userProfile;

    final completedAdsAsync = ref.watch(completedAdsProvider);
    final myRequestsAsync = ref.watch(myRequestsProvider);
    final incomingRequestsAsync = ref.watch(incomingRequestsProvider);

    final int completedCount = completedAdsAsync.value?.length ?? 0;
    final int pendingCount = user?.isStudent == true
        ? (myRequestsAsync.value?.where((a) => a.status == AdStatus.pending).length ?? 0)
        : (incomingRequestsAsync.value?.length ?? 0);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              context.push('/profile/settings');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(authProvider.notifier).refreshProfile();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              CircleAvatar(
                radius: 50,
                backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
                child: const Icon(Icons.person, size: 50, color: AppTheme.primaryColor),
              ),
              const SizedBox(height: 16),
              Text(
                user?.name ?? 'Kullanıcı',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                user?.email ?? 'E-posta adresi bulunamadı',
                style: TextStyle(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 12),
              _buildRoleBadge(user),
              const SizedBox(height: 32),
              
              if (user?.isStudent == true && user?.verificationStatus != VerificationStatus.verified)
                _buildVerificationCard(context, user?.verificationStatus),
              
              const SizedBox(height: 24),
              _buildStatCard(completedCount, pendingCount),
              const SizedBox(height: 32),
              if (user?.isAdmin == true)
                _buildListTile(context, ref, Icons.admin_panel_settings, 'Admin Paneli', route: '/admin', color: Colors.deepPurple),
              _buildListTile(context, ref, Icons.history, 'İşlem Geçmişi', route: '/profile/transaction-history'),
              _buildListTile(context, ref, Icons.help_outline, 'Yardım ve Destek', route: '/profile/help-support'),
              _buildListTile(context, ref, Icons.privacy_tip_outlined, 'Gizlilik Politikası', route: '/profile/privacy-policy'),
              _buildListTile(context, ref, Icons.logout, 'Çıkış Yap', color: AppTheme.errorColor),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleBadge(UserModel? user) {
    if (user == null) return const SizedBox();
    
    final bool isStudent = user.isStudent;
    
    Color color;
    IconData icon;
    String label;

    if (isStudent) {
      if (user.verificationStatus == VerificationStatus.verified) {
        color = Colors.green;
        icon = Icons.verified;
        label = 'Onaylı Öğrenci';
      } else if (user.verificationStatus == VerificationStatus.pending) {
        color = Colors.orange;
        icon = Icons.hourglass_empty;
        label = 'Onay Bekleyen Öğrenci';
      } else if (user.verificationStatus == VerificationStatus.rejected) {
        color = Colors.red;
        icon = Icons.cancel_outlined;
        label = 'Reddedilen Öğrenci';
      } else {
        color = Colors.grey;
        icon = Icons.info_outline;
        label = 'Doğrulanmamış Öğrenci';
      }
    } else {
      if (user.roleIndex == 2) {
        color = Colors.indigo;
        icon = Icons.storefront;
        label = 'İşletme';
      } else {
        color = Colors.blue;
        icon = Icons.volunteer_activism;
        label = 'Destekçi';
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationCard(BuildContext context, VerificationStatus? status) {
    String title = 'Hesabınız Doğrulanmadı';
    String description = 'İlanlardan yararlanmak için öğrenci belgenizi yükleyin.';
    IconData icon = Icons.info_outline;
    Color iconColor = AppTheme.primaryColor;

    if (status == VerificationStatus.pending) {
      title = 'Belgeniz Onay Bekliyor';
      description = 'Belgeniz sistem yöneticileri tarafından inceleniyor.';
      icon = Icons.hourglass_empty;
      iconColor = Colors.orange;
    } else if (status == VerificationStatus.rejected) {
      title = 'Belgeniz Reddedildi';
      description = 'Yüklediğiniz öğrenci belgesi onaylanmadı. Lütfen geçerli bir belge yükleyerek tekrar deneyin.';
      icon = Icons.cancel_outlined;
      iconColor = Colors.red;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(icon, color: iconColor, size: 28),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
            ),
            if (status != VerificationStatus.pending) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.push('/verify-student'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: status == VerificationStatus.rejected ? Colors.red : AppTheme.primaryColor,
                ),
                child: Text(status == VerificationStatus.rejected ? 'Yeniden Belge Yükle' : 'Hemen Doğrula'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(int completedCount, int pendingCount) {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStat('Tamamlanan', completedCount.toString()),
          Container(width: 1, height: 40, color: Colors.grey.shade300),
          _buildStat('Bekleyen', pendingCount.toString()),
          Container(width: 1, height: 40, color: Colors.grey.shade300),
          _buildStat('Puan', '10'),
        ],
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryColor,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildListTile(BuildContext context, WidgetRef ref, IconData icon, String title, {Color? color, String? route}) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (color ?? AppTheme.textPrimary).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color ?? AppTheme.textPrimary),
      ),
      title: Text(
        title,
        style: TextStyle(
          color: color ?? AppTheme.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: () {
        if (title == 'Çıkış Yap') {
          ref.read(authProvider.notifier).logout();
          context.go('/login');
        } else if (route != null) {
          context.push(route);
        }
      },
    );
  }
}
