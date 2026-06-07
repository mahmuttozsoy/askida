import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/feed_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../domain/models/ad_model.dart';
import '../../../../core/widgets/glass_container.dart';
import '../../../../core/theme/app_theme.dart';
import 'package:askida/features/notifications/presentation/providers/notification_provider.dart';
import 'package:askida/features/notifications/presentation/screens/notifications_dialog.dart';

class FeedScreen extends ConsumerWidget {
  final bool isStudent;

  const FeedScreen({super.key, required this.isStudent});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsStream = ref.watch(adsStreamProvider);
    final user = ref.watch(authProvider).userProfile;

    return Scaffold(
      appBar: AppBar(
        title: Text(isStudent ? 'Açık İlanlar' : 'İlanlarım'),
        actions: [
          Consumer(
            builder: (context, ref, child) {
              final unreadCount = ref.watch(unreadNotificationsCountProvider);
              return Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: Icon(
                      unreadCount > 0 ? Icons.notifications : Icons.notifications_none,
                      color: unreadCount > 0 ? AppTheme.primaryColor : null,
                    ),
                    onPressed: () {
                      NotificationsDialog.show(context);
                    },
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: AppTheme.errorColor,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          '$unreadCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
      body: adsStream.when(
        data: (ads) {
              final filteredAds = ads.where((a) => 
                  (a.parentId == null || a.parentId!.isEmpty) && 
                  a.status == AdStatus.active
              ).toList();

          if (filteredAds.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.layers_clear_outlined,
                    size: 64,
                    color: Colors.grey.shade200,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isStudent
                        ? 'Şu an açık bir ilan yok.'
                        : 'Henüz açık bir ürün/ilan yok.',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: filteredAds.length,
            itemBuilder: (context, index) {
              final ad = filteredAds[index];
              return _AdCard(ad: ad, isStudent: isStudent);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Hata: $err')),
      ),
      floatingActionButton: null,
    );
  }
}

class _AdCard extends StatelessWidget {
  final FoodAd ad;
  final bool isStudent;

  const _AdCard({required this.ad, required this.isStudent});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () => context.push(
          '/ad-detail',
          extra: {'ad': ad, 'isStudent': isStudent},
        ),
        borderRadius: BorderRadius.circular(24),
        child: GlassContainer(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppTheme.primaryColor.withValues(
                      alpha: 0.1,
                    ),
                    child: Icon(
                      ad.category == 'food'
                          ? Icons.fastfood
                          : (ad.category == 'drink'
                                ? Icons.local_cafe
                                : Icons.restaurant),
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ad.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on_outlined,
                              size: 14,
                              color: Colors.grey,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              ad.location,
                              style: const TextStyle(
                                color: Colors.grey,
                                fontSize: 12,
                              ),
                            ),
                            if (ad.quantity > 1) ...[
                              const SizedBox(width: 12),
                              Icon(
                                Icons.people_outline,
                                size: 14,
                                color: Colors.orange.shade700,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Kalan: ${ad.remainingQuantity} / ${ad.quantity} Kişi',
                                style: TextStyle(
                                  color: Colors.orange.shade700,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${ad.price.toStringAsFixed(0)} TL',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.secondaryColor,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                ad.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: Colors.grey.shade800),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.push(
                    '/ad-detail',
                    extra: {'ad': ad, 'isStudent': isStudent},
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isStudent
                        ? AppTheme.primaryColor
                        : Colors.grey.shade100,
                    foregroundColor: isStudent ? Colors.white : AppTheme.primaryColor,
                  ),
                  child: Text(
                    isStudent ? 'Detayları Gör ve Talep Et' : 'Detayları Gör',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
