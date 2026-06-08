import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/glass_container.dart';
import '../../../feed/presentation/providers/feed_provider.dart';

class TransactionHistoryScreen extends ConsumerWidget {
  const TransactionHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsState = ref.watch(completedAdsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('İşlem Geçmişi')),
      body: adsState.when(
        data: (ads) {
          if (ads.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history, size: 64, color: Colors.grey.shade200),
                  const SizedBox(height: 16),
                  Text(
                    'Henüz bir işlem kaydı yok.',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: ads.length,
            itemBuilder: (context, index) {
              final ad = ads[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.volunteer_activism, color: AppTheme.primaryColor),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(ad.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                            Text(ad.location, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${ad.createdAt.day}.${ad.createdAt.month}.${ad.createdAt.year}',
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                          const Text(
                            'Tamamlandı',
                            style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Hata: $err')),
      ),
    );
  }
}

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Yardım ve Destek')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text('Sıkça Sorulan Sorular', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildFaqItem('Uygulama nasıl çalışır?', 'Askıda uygulaması, ihtiyaç sahipleri ile hayırseverleri buluşturan bir platformdur.'),
          _buildFaqItem('Nasıl bağış yaparım?', 'İlanlar sekmesinden bir ilan seçerek "Bağış Yap" butonuna tıklayabilirsiniz.'),
          _buildFaqItem('Öğrenci olduğumu nasıl kanıtlarım?', 'Kayıt sırasında .edu uzantılı e-postanızla doğrulama yapmanız yeterlidir.'),
          const SizedBox(height: 32),
          GlassContainer(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                const Icon(Icons.support_agent, size: 48, color: AppTheme.primaryColor),
                const SizedBox(height: 16),
                const Text('Bize Ulaşın', style: TextStyle(fontWeight: FontWeight.bold)),
                const Text('destek@askida.app', style: TextStyle(color: AppTheme.primaryColor)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {},
                  child: const Text('Destek Talebi Oluştur'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return ExpansionTile(
      title: Text(question, style: const TextStyle(fontWeight: FontWeight.w600)),
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Text(answer, style: const TextStyle(color: Colors.grey)),
        ),
      ],
    );
  }
}

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gizlilik Politikası')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Gizlilik ve Güvenlik', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text(
              'Askıda uygulaması olarak gizliliğinize önem veriyoruz. '
              'Verileriniz KVKK kapsamında korunmaktadır. '
              'E-posta adresiniz sadece doğrulama amacıyla kullanılır ve üçüncü taraflarla paylaşılmaz.\n\n'
              'Toplanan Veriler:\n'
              '• Ad-Soyad (Kendi rızanızla paylaşılan)\n'
              '• E-posta adresi\n'
              '• Kullanıcı rolü (Öğrenci/Bağışçı)\n\n'
              'Veri Güvenliği:\n'
              'Verileriniz güvenli sunucularımızda şifreli veri tabanlarında güvenle saklanmaktadır.',
              style: TextStyle(height: 1.6, color: Colors.grey.shade800),
            ),
          ],
        ),
      ),
    );
  }
}

// ==========================================
// YENİ NESİL AYARLAR VE DURUM YÖNETİMİ (Riverpod v3)
// ==========================================

// Anlık Bildirim ayarını hafızada tutan sınıf
class PushNotifsNotifier extends Notifier<bool> {
  @override
  bool build() => true;
  void updateState(bool val) => state = val;
}

// E-posta Bildirimleri ayarını hafızada tutan sınıf
class EmailNotifsNotifier extends Notifier<bool> {
  @override
  bool build() => false;
  void updateState(bool val) => state = val;
}

// Uygulama Tema ayarını hafızada tutan sınıf
class ThemeNotifier extends Notifier<String> {
  @override
  String build() => 'Sistem Varsayılanı';
  void updateState(String val) => state = val;
}

// Bu sağlayıcılar (Providers), uygulamanın herhangi bir yerinden ayarların durumunu okumak ve güncellemek için kullanılır.
// StateProvider yerine Riverpod v3 mimarisine uygun olarak NotifierProvider kullanılmıştır.
final pushNotificationsProvider = NotifierProvider<PushNotifsNotifier, bool>(PushNotifsNotifier.new);
final emailNotificationsProvider = NotifierProvider<EmailNotifsNotifier, bool>(EmailNotifsNotifier.new);
final themeProvider = NotifierProvider<ThemeNotifier, String>(ThemeNotifier.new);

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pushNotifs = ref.watch(pushNotificationsProvider);
    final emailNotifs = ref.watch(emailNotificationsProvider);
    final currentTheme = ref.watch(themeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Ayarlar')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text('Bildirimler', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
          const SizedBox(height: 16),
          SwitchListTile(
            title: const Text('Anlık Bildirimler'),
            subtitle: const Text('Yeni ilan eklendiğinde haber ver'),
            value: pushNotifs,
            activeColor: AppTheme.primaryColor,
            onChanged: (val) {
              ref.read(pushNotificationsProvider.notifier).updateState(val);
            },
          ),
          SwitchListTile(
            title: const Text('E-posta Bildirimleri'),
            subtitle: const Text('Önemli güncellemeleri e-posta ile al'),
            value: emailNotifs,
            activeColor: AppTheme.primaryColor,
            onChanged: (val) {
              ref.read(emailNotificationsProvider.notifier).updateState(val);
            },
          ),
          const Divider(height: 32),
          const Text('Görünüm', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.dark_mode_outlined),
            title: const Text('Tema'),
            trailing: Text(currentTheme, style: const TextStyle(color: Colors.grey)),
            onTap: () {
              showModalBottomSheet(
                context: context,
                builder: (context) {
                  return SafeArea(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ListTile(
                          title: const Text('Sistem Varsayılanı'),
                          onTap: () {
                            ref.read(themeProvider.notifier).updateState('Sistem Varsayılanı');
                            Navigator.pop(context);
                          },
                        ),
                        ListTile(
                          title: const Text('Açık Tema'),
                          onTap: () {
                            ref.read(themeProvider.notifier).updateState('Açık Tema');
                            Navigator.pop(context);
                          },
                        ),
                        ListTile(
                          title: const Text('Koyu Tema'),
                          onTap: () {
                            ref.read(themeProvider.notifier).updateState('Koyu Tema');
                            Navigator.pop(context);
                          },
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          ),
          const Divider(height: 32),
          const Text('Hesap', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
          const SizedBox(height: 16),

          ListTile(
            leading: const Icon(Icons.delete_outline, color: Colors.red),
            title: const Text('Hesabı Sil', style: TextStyle(color: Colors.red)),
            onTap: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Hesabı Sil'),
                  content: const Text('Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('İptal'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Hesabınız başarıyla silindi.')),
                        );
                      },
                      child: const Text('Sil', style: TextStyle(color: Colors.red)),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
