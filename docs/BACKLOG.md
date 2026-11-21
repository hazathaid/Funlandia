# Backlog — Sisa Pekerjaan

**Update terakhir:** 2026-11-21
**Status:** F0–F3 selesai dan terverifikasi. Sisa pekerjaan ada di bawah.

Legenda prioritas:
- **P0** = blocker rilis APK/validasi produk.
- **P1** = penting, tapi tidak menghalangi build web saat ini.
- **P2** = pembersihan / peningkatan opsional.

## Ringkasan

| # | Item | Prioritas | Status | Referensi |
|---|---|---|---|---|
| 1 | Playtest 3 anak (F4) | P0 | Belum | Plan §11 F4 |
| 2 | Capacitor + APK release (F5) | P0 | Belum | Plan §11 F5 |
| 3 | Keystore release + backup 2 lokasi | P0 | Belum | `docs/KEYSTORE-RELEASE.md` |
| 4 | Audio rekaman (instruksi, angka, operator) | P0 | Belum — butuh aset | F1 B4, F2 §5, F3 §6 |
| 5 | Uji APK di 2 device fisik + mode pesawat | P0 | Belum (setelah #2) | Plan §11 F5 |
| 6 | Uji update APK v1.0.0 → v1.0.1 tanpa kehilangan progres | P0 | Belum (setelah #2–#3) | Plan §9.3 |
| 7 | Musik latar + pengingat lokal native | P1 | Belum | Plan §7, F3 §6 |
| 8 | QA manual backup/restore file (download + upload) | P1 | Belum | F3 §3 |
| 9 | QA Parent Gate di layar sentuh fisik | P1 | Belum | F3 §1 |
| 10 | Lighthouse PWA audit | P1 | Belum | F0 §4.2 |
| 11 | Audit dependency dev (9 advisories) | P2 | Runtime 0 vuln | `npm audit --omit=dev` |
| 12 | Warning ESLint (4) + dependency belum dipakai | P2 | Belum | `npm run lint` |
| 13 | Mode kontras tinggi / font lebih besar | P2 | Belum | Plan §10 |

## Detail

### 1. F4 — Validasi playtest (P0)

- 3 anak, 2 sesi × 15 menit.
- Catat: akurasi per skill, soal yang paling sering salah, reaksi saat salah/bantuan, apakah anak berhenti natural.
- Perbaiki semua temuan P0/P1.
- Target: akurasi rata-rata ≥ 70%.
- Belum ada file tiket lokal; buat saat mulai F4.

### 2. F5 — Capacitor + APK (P0)

- Tambah `@capacitor/core`, `cli`, `android`, dan plugin native sesuai plan §9.4.
- `capacitor.config.ts`, `npx cap add android`, `cap sync`.
- Hapus izin `INTERNET`; `android:allowBackup="true"`, `configChanges` orientasi, `usesCleartextTraffic="false"`.
- Back button Android → dialog "Mau berhenti dulu?" di layar soal.
- Splash, status bar, orientasi, haptic, pause audio saat background, adaptive icon.
- Build APK release, ukuran < 35 MB (batas keras 50 MB).
- GitHub Release + panduan install orang tua + checksum SHA-256.

### 3. Keystore release (P0)

- `bash scripts/create-release-keystore.sh` (sekali saja).
- Isi `android/keystore.properties` dari password manager.
- Catat sidik jari SHA-256/SHA-1 di `docs/KEYSTORE-RELEASE.md` §3.
- Backup `.jks` + password ke 2 lokasi terpisah; uji restore.
- Build release hanya lewat `android/signing.gradle`; verifikasi `apksigner`.
- Saat ini **belum ada** `petualanganangka-release.jks`.

### 4. Audio rekaman (P0)

- Rekam klip: instruksi tiap mode, angka 1–10, "tambah", "kurang", "sama dengan", pujian.
- Ganti implementasi `speak()`/`speakNumber()` di `src/platform/speech.ts` tanpa mengubah antarmuka.
- Web Speech tetap fallback kalau klip tidak tersedia.
- Bundle semua audio di app (tanpa network); target total < 8 MB.

### 5. Uji device fisik (P0, setelah F5)

- 2 device Android (minimal 1 kelas menengah bawah, RAM 3 GB, WebView lama).
- Main 1 bab penuh dalam mode pesawat (WiFi/data mati).
- Cek safe area, orientasi, tombol back, audio saat telepon masuk/background.

### 6. Uji update APK (P0, setelah #2–#3)

- Install v1.0.0 → main 1 bab → install v1.0.1 (`versionCode` naik, signature sama).
- Progres harus utuh; migrasi `schemaVersion` berjalan; backup otomatis sebelum migrasi.

### 7. Musik latar + pengingat lokal (P1)

- 1 track loop lembut (target < 8 MB total audio), volume default 40%.
- Pause saat background / telepon masuk (via `@capacitor/app`).
- Pengingat harian lokal, default mati, minta izin hanya saat orang tua mengaktifkan.
- Toggle di Zona Orang Tua sudah ada dan tersimpan, tetapi belum menjadwalkan apa pun.

### 8. QA manual backup/restore file (P1)

- Uji tombol **Backup ke file** benar-benar mengunduh JSON.
- Uji **Restore dari file** menimpa save dengan benar dan menolak JSON rusak.
- Unit test `serializeSaveFile`/`parseImportedSave` sudah ada; yang belum adalah uji UI + file nyata.

### 9. QA Parent Gate di layar sentuh fisik (P1)

- Parent Gate otomatis sudah lulus lewat pointer event, tetapi belum dicoba dengan dua jari di HP/tablet.
- Pastikan menahan dua tombol bersamaan atau bergantian tetap nyaman.

### 10. Lighthouse PWA (P1)

- Jalankan pada build produksi (`npm run preview`).
- Cek **Installable** + **Works offline**; offline smoke otomatis sudah lulus.

### 11. Dependency dev (P2)

- `npm install` melaporkan 9 advisories (6 moderate, 1 high, 2 critical) — semuanya dependency **dev**.
- `npm audit --omit=dev` → **0 vulnerabilities**.
- Evaluasi `npm audit` sebelum rilis; jangan `audit fix --force` tanpa cek breaking change.

### 12. Warning ESLint & dependency belum dipakai (P2)

- 4 warning: 2 `react-refresh/only-export-components`, 2 `react-hooks/exhaustive-deps`.
- `framer-motion`, `zustand`, `howler` terpasang tetapi belum dipakai runtime.
- Pakai saat menambah transisi/musik/state kompleks, atau hapus kalau tidak jadi dipakai.

### 13. Aksesibilitas lanjutan (P2)

- `prefers-reduced-motion` sudah didukung.
- Belum ada mode kontras tinggi dan opsi font lebih besar (plan §10).

## Sudah selesai (jangan dikerjakan ulang)

- **F0:** offline-first, font self-hosted, PWA precache-all, audit offline/kontras, platform port.
- **F1:** Hitung Buah end-to-end, tap-per-objek, mute persisten, retry soal, resume.
- **F2:** Tambah/Kurang/Bandingkan, 4 bab progresif, adaptive difficulty, bantuan 3 tahap.
- **F3:** Parent Gate, Zona Orang Tua, laporan skill, batas waktu soft cap, backup/restore JSON, reset.

**Verifikasi terakhir:** `npm run verify` lulus (37 test), 22/22 kontras, audit offline lulus,
QA browser otomatis 4 bab + Zona Orang Tua lulus, offline PWA smoke lulus.
