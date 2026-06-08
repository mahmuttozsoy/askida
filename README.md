# Askıda (Bandırma) Projesi

Bu proje; ihtiyaç sahipleri (öğrenciler) ile hayırseverleri ve işletmeleri buluşturan, askıda yemek/ürün/yardım mantığıyla çalışan modern bir yardımlaşma platformudur.

## 🛠️ Teknoloji Yığını (Tech Stack)

### 1. Backend (C# ASP.NET Core 9.0)
* **Konum:** `/Askida.Api`
* **Veritabanı:** PostgreSQL (Entity Framework Core üzerinden yönetiliyor).
* **Mimari:** Dependency Injection tabanlı, Repository pattern kullanılan modüler yapı.
  * *EfAidRepository:* İlanların/Yardımların (Aids) PostgreSQL veritabanına kaydedilmesini ve okunmasını sağlar.
* **Kimlik Doğrulama:** JWT (JSON Web Token).
* **Bildirimler:** E-posta (SMTP) ve WhatsApp (Twilio entegrasyonu) destekli OTP/Doğrulama sistemleri.
* **Sunucu & Deployment:** Docker ve `docker-compose` kullanılarak Ubuntu VPS'te (IP: 195.35.56.82) barındırılıyor. Deploy işlemi `deploy_docker_api.py` scripti üzerinden otomatikleştirildi.
* **Geriye Dönük Uyumluluk:** Yeni sistemde her şey `Aid` (İlan/Yardım) modeli üzerinden çalışır. Ancak Admin Panelinin eski API uçlarına (`/products`, `/donations`, `/requests`) yaptığı isteklerin çökmemesi için bu Controller'lar arkaplanda `IAidRepository`'e yönlendirilecek şekilde sisteme entegre edildi.

### 2. Mobil Uygulama (Flutter)
* **Konum:** `/lib`
* **Durum Yönetimi (State Management):** Riverpod v3 (Yeni nesil `Notifier` ve `NotifierProvider` mimarisi).
* **Yönlendirme (Routing):** `go_router` paketi.
* **Ağ İstekleri:** `dio` paketi ile API haberleşmesi (örn. `ad_api_service.dart`).
* **Öne Çıkan Modüller:**
  * **Auth:** Giriş, Kayıt, Rol Seçimi (Öğrenci, İşletme, Destekçi).
  * **Profil:** Hesap detayları, Öğrenci doğrulama (belge yükleme), Geçmiş işlemler.
  * **Feed (İlanlar):** Aktif askıda ürünlerinin/ilanların listelendiği, filtrelendiği ekran.
  * **Ayarlar:** Tema (Light/Dark/Sistem), Anlık/E-posta bildirimleri ve Hesap yönetimi (Şifre değiştir, hesabı sil).

### 3. Yönetim Paneli (Web Admin Panel)
* **Konum:** `/askida-admin-web`
* Ürünlerin, ilanların ve öğrencilerin doğrulanma süreçlerinin yönetildiği arayüz.
* Daha önce bağımsız bir JSON sunucusuna istek atarken, son güncellemelerle doğrudan C# sunucusundaki PostgreSQL veritabanına entegre edilmiştir.

---

## 🚀 Bugüne Kadar Yapılan Geliştirmeler (Kısa Özet)

1. **Sunucu & Veritabanı Entegrasyonu:** 
   * C# tarafında test amaçlı kullanılan sahte veritabanı (JSON) devre dışı bırakıldı ve **Gerçek PostgreSQL Veritabanı** entegrasyonu sağlandı (`EfAidRepository`). 
   * Hem Flutter mobil uygulamasının hem de Web Admin Panelinin aynı veritabanından veri okuması/yazması sağlandı. 
2. **API Uyumluluğu:** 
   * Flutter uygulaması modernize edilerek doğrudan `/aids` endpointlerine bağlandı.
   * Admin panelinin kodlarının bozulmaması için C# tarafında `/products`, `/donations` ve `/requests` endpointleri geriye dönük uyumlu olarak ayağa kaldırıldı.
3. **Flutter UI/UX Geliştirmeleri:**
   * Profil sayfasındaki **Ayarlar** menüsü tamamen işlevsel hale getirildi. 
   * Riverpod v3 uyumluluğu gözetilerek `Notifier` sınıfları üzerinden Tema değişimi, bildirim tercihleri ve hesap silme/şifre değiştirme diyalogları kodlandı.
4. **Hızlı Deployment:** 
   * C# API güncellemeleri, Python scripti kullanılarak Docker imajları halinde saniyeler içinde VPS sunucusuna başarıyla deploy edildi.
5. **Kod Dokümantasyonu:**
   * Projenin "beyni" olan en kritik C# (AidsController, EfAidRepository, Program) ve Flutter (ad_api_service, feed_provider, profile_sub_pages) dosyalarına detaylı Türkçe iş mantığı yorumları eklendi.

---

## 🎯 Yarınki (Sonraki) Hedeflerimiz
* (Buraya bir sonraki çalışma oturumumuzda eklemek/düzeltmek istediğiniz özellikleri ekleyebilirsiniz.)
* Sistem genelinde testlerin yapılması,
* Bildirim izinlerinin ve Push Notification altyapısının (Firebase) tam olarak test edilmesi,
* Öğrenci onay (Verification) süreçlerinin Admin panelinden tamamen yönetilebilirliğinin teyit edilmesi.

## 📌 Geliştirici Notları ve Uygulama Kuralları (ÖNEMLİ)
Sonraki güncellemelerde unutulmaması gereken kritik iş mantıkları (Business Rules) şunlardır:
1. **Öğrenci Kısıtlamaları:** Öğrenciler ürün fiyatlarını GÖREMEZ. İlan detay sayfasında veya ana sayfada fiyat gösterilmemelidir.
2. **Talep (Request) Kontrolü:** Bir öğrenci, bir ilana talep gönderdiğinde, bu talep onaylanana veya reddedilene kadar aynı ilana ikinci bir talep GÖNDEREMEZ.
3. **Ayarlar/Hesap:** "Şifre değiştir" özelliği hesap detaylarından kaldırılmıştır.
4. **Medya Gösterimi:** İlan resimleri `ad.imageUrl` kullanılarak ve her zaman `http` prefix kontrolü yapılarak render edilmelidir (Eğer `http` yoksa API ana sunucu adresi önüne eklenmelidir). Uygulama varsayılan ana ikonu kullanmaktadır (Flutter logoları kaldırıldı).
5. **Release (Yayın) Kuralları:** Uygulama paket adı (applicationId ve namespace) `com.askida.app` olarak ayarlanmıştır. Firebase `google-services.json` dosyası da bu isme ayarlıdır. Her Google Play Console güncellemesinde `pubspec.yaml` içindeki `version` ve `+buildNumber` artırılmalıdır. (Son Play Store sürüm kodu: 6)
6. **Başlangıç/Splash Screen Yönlendirmesi:** Uygulama açılışında 2 saniyelik sabit bekleme süresine ek olarak `authProvider`'ın arka planda profil yüklemesi (`isLoading`) bitene kadar beklenir. Eğer API isteği yavaşsa veya başarısız olursa (`try-catch` ile korunmuştur) kullanıcı çıkış yapılmış sayılmaz, mevcut token varsa anasayfaya yönlendirilir.
7. **Android MainActivity Paket Yolu:** Paket adı `com.askida.app` yapıldığı için, `MainActivity.kt` dosyası `android/app/src/main/kotlin/com/askida/app/` dizinine taşınmış ve dosya içerisindeki paket adı güncellenmiştir. Buna dikkat edilmemesi Android üzerinde Native ClassNotFound çökmelerine (Crash) sebep olur.

> **Not (AI için):** Bu dosya, projeye yeniden başlandığında bağlamın (context) hızlıca hatırlanması için özenle oluşturulmuştur. Yeni özellikler eklendikçe ve kurallar belirlendikçe bu dosya güncellenecektir.
