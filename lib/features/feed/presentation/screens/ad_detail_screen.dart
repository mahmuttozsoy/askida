import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/feed_provider.dart';
import '../../domain/models/ad_model.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/domain/models/user_model.dart';
import 'packages_screen.dart';

class AdDetailScreen extends ConsumerStatefulWidget {
  final FoodAd ad;
  final bool isStudent;

  const AdDetailScreen({super.key, required this.ad, required this.isStudent});

  @override
  ConsumerState<AdDetailScreen> createState() => _AdDetailScreenState();
}

class _AdDetailScreenState extends ConsumerState<AdDetailScreen> {
  bool _isLoading = false;
  int _donationQuantity = 1;

  @override
  Widget build(BuildContext context) {
    final userProfile = ref.watch(authProvider).userProfile;
    final bool isVerified = userProfile?.isVerified ?? false;
    final bool isPending =
        userProfile?.verificationStatus == VerificationStatus.pending;

    return Scaffold(
      appBar: AppBar(title: const Text('İlan Detayları')),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (widget.ad.imageUrl != null && widget.ad.imageUrl!.isNotEmpty)
              Image.network(
                widget.ad.imageUrl!.startsWith('http')
                    ? widget.ad.imageUrl!
                    : 'https://api.askidagmtid.com${widget.ad.imageUrl}',
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 200,
                    width: double.infinity,
                    color: Colors.grey.shade200,
                    child: const Icon(Icons.broken_image, color: Colors.grey, size: 48),
                  );
                },
              )
            else
              Container(
                height: 200,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primaryColor,
                      AppTheme.primaryColor.withValues(alpha: 0.7),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Center(
                  child: Icon(
                    widget.ad.category == 'food'
                        ? Icons.fastfood
                        : (widget.ad.category == 'drink'
                              ? Icons.local_cafe
                              : Icons.restaurant),
                    size: 80,
                    color: Colors.white,
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          widget.ad.title,
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                      // NOT: Kullanıcının talebi üzerine, detay ekranındaki fiyat bilgisi
                      // öğrenciler (isStudent == true) için tamamen gizlenmiştir.
                      if (!widget.isStudent)
                        Text(
                          '${widget.ad.price.toStringAsFixed(0)} TL',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.secondaryColor,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        size: 16,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          widget.ad.location.isNotEmpty
                              ? widget.ad.location
                              : 'Belirtilmedi',
                          style: const TextStyle(fontSize: 16),
                          overflow: TextOverflow.visible,
                        ),
                      ),
                    ],
                  ),
                  if (widget.ad.quantity > 1) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(
                          Icons.people,
                          size: 16,
                          color: Colors.orange.shade700,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Bu ilandan ${widget.ad.quantity} kişi faydalanabilir.',
                          style: TextStyle(
                            color: Colors.orange.shade700,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.check_circle_outline,
                          size: 16,
                          color: Colors.green.shade700,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Kalan kontenjan: ${widget.ad.remainingQuantity} kişi',
                          style: TextStyle(
                            color: Colors.green.shade700,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 24),

                  const Text(
                    'Açıklama',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.ad.description,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey.shade800,
                      height: 1.5,
                    ),
                  ),

                  const SizedBox(height: 40),

                  if (widget.isStudent && widget.ad.status == AdStatus.active)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (!isVerified)
                          Container(
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.orange.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Colors.orange.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.warning_amber_rounded,
                                  color: Colors.orange,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    isPending
                                        ? 'Hesabınız onay bekliyor. Onaylandığında talep edebilirsiniz.'
                                        : 'İlan talep edebilmek için profilinizden hesabınızı doğrulamanız gerekmektedir.',
                                    style: const TextStyle(
                                      color: Colors.orange,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ElevatedButton(
                          onPressed:
                              (_isLoading ||
                                  !isVerified ||
                                  (widget.ad.quantity > 1 &&
                                      widget.ad.remainingQuantity <= 0))
                              ? null
                              : () async {
                                  setState(() => _isLoading = true);
                                  final messenger = ScaffoldMessenger.of(
                                    context,
                                  );
                                  final navigator = Navigator.of(context);
                                  try {
                                    await ref
                                        .read(feedProvider.notifier)
                                        .claimAd(widget.ad.id);
                                    if (mounted) {
                                      messenger.showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'İlan başarıyla talep edildi!',
                                          ),
                                        ),
                                      );
                                      navigator.pop();
                                    }
                                  } catch (e) {
                                    if (mounted) {
                                      messenger.showSnackBar(
                                        SnackBar(content: Text('Hata: $e')),
                                      );
                                    }
                                  } finally {
                                    if (mounted) {
                                      setState(() => _isLoading = false);
                                    }
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor:
                                isVerified &&
                                    !(widget.ad.quantity > 1 &&
                                        widget.ad.remainingQuantity <= 0)
                                ? AppTheme.primaryColor
                                : Colors.grey.shade300,
                          ),
                          child: _isLoading
                              ? const CircularProgressIndicator(
                                  color: Colors.white,
                                )
                              : Text(
                                  (widget.ad.quantity > 1 &&
                                          widget.ad.remainingQuantity <= 0)
                                      ? 'Kontenjan Doldu'
                                      : (isVerified
                                            ? 'Şimdi Talep Et'
                                            : 'Önce Doğrulama Gerekli'),
                                  style: const TextStyle(fontSize: 18),
                                ),
                        ),
                      ],
                    ),
                  // Eski bağış butonu kaldırıldı. Artık bottomNavigationBar'da yer alacak.
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: !widget.isStudent
          ? Container(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).padding.bottom + 24,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 20,
                    offset: const Offset(0, -5),
                  ),
                ],
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(32),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Kaç adet bağışlamak istersiniz?',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.remove, color: Colors.black87),
                          onPressed: _donationQuantity > 1
                              ? () => setState(() => _donationQuantity--)
                              : null,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          '$_donationQuantity',
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: const Icon(
                            Icons.add,
                            color: AppTheme.primaryColor,
                          ),
                          onPressed: () => setState(() => _donationQuantity++),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Toplam Tutar:',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.black54,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '${(widget.ad.price * _donationQuantity).toStringAsFixed(0)} TL',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _isLoading
                        ? null
                        : () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => PackagesScreen(
                                  ad: widget.ad,
                                  quantity: _donationQuantity,
                                  totalPrice:
                                      widget.ad.price * _donationQuantity,
                                ),
                              ),
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 4,
                      shadowColor: AppTheme.primaryColor.withValues(alpha: 0.5),
                    ),
                    icon: const Icon(
                      Icons.payment,
                      color: Colors.white,
                      size: 24,
                    ),
                    label: const Text(
                      'Ödemeye Geç',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            )
          : null,
    );
  }
}
