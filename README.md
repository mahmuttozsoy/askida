# 🤲 Askıda (Dayanışma Platformu)

## 📖 Proje Özeti
Bu proje; ihtiyaç sahipleri (özellikle öğrenciler) ile hayırseverleri ve işletmeleri buluşturan, asırlık "askıda yemek/ürün" geleneğini modern teknolojiyle dijitalleştiren bir yardımlaşma platformudur. Sistem, şeffaflık ve güven ilkelerine dayalı olarak çalışır.

## 🏗️ Teknoloji Yığını ve Mimari (Tech Stack)

Proje 3 ana koldan (Backend, Mobil Uygulama, Admin Paneli) oluşmaktadır:

### 1. Backend (C# ASP.NET Core 9.0)
- **Dizin:** `/Askida.Api`
- **Veritabanı:** PostgreSQL (Entity Framework Core kullanılarak).
- **Mimari:** Dependency Injection tabanlı, Repository & Service katmanlarıyla ayrılmış modüler yapı (`EfAidRepository` vb.).
- **Kimlik Doğrulama:** JWT (JSON Web Token) tabanlı güvenli oturum.
- **Entegrasyonlar:** E-posta (SMTP) ve WhatsApp (Twilio) destekli OTP (Tek Kullanımlık Şifre) sistemleri.
- **Geriye Dönük Uyumluluk:** Yeni sistemin tekil `Aid` (İlan/Yardım) modeli üzerinden çalışmasıyla beraber, eski admin panellerinin çökmemesi için eski API uçları (`/products`, `/donations`, `/requests`) yeni modele yönlendirilerek korundu.
- **Sunucu & Deployment:** Docker ve `docker-compose` kullanılarak Ubuntu VPS üzerinde otomatikleştirilmiş Python scriptleriyle (`deploy_docker_api.py`, `vps_ssh.py`) deploy edilmektedir.

### 2. Mobil Uygulama (Flutter)
- **Dizin:** `/lib`
- **Durum Yönetimi (State Management):** Riverpod v3 (`Notifier` ve `NotifierProvider` mimarisi).
- **Yönlendirme (Routing):** `go_router` paketi.
- **Ağ İstekleri:** `dio` paketi ile API haberleşmesi (örn: `ad_api_service.dart`, `auth_provider.dart`).
- **Öne Çıkan Özellikler:**
  - **Auth & Profil:** Otomatik oturum yönetimi (SplashScreen üzerinden `authProvider` kontrolü ile), Öğrenci doğrulama süreçleri (belge upload) ve geçmiş işlemler.
  - **Feed (İlanlar Akışı):** Aktif "askıda" ilanlarının listelendiği, filtrelendiği gelişmiş akış.
  - **Bildirimler:** Firebase Cloud Messaging (FCM) altyapısı ve `flutter_local_notifications` ile sesli, titreşimli yerel anlık bildirimler.

### 3. Yönetim Paneli (Web Admin Panel)
- **Dizin:** `/askida-admin-web`
- **Özet:** İşletmelerin, öğrencilerin ve sistemdeki askı ilanlarının/takiplerinin yapıldığı, API'nin veritabanına entegre hafif bir web arayüzü (Vite + Vanilla JS/CSS altyapısında).

---

## ⚙️ Temel İş Mantığı ve Platform Kuralları (Business Logic)

Sistemdeki en kritik dinamikler aşağıda tanımlanmıştır:

1. **Rol Tabanlı Deneyim:**
   - **Öğrenci (Student):** Yardıma ihtiyacı olan taraftır. Uygulamayı kullanabilmek için belge doğrulaması gerekir. Öğrenciler ilan akışındaki ürünlerin veya yardımların **maddi fiyatını kesinlikle göremez**. Amaç, yardım alırken mahcubiyeti önlemektir. 
   - **İşletme (Business):** Askıya yemek/ürün ekleyen işletmelerdir.
   - **Destekçi (Supporter):** Askıdaki ürünleri finanse eden hayırseverlerdir.

2. **Talep (Request) Kontrolü:** 
   - Bir öğrenci herhangi bir ilana talep gönderdiğinde, bu talep onaylanana ya da reddedilene kadar **aynı ilana ikinci bir talep gönderemez**.

3. **Kullanıcı Deneyimi & Oturum:**
   - **Splash Screen Beklemesi:** Uygulama açıldığında profilin yüklenmesi için 2 saniye zorunlu bekleme + API yanıt beklemesi süreci vardır. İnternet yavaşsa veya hata dönerse bile oturum kapatılmaz (try-catch korumalıdır), kullanıcı doğrudan anasayfaya yönlendirilir.
   - **Hesap Ayarları:** Gereksiz karmaşıklığı önlemek adına "Şifre değiştir" ayarı profil detaylarından çıkarılmış, standart "Şifremi Unuttum" sürecine bağlanmıştır.

4. **Medya Yönetimi:** 
   - İlan resimleri `ad.imageUrl` üzerinden her zaman `http` prefix kontrolü yapılarak render edilir. Eğer `http` yoksa uygulamanın API ana base adresi başına otomatik eklenir.

---

## 🚀 Dağıtım (Deployment) ve Google Play Kuralları

- **Android Yayınlama:** Uygulama paketi (applicationId ve namespace) `com.askida.app` olarak ayarlanmıştır. Firebase `google-services.json` dosyası da birebir bu isme göre düzenlenmiştir.
- **Native Crash Önlemi:** `MainActivity.kt` dosyası Android manifest `android:name=".MainActivity"` parametresine uygun olarak `android/app/src/main/kotlin/com/askida/app/` yolunda tutulmalıdır.
- **Sürüm Güncellemeleri:** Her Play Console güncellemesinde `pubspec.yaml` dosyasındaki `version: x.y.z+buildNumber` kısmındaki **`+buildNumber` (sürüm kodu) mutlaka bir artırılmalıdır.** (Son güncel Play Store Sürüm Kodu: **6**)

> **Not:** Bu belge, projeye yeni bir geliştirici veya AI asistan dahil olduğunda tüm bağlamı (context), yazılım mimarisini ve değişmeyen şirket kurallarını hızlıca anlaması için merkezi bir başvuru kaynağıdır. Yeni geliştirmeler eklendikçe burası güncellenmelidir.
