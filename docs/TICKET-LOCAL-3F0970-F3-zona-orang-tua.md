# TICKET LOCAL-3F0970 — F3: Zona Orang Tua + Parent Gate + Soft Cap + Backup

> Lanjutan dari F1 & F2. F3 menambah alat monitoring & pengelolaan progres anak untuk orang tua.

| Field | Nilai |
|---|---|
| Key | `LOCAL-3F0970` (lokal, belum di-sync ke Jira) |
| Judul | Zona Orang Tua, Parent Gate, Batas Waktu Harian, Laporan Skill, Backup/Restore, Soft Cap |
| Tipe / Prioritas | Story / High |
| Status | **Done** (implementasi, tes, build, dan QA browser otomatis lulus) |
| Repo | `/Users/macbookpro/projects/games-buat-anak` |
| Basis | Plan §11 F3, "Parent Zone" di plan v0.3 |

## 0. Ringkas

| Area | Status |
|---|---|
| Parent gate (tahan dua tombol sampai penuh, soal 2 digit) | ✅ |
| Zona Orang Tua (laporan, setting, backup, reset, about) | ✅ |
| Batas waktu harian soft cap di peta | ✅ |
| Per-skill mastery & laporan per profil | ✅ |
| Unit test + build + `npm run verify` | ✅ |
| QA browser otomatis | ✅ |
| Audio rekaman lengkap | ⏳ Butuh aset klip, ditunda |
| Notifikasi lokal native | ⏳ F5 (Capacitor) |

## 1. Fitur di Zona Orang Tua

- **Parent gate:** tahan dua tombol sampai penuh (boleh bergantian), lalu jawab angka `7–9 + 7–9`.
- **Laporan per profil:** menit minggu ini, jumlah sesi, persentase `completedNaturally`, dan daftar skill yang perlu dibantu (mastery < 0.6 setelah ≥ 3 percobaan).
- **Batas waktu harian:** pilih 10/15/20/30 menit. Soft cap di peta: Kiko menguap & mengajak istirahat, bab tetap bisa dimainkan.
- **Pengaturan:** suara & narator, musik latar, pengingat harian. Musik & pengingat lokal baru aktif di F5.
- **Backup/restore JSON:** export & import file; file rusak ditolak tanpa menimpa save yang ada.
- **Reset progres:** dengan konfirmasi; setting orang tua dipertahankan.
- **Info aplikasi:** versi & catatan update manual.

## 2. Soft cap harian

Di `MapScreen`, `minutesUsedToday(save, Date.now()) >= settings.dailyLimitMin` menampilkan banner
"Kiko mengantuk" + tombol **Istirahat** (menuju layar penutup). Bab tidak diblokir paksa.

## 3. File & state

| File | Perubahan |
|---|---|
| `src/state/report.ts` | **Baru.** Laporan orang tua (pure functions). |
| `src/state/saveModel.ts` | `applySettings`, `resetProgressInSave`, `serializeSaveFile`, `parseImportedSave`. |
| `src/components/ParentGate.tsx` | **Baru.** Parent gate. |
| `src/screens/ParentZoneScreen.tsx` | **Baru.** UI Zona Orang Tua. |
| `src/screens/StartScreen.tsx` | Tombol "Orang tua" + Parent Gate. |
| `src/screens/MapScreen.tsx` | Rest banner soft cap. |
| `src/state/GameProvider.tsx` | `screen: 'parent'`, `openParentZone`, `updateSettings`, `restoreSave`, `resetProgress`. |
| `src/App.tsx` | Render `ParentZoneScreen`. |
| `src/styles.css` | Stile parent zone, parent gate, rest banner, tombol, toggle. |
| `src/state/report.test.ts`, `src/state/saveModel.test.ts` | Test laporan, backup, setting, reset. |

## 4. Verifikasi

| Tanggal | Perintah | Hasil | Catatan |
|---|---|---|---|
| 2026-11-21 | `npm install` | lulus | `vite-plugin-pwa` & dependency F0 terpasang |
| 2026-11-21 | `npm test` | lulus | 7 file, 37 test |
| 2026-11-21 | `npm run build` | lulus | Vite + PWA build sukses |
| 2026-11-21 | `npm run verify` | lulus | lint → audit offline → audit kontras → test → build |
| 2026-11-21 | QA browser otomatis (Chrome DevTools Protocol) | lulus | 4 bab selesai; Parent Gate + Zona Orang Tua; laporan skill 100%; backup/restore tampil; batas waktu berubah 20; progres utuh |
| 2026-11-21 | Offline PWA smoke (preview + SW + mode offline) | lulus | App tetap tampil saat `navigator.onLine=false`; semua resource dari host lokal |

## 5. Checklist QA (lulus 2026-11-21)

- [x] 1. `npm run dev`, buat profil, main 4 bab (hitung, tambah, kurang, bandingkan), selesaikan.
- [x] 2. Peta menampilkan banner "Kiko mengantuk" saat pemakaian 30 menit > batas 15 menit.
- [x] 3. Parent Gate dari Start: tahan dua tombol & jawab soal → masuk Zona Orang Tua; laporan & setting tampil.
- [x] 4. Ganti batas waktu ke 20 menit → tersimpan di save, progres tetap utuh.
- [x] 5. Refresh di peta: autosave, profil, dan laporan tetap utuh.

## 6. Sisa pekerjaan

- [ ] Audio rekaman penuh (instruksi & angka) — butuh aset klip; Web Speech API tetap fallback.
- [ ] Musik latar & pengingat lokal native — menunggu Capacitor/F5.
- [ ] QA di device fisik Android — bagian dari F5.

> Daftar sisa pekerjaan lintas fase (prioritas P0–P2): [`BACKLOG.md`](./BACKLOG.md).

---

**Ringkas:** F3 selesai di web. Orang tua bisa masuk lewat parent gate, membaca laporan, mengatur batas waktu, backup/restore, dan reset progres. Soft cap harian berjalan tanpa memblokir anak.
