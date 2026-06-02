Sen kıdemli bir Flutter ve C# ASP.NET Core geliştiricisisin.

“Askıda” isimli sosyal yardımlaşma uygulamasını geliştireceğiz.

Teknoloji planı:

Frontend:

* Flutter
* Material 3
* Riverpod
* Go Router
* Clean Architecture

Backend:

* C# ASP.NET Core Web API
* Katmanlı mimari
* JWT Authentication altyapısına hazır yapı
* REST API
* DTO, Service, Repository yapısı

Veritabanı:

* Şimdilik Firebase bağlantısı yapılmayacak
* Firebase entegrasyonu daha sonra eklenecek
* İlk aşamada mock data / fake repository kullanılacak

Öncelik:
Önce Flutter arayüzünü ve C# backend temel mimarisini kur.

Uygulama adı: Askıda

Amaç:
Öğrencilerin yemek, barınma, kırtasiye, ulaşım, sağlık, giyim, eğitim ve teknoloji gibi ihtiyaçlarının bireysel destekçiler veya işletmeler tarafından karşılanmasını sağlayan bir platform.

Kullanıcı rolleri:

1. Öğrenci
2. Bireysel Destekçi
3. İşletme
4. Admin

İlk aşamada Flutter’da şu ekranları oluştur:

1. Splash Screen
2. Onboarding Screen
3. Login Screen
4. Register Screen
5. Role Selection Screen
6. Student Home Screen
7. Supporter Home Screen
8. Business Home Screen
9. Aid Categories Screen
10. Aid Detail Screen
11. Create Aid Request Screen
12. Profile Screen
13. Settings Screen

Flutter tarafında:

* Modern ve temiz tasarım yap
* Responsive yapı kur
* Tüm renkleri app_theme.dart içinde tut
* Tüm route’ları app_router.dart içinde yönet
* Ortak widget’lar oluştur
* Hardcoded karmaşık yapıdan kaçın
* Firebase kodu yazma
* API bağlantısı için service katmanı hazırla ama şimdilik mock data kullan

C# backend tarafında şu yapıyı kur:

Askida.Api

* Controllers
* Models
* DTOs
* Services
* Repositories
* Interfaces
* Middleware
* Helpers

İlk API endpointleri:

Auth:

* POST /api/auth/register
* POST /api/auth/login

Users:

* GET /api/users
* GET /api/users/{id}
* PUT /api/users/{id}

Aid:

* GET /api/aids
* GET /api/aids/{id}
* POST /api/aids
* PUT /api/aids/{id}
* DELETE /api/aids/{id}

Categories:

* GET /api/categories

Backend şimdilik:

* In-memory fake data kullansın
* Firebase bağlantısı olmasın
* Entity modelleri Firebase’e uygun olacak şekilde tasarlansın
* Daha sonra Firestore repository eklenebilecek şekilde soyutlama yapılsın

Bana önce şu çıktıları ver:

1. Flutter proje klasör yapısı
2. C# backend klasör yapısı
3. Flutter ana tema dosyası
4. Flutter route yapısı
5. İlk 5 Flutter ekranının kodu
6. C# Program.cs
7. İlk controller örnekleri
8. Model ve DTO örnekleri
9. Fake repository yapısı

Kodları parça parça değil, düzenli başlıklarla ver.
Önce arayüz ve backend iskeletini kur.
Firebase bağlantısını şimdilik ekleme.

---

## Uygulama Planı

Bu bölüm, yukarıdaki isterler doğrultusunda "Askıda" uygulaması için Flutter frontend ve C# ASP.NET Core backend iskeletinin adım adım kurulum planını içermektedir.

### 1. Flutter Proje Klasör Yapısı (Clean Architecture)

Flutter tarafında Riverpod ve Go Router kullanılarak aşağıdaki `lib/` yapısı kurulacaktır:

```text
lib/
├── core/
│   ├── constants/ (renkler, stringler vb.)
│   ├── theme/ (app_theme.dart)
│   ├── routing/ (app_router.dart)
│   └── error/
├── features/
│   ├── auth/
│   │   ├── domain/ (modeller, repository arayüzleri)
│   │   ├── data/ (mock repository implementasyonu)
│   │   └── presentation/
│   │       ├── screens/ (Splash, Onboarding, Login, Register, RoleSelection)
│   │       └── widgets/
│   ├── home/
│   └── aid/
├── shared/
│   └── widgets/ (ortak butonlar, textfield'lar vb.)
└── main.dart
```

### 2. C# Backend Klasör Yapısı (Katmanlı Mimari)

C# ASP.NET Core Web API projesi, Flutter projesiyle aynı kök dizinde ayrı bir klasör (`e:\projelerim\Askida.Api`) olarak aşağıdaki katmanlı yapıya sahip olacaktır:

```text
Askida.Api/
├── Controllers/ (AuthController, UsersController, AidsController, CategoriesController)
├── Core/
│   ├── Entities/ (User, Aid, Category - Firebase'e uygun Id tipleri ile)
│   └── Interfaces/ (IAidRepository, IUserRepository vb.)
├── Infrastructure/
│   └── Data/ (Mock veri depoları, FakeRepository implementasyonları)
├── Application/
│   ├── DTOs/ (UserDto, CreateAidDto vb.)
│   └── Services/ (AuthService, AidService vb.)
├── Program.cs
└── appsettings.json
```

### 3. Flutter Tema ve Route Kurulumu

- **`app_theme.dart`**: Material 3 standartlarında, projeye özel renk paletiyle (modern ve temiz) hazırlanmış tema dosyası oluşturulacak.
- **`app_router.dart`**: Go Router kullanılarak uygulamanın navigasyon altyapısı kurulacak.

### 4. Flutter İlk 5 Ekranının Kodlanması

`features/auth/presentation/screens/` altında şu ekranlar oluşturulacaktır (Mock bağlantılarıyla):
1. **Splash Screen**: Uygulama açılış ekranı.
2. **Onboarding Screen**: Uygulamanın amacını anlatan tanıtım ekranı.
3. **Login Screen**: Giriş ekranı.
4. **Register Screen**: Kayıt ekranı.
5. **Role Selection Screen**: Kayıt sonrası (Öğrenci, Destekçi, İşletme) rol seçimi ekranı.

### 5. C# Backend İskeletinin Kurulumu

Belirlenen dizinde:
- **`Program.cs`**: Controller tabanlı API başlangıç noktası (DI konteyneri yapılandırması dahil).
- **Modeller ve DTO'lar**: `User`, `Aid` gibi temel varlıklar ve veri taşıma objeleri.
- **Fake Repository**: Interface tabanlı, In-memory liste kullanan veri erişim katmanı.
- **Controller Örnekleri**: RESTful prensiplere uygun uç noktalar.
