import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart'; 

class IAPState {
  final bool isAvailable;
  final List<ProductDetails> products;
  final List<PurchaseDetails> purchases;

  IAPState({
    this.isAvailable = false,
    this.products = const [],
    this.purchases = const [],
  });

  IAPState copyWith({
    bool? isAvailable,
    List<ProductDetails>? products,
    List<PurchaseDetails>? purchases,
  }) {
    return IAPState(
      isAvailable: isAvailable ?? this.isAvailable,
      products: products ?? this.products,
      purchases: purchases ?? this.purchases,
    );
  }
}

class IAPService extends Notifier<IAPState> {
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _subscription;

  @override
  IAPState build() {
    _initStoreInfo();
    
    final purchaseUpdated = _iap.purchaseStream;
    _subscription = purchaseUpdated.listen(
      (purchaseDetailsList) {
        _listenToPurchaseUpdated(purchaseDetailsList);
      },
      onDone: () {
        _subscription?.cancel();
      },
      onError: (error) {
        debugPrint("IAP Error: $error");
      },
    );

    ref.onDispose(() {
      _subscription?.cancel();
    });

    return IAPState();
  }

  Future<void> _initStoreInfo() async {
    final isAvailable = await _iap.isAvailable();
    if (!isAvailable) {
      state = state.copyWith(isAvailable: false);
      return;
    }
    state = state.copyWith(isAvailable: true);
  }

  Future<void> loadProduct(String productId) async {
    if (!state.isAvailable || productId.isEmpty) return;

    if (Platform.isIOS || Platform.isAndroid) {
      ProductDetailsResponse response = await _iap.queryProductDetails({productId});
      if (response.error == null && response.productDetails.isNotEmpty) {
        final currentProducts = List<ProductDetails>.from(state.products);
        // Add if not exists
        if (!currentProducts.any((p) => p.id == productId)) {
          currentProducts.addAll(response.productDetails);
          state = state.copyWith(products: currentProducts);
        }
      }
    }
  }

  Future<void> buyProduct(ProductDetails product) async {
    final PurchaseParam purchaseParam = PurchaseParam(productDetails: product);
    // Her zaman tek seferlik (consumable) olarak satin alinacak
    await _iap.buyConsumable(purchaseParam: purchaseParam, autoConsume: true);
  }

  Future<void> _listenToPurchaseUpdated(List<PurchaseDetails> purchaseDetailsList) async {
    List<PurchaseDetails> currentPurchases = List.from(state.purchases);
    
    for (var purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.status == PurchaseStatus.pending) {
        // Show pending UI
      } else {
        if (purchaseDetails.status == PurchaseStatus.error) {
          debugPrint("Purchase Error: ${purchaseDetails.error}");
        } else if (purchaseDetails.status == PurchaseStatus.purchased ||
            purchaseDetails.status == PurchaseStatus.restored) {
          
          bool valid = await _verifyPurchase(purchaseDetails);
          if (valid) {
            currentPurchases.add(purchaseDetails);
          }
        }
        if (purchaseDetails.pendingCompletePurchase) {
          await _iap.completePurchase(purchaseDetails);
        }
      }
    }
    
    state = state.copyWith(purchases: currentPurchases);
  }

  Future<bool> _verifyPurchase(PurchaseDetails purchaseDetails) async {
    try {
      final dio = ApiClient.create('');
      final response = await dio.post('https://api.askidagmtid.com/api/Payment/verify-purchase', data: {
        'PurchaseToken': purchaseDetails.verificationData.serverVerificationData,
        'ProductId': purchaseDetails.productID,
        'SubscriptionType': 'OneTime',
        'Price': 0,
        'Quantity': 1
      });

      if (response.data['success'] == true) {
        return true;
      }
    } catch (e) {
      debugPrint("Verify Purchase Error: $e");
    }
    return false;
  }
}

final iapServiceProvider = NotifierProvider<IAPService, IAPState>(() {
  return IAPService();
});
