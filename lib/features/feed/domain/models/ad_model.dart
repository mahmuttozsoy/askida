import 'package:cloud_firestore/cloud_firestore.dart';

enum AdStatus { active, pending, completed, cancelled }

class FoodAd {
  final String id;
  final String creatorId;
  final String? claimerId;
  final String title;
  final String description;
  final String category;
  final double price;
  final String location;
  final AdStatus status;
  final int quantity;
  final int remainingQuantity;
  final String? parentId;
  final DateTime createdAt;
  final String? imageUrl;

  FoodAd({
    required this.id,
    required this.creatorId,
    this.claimerId,
    required this.title,
    required this.description,
    required this.category,
    required this.price,
    required this.location,
    this.status = AdStatus.active,
    this.quantity = 1,
    this.remainingQuantity = 1,
    this.parentId,
    required this.createdAt,
    this.imageUrl,
  });

  Map<String, dynamic> toMap() {
    return {
      'creatorId': creatorId,
      'claimerId': claimerId,
      'title': title,
      'description': description,
      'category': category,
      'price': price,
      'location': location,
      'status': status.name,
      'quantity': quantity,
      'remainingQuantity': remainingQuantity,
      'parentId': parentId,
      'createdAt': FieldValue.serverTimestamp(),
      'imageUrl': imageUrl,
    };
  }

  factory FoodAd.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return FoodAd(
      id: doc.id,
      creatorId: data['creatorId'] ?? '',
      claimerId: data['claimerId'],
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      category: data['category'] ?? '',
      price: (data['price'] ?? 0).toDouble(),
      location: data['location'] ?? '',
      status: AdStatus.values.firstWhere((e) => e.name == data['status'], orElse: () => AdStatus.active),
      quantity: data['quantity'] ?? 1,
      remainingQuantity: data['remainingQuantity'] ?? 1,
      parentId: data['parentId'],
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      imageUrl: data['imageUrl'],
    );
  }

  factory FoodAd.fromJson(Map<String, dynamic> json) {
    final statusStr = (json['status'] ?? 'Available').toString().toLowerCase();
    AdStatus statusVal = AdStatus.active;
    if (statusStr == 'claimed' || statusStr == 'pending') statusVal = AdStatus.pending;
    if (statusStr == 'completed') statusVal = AdStatus.completed;
    if (statusStr == 'cancelled') statusVal = AdStatus.cancelled;

    String cat = json['categoryId'] ?? json['category'] ?? 'food';
    if (cat.startsWith('cat-')) {
      cat = cat.substring(4);
    }
    if (cat == 'yemek') cat = 'food';
    if (cat == 'kirtasiye' || cat == 'barinma') cat = 'other';

    return FoodAd(
      id: json['id'] ?? '',
      creatorId: json['creatorId'] ?? '',
      claimerId: (json['claimerId'] != null && json['claimerId'].toString().isNotEmpty) ? json['claimerId'] : null,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: cat,
      price: (json['price'] ?? 0.0).toDouble(),
      location: json['location'] ?? 'Merkez',
      status: statusVal,
      quantity: json['quantity'] ?? 1,
      remainingQuantity: json['remainingQuantity'] ?? 1,
      parentId: json['parentId'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      imageUrl: json['imageUrl'],
    );
  }
}
