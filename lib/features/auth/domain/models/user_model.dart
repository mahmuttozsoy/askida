import 'package:cloud_firestore/cloud_firestore.dart';

enum VerificationStatus { none, pending, verified, rejected }

class UserModel {
  final String uid;
  final String email;
  final String phone;
  final String name;
  final int roleIndex; // 0: student, 1: supporter, 2: business
  final VerificationStatus verificationStatus;
  final String? verificationDocumentUrl;
  final String studentCategory;
  final String schoolName;
  final String grade;
  final DateTime createdAt;

  UserModel({
    required this.uid,
    required this.email,
    this.phone = '',
    required this.name,
    required this.roleIndex,
    this.verificationStatus = VerificationStatus.none,
    this.verificationDocumentUrl,
    this.studentCategory = '',
    this.schoolName = '',
    this.grade = '',
    required this.createdAt,
  });

  bool get isStudent => roleIndex == 0;
  bool get isAdmin => roleIndex == 3;
  bool get isVerified => verificationStatus == VerificationStatus.verified;

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'email': email,
      'name': name,
      'role': roleIndex,
      'verificationStatus': verificationStatus.name,
      'verificationDocumentUrl': verificationDocumentUrl,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserModel(
      uid: doc.id,
      email: data['email'] ?? '',
      name: data['name'] ?? '',
      roleIndex: data['role'] ?? 0,
      verificationStatus: VerificationStatus.values.firstWhere(
        (e) => e.name == data['verificationStatus'],
        orElse: () => VerificationStatus.none,
      ),
      verificationDocumentUrl: data['verificationDocumentUrl'],
      studentCategory: data['studentCategory'] ?? '',
      schoolName: data['schoolName'] ?? '',
      grade: data['grade'] ?? '',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final verificationStatusString =
        (json['verificationStatus'] ?? json['VerificationStatus'] ?? 'none')
            .toString()
            .toLowerCase();
    final roleStr = (json['role'] ?? json['Role'] ?? 'Student')
        .toString()
        .toLowerCase();

    int roleIdx = 0;
    if (roleStr == 'supporter' || roleStr == '1') roleIdx = 1;
    if (roleStr == 'business' || roleStr == '2') roleIdx = 2;
    if (roleStr == 'admin' || roleStr == '3') roleIdx = 3;

    return UserModel(
      uid: (json['id'] ?? json['uid'] ?? json['Id'] ?? '').toString(),
      email: (json['email'] ?? json['Email'] ?? '').toString(),
      phone: (json['phone'] ?? json['Phone'] ?? '').toString(),
      name: (json['fullName'] ?? json['name'] ?? json['FullName'] ?? '')
          .toString(),
      roleIndex: roleIdx,
      verificationStatus: VerificationStatus.values.firstWhere(
        (e) => e.name == verificationStatusString,
        orElse: () => VerificationStatus.none,
      ),
      verificationDocumentUrl:
          json['verificationDocumentUrl'] ?? json['VerificationDocumentUrl'],
      studentCategory: (json['studentCategory'] ?? json['StudentCategory'] ?? '').toString(),
      schoolName: (json['schoolName'] ?? json['SchoolName'] ?? '').toString(),
      grade: (json['grade'] ?? json['Grade'] ?? '').toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : (json['CreatedAt'] != null
                ? DateTime.parse(json['CreatedAt'].toString())
                : DateTime.now()),
    );
  }
}
