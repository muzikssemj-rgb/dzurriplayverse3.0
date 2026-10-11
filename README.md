# DZURRI PLAYVERSE

**One Creator. Infinite Worlds.** · *Play. Learn. Explore.* · 👑 **A DZURRI ORIGINAL**

Platform permainan digital milik Dzurri: web app responsif, Progressive Web App (PWA) dan Owner Console. Dibina dengan **Next.js + Firebase (Firestore) + Vercel**.

Dalam Owner Console, pemilik boleh:
- menampal pautan permainan, yang kemudian dipaparkan di halaman utama;
- memuat naik foto dan profil pencipta;
- menukar imej hero halaman utama.

Semua ini tanpa mengubah kod atau deploy semula.

---

## 1. Ciri utama

**Pemain (tanpa akaun)**
- Halaman utama:
  - Hero dengan imej pencipta;
  - kategori;
  - Featured, Popular, Game Worlds, Recently Added dan Explore All.
- Carian dan penapis mengikut nama, tag dan kategori.
- Game Launcher:
  - **Embedded**: permainan dimainkan dalam Playverse;
  - **External**: permainan dibuka di tab baharu;
  - butang Fullscreen, Reload, Open in New Tab dan Report a Broken Link.
- Kegemaran dan sejarah main disimpan pada peranti pemain.
- Halaman Creator (foto, nama, profil, moto), About, Install, Offline.
- 4 permainan terbina dalam yang boleh dimainkan luar talian: Music Quest, Quiz Arena, Rhythm Runner, Memory Match.

**Pemilik (`/admin`, kata laluan sahaja)**
- **Dashboard**: angka sebenar daripada pangkalan data dan log aktiviti.
- **Games**:
  - Add / Edit / Preview / Publish / Unpublish / Duplicate / Delete;
  - muat naik thumbnail.
- **Categories**: tambah, namakan semula, susun, padam.
- **Creator Profile**:
  - muat naik **foto anda** dan **imej hero (kartun anda)**;
  - nama, gelaran, profil dan moto.
- **Reports**: laporan pautan rosak daripada pemain.
- **Settings**: logout dan cara menukar kata laluan.

---

## 2. Langkah demi langkah: Firebase → GitHub → Vercel

### A. Firebase (lebih kurang 5 minit, pelan percuma *Spark* sudah cukup)

1. Buka <https://console.firebase.google.com> → **Create a project** → beri nama, contohnya `dzurri-playverse`. Google Analytics boleh dimatikan → **Create project**.
2. Di menu kiri, pilih **Build → Firestore Database** → **Create database**.
   - Location: **asia-southeast1 (Singapore)**.
   - Pilih **Start in production mode** → **Create**.
   - Peraturan "deny all" ini memang yang dikehendaki. Hanya server aplikasi yang mengakses Firestore.
3. Klik ikon ⚙️ → **Project settings** → tab **Service accounts** → **Generate new private key** → **Generate key**.
   - Satu fail `.json` akan dimuat turun.
   - ⚠️ **Fail ini RAHSIA.** Jangan kongsi dan jangan muat naik ke GitHub.

> Firebase **Storage tidak diperlukan**. Gambar yang dimuat naik diproses (WEBP, maksimum ±850 KB) dan disimpan terus dalam Firestore, supaya anda kekal di pelan percuma.

### B. GitHub

Muat naik isi folder projek ke repo **Private** baharu, sama ada dengan GitHub Desktop atau dengan *Add file → Upload files*.

Upload melalui laman web GitHub dihadkan kepada 100 fail sekali. Jadi muat naik dalam 2 bahagian, menggunakan folder `UPLOAD-1` dan `UPLOAD-2` yang disediakan.

### C. Vercel

1. Buka <https://vercel.com/new> → **Import** repo `dzurri-playverse`. Framework: Next.js (dikesan automatik).
2. Buka **Environment Variables** dan tambah:

   | Key | Value |
   |---|---|
   | `ADMIN_PASSWORD` | kata laluan admin anda |
   | `FIREBASE_SERVICE_ACCOUNT` | Buka fail `.json` dari langkah A3 dengan TextEdit, **⌘A → ⌘C**, kemudian tampal **seluruh** kandungannya di sini |

3. **Deploy**. Selepas siap, buka laman anda. Kali pertama laman dibuka, 8 kategori dan 4 permainan contoh dicipta secara automatik.
4. Log masuk di `https://<laman-anda>.vercel.app/admin/login`.

**Menukar kata laluan:**
1. Vercel → Settings → Environment Variables → edit `ADMIN_PASSWORD`.
2. **Deployments → ⋯ → Redeploy**.
3. Semua sesi lama terbatal secara automatik.

### D. Semak deployment (pilihan)

```bash
SITE_URL=https://<laman-anda>.vercel.app node scripts/verify-deployment.mjs
```

---

## 3. Cara menambah permainan

1. Pergi ke `/admin/login`, masukkan kata laluan, kemudian klik **＋ Add New Game**.
2. Isi **Game Title** dan tampal **Game URL** (mesti bermula dengan `https://`).
3. Tambah thumbnail (muat naik atau tampal URL), penerangan dan kategori.
4. Pilih **Embedded** atau **External**.
   - Jika laman permainan menyekat iframe, pemain akan diberi butang *Open in New Tab*.
5. Klik **Save Draft & Preview**, kemudian **Publish**. Permainan terus muncul di halaman utama.

## 4. Gambar & profil pencipta

**Admin → Creator Profile:**
- **Foto profil**: muka anda. Dipaparkan di halaman Creator, footer dan banner.
- **Imej hero**: watak kartun anda di halaman utama.
  - Cara mendapatkannya: muat naik foto anda ke ChatGPT atau Gemini dan minta *"jadikan saya watak kartun 3D gaya permainan futuristik, latar gelap neon biru-ungu"*. Kemudian muat naik hasilnya di sini.
  - Jika tiada imej hero, foto profil digunakan.
- **Nama, gelaran, profil dan moto**: dipaparkan kepada pengguna di halaman Creator.

---

## 5. Keselamatan

- Kata laluan disimpan dalam `ADMIN_PASSWORD` di Vercel. Ia tiada dalam kod, GitHub, pelayar atau pangkalan data.
- Sesi menggunakan cookie HttpOnly bertandatangan HMAC-SHA256.
  - Tamat selepas 30 minit tanpa aktiviti atau 12 jam maksimum.
  - Menukar kata laluan membatalkan semua sesi.
- Had log masuk:
  - 5 percubaan gagal setiap 15 minit bagi setiap rangkaian;
  - 30 percubaan gagal setiap 15 minit untuk semua rangkaian (melindungi daripada serangan teragih).
  - Had ini disimpan dalam Firestore.
- Semua tindakan admin disemak semula di server: proxy → halaman → Server Action / API.
- Firestore dikunci (*production mode*). Hanya server, melalui Admin SDK, boleh membaca atau menulis.
- Validasi di server (Zod):
  - URL mesti `https://`;
  - `javascript:`, `data:` dan `http:` ditolak;
  - fail muat naik disahkan melalui *magic bytes*, diproses semula ke WEBP dan metadata EXIF/GPS dibuang.
- Pengepala keselamatan: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- ⚠️ Kata laluan pendek atau mudah diteka (contohnya `dzurrihensem`) lebih mudah ditembusi walaupun ada had percubaan. Disyorkan sekurang-kurangnya 12 aksara.

## 6. PWA

- Nama **DZURRI PLAYVERSE** dan short name **DZURRI**. Mod standalone, ikon 48–512 termasuk maskable, dengan screenshots.
- Butang **Install App** dengan panduan untuk iPhone/iPad (*Share → Add to Home Screen*), Android, Chrome/Edge desktop dan macOS Safari.
- Cache:
  - halaman *network-first*;
  - aset statik cache-first;
  - `/admin` dan `/api` **tidak pernah dicache**.
- Notis "versi baharu" dipaparkan setiap kali anda deploy.
- Luar talian: halaman yang pernah dibuka dan 4 permainan terbina dalam. Permainan luaran sentiasa memerlukan internet.

## 7. Pembangunan tempatan (pilihan)

```bash
npm install
ADMIN_PASSWORD=ujian123 npm run dev   # tanpa Firebase → storan tempatan .data/
```

Perintah lain:
- `npm run lint`
- `npm run typecheck`
- `npm test` (unit)
- `npm run test:e2e` (Playwright, storan tempatan)

## 8. Ujian yang telah dijalankan

| Ujian | Keputusan |
|---|---|
| Lint, typecheck, build | ✅ |
| Unit (Vitest): validasi URL, magic bytes, polisi iframe, token sesi (palsu/tamat/tukar kata laluan), carian & susunan permainan | ✅ 33/33 |
| E2E Playwright: halaman awam, carian, launcher, laporan, kegemaran, login (salah / cookie palsu / betul), CRUD permainan penuh, kategori, muat naik imej → WEBP, **profil pencipta + foto + imej hero**, tamat sesi, Server Action tanpa sesi ditolak, had login, PWA (*Chrome installability* lulus, luar talian) | ✅ 69/69 |

**Penting:** ujian E2E dijalankan menggunakan **storan tempatan** yang menggantikan Firestore, kerana akses ke Google Cloud tidak tersedia dalam persekitaran pembangunan. Kod Firestore (`lib/db/firestore.ts`) kecil dan hanya menggunakan pertanyaan asas tanpa indeks komposit, tetapi ia **belum diuji terhadap projek Firebase sebenar**. Selepas deploy, uji log masuk, Add Game dan muat naik foto, atau jalankan `scripts/verify-deployment.mjs`.

## 9. Had

- Tiada akaun pemain. Tiada rating, notifikasi atau cadangan (sengaja, kerana tiada data sebenar).
- Paparan awam dicache sehingga 10 minit, tetapi dikemas kini **serta-merta** apabila admin menyimpan perubahan. Kiraan *Popular* mungkin lewat sehingga 10 minit.
- Imej disimpan dalam Firestore (maksimum ±850 KB setiap imej selepas pemprosesan).
- Pelan percuma Firestore: 50,000 bacaan sehari. Cache di atas mengurangkan bacaan dengan ketara.

## 10. Penyelesaian masalah

| Masalah | Penyelesaian |
|---|---|
| "Pangkalan data belum disambungkan" | `FIREBASE_SERVICE_ACCOUNT` tiada atau tidak lengkap. Tampal semula **seluruh** JSON, kemudian Redeploy. |
| "Senarai permainan tidak dapat dimuatkan" | Firestore belum dicipta (langkah A2), atau JSON daripada projek lain. |
| Login: "ADMIN_PASSWORD belum ditetapkan" | Tambah `ADMIN_PASSWORD` di Vercel, kemudian Redeploy. |
| "Terlalu banyak percubaan" | Tunggu 15 minit. |
| Permainan embedded kosong | Laman sumber menyekat iframe. Pilih **External**. |

© Dzurri. All rights reserved.
