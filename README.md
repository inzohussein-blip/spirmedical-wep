# 📱 التقرير الشامل لتحليل تطبيق "دليل البصرة الطبي"

> تحليل كامل للنسختين 3.9.0 و 4.6.0 مع مقارنة شاملة وصور التطبيق

---

## 📋 جدول المحتويات

1. [معلومات أساسية](#1-معلومات-أساسية)
2. [البنية التقنية](#2-البنية-التقنية)
3. [صور التطبيق وتحليلها](#3-صور-التطبيق-وتحليلها)
4. [الشجرة الهندسية الكاملة](#4-الشجرة-الهندسية-الكاملة)
5. [الـ Plugins والمكتبات](#5-الـ-plugins-والمكتبات)
6. [مفاتيح API والـ Backend](#6-مفاتيح-api-والـ-backend)
7. [الصلاحيات والأمان](#7-الصلاحيات-والأمان)
8. [مقارنة النسختين 3.9.0 ⟷ 4.6.0](#8-مقارنة-النسختين-390--460)
9. [الميزات المكتشفة](#9-الميزات-المكتشفة)
10. [معلومات المطور](#10-معلومات-المطور)
11. [نقاط أمنية ومخاوف](#11-نقاط-أمنية-ومخاوف)
12. [الأصول البصرية والمحتوى](#12-الأصول-البصرية-والمحتوى)
13. [الخلاصة والتوصيات](#13-الخلاصة-والتوصيات)

---

## 1. معلومات أساسية

| الحقل | القيمة |
|------|--------|
| **اسم التطبيق** | دليل البصرة الطبي (Basra Clinics) |
| **Package Name** | `com.basra.clinics` |
| **آخر إصدار** | 4.6.0 (Build 460) |
| **الإصدار السابق** | 3.9.0 (Build 390) |
| **تاريخ آخر تحديث** | 19 مايو 2026 |
| **عدد التنزيلات** | +1,000 |
| **التقييم** | ⭐ 4.7/5 (24 مراجعة) |
| **الفئة** | طب |
| **التصنيف العمري** | 3 سنوات وما فوق |
| **Min Android** | API 24 (Android 7.0) |
| **Target Android** | API 36 (Android 16) |
| **حجم XAPK** | ~60 MB |
| **رابط Play Store** | [com.basra.clinics](https://play.google.com/store/apps/details?id=com.basra.clinics) |

### وصف التطبيق
> تطبيق بصري طبي شامل لكل مجالات الطب والصحة، يهدف إلى تسهيل وصول المستخدمين إلى الأطباء بمختلف الاختصاصات وكذلك الصيدليات والمختبرات ومراكز التجميل والمستشفيات.

---

## 2. البنية التقنية

### إطار العمل: **Flutter** 🎨

التطبيق مبني بـ **Flutter** (لغة Dart):
- ✅ تطبيق واحد لـ Android و iOS
- ✅ الكود الفعلي مترجم إلى ملف `libapp.so` (native binary)
- ⚠️ لا يمكن استرجاع الكود Java/Kotlin لأن المنطق كله بـ Dart

### كيف يعمل التطبيق تقنياً:

```
كود Dart → Flutter Engine → libapp.so (AOT) → APK
                                ↓
                          Firebase Backend
                                ↓
                    Cloud Firestore + Realtime DB
```

### المكونات الأساسية:

| العنصر | التفاصيل |
|--------|----------|
| **اللغة** | Dart |
| **Framework** | Flutter |
| **Backend** | Firebase (Google Cloud) |
| **Database** | Cloud Firestore + Realtime Database |
| **Auth** | Firebase Auth + Google Sign-In + Apple Sign-In |
| **Storage** | Firebase Storage |
| **Notifications** | Firebase Cloud Messaging (FCM) |
| **Maps** | Google Maps API |
| **Ads** | Google AdMob |
| **Monetization** | In-App Purchases (Google Play Billing) |

---

## 3. صور التطبيق وتحليلها

### 🏠 الصورة 1: الشاشة الرئيسية

![الشاشة الرئيسية](screenshots/01_home.webp)

**العناصر الظاهرة:**
- شريط علوي أخضر مع اسم التطبيق وأيقونات (إشعارات 🔔، وضع ليلي 🌙)
- شريط بحث "ابحث عن طبيب، صيدلية، مختبر، مستشفى..."
- بطاقة طبيب مميز (د. حسن رمضان شندوخ)
- شريط الاختصاصات الدائرية مع أيقونات
- **💬 "غرفة الدردشة - متاح الآن"** ← ميزة الدردشة الحية
- قسم "أطباء مقترحون"
- Bottom Navigation بـ 5 tabs

**المكتبات المستخدمة:**
- `awesome_bottom_bar` - الشريط السفلي
- `carousel_slider` - الكاروسيل
- `flutter_typeahead` - البحث الذكي
- `cached_network_image` - تحميل الصور
- `grouped_list` - قوائم التخصصات

---

### 📋 الصورة 2: قائمة الأطباء

![قائمة الأطباء](screenshots/02_doctors_list.webp)

**العناصر الظاهرة:**
- شريط البحث "ابحث عن الاسم"
- Filter chips: أطباء / أسنان / صيدليات (مع أيقونات)
- Grid 2 عمود من بطاقات الأطباء
- كل بطاقة فيها: صورة دائرية + اسم الطبيب + التخصص

**الأطباء الظاهرون:**
- د. نصار طه ياسين - السكري والغدد الصم
- د. حسن رمضان شندوخ - الباطنية والصدرية
- د. رامي صباح المظفر - الباطنية والصدرية
- د. ايهاب فالح المظفر - الجراحة التجميلية

**ملاحظات:**
- شعار "PASA MARIDA TEAM" في الأسفل (شريك تقني محتمل)
- استخدام Avatars دائرية احترافية

---

### 🏥 الصورة 3: شاشة الاختصاصات

![جميع الاختصاصات](screenshots/03_specialties.webp)

**التخصصات الظاهرة:**

| الأيقونة | التخصص | عدد الأطباء |
|---------|---------|------------|
| 🦋 | السكري والغدد الصم | 6 طبيب |
| 👃 | الأذن والأنف والحنجرة | لا يوجد |
| 🔬 | النسيج المرضي | لا يوجد |
| 🦴 | العظام والكسور | 1 طبيب |
| 🎗️ | طب الأورام | لا يوجد |
| 🫁 | جراحة الصدر | لا يوجد |
| 🫃 | الجهاز الهضمي | 2 طبيب |
| 👶 | طب الاطفال | 1 طبيب |

**التقنيات المستخدمة:**
- Grid Layout مع `GridView`
- `medicons/` assets من الـ Flutter assets
- Firestore aggregation queries لعد الأطباء
- `delayed_widget` للأنيميشن

---

### 👨‍⚕️ الصورة 4: ملف الطبيب التفصيلي

![ملف الطبيب](screenshots/04_doctor_profile.webp)

**العناصر الظاهرة:**

| العنصر | التفاصيل |
|--------|----------|
| شريط أزرق علوي | مشاركة 📤 + مفضلة ❤️ + تعديل ✏️ |
| اسم الطبيب | د. حسن رمضان شندوخ |
| شارة التخصص | اختصاص الباطنية والصدرية |
| **✓ شارة التحقق الزرقاء** | Verified Badge على الصورة |
| زر "الاتجاهات" 🗺️ | يفتح الخريطة |
| زر "الاتصال" 📞 | اتصال مباشر |
| **التقييم 5.0** ⭐ | باستخدام `rating_summary` (جديد!) |
| **المشاهدات 82** 👁️ | عدّاد real-time |
| نبذة عن الطبيب | نص HTML/Rich Text |
| عنوان العيادة | قسم سفلي مع موقع |

**نص النبذة المكتشف:**
> "اختصاص في الامراض الباطنية والقلبية وامراض الجهاز التنفسي والجهاز العضمي وامراض الكلى وامراض الدم وداء السكري والغدد الصماء وارتفاع ضغط الدم"

**المكتبات المستخدمة:**
- `flutter_html` - عرض النص الغني
- `flutter_rating_bar` + `rating_summary` - التقييم
- `share_plus` - المشاركة
- `url_launcher` - الاتصال
- `cached_network_image` - الصور
- Realtime Database - عدّاد المشاهدات

---

### 🗺️ الصورة 5: خريطة الخدمات

![الخريطة](screenshots/05_map.webp)

**العناصر الظاهرة:**
- خريطة Google كاملة للبصرة
- Filter chips: الكل / أطباء / أسنان / صيدليات
- Markers ملونة لكل نوع خدمة:
  - 🔴 أحمر = المستشفيات
  - 🔵 أزرق = العيادات
  - 🟢 أخضر = الصيدليات
  - 🟡 أصفر = المختبرات
- زر تحديث 🔄
- أزرار Zoom + / -
- زر تحديد الموقع 🎯

**المعالم الجغرافية الظاهرة:**
- Basra Family Park (شمال)
- Basra Times Square
- Al-Sayyab Teaching Hospital
- Basra Children's Hospital (وسط)
- Basra International Stadium (جنوب)
- AL AMIN AL DAKHILI
- AL AMARIYAH

**المكتبات المستخدمة:**
- `google_maps_flutter` - الخريطة
- `geolocator` - الموقع الحالي
- `map_location_picker` - اختيار الموقع
- Custom markers من assets

---

## 4. الشجرة الهندسية الكاملة

### 📦 المستوى الأول: ملف XAPK (الحاوية)

```
دليل_البصرة_الطبي_3_9_0_APKPure.xapk  (60 MB - تنسيق ZIP)
│
├── 📄 manifest.json              [1.3 KB]
├── 🖼️  icon.png                   [15 KB]
│
├── 📦 com.basra.clinics.apk      [25 MB]  ← الـ APK الرئيسي
├── 📦 config.arm64_v8a.apk       [34 MB]  ← المكتبات Native
├── 📦 config.en.apk              [53 KB]  ← الموارد بالإنجليزية
└── 📦 config.mdpi.apk            [67 KB]  ← صور بدقة متوسطة
```

### 📦 المستوى الثاني: محتوى الـ Base APK

```
com.basra.clinics.apk
│
├── 📄 AndroidManifest.xml         ← تكوين التطبيق
│
├── 📁 META-INF/                   ← التوقيع الرقمي (BNDLTOOL)
│
├── 🔢 classes.dex                 [8.4 MB]
├── 🔢 classes2.dex                [32 KB]
├── 🔢 classes3.dex                [208 KB]
├── 🔢 classes4.dex                [3.4 MB]
│
├── 📁 assets/
│   ├── dexopt/
│   └── flutter_assets/            ← 🎯 جميع موارد Flutter
│
├── 📁 res/                        ← موارد Android
│
└── 📄 ملفات .properties           ← معلومات المكتبات (50+ ملف)
```

### 🎨 المستوى الثالث: مجلد flutter_assets

```
flutter_assets/                    [16 MB إجمالي]
│
├── 📄 AssetManifest.bin           [48 KB]
├── 📄 FontManifest.json           [1.4 KB]
├── 📄 NativeAssetsManifest.json   [45 B]
├── 📄 NOTICES.Z                   [137 KB]
│
├── 🎨 assets/                     ← الموارد البصرية (190 ملف)
│   ├── 🏥 medicons/   [45 ملف]    ← أيقونات التخصصات الطبية
│   ├── 📂 category/   [20 ملف]    ← فئات الخدمات
│   ├── 🎭 animation/  [21 ملف]    ← Lottie animations
│   ├── 🏥 7sanabil/   [30 ملف]    ← شريك "7 سنابل"
│   ├── 🏷️ weco/       [9 ملف]     ← شريك "WECO"
│   ├── 🎨 logo/       [13 ملف]    ← شعارات التطبيق
│   ├── 👤 icons/      [24 ملف]    ← أيقونات الواجهة
│   ├── 🖼️ svg/        [9 ملف]
│   ├── 👥 user_avatars/  [17 ملف] ← صور بروفايل افتراضية
│   ├── 🎚️ slider/     [3 ملف]
│   └── 🎭 avatar/     [3 ملف]
│
├── 🔤 fonts/                      ← الخطوط (9 ملفات)
│   ├── Cairo-{Bold,Medium,Regular}.ttf
│   ├── Tajawal-{Bold,Medium,Regular}.ttf
│   ├── Dubai-Regular.ttf
│   ├── Courgette-Regular.ttf
│   └── MaterialIcons-Regular.otf
│
├── 📚 packages/                   ← أصول مكتبات Flutter
│   ├── country_code_picker/
│   ├── cupertino_icons/
│   ├── fluttertoast/
│   ├── font_awesome_flutter/
│   └── iconly/
│
└── 🎮 shaders/                    ← Shaders للرسوميات
    ├── ink_sparkle.frag
    └── stretch_effect.frag
```

### 💻 المستوى الرابع: الكود المصدري

```
sources/  (88 MB، ~14,895 ملف Java)
│
├── 🎯 com/basra/clinics/          ← كود التطبيق الفعلي
│   ├── MainActivity.java          ← نقطة الدخول
│   └── R.java                     ← مرجع الموارد
│
├── 🌐 io/flutter/                 ← محرك Flutter
│   ├── embedding/
│   ├── plugin/
│   ├── plugins/
│   │   ├── GeneratedPluginRegistrant.java
│   │   ├── firebase/{auth, core, firestore, messaging, storage}
│   │   ├── imagepicker/
│   │   └── urllauncher/
│   └── view/
│
├── 🔥 com/google/firebase/        ← خدمات Firebase
│   ├── appcheck/, auth/, components/
│   ├── firestore/, messaging/, storage/
│   └── ktx/
│
├── 🎮 com/google/                 ← خدمات Google الأخرى
│   ├── ads/, android/, maps/, protobuf/
│
├── 📦 androidx/                   ← مكتبات AndroidX
│   ├── annotation/, appcompat/, browser/
│   ├── lifecycle/, room/, work/
│   └── ... (25 مكتبة)
│
└── 🎭 [obfuscated]/               ← الكود المشوش (473 package مختصر)
```

---

## 5. الـ Plugins والمكتبات

### 🔌 Flutter Plugins (34 plugin في النسخة الجديدة)

| # | اسم الـ Plugin | الوظيفة |
|---|---------------|---------|
| 1 | `app_links` | معالجة Deep Links |
| 2 | `cloud_firestore` | قاعدة بيانات Firebase |
| 3 | `file_picker` | اختيار ملفات من الجهاز |
| 4 | `firebase_auth` | تسجيل الدخول |
| 5 | `firebase_core` | أساسيات Firebase |
| 6 | `firebase_messaging` | الإشعارات (Push) |
| 7 | `firebase_storage` | تخزين سحابي |
| 8 | `flutter_barcode_scanner` | مسح الباركود/QR |
| 9 | `flutter_keyboard_visibility` | كشف ظهور لوحة المفاتيح |
| 10 | `flutter_keyboard_visibility_temp_fork` | نسخة معدلة |
| 11 | `flutter_local_notifications` | إشعارات محلية |
| 12 | `flutter_plugin_android_lifecycle` | دورة حياة Android |
| 13 | `flutter_upgrade_version` | فحص تحديث التطبيق |
| 14 | `flutter_web_browser` | متصفح داخلي |
| 15 | `fluttertoast` | رسائل توست |
| 16 | `geocoding_android` | تحويل عنوان ↔ إحداثيات |
| 17 | `geolocator_android` | تحديد الموقع |
| 18 | `google_maps_flutter_android` | خرائط Google |
| 19 | `google_mobile_ads` | إعلانات AdMob |
| 20 | `google_sign_in_android` | تسجيل دخول بـ Google |
| 21 | `image_picker_android` | اختيار صور |
| 22 | `image_pickers` | اختيار صور (بديل) |
| 23 | `in_app_purchase_android` | مشتريات داخلية |
| 24 | `in_app_review` | طلب تقييم |
| 25 | `package_info_plus` | معلومات الحزمة |
| 26 | `path_provider_android` | مسارات الملفات |
| 27 | `quill_native_bridge_android` | محرر نصوص Quill |
| 28 | `share_plus` | مشاركة المحتوى |
| 29 | `shared_preferences_android` | تخزين التفضيلات |
| 30 | `sign_in_with_apple` | تسجيل دخول Apple |
| 31 | `sqflite_android` | SQLite |
| 32 | `store_redirect` | فتح متجر التطبيقات |
| 33 | `url_launcher_android` | فتح روابط خارجية |
| 34 | `webview_flutter_android` | WebView |

### 📚 مكتبات Dart (332 مكتبة)

**أهم المكتبات حسب الفئة:**

#### مكتبات UI/UX
- `awesome_bottom_bar` - الشريط السفلي
- `carousel_slider` + `photo_view` - معرض الصور
- `cached_network_image` - الصور المخزنة
- `flutter_quill` + `flutter_html` - النصوص الغنية
- `flutter_typeahead` - البحث الذكي
- `flutter_rating_bar` + `rating_summary` ✨ - التقييم
- `dropdown_search` - قوائم منسدلة بحث
- `calendar_date_picker2` - تقويم الحجز
- `fl_chart` - رسومات بيانية
- `introduction_screen` - شاشات Onboarding
- `dynamic_multi_step_form` - نماذج متعددة الخطوات
- `morphable_shape` - أشكال متغيرة
- `shaky_animated_listview` - قوائم متحركة
- `swipeable_tile` - عناصر قابلة للسحب
- `grouped_list` - قوائم مجمعة
- `timeago` - عرض الوقت بشكل ودود
- `flutter_timer_countdown` - مؤقت/عد تنازلي
- `lottie` - أنيميشن Lottie

#### State Management
- `flutter_riverpod` ⭐ - الإدارة الرئيسية
- `provider` - إدارة فرعية
- `get` - GetX
- `state_notifier` - ValueNotifier-like
- `flutter_hooks` - React-style hooks
- `rxdart` - Reactive programming

#### Networking
- `dio` - HTTP client متقدم
- `retrofit` - REST API typesafe
- `http` - HTTP بسيط

#### Code Generation
- `freezed_annotation` - Immutable data classes
- `copy_with_extension` - copyWith() محسّن
- `json_annotation` - JSON serialization

#### Storage
- `sqflite` - SQLite database
- `hive` - NoSQL سريع
- `shared_preferences` - الإعدادات

---

## 6. مفاتيح API والـ Backend

### 🔥 Firebase Configuration

```yaml
project_id: basra-drs
google_app_id: 1:472320779209:android:40dba67b4a2ebb3a8c3e18
google_api_key: AIzaSyCJJ1M4Gqu1gl-KGIay-Uc5F0TqTnqcw7w
gcm_defaultSenderId: 472320779209
google_storage_bucket: basra-drs.appspot.com
firebase_database_url: https://basra-drs-default-rtdb.firebaseio.com
default_web_client_id: 472320779209-baffu3hqrcr4c7vh8rgs64st1b2ignj4.apps.googleusercontent.com
```

### 🗺️ Google Maps
- **API Key**: `AIzaSyCJJ1M4Gqu1gl-KGIay-Uc5F0TqTnqcw7w`

### 📊 Google AdMob
- **App ID**: `ca-app-pub-6054078815437409~6173522452`

### 🔗 Deep Links
- `basraclinics://signup`
- `basraclinics://register`
- `https://basra-clinics.app/signup` (App Link مع `autoVerify`)

### 🔐 Service Account
- `firebase-adminsdk-ipbj3@basra-drs.iam.gserviceaccount.com`

### 🌐 الحسابات الرسمية

| المنصة | الحساب |
|--------|---------|
| **Telegram** | [@basraclinics](https://t.me/basraclinics) |
| **Instagram** | [@basraclinics.app](https://www.instagram.com/basraclinics.app) |
| **Facebook** | [Profile ID: 61583681083801](https://www.facebook.com/profile.php?id=61583681083801) |
| **Smart Link** | https://onelink.to/mn9fed |
| **Website** | basra-clinics.app |

---

## 7. الصلاحيات والأمان

### 📝 الصلاحيات المطلوبة (19 صلاحية)

```xml
<uses-permission android:name="android.permission.ACCESS_ADSERVICES_AD_ID"/>
<uses-permission android:name="android.permission.ACCESS_ADSERVICES_ATTRIBUTION"/>
<uses-permission android:name="android.permission.ACCESS_ADSERVICES_TOPICS"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.FLASHLIGHT"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="com.android.vending.BILLING"/>
<uses-permission android:name="com.android.vending.CHECK_LICENSE"/>
<uses-permission android:name="com.basra.clinics.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"/>
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE"/>
<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
<uses-permission android:name="com.google.android.providers.gsf.permission.READ_GSERVICES"/>
```

### الاستخدامات:

| الصلاحية | الاستخدام |
|----------|-----------|
| `ACCESS_FINE_LOCATION` | تحديد موقع دقيق (لإيجاد عيادات قريبة) |
| `ACCESS_COARSE_LOCATION` | تحديد الموقع التقريبي |
| `INTERNET` | الاتصال بـ Firebase |
| `CAMERA` + `FLASHLIGHT` | التقاط صور (للوصفات الطبية) |
| `FOREGROUND_SERVICE` | تشغيل خدمات في الخلفية |
| `POST_NOTIFICATIONS` | إشعارات المواعيد |
| `BILLING` | اشتراكات داخلية |
| `AD_ID` + ADSERVICES | إعلانات AdMob |

---

## 8. مقارنة النسختين 3.9.0 ⟷ 4.6.0

### 🔥 الاكتشاف الكبير

**Play Store كان مضللاً!** كتب المطور:
> "إصلاح بعض المشاكل والأخطاء + تحسينات أداء التطبيق"

**لكن الواقع**: قفزة من **3.9.0 → 4.6.0** (سبعة minor versions!) مع تغييرات معمارية.

### 📊 جدول المقارنة

| المؤشر | 3.9.0 (XAPK) | 4.6.0 (Play Store) |
|--------|---------------|---------------------|
| **رقم Build** | 390 | 460 |
| **حجم Base APK** | 25 MB | 25 MB |
| **عدد ملفات Java** | 14,895 | 14,892 |
| **مكتبات Dart** | 342 | 332 (**-10**) |
| **Plugins** | 35 | 34 (**-1**) |
| **ملفات assets** | 194 | 194 (متطابقة 100%) |
| **حجم flutter_assets** | 16 MB | 16 MB |
| **target SDK** | API 36 | API 36 |
| **min SDK** | API 24 | API 24 |

### ❌ المكتبات المحذوفة في 4.6.0 (11 مكتبة)

```
❌ rive                  ← مكتبة الأنيميشن المتقدم
❌ rive_native           ← المكون الـ native لها
❌ awesome_dialog        ← الحوارات المنبثقة المتحركة
❌ code_assets           ← مكتبة dev internal
❌ glob                  ← مطابقة الأنماط
❌ graphs                ← خوارزميات الرسوم البيانية
❌ hooks                 ← hooks مساعدة
❌ logging               ← التسجيل
❌ native_toolchain_c    ← أدوات بناء C
❌ objective_c           ← مكتبة Obj-C
❌ pub_semver            ← إدارة الإصدارات
```

### ✅ المكتبات المضافة في 4.6.0

```
✅ rating_summary        ← عرض ملخص التقييمات (يطابق ميزة "التقييم 5.0")
```

### 🎨 تغيير الـ Theme

**تحول كبير لم يُكتشف من الكود وحده** (اكتُشف من الصور):

| النسخة | اللون الأساسي |
|--------|----------------|
| 3.9.0 | 🔴 **أحمر** (assets/logo/ كانت RedD، RLred، RDlogo) |
| 4.6.0 | 🟢 **أخضر طبي** (مثل ما يظهر في الصور الحالية) |

### ✅ ما لم يتغير (متطابق 100%)

- ✅ كل صور الـ assets (190 ملف)
- ✅ الخطوط (Cairo, Tajawal, Dubai, Courgette)
- ✅ مفاتيح Firebase بالضبط
- ✅ Google Maps API Key
- ✅ AdMob App ID
- ✅ الصلاحيات (19 صلاحية)
- ✅ Deep Links
- ✅ AndroidManifest

---

## 9. الميزات المكتشفة

### 🎯 ميزات مؤكدة (من الصور + الكود):

| الميزة | المكتبة | الصورة |
|--------|---------|--------|
| **البحث الذكي** | `flutter_typeahead` | 1, 2 |
| **التنقل السفلي 5 tabs** | `awesome_bottom_bar` | كل الصور |
| **عرض الأطباء** | `cached_network_image` | 1, 2 |
| **التخصصات بأيقونات** | `medicons/` assets | 1, 3 |
| **عدّاد الأطباء/تخصص** | Firestore aggregation | 3 |
| **شارة التحقق الزرقاء** | Custom widget | 4 |
| **التقييم 5 نجوم** | `flutter_rating_bar` + `rating_summary` | 4 |
| **عدّاد المشاهدات** | Realtime Database | 4 |
| **زر المشاركة** | `share_plus` | 4 |
| **زر المفضلة** | custom + Firestore | 4 |
| **زر الاتصال** | `url_launcher` (tel:) | 4 |
| **زر الاتجاهات** | `google_maps_flutter` | 4 |
| **نبذة بـ HTML** | `flutter_html` | 4 |
| **الخريطة التفاعلية** | `google_maps_flutter` | 5 |
| **markers ملونة** | Custom markers | 5 |
| **تحديد الموقع** | `geolocator` | 5 |
| **💬 غرفة الدردشة** | Firestore Realtime | 1 |

### 🎯 ميزات إضافية (من المكتبات):

- 🗓️ **حجز مواعيد بالتقويم** (`calendar_date_picker2`)
- 🗺️ **اختيار موقع من الخريطة** (`map_location_picker`)
- ⏱️ **عد تنازلي/مؤقت** (`flutter_timer_countdown`)
- 📊 **رسومات بيانية** (`fl_chart`)
- 🔍 **بحث ذكي مع اقتراحات** (`flutter_typeahead`)
- 🎯 **شاشات onboarding** (`introduction_screen`)
- 📋 **نماذج متعددة الخطوات** (`dynamic_multi_step_form`)
- 📷 **مسح QR Code** (`flutter_barcode_scanner`)
- 🛒 **مشتريات داخلية** (`in_app_purchase`)
- 📢 **إعلانات AdMob** (`google_mobile_ads`)

### 🏗️ معمارية احترافية:

```
State Management Layer:
  ├── flutter_riverpod (Primary)
  ├── provider (Secondary)
  ├── get (Navigation + State)
  ├── state_notifier
  ├── flutter_hooks
  └── rxdart

Networking Layer:
  ├── dio (Main HTTP client)
  ├── retrofit (Typesafe REST)
  └── http (Fallback)

Code Generation:
  ├── freezed_annotation
  ├── copy_with_extension
  └── json_annotation

Storage Layer:
  ├── sqflite (SQLite)
  ├── hive (NoSQL)
  └── shared_preferences

Backend:
  ├── Cloud Firestore
  ├── Realtime Database
  ├── Firebase Storage
  ├── Firebase Auth
  └── Firebase Messaging
```

---

## 10. معلومات المطور

### 🏢 الشركة المطورة:

| الحقل | القيمة |
|------|--------|
| **اسم العرض** | JJ Tech. |
| **الاسم القانوني** | J.J TECHNOLOGY DEVELOPMENT SOFTWARE SRL |
| **البلد** | 🇷🇴 رومانيا - بوخارست |
| **العنوان** | STR. LAMAIULUI NR. 4, 014581 Bucuresti, Romania |
| **الهاتف** | +40 768 819 830 |
| **البريد** | contact@jj-technology.com |
| **البريد للدعم** | drcode29@gmail.com |
| **معرف المطور في Play** | 8613885418157014207 |

### 🎮 تطبيقات أخرى لنفس المطور:

| التطبيق | Package | الفئة |
|---------|---------|-------|
| **دليل البصرة الطبي** | com.basra.clinics | طبي ⭐ |
| **ISAP** | com.isap.charity | الخيرية |
| **قاموس الناصرية** | com.nasdict | لغوي |
| **Dr.Quiz Elite** | com.drquiz.elite | اختبارات طبية (⭐ 4.9) |

### 🔍 ملاحظة مهمة:

"drcode29" → "Dr Code 29" → يبدو أن المطور الأصلي **عراقي**، والشركة الرومانية هي **مظلة قانونية** فقط (مثل LLC في ولاية ديلاوير).

كل تطبيقات المطور لها طابع **عراقي**:
- الناصرية، البصرة، Dr.Quiz للأطباء العراقيين

---

## 11. نقاط أمنية ومخاوف

### ⚠️ مخاوف أمنية مكتشفة:

#### 1. **`cleartextTrafficPermitted="true"`** ⚠️ خطر
```xml
<network-security-config>
    <base-config cleartextTrafficPermitted="true"/>
</network-security-config>
```
- التطبيق يسمح بطلبات HTTP غير مشفرة (ليس HTTPS فقط)
- **خطر**: بيانات المستخدمين قابلة للاعتراض
- **التوصية**: تعطيل HTTP الصريح في الإنتاج

#### 2. **`requestLegacyExternalStorage="true"`** ⚠️
- يطلب وصولاً قديماً للتخزين الخارجي
- أمان أقل من scoped storage الحديث

#### 3. **مفاتيح API مكشوفة** ⚠️
- Firebase API Key مكشوف في APK
- Google Maps API Key مكشوف
- **التوصية**: تطبيق API Key restrictions (package name + SHA-1)

#### 4. **تناقض إقرار البيانات** 🚨
- **Play Store يقول**: "لا يجمع أي بيانات"
- **سياسة الخصوصية تقول**: يجمع الاسم، البريد، صورة، user_id، عمليات البحث، الدردشة...
- **خطر**: قد يؤدي لإيقاف التطبيق من Play Store

### ✅ نقاط إيجابية أمنية:

- يستخدم Firebase (آمن إذا كانت Security Rules صحيحة)
- يستخدم App Links مع `autoVerify`
- يستخدم `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` مع `signature` protection
- التطبيق موقّع بطريقة صحيحة (BNDLTOOL)

### 🔥 ملاحظة: التحديث 4.6.0 **لم يعالج** أي من هذه النقاط!

---

## 12. الأصول البصرية والمحتوى

### 🎨 فئات الخدمات الطبية:

- 💊 صيدلية (Pharmacy)
- 🦷 طبيب أسنان (Dentist)
- 🏥 مستشفى (Hospital)
- 👨‍⚕️ طبيب (Doctor - ذكر/أنثى)
- 🧪 مختبر (Lab)
- 👩‍⚕️ تمريض (Nursing)
- 🏥 عيادة (Clinic)
- 🦵 علاج طبيعي (Physiotherapy)
- 🏠 خدمات منزلية (Home Delivery)

### 🔤 الخطوط المستخدمة:

| الخط | الاستخدام |
|------|-----------|
| **Cairo** (Bold, Medium, Regular) | عربي رئيسي |
| **Tajawal** (Bold, Medium, Regular) | عربي ثانوي |
| **Dubai** Regular | خط دبي العربي |
| **Courgette** Regular | لاتيني مزخرف |
| **MaterialIcons** | أيقونات Material |

### 🏥 الشركاء المكتشفون:

#### 1. **7 سنابل** (7sanabil)
سلسلة مجمعات طبية بـ 10 فروع في البصرة:
- أبو الخصيب (abasia)
- الحسين (hussian)
- الجمهورية (jamhoria)
- الجزيرة (jasera)
- الكوت (kut)
- القبلة (qabla)
- القرمة (qarma)
- التنومة (tanoma)
- ياسين (yaseen)
- الزبير (zubir)

#### 2. **WECO**
شريك آخر بشاشات "ask" (8 صور)

### 📞 الأرقام الهاتفية المضمنة:

أكثر من 35+ رقم عراقي (تبدأ بـ 077):
```
07715650003, 07724146661, 07730206707
07747263335, 07748026606, 07748030511
07748030512, 07748071190, ...
```

### 🗄️ بنية قاعدة البيانات:

#### 1. **Cloud Firestore** (online)
- بيانات العيادات والأطباء
- حسابات المستخدمين
- المراجعات والتقييمات
- المواعيد
- الدردشة

#### 2. **Realtime Database** (online)
- عدّادات المشاهدات (real-time)
- إشعارات live

#### 3. **SQLite** (local)
- نسخة محلية للبيانات
- يعمل offline
- `user_version = 3` (تطور المخطط)

### 📊 إحصائيات التطبيق:

| المؤشر | القيمة |
|--------|--------|
| ملفات Lottie animations | 21 |
| ملفات SVG | 18 |
| أيقونات طبية (PNG) | 45 |
| Avatars افتراضية | 17 |
| أعلام دول | متعدد (country_code_picker) |
| الـ Plugins | 34 |
| المكتبات Dart | 332 |

---

## 13. الخلاصة والتوصيات

### 🎯 الخلاصة:

**دليل البصرة الطبي** تطبيق Flutter احترافي متوسط الحجم لربط المرضى بالعيادات والأطباء في محافظة البصرة العراقية. يستخدم:

- **Backend**: Firebase (Firestore + Realtime DB + Auth + Storage + FCM)
- **Frontend**: Flutter (Dart) بمعمارية احترافية
- **Monetization**: إعلانات AdMob + مشتريات داخلية
- **Features**: خرائط، حجوزات، تقييمات، إشعارات، دفع، دردشة، مسح QR
- **Architecture**: Riverpod + GetX + Dio + Retrofit + Freezed + Hive

### 📊 التقييم العام:

| الجانب | التقييم | الملاحظات |
|--------|---------|----------|
| **الميزات** | ⭐⭐⭐⭐⭐ | شامل جداً (34 plugin + 332 مكتبة) |
| **التصميم** | ⭐⭐⭐⭐ | احترافي، RTL ممتاز، theme أخضر طبي |
| **المعمارية** | ⭐⭐⭐⭐⭐ | best practices من Flutter |
| **الأمان** | ⭐⭐ | مشاكل cleartext + مفاتيح مكشوفة |
| **الأداء** | ⭐⭐⭐⭐ | تحسينات في 4.6.0 |
| **الصيانة** | ⭐⭐⭐⭐⭐ | مطور نشط، تحديثات منتظمة |

### 💡 توصيات للمطور:

1. ✅ **تفعيل API Key restrictions** على مفاتيح Google
2. ✅ **مراجعة Firebase Security Rules**
3. ✅ **تعطيل cleartextTrafficPermitted**
4. ✅ **استخدام scoped storage بدل legacy**
5. ✅ **توحيد إقرار البيانات** بين Play Store وسياسة الخصوصية
6. ✅ **استخدام cluster markers** على الخريطة (الـ markers متراكمة)
7. ✅ **تحويل الصور إلى WebP** لتقليل الحجم
8. ✅ **إضافة certificate pinning** للـ Firebase

### 🎓 دروس مستفادة لمشاريع مشابهة:

#### للتطبيقات الطبية/الدليل:
- استخدم **Flutter + Firebase** للسرعة في النشر
- استخدم **Realtime DB** للعدّادات الحية (مشاهدات، likes)
- **Firestore** للبيانات الأساسية
- **Google Maps + geolocator** للموقع
- **flutter_quill** للنصوص الغنية
- **rating_summary** للتقييمات الاحترافية

#### للأمان:
- لا تفعّل `cleartextTrafficPermitted`
- استخدم **certificate pinning**
- ضع **API restrictions** على كل مفاتيح Google
- اكتب **Firebase Security Rules** صارمة
- وحّد إقرار البيانات بين Play Store وسياسة الخصوصية

---

## 📂 الملفات المرفقة

```
basra_clinics_report/
├── README.md                          ← هذا الملف
└── screenshots/
    ├── 01_home.webp                   ← الشاشة الرئيسية
    ├── 02_doctors_list.webp           ← قائمة الأطباء
    ├── 03_specialties.webp            ← التخصصات
    ├── 04_doctor_profile.webp         ← ملف الطبيب
    └── 05_map.webp                    ← الخريطة
```

---

## 🛠️ أدوات التحليل المستخدمة

- **JadX 1.1.0** - فك تشفير APK وتحليل DEX
- **strings** - استخراج النصوص من binaries
- **unzip** - فك ضغط XAPK/APK
- **md5sum** - مقارنة الملفات
- **gzip/gunzip** - فك ضغط NOTICES.Z
- **diff/comm** - مقارنة النسختين
- **tree** - عرض الشجرة الهندسية
- **Google Play Store** - معلومات الإصدار الحالي
- **Developer Website** - سياسة الخصوصية وشروط الاستخدام
- **Web Search** - معلومات إضافية عن المطور

---

## 📅 معلومات التقرير

- **تاريخ التحليل**: 21 مايو 2026
- **النسخ المُحلّلة**: 3.9.0 (XAPK) + 4.6.0 (Play Store)
- **المُحلِّل**: Claude (Anthropic AI)
- **اللغة**: العربية مع مصطلحات تقنية بالإنجليزية

---

*هذا التقرير لأغراض تعليمية وبحثية فقط. كل المعلومات مستخرجة من مصادر علنية (Play Store، Developer Website، APK من APKPure) وتحليل تقني للملفات.*
