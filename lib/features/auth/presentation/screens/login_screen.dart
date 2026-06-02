import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  UserRole? _selectedRole;
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Telefon numarası gerekli';
    }

    final digits = value.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 10 && digits.startsWith('5')) {
      return null;
    }
    if (digits.length == 11 && digits.startsWith('0') && digits[1] == '5') {
      return null;
    }

    return 'Geçerli bir telefon numarası girin (5XX XXX XX XX)';
  }

  void _handleLogin() async {
    if (_selectedRole == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lütfen bir rol seçin')),
      );
      return;
    }

    if (_formKey.currentState?.validate() ?? false) {
      try {
        await ref.read(authProvider.notifier).login(
              _selectedRole!,
              phone: _phoneController.text.trim(),
              password: _passwordController.text.trim(),
            );
        if (mounted) {
          final profile = ref.read(authProvider).userProfile;
          if (profile?.isAdmin == true) {
            context.go('/admin');
          } else if (_selectedRole == UserRole.student) {
            context.go('/home-student');
          } else {
            context.go('/home-supporter');
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Hata: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Giriş Yap'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Text(
                'Tekrar Merhaba!',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Hesabınıza giriş yaparak devam edin.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 32),

              // Role Selection
              const Text('Giriş Türünüzü Seçin:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => setState(() => _selectedRole = UserRole.student),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _selectedRole == UserRole.student
                            ? AppTheme.primaryColor
                            : Colors.white,
                        foregroundColor: _selectedRole == UserRole.student
                            ? Colors.white
                            : AppTheme.textPrimary,
                        side: BorderSide(color: AppTheme.primaryColor.withValues(alpha: 0.2)),
                        elevation: _selectedRole == UserRole.student ? 4 : 0,
                      ),
                      child: const Text('Öğrenci'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => setState(() => _selectedRole = UserRole.supporter),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _selectedRole == UserRole.supporter
                            ? AppTheme.primaryColor
                            : Colors.white,
                        foregroundColor: _selectedRole == UserRole.supporter
                            ? Colors.white
                            : AppTheme.textPrimary,
                        side: BorderSide(color: AppTheme.primaryColor.withValues(alpha: 0.2)),
                        elevation: _selectedRole == UserRole.supporter ? 4 : 0,
                      ),
                      child: const Text('Destekçi'),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: 'Telefon Numarası',
                  hintText: '5XX XXX XX XX',
                  prefixIcon: Icon(Icons.phone_outlined),
                  prefixText: '+90 ',
                ),
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(11),
                ],
                validator: _validatePhone,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'Şifre',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                obscureText: _obscurePassword,
                validator: (value) =>
                    value == null || value.isEmpty ? 'Şifre gerekli' : null,
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.push('/forgot-password'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.grey.shade600,
                  ),
                  child: const Text('Şifremi Unuttum'),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _handleLogin,
                child: const Text('Giriş Yap'),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Hesabınız yok mu?'),
                  TextButton(
                    onPressed: () => context.push('/register'),
                    child: const Text('Kayıt Ol'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
