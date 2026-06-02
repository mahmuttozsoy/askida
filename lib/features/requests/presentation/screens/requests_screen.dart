import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../feed/presentation/providers/feed_provider.dart';
import '../../../feed/domain/models/ad_model.dart';
import '../../../../core/widgets/glass_container.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/services/user_api_service.dart';
import '../../../auth/domain/models/user_model.dart';

final userProfileFutureProvider = FutureProvider.family<UserModel?, String>((ref, userId) async {
  final service = UserApiService();
  final response = await service.getUserProfile(userId);
  if (response['success'] == true && response['user'] != null) {
    return UserModel.fromJson(response['user']);
  }
  return null;
});

String _maskName(String name) {
  if (name.isEmpty) return 'Öğrenci';
  final parts = name.trim().split(' ');
  final maskedParts = parts.map((part) {
    if (part.isEmpty) return '';
    if (part.length == 1) return '${part[0]}*';
    return '${part[0]}***';
  });
  return maskedParts.join(' ');
}

class RequestsScreen extends ConsumerWidget {
  final bool isStudent;

  const RequestsScreen({super.key, required this.isStudent});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsState = isStudent 
        ? ref.watch(myRequestsProvider)
        : ref.watch(incomingRequestsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(isStudent ? 'Taleplerim' : 'Gelen Talepler'),
      ),
      body: adsState.when(
        data: (ads) {
          if (ads.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history_outlined, size: 64, color: Colors.grey.shade200),
                  const SizedBox(height: 16),
                  Text(
                    isStudent ? 'Henüz bir talebiniz yok.' : 'Henüz gelen bir talep yok.',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: ads.length,
            itemBuilder: (context, index) {
              final ad = ads[index];
              return _RequestCard(ad: ad, isStudent: isStudent);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Hata: $err')),
      ),
    );
  }
}

class _RequestCard extends ConsumerWidget {
  final FoodAd ad;
  final bool isStudent;

  const _RequestCard({required this.ad, required this.isStudent});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool isCompleted = ad.status == AdStatus.completed;
    final bool isCancelled = ad.status == AdStatus.cancelled;

    final claimerProfileAsync = (ad.claimerId != null && ad.claimerId!.isNotEmpty && !isStudent)
        ? ref.watch(userProfileFutureProvider(ad.claimerId!))
        : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: isCompleted
                      ? Colors.green.withValues(alpha: 0.1)
                      : isCancelled
                          ? Colors.red.withValues(alpha: 0.1)
                          : Colors.orange.withValues(alpha: 0.1),
                  child: Icon(
                    isCompleted
                        ? Icons.check_circle_outline
                        : isCancelled
                            ? Icons.cancel_outlined
                            : Icons.hourglass_top,
                    color: isCompleted
                        ? Colors.green
                        : isCancelled
                            ? Colors.red
                            : Colors.orange,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ad.title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        isCompleted
                            ? 'Tamamlandı'
                            : isCancelled
                                ? 'Reddedildi'
                                : (ad.status == AdStatus.pending ? 'Onay Bekliyor' : 'Aktif'),
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                Text(
                  '${ad.price.toStringAsFixed(0)} TL',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.secondaryColor),
                ),
              ],
            ),
            if (claimerProfileAsync != null) ...[
              claimerProfileAsync.when(
                data: (user) {
                  if (user == null) return const SizedBox();
                  final isVerified = user.verificationStatus == VerificationStatus.verified;
                  return Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: (isVerified ? Colors.green : Colors.grey).withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: (isVerified ? Colors.green : Colors.grey).withValues(alpha: 0.1),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isVerified ? Icons.verified : Icons.error_outline,
                            color: isVerified ? Colors.green : Colors.grey,
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Talep Eden: ${_maskName(user.name)} (${isVerified ? "Onaylı Öğrenci" : "Onaysız Öğrenci"})',
                              style: TextStyle(
                                fontSize: 13,
                                color: isVerified ? Colors.green.shade800 : Colors.grey.shade800,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                loading: () => const Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Center(
                    child: SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ),
                error: (err, stack) => const SizedBox(),
              ),
            ],
            if (!isStudent && ad.status == AdStatus.pending) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => ref.read(feedProvider.notifier).rejectAd(ad.id),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.errorColor,
                        side: const BorderSide(color: AppTheme.errorColor),
                      ),
                      child: const Text('Reddet'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => ref.read(feedProvider.notifier).approveAd(ad.id),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                      child: const Text('Onayla'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
