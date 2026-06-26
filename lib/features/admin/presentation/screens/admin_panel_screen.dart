import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/user_api_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/glass_container.dart';
import '../../../auth/domain/models/user_model.dart';

final userApiServiceProvider = Provider((ref) => UserApiService());

// Onay bekleyen öğrencileri takip eden provider
final pendingVerificationsProvider = StreamProvider<List<UserModel>>((ref) async* {
  final service = ref.watch(userApiServiceProvider);
  while (true) {
    try {
      final usersJson = await service.getAllUsers();
      final usersList = usersJson
          .map((json) => UserModel.fromJson(json))
          .where((u) => u.verificationStatus == VerificationStatus.pending)
          .toList();
      yield usersList;
    } catch (e) {
      debugPrint("Error fetching pending verifications: $e");
    }
    await Future.delayed(const Duration(seconds: 5));
  }
});

// Kayıtlı işletme ve destekçileri takip eden provider
final partnersProvider = StreamProvider<List<UserModel>>((ref) async* {
  final service = ref.watch(userApiServiceProvider);
  while (true) {
    try {
      final usersJson = await service.getAllUsers();
      final partnersList = usersJson
          .map((json) => UserModel.fromJson(json))
          .where((u) => u.roleIndex == 1 || u.roleIndex == 2) // 1: supporter, 2: business
          .toList();
      yield partnersList;
    } catch (e) {
      debugPrint("Error fetching partners: $e");
    }
    await Future.delayed(const Duration(seconds: 5));
  }
});

class AdminPanelScreen extends ConsumerWidget {
  const AdminPanelScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Admin Paneli'),
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
          bottom: const TabBar(
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            tabs: [
              Tab(icon: Icon(Icons.school_outlined), text: 'Öğrenci Doğrulama'),
              Tab(icon: Icon(Icons.handshake_outlined), text: 'İşletme & Destekçi'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _StudentsTab(),
            _PartnersTab(),
          ],
        ),
      ),
    );
  }
}

class _StudentsTab extends ConsumerWidget {
  const _StudentsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingUsersAsync = ref.watch(pendingVerificationsProvider);

    return pendingUsersAsync.when(
      data: (users) {
        if (users.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.verified_outlined, size: 64, color: Colors.green),
                SizedBox(height: 16),
                Text('Onay bekleyen öğrenci belgesi bulunmuyor.', style: TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: users.length,
          itemBuilder: (context, index) {
            final user = users[index];
            return _VerificationCard(user: user);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Hata: $err')),
    );
  }
}

class _PartnersTab extends ConsumerWidget {
  const _PartnersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final partnersAsync = ref.watch(partnersProvider);

    return partnersAsync.when(
      data: (partners) {
        if (partners.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people_outline, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text('Kayıtlı destekçi veya işletme bulunmuyor.', style: TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: partners.length,
          itemBuilder: (context, index) {
            final partner = partners[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: GlassContainer(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
                      child: Text(partner.name.isNotEmpty ? partner.name[0].toUpperCase() : 'P'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(partner.name, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: (partner.roleIndex == 2 ? Colors.orange : Colors.blue).withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  partner.roleIndex == 2 ? 'İşletme' : 'Destekçi',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: partner.roleIndex == 2 ? Colors.orange : Colors.blue,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(partner.email, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          if (partner.phone.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(partner.phone, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Hata: $err')),
    );
  }
}

class _VerificationCard extends ConsumerWidget {
  final UserModel user;
  const _VerificationCard({required this.user});

  void _showImageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppBar(title: Text(user.name), leading: const CloseButton()),
            if (user.verificationDocumentUrl != null)
              InteractiveViewer(
                child: Image.network(
                  user.verificationDocumentUrl!,
                  loadingBuilder: (context, child, progress) {
                    if (progress == null) return child;
                    return const Padding(
                      padding: EdgeInsets.all(40.0),
                      child: CircularProgressIndicator(),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return const Padding(
                      padding: EdgeInsets.all(40.0),
                      child: Text('Belge yüklenirken bir hata oluştu veya belge bulunamadı.'),
                    );
                  },
                ),
              )
            else
              const Padding(
                padding: EdgeInsets.all(40.0),
                child: Text('Belge yüklenemedi.'),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final service = ref.read(userApiServiceProvider);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
                  child: Text(user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                      Text(user.email, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      if (user.phone.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(user.phone, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      ],
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.remove_red_eye_outlined, color: AppTheme.primaryColor),
                  onPressed: () => _showImageDialog(context),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.02),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.school_outlined, size: 16, color: AppTheme.primaryColor),
                      const SizedBox(width: 6),
                      Text(
                        'Kategori: ${user.studentCategory.isNotEmpty ? user.studentCategory : "Belirtilmemiş"}',
                        style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.account_balance_outlined, size: 16, color: AppTheme.primaryColor),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Okul: ${user.schoolName.isNotEmpty ? user.schoolName : "Belirtilmemiş"}',
                          style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.class_outlined, size: 16, color: AppTheme.primaryColor),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          user.studentCategory == 'Üniversite' 
                              ? 'Bölüm: ${user.grade.isNotEmpty ? user.grade : "Belirtilmemiş"}'
                              : 'Sınıf/Şube: ${user.grade.isNotEmpty ? user.grade : "Belirtilmemiş"}',
                          style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () async {
                      await service.rejectUser(user.uid);
                      ref.invalidate(pendingVerificationsProvider);
                    },
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                    child: const Text('Reddet'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      await service.approveUser(user.uid);
                      ref.invalidate(pendingVerificationsProvider);
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                    child: const Text('Onayla'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
