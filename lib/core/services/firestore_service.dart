import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';
import '../../features/auth/domain/models/user_model.dart';
import '../../features/feed/domain/models/ad_model.dart';
import '../../features/feed/domain/models/category_model.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Categories
  Future<List<CategoryModel>> getCategories() async {
    final snapshot = await _db.collection('categories').get();
    return snapshot.docs.map((doc) {
      final data = doc.data();
      return CategoryModel(
        id: doc.id,
        name: data['name'] ?? '',
        icon: data['icon'] ?? 'help_outline',
      );
    }).toList();
  }

  // Helper to seed initial categories if none exist
  Future<void> checkAndSeedCategories() async {
    final snapshot = await _db.collection('categories').get();
    if (snapshot.docs.isEmpty) {
      final initialCategories = [
        {'name': 'Yemek', 'icon': 'restaurant'},
        {'name': 'Kahve', 'icon': 'local_cafe'},
        {'name': 'Ulaşım', 'icon': 'directions_bus'},
        {'name': 'Kitap', 'icon': 'menu_book'},
        {'name': 'Market', 'icon': 'shopping_cart'},
      ];
      
      for (var cat in initialCategories) {
        await _db.collection('categories').add(cat);
      }
    }
  }

  // --- İLAN (FOODAD) İŞLEMLERİ ---

  // İlan Oluştur
  Future<void> createAd(FoodAd ad) async {
    await _db.collection('ads').add(ad.toMap());
  }

  // Tüm Aktif İlanları Getir (Canlı Akış)
  Stream<List<FoodAd>> getAds() {
    return _db
        .collection('ads')
        .where('status', isEqualTo: 'active')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => FoodAd.fromFirestore(doc)).toList());
  }

  // Kullanıcıya Göre İlanları Getir
  Stream<List<FoodAd>> getMyAds(String userId) {
    return _db
        .collection('ads')
        .where('creatorId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => FoodAd.fromFirestore(doc)).toList());
  }

  // İlanı Talep Et (Öğrenci)
  Future<void> claimAd(String adId, String userId) async {
    await _db.collection('ads').doc(adId).update({
      'status': AdStatus.pending.name,
      'claimerId': userId,
    });
  }

  // Talebi Onayla (Destekçi)
  Future<void> approveAd(String adId) async {
    await _db.collection('ads').doc(adId).update({
      'status': AdStatus.completed.name,
    });
  }

  // Talebi Reddet (Destekçi)
  Future<void> rejectAd(String adId) async {
    await _db.collection('ads').doc(adId).update({
      'status': AdStatus.active.name,
      'claimerId': null, // Tekrar havuzuna düşmesi için
    });
  }

  // --- DOĞRULAMA (OTP) İŞLEMLERİ ---

  Future<void> saveOTP(String email, String otp) async {
    await _db.collection('verification_codes').doc(email).set({
      'code': otp,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }
  // --- ÖĞRENCİ DOĞRULAMA İŞLEMLERİ ---

  Future<String> uploadVerificationDocument(String userId, File file) async {
    final ref = _storage.ref().child('verifications').child('$userId.jpg');
    await ref.putFile(file);
    return await ref.getDownloadURL();
  }

  Future<void> submitVerification(String userId, String documentUrl) async {
    await _db.collection('users').doc(userId).update({
      'verificationStatus': VerificationStatus.pending.name,
      'verificationDocumentUrl': documentUrl,
    });
  }

  // --- ADMIN PANEL METOTLARI ---

  // Onay bekleyen öğrencileri getir
  Stream<List<UserModel>> getPendingVerifications() {
    return _db
        .collection('users')
        .where('verificationStatus', isEqualTo: VerificationStatus.pending.name)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => UserModel.fromFirestore(doc)).toList());
  }

  // Kullanıcıyı onayla
  Future<void> approveUser(String userId) async {
    await _db.collection('users').doc(userId).update({
      'verificationStatus': VerificationStatus.verified.name,
    });
  }

  // Kullanıcıyı reddet
  Future<void> rejectUser(String userId) async {
    await _db.collection('users').doc(userId).update({
      'verificationStatus': VerificationStatus.none.name,
      'verificationDocumentUrl': null, // Belgeyi sıfırla ki tekrar yükleyebilsin
    });
  }

  Future<bool> verifyOTP(String email, String code) async {
    final doc = await _db.collection('verification_codes').doc(email).get();
    if (!doc.exists) return false;

    final data = doc.data()!;
    final savedCode = data['code'];
    final createdAt = data['createdAt'] as Timestamp?;
    
    if (savedCode != code) return false;
    
    if (createdAt != null) {
      final now = DateTime.now();
      if (now.difference(createdAt.toDate()).inMinutes > 10) return false;
    }
    
    await _db.collection('verification_codes').doc(email).delete();
    return true;
  }
}
