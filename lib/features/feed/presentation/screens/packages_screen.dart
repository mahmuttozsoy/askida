import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/models/ad_model.dart';
import '../providers/feed_provider.dart';
import '../../../../core/services/iap_service.dart';

class PackagesScreen extends ConsumerStatefulWidget {
  final FoodAd ad;
  final int quantity;
  final double totalPrice;

  const PackagesScreen({
    super.key,
    required this.ad,
    required this.quantity,
    required this.totalPrice,
  });

  @override
  ConsumerState<PackagesScreen> createState() => _PackagesScreenState();
}

class _PackagesScreenState extends ConsumerState<PackagesScreen> {
  bool _isProcessing = false;
  bool _isCooldown = false;

  @override
  void initState() {
    super.initState();
    // Start loading the specific product for this ad
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.ad.googlePlayProductId != null) {
        ref.read(iapServiceProvider.notifier).loadProduct(widget.ad.googlePlayProductId!);
      }
    });
  }

  void _onPaymentSuccess() async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      await ref.read(feedProvider.notifier).createAd(
            title: widget.ad.title,
            description: widget.ad.description,
            category: widget.ad.category,
            price: widget.ad.price,
            location: widget.ad.location,
            quantity: widget.quantity,
          );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Satın alma başarılı! Destek oluşturuldu.'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.of(context).pop(); 
      Navigator.of(context).pop(); 
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Hata: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _buyWithGooglePlay() async {
    setState(() => _isCooldown = true);
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _isCooldown = false);
    });

    final iapState = ref.read(iapServiceProvider);
    
    if (!iapState.isAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Google Play Store hizmeti şu an kullanılamıyor.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    try {
      ProductDetails? targetProduct;
      try {
        targetProduct = iapState.products.firstWhere((p) => p.id == widget.ad.googlePlayProductId);
      } catch (e) {
        debugPrint('Product not found in list: $e');
      }

      if (targetProduct != null) {
        await ref.read(iapServiceProvider.notifier).buyProduct(targetProduct);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ürün Google Play üzerinde bulunamadı: ${widget.ad.googlePlayProductId}'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Ödeme başlatılamadı: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final iapState = ref.watch(iapServiceProvider);

    // If purchase was successful, trigger success action
    ref.listen(iapServiceProvider, (previous, current) {
      if (current.purchases.isNotEmpty) {
        final latestPurchase = current.purchases.last;
        if (latestPurchase.productID == widget.ad.googlePlayProductId) {
           _onPaymentSuccess();
        }
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Destek Paketi Al'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.volunteer_activism, size: 80, color: AppTheme.primaryColor),
              const SizedBox(height: 20),
              Text(
                widget.ad.title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              Text(
                widget.ad.description,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
              ),
              const SizedBox(height: 30),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Paket Fiyatı:',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '${widget.totalPrice.toStringAsFixed(2)} TL',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue, size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Bu tek seferlik bir satın almadır.',
                            style: TextStyle(color: Colors.blue),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (!iapState.isAvailable)
                const Padding(
                  padding: EdgeInsets.only(bottom: 20),
                  child: Text(
                    'Google Play Store bağlantısı kurulamıyor.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.red),
                  ),
                ),
              SizedBox(
                height: 56,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.shopping_cart),
                  label: _isProcessing
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Google Play ile Satın Al',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: (_isProcessing || _isCooldown || !iapState.isAvailable) ? null : _buyWithGooglePlay,
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
