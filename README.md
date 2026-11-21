# Petualangan Angka

Game hitung-hitungan untuk anak 5–8 tahun. Android, offline-first, tanpa iklan, tanpa akun, dengan akhir permainan yang jelas.

- **Plan lengkap:** [`docs/PLAN-game-hitung-anak.md`](docs/PLAN-game-hitung-anak.md)
- **Signing & keystore runbook:** [`docs/KEYSTORE-RELEASE.md`](docs/KEYSTORE-RELEASE.md)

---

## ▶️ Menjalankan (dev)

```bash
npm install
npm run dev            # Vite dev server
npm test               # Vitest: logika game + port platform
npm run build          # generate ikon + tsc --noEmit + vite build (service worker ikut dibuat)
npm run preview        # cek hasil build produksi
npm run lint           # ESLint 9 (flat config)
npm run audit:offline  # gate: gagal kalau ada URL/CDN/fetch eksternal
npm run audit:contrast # gate: semua pasangan warna ≥ 4.5:1
npm run verify         # lint + audit + test + build (persis yang dijalankan CI)
```

Tidak ada network request saat runtime: font **Baloo 2** dan **Nunito** di-self-host lewat `@fontsource`
(di-bundle Vite, tanpa Google Fonts), ilustrasi berupa SVG inline, SFX disintesis lewat Web Audio, ikon
di-generate (bukan file biner di repo), dan soal digenerate prosedural dari seed lokal.
Gate-nya: `npm run audit:offline` (nol URL/CDN/fetch eksternal) + `npm run audit:contrast` (semua pasangan
warna ≥ 4.5:1).

---

## 🧱 F0 — Fondasi offline-first

Fondasi yang sudah ada di repo (tiket `LOCAL-1F77E9`):

- **Stack:** Vite 5 + React 18 + TypeScript + Tailwind 3 (preflight dimatikan, utility tetap aktif).
  Framer Motion, Zustand, dan Howler sudah terpasang tetapi **belum dipakai runtime** — animasi masih CSS,
  state masih React Context, audio masih disintesis. Audio klip/musik menunggu aset rekaman.
- **Design token** satu sumber di `src/design/tokens.css` (dicerminkan ke `tailwind.config.js`), dengan
  tipografi self-hosted + perbaikan kontras di `src/design/overrides.css` (dimuat paling akhir).
- **`src/platform/`** = port SaveStore, audio SFX, haptic, orientasi, speech, dan PWA. Logika game tidak
  menyentuh API browser langsung, jadi Capacitor (F5) tinggal menukar implementasi.
- **PWA offline-first:** manifest + service worker precache-all (nol CDN, nol Google Fonts, nol request
  jaringan saat runtime); ikon PNG di-generate oleh `scripts/generate-icons.mjs`.
- **Tooling & gate:** ESLint 9 + Prettier, `npm run audit:offline`, `npm run audit:contrast`, dan
  `.github/workflows/ci.yml` yang menjalankan lint → audit offline → audit kontras → test → build.

Detail, keputusan teknis, dan checklist verifikasi: [`docs/TICKET-LOCAL-1F77E9-F0-offline-first.md`](docs/TICKET-LOCAL-1F77E9-F0-offline-first.md).

---

## 🍎 F1 — Mode "Hitung Buah" (vertical slice)

Alur yang sudah jalan end-to-end:

```
Layar Mulai (pilih profil) → Peta Pulau → 10 soal Hitung 1–10 → Layar Hadiah → Layar Penutup
```

- **Hitungan tap-per-objek:** setiap ketukan menyebut angkanya (`satu, dua, tiga, …`) dan memberi badge angka.
  Butuh bantuan? Tombol **"Hitung bareng Kiko"** menyorot objek satu-satu sambil bersuara.
- **Pilihan jawaban besar** (maks 4, target ≥ 64 px), semua interaksi tap — tidak ada drag.
- **Audio instruksi** per soal via Web Speech API `id-ID` (fallback sementara; klip rekaman menyusul di F3),
  plus tombol **Dengar** untuk mengulang. **Tombol mute selalu terlihat** dan preferensinya tersimpan.
- **Umpan balik:** benar → bintang muncul ≤ 800 ms lalu berhenti & lanjut otomatis; salah → getar halus
  (bukan layar merah) lalu soal yang sama bisa dicoba lagi. Bantuan 3 tahap: (1) dorong menghitung,
  (2) hitung bersama otomatis, (3) jawaban ditunjukkan + soal serupa diulang.
- **State sesi** dicatat ke save file: `sessions[].completedNaturally` = `true` hanya kalau bab tuntas
  (bukan keluar di tengah), ditambah `completedChapters`, `collection`, `skillProgress`, `dailyUsage`, dan
  `activeRun` untuk resume.
- **Tahan refresh:** autosave setiap soal dijawab. Refresh di tengah bab → lanjut di soal yang sama;
  refresh setelah bab selesai → bab tetap bertanda selesai dan kartu tetap di koleksi (localStorage + backup).

### Checklist verifikasi manual

1. `npm run dev`, buat profil, masuk peta, mulai "Hitung Buah".
2. Ketuk buah satu-satu → angka keluar berurutan; selesaikan 10 soal.
3. Jawab salah sekali → getar halus, lalu coba lagi (soal tidak pindah).
4. Selesaikan bab → layar hadiah (kartu + bintang) → tombol Selesai → "Sampai jumpa besok".
5. Refresh di tengah bab → kembali ke soal yang sama. Refresh di peta → bab tetap "Selesai" + kartu ada.
6. Mute di semua layar → refresh → status mute dan progres tidak berubah.
7. Console harus bersih (tanpa error/warning React).

---

## 🍊 F2 — Tambah, Kurang & Bandingkan

Peta Pulau sekarang punya 4 bab yang terbuka bertahap:

```
Bab 1 Hitung Buah  →  Bab 2 Tambah Buah  →  Bab 3 Kurang Buah  →  Bab 4 Mana Lebih Banyak
```

- **Tambah/kurang dalam 10:** dua kelompok buah (`3 + 2`) atau buah yang ditandai sudah dimakan
  (`5 − 2`). Anak tetap bisa mengetuk buah satu-satu untuk menghitung.
- **Bandingkan:** dua keranjang buah besar; anak mengetuk keranjang yang lebih banyak. Angka
  keranjang baru muncul saat bantuan tahap 2.
- **Adaptive:** tingkat kesulitan dipilih dari `mastery` skill tersimpan — mudah (<0.5), sedang
  (0.5–0.79), sulit (≥0.8). Mastery dicatat per mode (`count-1-10`, `add-within-10`,
  `sub-within-10`, `compare-within-10`).
- **Bantuan 3 tahap** berlaku untuk semua mode: dorongan → hitung bersama Kiko → jawaban ditandai
  + soal serupa diulang sekali.
- **Resume aman:** `activeRun` menyimpan `difficulty`, jadi refresh di tengah bab mengembalikan soal
  dan tingkat kesulitan yang sama. Save lama (sebelum F2) tetap terbaca.

Detail & checklist QA: [`docs/TICKET-LOCAL-3F0970-F2-tambah-kurang-banding.md`](docs/TICKET-LOCAL-3F0970-F2-tambah-kurang-banding.md).

---

## 👩‍👦 F3 — Zona Orang Tua, Batas Waktu & Backup

Orang tua bisa memantau & mengelola progres anak dari **Zona Orang Tua**:

```
Start → Parent Gate (tahan 2 tombol + soal) → Zona Orang Tua
```

- **Parent Gate:** tahan dua tombol sampai penuh, lalu jawab angka `7–9 + 7–9`. Anak tidak akan masuk tanpa sengaja.
- **Laporan per profil:** menit minggu ini, sesi, persentase selesai natural, dan daftar skill yang perlu dibantu.
- **Batas waktu harian:** 10/15/20/30 menit. Saat cap tercapai, Kiko menguap & ajak istirahat — bab tetap bisa dimainkan.
- **Backup & restore JSON:** ekspor progres ke file, simpan sendiri, pulihkan dari file lagi.
- **Reset progres:** dengan konfirmasi; setting orang tua tetap.

Detail & checklist QA: [`docs/TICKET-LOCAL-3F0970-F3-zona-orang-tua.md`](docs/TICKET-LOCAL-3F0970-F3-zona-orang-tua.md).

---

## 🔒 Identitas build — DIBEKUKAN (JANGAN PERNAHKAN GANTI)

Android menolak update APK kalau `applicationId` atau keystore berubah. Kalau itu terjadi, orang tua harus **uninstall** dulu → **seluruh progres anak hilang dan tidak bisa dikembalikan**.

| Item | Nilai | Aturan |
|---|---|---|
| `applicationId` | **`id.petualanganangka.app`** | **FROZEN.** Jangan pernah ganti setelah APK pertama dibagikan. |
| Keystore file | `petualanganangka-release.jks` (root repo, tidak di-commit) | **FROZEN.** Wajib dibackup di 2 lokasi terpisah. |
| `keyAlias` | **`petualanganangka`** | **FROZEN.** Sama seperti keystore. |
| Algoritma | RSA 2048, PKCS12 | — |
| Tanggal pembuatan keystore | **2026-11-21** (isi tanggal asli setelah generate) | — |
| Validitas | **10.000 hari (± 27 tahun)** → kedaluwarsa ± April 2054 | cukup, tidak perlu diperpanjang |
| `versionCode` | 1, 2, 3, … | **naik di setiap rilis** |
| `versionName` | 1.0.0, 1.0.1, … | bebas |

> **Jangan pernah ganti `applicationId`, file keystore, atau alias.** Satu perubahan = update ditolak = progres anak harus dihapus. Nilai ini juga dijaga otomatis: `android/signing.gradle` menggagalkan release build kalau `keyAlias`/keystore tidak sesuai.

### Rahasia yang tidak boleh masuk git

```
*.jks
*.keystore
keystore.properties
```

Sudah ada di `.gitignore`. Konfigurasi signing dibaca dari `android/keystore.properties` (lokal, dari password manager), dengan template `android/keystore.properties.example` yang aman di-commit.

### Checklist sekali di awal proyek

1. `bash scripts/create-release-keystore.sh` → menghasilkan `petualanganangka-release.jks`.
2. Backup `.jks` + password ke **2 lokasi terpisah** (password manager + cloud pribadi/offline), lalu uji restore.
3. `cp android/keystore.properties.example android/keystore.properties` dan isi password.
4. `bash scripts/check-secrets-not-committed.sh` → harus lulus sebelum commit/push.
5. Build release hanya lewat `android/signing.gradle` (release build gagal kalau keystore tidak ada).

Detail langkah, sidik jari, dan prosedur pemulihan: [`docs/KEYSTORE-RELEASE.md`](docs/KEYSTORE-RELEASE.md).

---

## Struktur repo saat ini

```
src/
  main.tsx                        entry (React root, font @fontsource, registrasi SW)
  App.tsx                         shell + pemilihan layar + tombol mute global
  styles.css                      kelas komponen layar, animasi sekali-jalan, reduced-motion
  design/
    tokens.css                    token warna/radius/spacing/tipografi + @tailwind directives
    overrides.css                 tipografi self-hosted + perbaikan kontras (dimuat paling akhir)
  app/version.ts                  APP_VERSION
  game/
    chapters.ts                   definisi pulau & bab (4 bab, unlock progresif)
    counting.ts                   generator soal Hitung 1–10 (deterministik dari seed)
    questions.ts                  generator 4 mode + adaptive difficulty + opsi jawaban
    rng.ts                        RNG mulberry32
    session.ts                    state machine bab (answer/retry/advance, serialisasi activeRun)
  state/
    GameProvider.tsx              alur layar, audio, autosave, finalisasi sesi
    progress.ts                   terapkan hasil sesi ke save file
    report.ts                     laporan orang tua (skill, menit, completedNaturally)
    saveModel.ts                  schema + migrasi/sanitasi + backup/restore save file
  platform/
    saveStore.ts                  abstraksi storage (localStorage web, nanti Capacitor)
    speech.ts                     narator Web Speech API id-ID (fallback sampai klip audio ada)
    audio.ts                      port SFX — Web Audio sintesis, tanpa file & tanpa network
    haptic.ts                     port getar (Vibration API sekarang, Haptics native di F5)
    orientation.ts                port orientasi layar (lock best-effort, no-throw)
    pwa.ts                        registrasi service worker (precache-all)
    index.ts                      fasad `platform` + `setSoundEnabled()` (satu sakelar audio)
  components/                     Mascot, FruitSvg, MuteButton, ProgressDots, ParentGate
  screens/                        Start, Map, Play, Reward, End, ParentZone
docs/
  PLAN-game-hitung-anak.md        plan produk & arsitektur
  BACKLOG.md                      daftar sisa pekerjaan + prioritas P0–P2
  KEYSTORE-RELEASE.md             runbook signing/keystore (frozen identity)
  TICKET-LOCAL-1F77E9-F0-offline-first.md
  TICKET-LOCAL-3F0970-F1-hitung-buah.md
  TICKET-LOCAL-3F0970-F2-tambah-kurang-banding.md
  TICKET-LOCAL-3F0970-F3-zona-orang-tua.md
android/
  signing.gradle                  signing config release (baca keystore.properties)
  keystore.properties.example     template kredensial signing (aman di-commit)
scripts/
  create-release-keystore.sh      generate keystore (sekali saja)
  check-secrets-not-committed.sh  guard: git bersih dari keystore/password
  generate-icons.mjs              ikon PNG placeholder ditulis manual (tanpa dependency)
  audit-offline.mjs               gate: nol URL/CDN/fetch eksternal, SW wajib precache
  check-contrast.mjs              gate: semua pasangan token ≥ 4.5:1
.github/
  workflows/ci.yml                lint → audit offline → audit kontras → test → build → audit dist
```

## Verifikasi

```bash
npm run verify   # lint + audit offline + audit kontras + test + build
```

Status 2026-11-21: `npm run verify` lulus (37 test, 22 pasangan kontras), QA browser otomatis lulus
untuk 4 bab + Parent Gate/Zona Orang Tua, dan offline PWA smoke lulus.

**Sisa pekerjaan:** lihat [`docs/BACKLOG.md`](docs/BACKLOG.md) — playtest F4, Capacitor/APK F5,
keystore, audio rekaman, musik/pengingat lokal, dan QA device fisik.
