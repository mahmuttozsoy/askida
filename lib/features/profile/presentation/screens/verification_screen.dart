import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../../core/services/user_api_service.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';

class VerificationScreen extends ConsumerStatefulWidget {
  const VerificationScreen({super.key});

  @override
  ConsumerState<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends ConsumerState<VerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _emailController;
  final TextEditingController _schoolController = TextEditingController();
  final TextEditingController _gradeController = TextEditingController();

  String? _selectedCategory;
  File? _imageFile;
  bool _isLoading = false;
  final _picker = ImagePicker();


  @override
  void initState() {
    super.initState();
    final userProfile = ref.read(authProvider).userProfile;
    _nameController = TextEditingController(text: userProfile?.name ?? '');
    _phoneController = TextEditingController(text: userProfile?.phone ?? '');
    _emailController = TextEditingController(text: userProfile?.email ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _schoolController.dispose();
    _gradeController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
      });
    }
  }

  Future<void> _submit() async {
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lütfen eğitim kademenizi seçin.')),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lütfen öğrenci belgenizin veya kartınızın fotoğrafını yükleyin.')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    try {
      final userProfile = ref.read(authProvider).userProfile;
      if (userProfile == null) throw 'Kullanıcı oturumu bulunamadı';

      final service = UserApiService();
      final response = await service.verifyStudent(
        userId: userProfile.uid,
        fullName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        email: _emailController.text.trim(),
        studentCategory: _selectedCategory!,
        schoolName: _schoolController.text.trim(),
        grade: _gradeController.text.trim(),
        file: _imageFile!,
      );

      if (response['success'] != true) {
        throw response['message'] ?? 'Doğrulama başvurusu gönderilirken bir hata oluştu.';
      }

      await ref.read(authProvider.notifier).refreshProfile();

      if (mounted) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Doğrulama başvurunuz başarıyla iletildi!')),
        );
        navigator.pop();
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text('Hata oluştu: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildCategoryCard(String cat, IconData icon) {
    final isSelected = _selectedCategory == cat;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedCategory = cat;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected 
                ? AppTheme.primaryColor.withValues(alpha: 0.08)
                : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected 
                  ? AppTheme.primaryColor 
                  : Colors.grey.shade200,
              width: isSelected ? 1.8 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon, 
                color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
                size: 28,
              ),
              const SizedBox(height: 8),
              Text(
                cat,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? AppTheme.primaryColor : AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategorySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Eğitim Kademesi',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _buildCategoryCard('İlkokul', Icons.child_care_rounded),
            const SizedBox(width: 12),
            _buildCategoryCard('Ortaokul', Icons.face_rounded),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _buildCategoryCard('Lise', Icons.school_rounded),
            const SizedBox(width: 12),
            _buildCategoryCard('Üniversite', Icons.school_outlined),
          ],
        ),
      ],
    );
  }

  Widget _buildCardContainer({required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Öğrenci Hesabı Doğrula'),
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: Colors.grey.shade200,
            height: 1,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 12,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.shield_rounded,
                      size: 48,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Öğrenci Doğrulama Formu',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Askıda ilanlarından ücretsiz olarak yararlanabilmek için aktif öğrenci olduğunuzu doğrulamamız gerekmektedir.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary, height: 1.4, fontSize: 13),
                ),
                const SizedBox(height: 24),
                
                // Category Selector (2x2 Grid)
                _buildCategorySelector(),
                const SizedBox(height: 20),
                
                // Form Fields Panel
                _buildCardContainer(
                  children: [
                    const Text(
                      'Öğrenim ve İletişim Bilgileriniz',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Full Name
                    TextFormField(
                      controller: _nameController,
                      style: const TextStyle(color: AppTheme.textPrimary),
                      decoration: const InputDecoration(
                        labelText: 'Ad Soyad',
                        prefixIcon: Icon(Icons.person_outline, color: AppTheme.primaryColor, size: 20),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Lütfen ad soyad girin' : null,
                    ),
                    const SizedBox(height: 14),

                    // Phone Number
                    TextFormField(
                      controller: _phoneController,
                      style: const TextStyle(color: AppTheme.textPrimary),
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Telefon Numarası',
                        prefixIcon: Icon(Icons.phone_outlined, color: AppTheme.primaryColor, size: 20),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Lütfen telefon numarası girin' : null,
                    ),
                    const SizedBox(height: 14),

                    // Email Address
                    TextFormField(
                      controller: _emailController,
                      style: const TextStyle(color: AppTheme.textPrimary),
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'E-posta Adresi',
                        prefixIcon: Icon(Icons.mail_outline, color: AppTheme.primaryColor, size: 20),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Lütfen e-posta adresi girin' : null,
                    ),
                    const SizedBox(height: 14),
                    
                    // School Name
                    TextFormField(
                      controller: _schoolController,
                      style: const TextStyle(color: AppTheme.textPrimary),
                      decoration: const InputDecoration(
                        labelText: 'Okul / Üniversite Adı',
                        prefixIcon: Icon(Icons.account_balance_outlined, color: AppTheme.primaryColor, size: 20),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Lütfen okul adını girin' : null,
                    ),
                    const SizedBox(height: 14),
                    
                    // Class/Grade/Department
                    TextFormField(
                      controller: _gradeController,
                      style: const TextStyle(color: AppTheme.textPrimary),
                      decoration: InputDecoration(
                        labelText: _selectedCategory == 'Üniversite' ? 'Fakülte / Bölüm' : 'Sınıf / Şube',
                        prefixIcon: const Icon(Icons.class_outlined, color: AppTheme.primaryColor, size: 20),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty 
                          ? (_selectedCategory == 'Üniversite' ? 'Lütfen fakülte/bölüm bilgisi girin' : 'Lütfen sınıf/şube girin') 
                          : null,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                
                // Document Picker Panel
                _buildCardContainer(
                  children: [
                    const Text(
                      'Öğrenci Kartı veya Öğrenci Belgesi Fotoğrafı',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'PNG, JPG formatlarında net öğrenci belgesi',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 11.5),
                    ),
                    const SizedBox(height: 14),
                    InkWell(
                      onTap: _isLoading ? null : _pickImage,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        height: 180,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _imageFile != null 
                                ? AppTheme.primaryColor.withValues(alpha: 0.4) 
                                : Colors.grey.shade300, 
                            style: BorderStyle.solid,
                            width: 1.2,
                          ),
                        ),
                        child: _imageFile != null
                            ? Stack(
                                children: [
                                  Positioned.fill(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(11),
                                      child: Image.file(_imageFile!, fit: BoxFit.cover),
                                    ),
                                  ),
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: CircleAvatar(
                                      radius: 18,
                                      backgroundColor: Colors.black.withValues(alpha: 0.7),
                                      child: IconButton(
                                        icon: const Icon(Icons.cached, color: Colors.white, size: 16),
                                        onPressed: _isLoading ? null : _pickImage,
                                        padding: EdgeInsets.zero,
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryColor.withValues(alpha: 0.08),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.add_a_photo_outlined, size: 28, color: AppTheme.primaryColor),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    'Görsel Seçmek İçin Dokunun',
                                    style: TextStyle(color: AppTheme.textPrimary, fontSize: 12.5, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Submit Button
                ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    elevation: 1,
                    shadowColor: AppTheme.primaryColor.withValues(alpha: 0.2),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading 
                    ? const SizedBox(
                        height: 20, 
                        width: 20, 
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : const Text(
                        'Belgeleri Gönder ve Doğrula',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
