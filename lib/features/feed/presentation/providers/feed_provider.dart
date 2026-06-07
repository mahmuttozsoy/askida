import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/ad_api_service.dart';
import '../../domain/models/ad_model.dart';
import '../../domain/models/category_model.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// AdApiService'i uygulamanın her yerinden erişilebilir kılan Riverpod sağlayıcısı
final adApiServiceProvider = Provider((ref) => AdApiService());

// Canlı İlan Akışı (Feed) Yöneticisi
// Riverpod'un StreamProvider yapısını kullanarak her 5 saniyede bir arkaplanda C# Backend'inden en güncel ilanları çeker.
// Yeni bir ilan eklendiğinde veya biri "Talep Et" dediğinde sayfa yenilemeye gerek kalmadan ekranda anında güncellenmesini sağlar.
final adsStreamProvider = StreamProvider<List<FoodAd>>((ref) async* {
  final service = ref.watch(adApiServiceProvider);
  while (true) {
    try {
      final adsJson = await service.getAds();
      final adsList = adsJson.map((json) => FoodAd.fromJson(json)).toList();
      yield adsList;
    } catch (e) {
      debugPrint("[FeedProvider] Error fetching ads: $e");
    }
    await Future.delayed(const Duration(seconds: 5));
  }
});

// Kategoriler (Sabit olduğu için veritabanından çekmek yerine direkt dönüyoruz)
final categoriesProvider = Provider<List<CategoryModel>>((ref) {
  return [
    CategoryModel(id: 'food', name: 'Yemek', icon: 'fastfood'),
    CategoryModel(id: 'drink', name: 'İçecek', icon: 'local_cafe'),
    CategoryModel(id: 'other', name: 'Diğer', icon: 'more_horiz'),
  ];
});

// Feed (Ana Sayfa) İşlemleri Yöneticisi
// İlan oluşturma, talep etme, onaylama ve reddetme gibi EYLEMLERİN (Actions) tutulduğu sınıftır.
class FeedNotifier extends Notifier<void> {
  late final AdApiService _service;

  @override
  void build() {
    _service = ref.watch(adApiServiceProvider);
  }

  Future<void> createAd({
    required String title,
    required String description,
    required String category,
    required double price,
    required String location,
    required int quantity,
  }) async {
    final user = ref.read(authProvider).userProfile;
    if (user == null) throw 'Giriş yapmanız gerekiyor';

    // Map category
    String categoryId = 'cat-yemek';
    if (category == 'drink') categoryId = 'cat-barinma';
    if (category == 'other') categoryId = 'cat-kirtasiye';

    final response = await _service.createAd(
      title: title,
      description: description,
      categoryId: categoryId,
      creatorId: user.uid,
      price: price,
      location: location,
      quantity: quantity,
    );

    if (response['success'] != true) {
      throw response['message'] ?? 'İlan oluşturulurken hata oluştu';
    }

    // Yeni ilan oluşturulduğunda, 5 saniyelik zamanlayıcıyı beklemeden listeyi HEMEN yeniler!
    ref.invalidate(adsStreamProvider);
  }

  Future<void> claimAd(String adId) async {
    final user = ref.read(authProvider).userProfile;
    if (user == null) throw 'Giriş yapmanız gerekiyor';
    
    final response = await _service.claimAd(adId, user.uid);
    if (response['success'] != true) {
      throw response['message'] ?? 'İlan talep edilirken hata oluştu';
    }

    // Refresh stream immediately
    ref.invalidate(adsStreamProvider);
  }

  Future<void> approveAd(String adId) async {
    final response = await _service.updateAdStatus(adId, 'Completed');
    if (response['success'] != true) {
      throw response['message'] ?? 'Talep onaylanırken hata oluştu';
    }
    ref.invalidate(adsStreamProvider);
  }

  Future<void> rejectAd(String adId) async {
    final response = await _service.updateAdStatus(adId, 'Available');
    if (response['success'] != true) {
      throw response['message'] ?? 'Talep reddedilirken hata oluştu';
    }
    ref.invalidate(adsStreamProvider);
  }
}

final feedProvider = NotifierProvider<FeedNotifier, void>(() => FeedNotifier());

// Öğrencinin talep ettiği ve aktif/beklemede/tamamlanmış tüm ilanlar
final myRequestsProvider = Provider<AsyncValue<List<FoodAd>>>((ref) {
  final adsAsync = ref.watch(adsStreamProvider);
  final user = ref.watch(authProvider).userProfile;
  return adsAsync.whenData((ads) {
    return ads.where((a) => a.claimerId == user?.uid).toList();
  });
});

// Destekçiye gelen BEKLEYEN talepler (Onay bekleyenler)
final incomingRequestsProvider = Provider<AsyncValue<List<FoodAd>>>((ref) {
  final adsAsync = ref.watch(adsStreamProvider);
  final user = ref.watch(authProvider).userProfile;
  return adsAsync.whenData((ads) {
    return ads.where((a) => a.creatorId == user?.uid && a.status == AdStatus.pending).toList();
  });
});

// İşlem Geçmişi (Tamamlanmış ilanlar)
final completedAdsProvider = Provider<AsyncValue<List<FoodAd>>>((ref) {
  final adsAsync = ref.watch(adsStreamProvider);
  final user = ref.watch(authProvider).userProfile;
  final role = ref.watch(authProvider).role;

  return adsAsync.whenData((ads) {
    if (role == UserRole.student) {
      return ads.where((a) => a.claimerId == user?.uid && a.status == AdStatus.completed).toList();
    } else {
      return ads.where((a) => a.creatorId == user?.uid && a.status == AdStatus.completed).toList();
    }
  });
});
