# Plan: Game Hitung-Hitungan untuk Anak

**Nama kerja:** _Petualangan Angka_ (working title)
**Versi plan:** 0.3 — revisi: **Android saja + distribusi via APK (sideload)**
**Target rilis MVP:** ±3,5 minggu (1 orang developer, part-time)

> **Perubahan di v0.3**
> 1. **Android saja dulu.** iOS dikeluarkan dari scope v1 dan dipindah ke backlog fase 2. Efeknya: fase F5 lebih pendek, dan biaya Apple Developer ($99/tahun) + risiko review App Store kategori anak hilang dari jalur kritis.
> 2. **APK sideload jadi jalur distribusi utama**, bukan Play Store. Artinya: Play Console ($25) dan review store **tidak** jadi penghalang rilis. Kita bisa rilis ke keluarga/sekolah sendiri minggu ini juga.
> 3. Konsekuensinya muncul pekerjaan baru yang tidak ada di v0.2: **signing keystore, versionCode, checksum, panduan install untuk orang tua, dan mekanisme update manual**. Ini bagian paling rawan karena satu kesalahan bisa membuat anak **kehilangan seluruh progres** (§9.3).
> 4. Play Store dipindah ke **fase 2 (opsional)** — kalau nanti mau jangkauan lebih luas.
>
> Perubahan dari v0.2: offline-first sebagai constraint arsitektur, app mobile (Capacitor).

---

## 1. Latar Belakang & Tujuan

Anak-anak (5–8 tahun) sering terpapar game kasual yang dirancang untuk menahan perhatian selama mungkin: reward acak, streak yang bikin cemas, iklan, dan tidak ada titik berhenti yang natural. Efeknya bukan cuma waktu layar, tapi juga berkurangnya toleransi terhadap aktivitas yang "lambat" seperti belajar.

**Tujuan produk ini bukan "game yang lebih seru", tapi game yang:**
1. Melatih kemampuan hitung (berhitung, tambah, kurang, membandingkan).
2. Menarik secara visual & audio, sehingga anak mau memainkannya.
3. Punya **akhir yang jelas** — anak berhenti karena ceritanya selesai, bukan karena bosan atau dilarang.
4. Memberi orang tua alat kontrol yang jujur (bukan dark pattern).
5. **Bisa dimainkan di mana saja tanpa internet** — di mobil, di pesawat, saat kuota habis. Ini juga bagian dari desain sehat: tidak ada iklan, tidak ada notifikasi push dari server, tidak ada konten yang tiba-tiba berubah di belakang layar.

**Non-goal (v1):** iOS, multiplayer, leaderboard online, iklan, in-app purchase, akun cloud, sinkronisasi antar-perangkat, auto-update via store.

---

## 2. Target Pengguna & Perangkat

| Persona | Kebutuhan |
|---|---|
| **Anak 5–6 th (pra-sekolah)** | Belum lancar membaca, motorik tap masih kasar, butuh objek visual konkret (bukan simbol abstrak) |
| **Anak 7–8 th (SD awal)** | Sudah bisa baca angka, siap simbol `+`/`−`, butuh tantangan bertingkat agar tidak bosan |
| **Orang tua** | Ingin tahu progres anak, bisa membatasi waktu, tanpa drama saat menyuruh berhenti. **Juga harus bisa memasang & meng-update app sendiri tanpa developer.** |

**Perangkat (v1):**
- **Satu-satunya target: HP/tablet Android**, dipasang sebagai **APK** (langsung dari file), landscape 1024×768 dan portrait 360×800.
- **Minimum:** Android 8.0 (API 26). Target `compileSdk`/`targetSdk` 35.
- **Prioritas uji:** HP kelas menengah bawah (RAM 3GB) — perangkat anak sering hand-me-down. Android System WebView versi lama adalah variabel paling nyata di sini.
- **Kenapa Android saja:** APK bisa dibagikan lewat WhatsApp/Drive tanpa akun developer, tanpa biaya, tanpa review. Untuk validasi produk, ini jalur tercepat. iOS dan Play Store menyusul setelah terbukti dipakai.

---

## 3. Prinsip Desain "Anti-Adiktif"

Ini yang membedakan produk kita. Setiap keputusan desain harus lolos tes 6 prinsip ini:

| # | Prinsip | Implementasi konkret |
|---|---|---|
| 1 | **Natural stopping point** | Game dibagi per "bab" (chapter) berisi 10 soal. Setelah bab selesai ada layar penutup: "Kamu dapat kartu baru! Sampai jumpa besok 🌙" — tanpa tombol "lanjut terus" yang menggoda. |
| 2 | **Tanpa loss aversion** | Tidak ada nyawa, tidak ada streak yang bisa hangus, tidak ada timer mundur untuk soal. Salah = diberi bantuan, bukan dihukum. |
| 3 | **Reward terprediksi** | Hadiah (kartu hewan) didapat setelah 1 bab selesai — bukan acak (no loot box / gacha), karena variable reward adalah mesin utama adiksi. |
| 4 | **Tidak ada notifikasi agresif** | Maksimal 1 pengingat/hari, hanya jika diaktifkan orang tua. Default: mati. **Tanpa push notification dari server** — pengingat dijadwalkan lokal oleh perangkat. |
| 5 | **Sesi pendek & dibatasi** | Soft cap 15 menit/hari. Saat tercapai, maskot menguap dan mengajak istirahat — bukan pop-up "waktu habis" yang bikin anak tantrum. |
| 6 | **Belajar terukur > waktu layar** | Metrik utama: akurasi & mastery skill, **bukan** durasi main. Kita tidak mengoptimasi DAU. |

Prinsip ke-7 yang muncul dari keputusan offline: **tidak ada konten yang berubah di belakang layar.** Apa yang diinstal hari ini adalah apa yang dimainkan anak — tidak ada event musiman mendadak, tidak ada A/B test yang mengubah pengalaman anak tanpa sepengetahuan orang tua.

Prinsip ke-8 dari keputusan APK: **tidak ada update paksa.** Anak tidak akan pernah tiba-tiba dapat layar "memperbarui..." atau fitur baru di tengah cerita. Update sepenuhnya keputusan orang tua.

---

## 4. Konsep Game

**Tema:** pulau kecil penuh hewan lucu. Anak membantu maskot **Kiko (rubah kecil)** mengumpulkan "bintang angka" untuk menyalakan mercusuar supaya hewan-hewan pulang ke sarangnya.

**Core loop (per bab ±3–5 menit):**

```
Peta Pulau → Pilih Titik → 10 soal interaktif → Kartu hewan + 1 bintang → Layar penutup bab
```

**Struktur progres:** 3 pulau × 4 bab = 12 bab untuk v1 (≈ 60–80 menit konten inti, bisa diulang dengan soal teracak).

**Maskot sebagai guru:** Kiko bereaksi — senang saat benar, menggaruk kepala saat salah, lalu **mendemonstrasikan** cara menghitung dengan animasi objek. Maskot bukan hanya dekorasi; dia media scaffolding.

---

## 5. Kurikulum Matematika (v1)

Urutan skill diambil dari perkembangan numerasi anak (konkret → abstrak):

| Level | Skill | Contoh soal | Representasi |
|---|---|---|---|
| 1 | Membilang 1–10 | "Ada berapa apel?" | Tap objek satu-satu (suara "satu, dua, tiga...") |
| 2 | Subitizing 1–5 | "Berapa banyak tanpa menghitung?" | Pola dadu/jari |
| 3 | Membandingkan | "Mana yang lebih banyak?" | Dua keranjang visual |
| 4 | Tambah dalam 10 | "3 apel + 2 apel = ?" | Objek dulu → baru simbol `3 + 2 = ?` |
| 5 | Kurang dalam 10 | "5 apel dimakan 2, sisa?" | Animasi objek hilang |
| 6 | Number bond | "4 + ? = 7" | Rumah angka / anak tangga |
| 7 | Tambah/kurang dalam 20 | (fase 2) | Garis bilangan |

Aturan pedagogis yang wajib dipegang:
- **Setiap soal punya 3 tahap bantuan** bila anak salah: (1) sorot objek, (2) hitung bersama dengan suara, (3) jawaban ditunjukkan + soal serupa diulang nanti. Tidak pernah langsung pindah soal tanpa pemahaman.
- **Jangan campur skill baru dengan skill yang belum mastery** (>80% akurasi dalam 3 sesi terakhir).
- **Pilihan jawaban maksimal 4**, jarak antar tombol ≥ 64px.

---

## 6. Desain Visual

Tujuannya "menarik" tanpa jadi stimulasi berlebih. Aturan: **banyak ruang kosong, satu fokus per layar, animasi memandu perhatian (bukan menghibur diri sendiri).**

### Palet warna (mode terang, ramah anak, kontras cukup)

| Peran | Hex | Catatan |
|---|---|---|
| Latar | `#FFF8E7` | krem hangat, tidak menyilaukan |
| Primer | `#FFB703` | kuning madu — tombol utama |
| Sekunder | `#06D6A0` | mint — jawaban benar / progres |
| Aksen | `#EF476F` | pink — maskot & highlight |
| Info | `#118AB2` | biru — elemen peta/air |
| Teks | `#2B2D42` | navy gelap, kontras ≥ 7:1 |

Semua pasangan warna wajib dicek kontras WCAG AA (≥4.5:1).

### Tipografi
- **Display/angka:** Baloo 2 (bulat, playful, angka jelas, ada `1` dengan kait — penting agar tidak tertukar dengan `7`).
- **Body:** Nunito.
- Ukuran minimum: teks UI 20px, angka soal 64–96px. Anak pra-sekolah tidak membaca label kecil.
- **Font wajib di-bundle lokal** (`@fontsource/baloo-2`, `@fontsource/nunito`), **bukan** dari Google Fonts CDN. Alasan: CDN butuh internet, dan request ke server luar bertentangan dengan klaim "tanpa data keluar perangkat".

### Elemen visual
- Gaya: flat illustration dengan outline tebal, sudut membulat (radius 24px), sedikit tekstur kertas.
- Aset: SVG (bukan PNG) agar tajam di semua resolusi, ±25 ilustrasi awal (8 hewan, 6 buah, 4 elemen lingkungan, Kiko dengan 6 ekspresi).
- Animasi: Framer Motion, durasi 200–400ms, easing lembut (`ease-out`), **tanpa** gerakan berulang tanpa henti di area baca (hindari attention hijacking).
- Efek benar: konfeti kecil + bintang muncul (≤800ms) lalu berhenti. Efek salah: tombol bergetar halus, bukan layar merah.

### Kekhususan app Android
- **Lock orientasi landscape** saat di layar soal (bisa diubah orang tua), portrait untuk peta & menu.
- **Safe area insets** (notch, gesture bar) — padding konten tidak boleh ketutup.
- **Cegah salah keluar:** tombol back Android di layar soal memunculkan dialog "Mau berhenti dulu?" (bukan langsung keluar); di peta, back dua kali untuk keluar.
- **Matikan** text selection, long-press context menu, pinch-zoom, dan double-tap zoom agar tap anak tidak memicu zoom tak sengaja. Tambah `viewport-fit=cover`, `user-scalable=no`, `overscroll-behavior: none`.
- Splash screen & app icon yang lucu (bagian dari daya tarik, bukan sekadar teknis) — termasuk **adaptive icon** Android (foreground + background layer) supaya tidak terlihat kotak putih di launcher modern.

---

## 7. Audio

- Musik latar 1 track loop lembut (ukulele/marimba), volume default 40%.
- SFX: tap, benar (variasi 3 nada naik), salah (1 nada rendah lembut, tidak "buzzer"), bintang, kartu baru.
- **Suara narator bahasa Indonesia** untuk instruksi soal (penting untuk anak yang belum bisa baca). v1: rekam 30–40 klip pendek, atau pakai Web Speech API sebagai fallback.
- Tombol mute selalu terlihat di pojok.
- **Semua audio di-bundle di dalam APK** (bukan streaming). Format: Opus/`.webm` (WebView Android modern mendukung). Target total < 8MB.
- Musik berhenti otomatis saat app ke background / ada telepon masuk, dan resume lagi setelahnya (via `@capacitor/app` `appStateChange`).

---

## 8. Alur Layar

```
[Layar Mulai]  → pilih profil anak (avatar + nama)
      ↓
[Peta Pulau]   → 3 pulau, titik bab yang terbuka, kartu koleksi
      ↓
[Layar Soal]   → prompt audio+teks, area soal visual, 2–4 pilihan jawaban,
                  progres bab (10 titik), tombol bantuan
      ↓ (bab selesai)
[Layar Hadiah] → animasi kartu hewan + bintang, tombol "Selesai" (utama)
      ↓
[Layar Penutup]→ "Sampai jumpa besok" — titik berhenti natural
```

**Zona Orang Tua** (diakses via parent gate: tahan 2 tombol + soal hitung 2 digit):
- Laporan: akurasi per skill, skill yang perlu dibantu, total menit minggu ini.
- Batas waktu harian (10/15/20/30 menit).
- Toggle musik, suara, pengingat harian.
- **Backup & restore progres** (export/import file JSON) — penting karena semua data lokal, dan karena **update APK tidak selalu mulus** (§9.3).
- **Info versi app + cara update** — satu layar berisi nomor versi dan tautan/QR ke halaman rilis.
- Reset progres.

---

## 9. Tech Stack & Arsitektur

### 9.1 Satu codebase, dua jalur distribusi (Android)

Keputusan arsitektur paling penting: **jangan tulis app native terpisah.** Semua logika game ditulis sekali sebagai web app, lalu dibungkus Capacitor.

```
        ┌──────────────────────────────┐
        │  React + TS (satu codebase)  │
        └───────────────┬──────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
[PWA di browser]                 [Android APK]
untuk dev & demo cepat           Capacitor 7 → jalur rilis v1
gratis, tanpa install            sideload (file APK)
```

| Jalur | Kelebihan | Kekurangan | Peran di v1 |
|---|---|---|---|
| **APK sideload** (Capacitor) | Tanpa biaya, tanpa review store, aset ter-bundle → offline 100% dari instal pertama, bisa hapus izin INTERNET, ikon & splash proper | Parent harus install manual (aktifkan "Install unknown apps"), Play Protect muncul peringatan, **update manual** | **Jalur utama rilis v1** |
| **PWA** | Gratis, update instan, tanpa install | iOS sering hapus data PWA; offline tidak sekuat native; tidak ada ikon proper | Untuk development, demo ke orang tua, dan fallback |
| ~~Play Store~~ | Update otomatis, kepercayaan lebih tinggi | $25, review beberapa hari, butuh Data Safety + target audience | **Fase 2 (opsional)** |

**Rencana jangka panjang:** rilis APK dulu → kalau dipakai rutin oleh ≥20 keluarga, baru masuk Play Store (ticket LOCAL-821AF8, prioritas Low).

### 9.2 Offline-first: aturan mainnya

Offline **bukan** "tambahkan service worker di akhir". Ini constraint yang mengikat setiap keputusan teknis:

| Aturan | Konsekuensi teknis |
|---|---|
| **Tidak ada network request saat runtime.** Nol. | Tidak ada CDN (font, icon, JS, CSS semua bundle), tidak ada Google Fonts, tidak ada analytics, tidak ada remote config, tidak ada gambar dari URL. |
| **Semua aset masuk build** | SVG + font + audio + JSON konten di-import lewat Vite, jadi ikut build artifact. Audio via `import url from './x.webm?url'`. |
| **Service worker = hanya untuk jalur web** | `vite-plugin-pwa` mode `precache all`. Di APK tidak dipakai karena aset sudah lokal, tapi tetap di-build supaya PWA aman. |
| **Tidak ada fetch ke server untuk soal** | Seluruh bank soal & kurikulum di-generate prosedural dari seed lokal (deterministik), bukan diambil dari API. |
| **Izin `INTERNET` dihapus dari manifest** | App secara teknis tidak bisa mengirim data anak. Nilai jual privasi yang bisa diverifikasi. |
| **Uji offline sebagai test case** | Playwright: `context.setOffline(true)` → alur bab penuh harus lulus. Setelah APK terpasang: **mode pesawat + cabut WiFi/data, main 1 bab penuh.** |

**Ukuran target:** APK universal < 35MB (batas keras 50MB di CI). Capacitor base APK ±4MB, sisanya aset — audio dikompresi dulu kalau melebihi.

### 9.3 Rilis APK: signing, distribusi, dan update

Ini bagian yang **paling mudah merusak pengalaman orang tua**, jadi ditulis eksplisit.

#### Identitas build yang DIBEKUKAN setelah build pertama dibagikan

Tiga hal ini tidak boleh berubah selamanya. Kalau berubah, Android akan menolak update dan orang tua harus uninstall dulu → **progres anak hilang**.

| Item | Nilai | Aturan |
|---|---|---|
| `applicationId` | `id.petualanganangka.app` | **Frozen.** Jangan ganti setelah rilis pertama. |
| **Keystore signing** | file `.jks` + password | **Frozen & wajib dibackup di 2 tempat.** Hilang = tidak bisa update selamanya, harus terbit app "baru". |
| `versionCode` | integer naik terus | Naik di setiap rilis (1, 2, 3…). `versionName` bebas (1.0.0, 1.0.1). |

**Manajemen keystore (non-negotiable):**
- `keystore.properties` dan `*.jks` masuk `.gitignore` — **tidak pernah** ke commit.
- Password disimpan di password manager **dan** catatan offline terpisah.
- File `.jks` dibackup di 2 lokasi berbeda (mis. password manager attachment + cloud pribadi).
- Konfigurasi signing dibaca dari `keystore.properties` (bukan hardcode di `build.gradle`).

```gradle
// android/app/build.gradle
def keystoreProps = new Properties()
keystoreProps.load(new FileInputStream(rootProject.file("keystore.properties")))

android {
    defaultConfig {
        applicationId "id.petualanganangka.app"
        versionCode 1        // NAIKKAN setiap rilis
        versionName "1.0.0"
        minSdk 26
        targetSdk 35
    }
    signingConfigs {
        release {
            storeFile file(keystoreProps['storeFile'])
            storePassword keystoreProps['storePassword']
            keyAlias keystoreProps['keyAlias']
            keyPassword keystoreProps['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false   // Capacitor + WebView: biarkan false dulu demi stabilitas
            debuggable false
        }
    }
}
```

#### Konfigurasi manifest Android

- **Hapus** `<uses-permission android:name="android.permission.INTERNET"/>`.
- `android:screenOrientation` diatur runtime via plugin, tulis `unspecified` di manifest.
- `android:usesCleartextTraffic="false"`, `android:allowBackup="true"` (biar Android auto-backup membantu), `android:hardwareAccelerated="true"`.
- `android:configChanges="orientation|screenSize|keyboardHidden"` — cegah WebView reload saat rotasi (reload = kehilangan state sesi).
- Simpan semua di `android/app/src/main/AndroidManifest.xml`, **di-commit ke git** (folder `android/` di-commit, kecuali `build/`, `.gradle/`, `keystore.properties`, `*.jks`).

#### Proses build & distribusi

```bash
npm run build                      # Vite → dist/
npx cap sync android               # copy dist/ ke android/
cd android && ./gradlew assembleRelease
# hasil: android/app/build/outputs/apk/release/app-release.apk
shasum -a 256 app-release.apk      # catat checksum
```

**Distribusi: GitHub Releases** (repo publik khusus rilis, atau private + link langsung).
- Setiap rilis: tag `v1.0.0`, lampirkan `app-release.apk` + `SHA256.txt` + catatan rilis bahasa manusia ("soal tambah sekarang ada 2 level baru").
- APK juga bisa dibagikan langsung via WhatsApp (mode dokumen, limit 100MB) atau Google Drive untuk keluarga terdekat.

**Panduan install untuk orang tua (1 halaman, bahasa awam):**
1. Unduh `app-release.apk`.
2. Buka file → Android menanyakan "Install unknown apps" → izinkan untuk aplikasi itu saja (bukan global).
3. Play Protect mungkin muncul "app tidak dikenal" → pilih "Install anyway". Ini normal untuk app di luar Play Store.
4. Buka **Petualangan Angka** → ikon Kiko muncul di home screen.
5. Kalau ada peringatan "app berbahaya", itu karena belum ada di Play Store — bukan virus. Checksum tersedia untuk verifikasi.

#### Alur update (kritis — ini titik data hilang)

```
Orang tua unduh APK versi baru (v1.0.1)
   → tap → Android memasang MENIMPA app lama (signature + applicationId sama)
   → data lama tetap utuh → app dibuka → migrasi schemaVersion dijalankan
```

Aturan pendukung:
- **`schemaVersion` di save file wajib ada dari v1.0.0**, plus fungsi migrasi per versi, dites dengan fixture file save lama.
- **Backup otomatis `save.bak.json` sebelum migrasi**; kalau migrasi gagal, app menampilkan "progres tidak bisa dibaca, mau restore backup?" — jangan crash ke layar kosong.
- Di Zona Orang Tua: tombol **"Backup dulu sebelum update"** yang mengekspor JSON ke folder Download/Share sheet.
- **Tidak ada pengecekan update otomatis** (bertentangan dengan nol-network). Update sepenuhnya manual & disengaja orang tua. Nomor versi ditampilkan di Zona Orang Tua supaya orang tua tahu versi apa yang terpasang.

### 9.4 Mobile app (Capacitor)

Alasan memilih Capacitor dibanding React Native / Flutter: **kita tidak perlu menulis ulang apa pun.** Codebase React/Vite yang sama di-serve dari folder `dist/` di dalam WebView native.

```
Vite + React 18 + TypeScript
Tailwind CSS        → styling + design token
Framer Motion       → animasi
Zustand             → state (profil, sesi, progres)
Howler.js           → audio
Vitest + Playwright → unit test logika soal, smoke test alur + offline test
Capacitor 7         → wrapper Android (APK)
```

Plugin native Android yang dipakai (semua opsional kecuali yang ditandai):
- `@capacitor/core` + `@capacitor/cli` + `@capacitor/android` — **wajib**
- `@capacitor/app` — **wajib** (handle tombol back Android, pause audio saat background)
- `@capacitor/splash-screen`, `@capacitor/status-bar` — **wajib** (rasa "app beneran")
- `@capacitor/screen-orientation` — lock landscape di layar soal
- `@capacitor/filesystem` + `@capacitor/share` — simpan progres + export backup JSON
- `@capacitor/haptics` — getaran halus saat jawaban benar (feedback taktil, murah secara stimulasi)
- `@capacitor/local-notifications` — pengingat harian opsional, dijadwalkan lokal (butuh izin notifikasi; default mati, jadi minta izin hanya saat orang tua mengaktifkan)
- `@capacitor-community/keep-awake` — layar tidak mati saat anak membaca soal

Yang **tidak** dipakai: push notification, analytics SDK, ad SDK, crash reporter yang kirim data, `@capacitor/browser` (tidak ada tautan keluar).

### 9.5 Penyimpanan progres (harus tahan-hapus)

Data anak adalah satu-satunya hal yang tidak bisa diregenerasi. Tanpa cloud, storage lokal jadi titik rapuh — dan di APK, update manual menambah satu risiko lagi.

| Lapisan | Teknologi | Isi |
|---|---|---|
| **Utama** | `@capacitor/filesystem` → satu file `save.json` di `Directory.Data` | Semua profil, progres skill, kartu koleksi, setting |
| **Fallback web/PWA** | IndexedDB via `idb-keyval` | Sama |
| **Cache cepat** | `@capacitor/preferences` | Snapshot terakhir, load instan saat cold start |
| **Jaring pengaman** | Tulis atomik (`save.tmp` → rename) + `save.bak.json` sebelum migrasi | Cegah korupsi kalau app mati saat menyimpan |
| **Manual** | Tombol "Backup ke file" di Zona Orang Tua | File JSON bisa disimpan ke Drive/WhatsApp sendiri |

Autosave setelah **setiap soal dijawab** (bukan hanya di akhir bab) — anak yang keluar di tengah bab tidak kehilangan progres. Ditambah flush saat `appStateChange` → background.

Akses storage dibungkus interface `SaveStore` supaya implementasi web dan native bisa ditukar tanpa menyentuh logika game:

```ts
interface SaveStore {
  load(): Promise<SaveFile | null>;
  save(data: SaveFile): Promise<void>;
  exportToFile(): Promise<void>;   // native: share sheet, web: download
  importFromFile(): Promise<void>;
  migrate(raw: unknown): SaveFile; // wajib, dipanggil saat schemaVersion lama
}
```

### 9.6 Struktur folder (usulan)

```
src/
  app/            App shell, routing, theme provider
  game/
    engine/       generator soal, aturan bantuan, adaptive logic
    skills/       definisi skill & kurikulum
    modes/        CountingGame, AddSubGame, CompareGame
  components/     Tombol, KartuSoal, Maskot, ProgresBab, Konfeti
  screens/        Start, Map, Play, Reward, End, ParentZone
  state/          store profil, store sesi, store progres
  platform/       abstraksi SaveStore, audio, haptic, orientation (web vs native)
  assets/         svg, audio, fonts  ← SEMUA di-bundle, tidak ada yang remote
capacitor.config.ts
android/          di-commit (kecuali build/, .gradle/, keystore.properties, *.jks)
.github/workflows/release-apk.yml   (opsional, fase 2)
```

### 9.7 Model data (lokal)

```ts
type Profile = { id, name, avatarId, ageGroup: '5-6' | '7-8', createdAt };

type SkillProgress = {
  skillId: string;
  mastery: number;         // 0..1, rolling average akurasi
  attempts: number;
  lastPracticedAt: number;
  commonMistakes: string[];// mis. 'off-by-one', 'operand-swap'
};

type Session = {
  id, profileId, startedAt, endedAt,
  chapterId, itemsAnswered, correctCount, hintsUsed, completedNaturally: boolean
};

type SaveFile = {
  schemaVersion: number;   // wajib, untuk migrasi saat update app
  appVersion: string;      // versi yang menulis file ini (untuk diagnosa)
  profiles: Profile[];
  skillProgress: Record<string, SkillProgress[]>;
  collection: string[];    // kartu hewan yang sudah didapat
  settings: { dailyLimitMin, musicOn, sfxOn, reminderOn, orientationLock };
  dailyUsage: Record<string /* yyyy-mm-dd */, number /* detik */>;
  sessions: Session[];
};
```

`completedNaturally` dipakai untuk metrik "apakah anak berhenti karena bab selesai" — indikator desain yang sehat.
`schemaVersion` + `appVersion` wajib ada dari awal: app offline berarti update datang tanpa migrasi server, jadi kode harus bisa membaca save lama.

---

## 10. Aksesibilitas

- Target tap ≥ 64×64 px; tidak ada drag-and-drop wajib (motorik kasar).
- Semua soal punya versi audio.
- Dukungan `prefers-reduced-motion` → matikan konfeti/animasi besar.
- Mode kontras tinggi & opsi font lebih besar.
- Tidak ada mekanik berbasis warna saja (selalu ada bentuk/ikon pembeda).
- Orientasi: landscape utama, portrait tetap jalan (layout responsif).
- Offline juga aksesibilitas: anak di daerah sinyal lemah tetap bisa belajar.

---

## 11. Roadmap

| Fase | Durasi | Deliverable | Definisi selesai |
|---|---|---|---|
| **F0 — Fondasi + offline-first** ✅ | 3 hari | Repo, Vite+React+TS+Tailwind, design token, **font & audio self-hosted**, PWA shell precache, struktur `src/platform/` | **Selesai**: `npm run verify` lulus; offline PWA smoke lulus. Detail: `docs/TICKET-LOCAL-1F77E9-F0-offline-first.md` |
| **F1 — Vertical slice** ✅ | 5 hari | 1 mode (Menghitung 1–10) end-to-end: peta → 10 soal → hadiah → penutup | **Selesai**: 1 bab penuh, audio & animasi, progres tersimpan. Detail: `docs/TICKET-LOCAL-3F0970-F1-hitung-buah.md` |
| **F2 — Konten inti** ✅ | 5 hari | Mode Tambah/Kurang + Bandingkan, generator soal, adaptive + 3 tahap bantuan | **Selesai 2026-11-21**: 4 mode stabil, kesulitan menyesuaikan mastery. Detail: `docs/TICKET-LOCAL-3F0970-F2-tambah-kurang-banding.md` |
| **F3 — Polish & orang tua** ✅ | 4 hari | Zona Orang Tua + parent gate, batas waktu, laporan per skill, backup/restore, soft cap harian | **Selesai 2026-11-21**: orang tua bisa set limit, baca laporan, export progres. Audio rekaman belum (butuh aset klip). Detail: `docs/TICKET-LOCAL-3F0970-F3-zona-orang-tua.md` |
| **F4 — Validasi** | 3 hari | Playtest 3 anak (2 sesi × 15 menit), observasi + perbaikan | Semua temuan P0/P1 diperbaiki, akurasi rata-rata ≥70% |
| **F5 — APK Android & distribusi** | 4 hari | Capacitor init, plugin native, ikon/splash adaptive, back button, keystore + release signing, build APK, GitHub Release, panduan install/update | APK terpasang dari link di **2 device fisik**, jalan penuh di mode pesawat, dan **update v1.0.1 menimpa v1.0.0 tanpa kehilangan progres** |

Total ±24 hari kerja (turun dari 25 karena iOS & Play Store keluar dari jalur kritis).

**Status per 2026-11-21:** F0 ✅, F1 ✅, F2 ✅, F3 ✅. F4 (validasi playtest) berikutnya, lalu F5 APK.

**Sisa lintas fase:** audio rekaman (butuh aset klip) dan Capacitor/APK release (F5).
**Daftar rinci & prioritas:** [`docs/BACKLOG.md`](./BACKLOG.md).

**Rincian F5 (4 hari):**
1. Capacitor init + `cap sync`, build debug APK, pasang di device fisik. Hapus izin INTERNET.
2. Perilaku native: back button, orientasi, splash, status bar, haptic, pause audio di background, `configChanges`. Uji offline penuh.
3. Keystore release + signing, `versionCode` 1, adaptive icon, ukuran APK, checksum.
4. GitHub Release v1.0.0 + panduan install orang tua + **uji alur update v1.0.0 → v1.0.1 dengan data utuh**.

**Kenapa F5 di akhir, bukan di awal?** Risiko terbesar ada di *game-nya* (apakah anak suka dan benar-benar belajar), bukan di packaging. Tapi ada pengecualian: `src/platform/` disiapkan di F0 agar tak perlu refactor, dan **audit "tidak ada network call" dilakukan di F0 lalu dijaga tiap fase** — jauh lebih murah daripada membongkar CDN di akhir.

**Jalur cepat kalau butuh dipakai keluarga minggu ini:** F0–F4 di web (buka di Chrome HP, "Add to Home screen") → rilis APK di F5. Progres bisa dipindah via backup JSON.

---

## 12. Metrik Keberhasilan

Fokus pada pembelajaran, bukan keterikatan:

| Metrik | Target v1 |
|---|---|
| Akurasi soal per skill | naik ≥15% dari sesi 1 ke sesi 5 |
| Waktu per soal | turun ≥20% setelah 3 bab |
| `completedNaturally` | ≥80% sesi berakhir di layar penutup bab |
| Pemanfaatan bantuan | turun seiring mastery (tanda anak makin mandiri) |
| Durasi sesi | konsisten di bawah batas yang diset orang tua |
| Retensi 7 hari (oleh orang tua) | ≥40% — cukup, tidak perlu maksimal |
| **Crash-free sessions** | ≥99% (diukur manual dari playtest, tanpa SDK) |
| **Ukuran APK** | < 35MB (batas keras 50MB) |
| **Update tanpa kehilangan data** | 100% — diuji tiap rilis |

**Anti-metrik** (sengaja tidak dioptimasi): DAU/MAU maksimal, panjang sesi, jumlah sesi per hari, jumlah notifikasi yang diklik, jumlah install.

---

## 13. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Terlalu banyak animasi → anak overstimulasi, malah susah fokus | Aturan "satu fokus per layar", review animasi di F3, uji `reduced-motion` |
| Anak pra-sekolah tidak paham instruksi | Semua instruksi ber-audio, ikon besar, demonstrasi maskot |
| Audio autoplay diblokir WebView | Wajib interaksi pertama (tombol "Mulai") sebelum audio aktif |
| Anak bosan karena tidak ada variasi | Kartu koleksi + 3 tema pulau; variasi dari konteks, bukan dari randomness |
| Orang tua minta fitur kompetitif ("biar semangat") | Tawarkan progres personal (badge pribadi), tolak leaderboard publik |
| Scope creep ke bahasa/ipa, atau ke iOS | Kunci v1 ke matematika + Android; iOS/Play Store sudah ada ticket backlog sendiri |
| **Keystore hilang / ke-commit ke git** | `.gitignore` sejak commit pertama, backup 2 lokasi, password di password manager. Kerugiannya: tidak bisa update app selamanya |
| **`applicationId` atau keystore berubah → update gagal** | DibeKukan di §9.3, ditulis di README, dicek di checklist rilis |
| **Update APK menghapus progres anak** | Autosave per soal + `save.bak.json` sebelum migrasi + `schemaVersion` + fungsi migrasi dites dengan fixture; tombol "Backup dulu sebelum update" |
| **Play Protect memblokir / orang tua takut "app tidak dikenal"** | Panduan install bergambar, checksum SHA-256, penjelasan bahasa awam, dan opsi Play Store di fase 2 kalau jangkauan membesar |
| **Orang tua stuck di versi lama** (tidak ada auto-update) | Nomor versi tampil di Zona Orang Tua, catatan rilis bahasa manusia, pengingat halus 1x per bulan (bukan pop-up mengganggu) |
| **HP lama / WebView usang** | `minSdk 26`, uji di 1 device low-end fisik, hindari API browser baru tanpa polyfill |
| **APK membengkak** | Budget ukuran di CI (gagal build kalau > 50MB), audio Opus, SVG dioptimasi (svgo) |
| **Progres hilang karena clear data / ganti HP** | Backup manual JSON di Zona Orang Tua + `allowBackup=true` untuk Android auto-backup |

---

## 14. Langkah Berikutnya

1. **Keputusan yang sudah final (v0.3):**
   - ✅ Offline wajib — constraint arsitektur, bukan fitur.
   - ✅ Android saja, distribusi via **APK sideload**.
   - ✅ Play Store & iOS → backlog fase 2.
   - ✅ Fokus usia: 5–8 tahun; pra-sekolah memakai representasi visual, usia 7–8 mulai simbol `+`/`−`.
2. **F0–F3 sudah selesai dan terverifikasi.** Berikutnya F4 (playtest) lalu F5 (APK).
3. **Buat keystore release sekarang** (sebelum build pertama dibagikan) dan backup 2 lokasi.
4. Siapkan aset audio: 1 track musik + klip narator (masih kurang).
5. Jadwalkan playtest dengan 3 anak di F4.
6. Kerjakan F5: Capacitor, signing, APK, GitHub Release, panduan install/update.

Daftar rinci sisa pekerjaan beserta prioritas P0–P2 ada di [`BACKLOG.md`](./BACKLOG.md).
