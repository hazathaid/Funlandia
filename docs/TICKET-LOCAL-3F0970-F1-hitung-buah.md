# TICKET LOCAL-3F0970 — F1: Mode "Hitung Buah" + alur bab lengkap

> **SATU-SATUNYA file tiket untuk F1.** Semua konteks, status, dan sisa pekerjaan ada di sini.
> Model yang melanjutkan **tidak perlu** membaca `docs/PLAN-game-hitung-anak.md` (30 halaman) — cukup file ini.

| Field | Nilai |
|---|---|
| Key | `LOCAL-3F0970` (lokal, belum di-sync ke Jira) |
| Judul | F1: Mode "Hitung Buah" + alur bab lengkap |
| Tipe / Prioritas | Story / High |
| Status | **Done** (implementasi, tes otomatis, dan QA browser lulus) |
| Vertical slice | Layar Mulai → Peta Pulau → 10 soal Hitung 1–10 → Hadiah → "Sampai jumpa besok" |
| Repo | `/Users/macbookpro/projects/games-buat-anak` |

> **Lanjutan:** F2 (mode Tambah/Kurang/Bandingkan + adaptive) sudah selesai pada 2026-11-21,
> lalu F3 (Zona Orang Tua + Parent Gate + Soft Cap) menyusul pada 2026-11-21.
> Detail: [`TICKET-LOCAL-3F0970-F2-tambah-kurang-banding.md`](./TICKET-LOCAL-3F0970-F2-tambah-kurang-banding.md),
> [`TICKET-LOCAL-3F0970-F3-zona-orang-tua.md`](./TICKET-LOCAL-3F0970-F3-zona-orang-tua.md).

## 0. Legenda & status ringkas

- `[x]` = **sudah ditulis di kode** (file-nya ada di repo).
- `[ ]` = **belum** / belum diverifikasi. Ini yang perlu dikerjakan.
- ⚠️ = **belum pernah dijalankan** — tidak ada `node_modules` di workspace, jadi `npm test`/`npm run build` belum pernah dieksekusi. Jangan anggap "hijau" sebelum dijalankan.

| Area | Status | Keterangan |
|---|---|---|
| Entry point + UI shell | ✅ `[x]` | sebelumnya `src/main.tsx` **tidak ada** (app tidak bisa jalan) — sudah dibuat |
| 5 layar (Start/Map/Play/Reward/End) | ✅ `[x]` | semua komponen ada |
| Mode counting (tap-per-objek + suara) | ✅ `[x]` | plus "Hitung bareng Kiko" |
| Audio + tombol mute selalu terlihat | ✅ `[x]` | Web Speech API `id-ID`, preferensi tersimpan |
| Animasi benar ≤800ms, salah getar halus | ✅ `[x]` | 750ms / 650ms sekali-jalan |
| State sesi + `completedNaturally` | ✅ `[x]` | `sessions[]`, `completedChapters`, `activeRun` |
| Bugfix soal terkunci setelah salah | ✅ `[x]` | `retry()` di `game/session.ts` |
| Unit test ditulis | ✅ `[x]` | 3 file test |
| **Test dijalankan (`npm test`)** | ✅ `[x]` | 12 test lulus |
| **Build (`npm run build`)** | ✅ `[x]` | `tsc --noEmit` + `vite build` lulus |
| **QA manual 8 langkah** | ✅ `[x]` | browser QA lulus (lihat §7) |
| Audio rekaman (bukan TTS) | `[ ]` | belum; butuh aset klip. Web Speech tetap fallback. Bukan blocker F1. |
| Capacitor/APK release | `[ ]` | F5, di luar scope F1 |

## 1. Definisi selesai (DoD)

1. Satu bab bisa diselesaikan end-to-end tanpa bug.
2. Tidak ada error/warning di console.
3. Progres tersimpan setelah refresh (di tengah bab **dan** setelah bab selesai).

Status DoD: **#1, #2, dan #3 sudah dibuktikan** lewat tes otomatis dan QA browser.

## 2. Spesifikasi yang harus benar

### 2.1 Alur layar (tidak boleh putus)
```
StartScreen (buat/pilih profil)
  → MapScreen (bab 1 terbuka, 3 bab terkunci, koleksi kartu)
  → PlayScreen (10 soal menghitung 1–10)
  → RewardScreen (kartu + bintang)
  → EndScreen ("Sampai jumpa besok 🌙", tanpa tombol "main terus")
```

### 2.2 Mode counting
- Soal: `Ada berapa <buah>?` — jumlah 1–10 muncul tepat sekali per bab (deterministik dari seed).
- Anak **mengetuk objek satu per satu**; tiap ketukan menampilkan badge angka + menyebut angkanya (`satu, dua, tiga, …`).
- Mengetuk objek yang sama = mengulang angkanya, **bukan** membatalkan hitungan (anti dobel-hitung via ref).
- Setelah itu pilih jumlah dari tombol jawaban (3–4 pilihan, pengecoh ±1/±2/±3).
- Bantuan 3 tahap: (1) dorongan teks, (2) tombol "Hitung bareng Kiko" menyorot objek berurutan, (3) jawaban benar ditandai "Ini jawabannya" + soal serupa dijadwalkan ulang sekali.

### 2.3 Interaksi anak 5 tahun
- Semua **tap**, tidak ada drag wajib.
- Target tap besar (≥64px), teks besar, kontras tinggi.
- Tidak ada input teks bebas, tidak ada countdown/menekan waktu.
- Keluar bab harus lewat dialog "Mau berhenti dulu?" (bukan langsung tendang keluar).

### 2.4 Audio
- Instruksi tiap soal dibacakan otomatis (Web Speech API `id-ID`, rate 0.85) + tombol **Dengar** untuk mengulang.
- **Tombol mute selalu terlihat** (di-render di shell `App.tsx`, juga tampil di atas dialog).
- Status mute tersimpan di `save.settings.sfxOn` dan dipulihkan saat boot.
- Audio tidak boleh membuat game crash (semua `speechSynthesis` dibungkus `try/catch`).

### 2.5 Umpan balik & animasi
- Benar: bintang muncul **750ms** lalu berhenti (animasi sekali-jalan) → auto lanjut soal berikutnya.
- Salah: **getar halus** (shake) 650ms, bukan layar merah, lalu soal yang **sama** bisa dicoba lagi.
- `prefers-reduced-motion` dihormati.

### 2.6 State sesi & persistensi
- Save file `localStorage` key `petualangan-angka.save.v1` (+ `.bak`, `.tmp`, `.corrupt`), `schemaVersion: 1`.
- Dicatat saat bab selesai: `sessions[]` (id, startedAt, endedAt, chapterId, itemsAnswered, correctCount, hintsUsed, **completedNaturally**), `skillProgress`, `collection`, `completedChapters`, `dailyUsage`.
- `completedNaturally: true` **hanya** kalau 10 soal tuntas; `false` kalau anak keluar di tengah (sudah ada `attempts > 0`).
- Autosave setiap soal dijawab → `activeRun` (resume) diisi; dikosongkan saat bab selesai/keluar.
- Refresh di tengah bab → `GameProvider` boot membaca `activeRun` dan langsung membuka soal yang sama (ketukan di-reset, bantuan di-reset ke tahap 0).
- Refresh setelah bab selesai → bab tetap "Selesai" + kartu tetap di koleksi.

## 3. Peta file & status

| File | Isi | Status |
|---|---|---|
| `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json` | Vite + React + TS + Vitest | `[x]` |
| `src/main.tsx` | entry React root (**sebelumnya hilang → app blank**) | `[x]` |
| `src/App.tsx` | shell + pemilihan layar + `<MuteButton />` global | `[x]` |
| `src/styles.css` | design token plan §6, target ≥64px, animasi sekali-jalan, reduced-motion, anti zoom/select | `[x]` |
| `src/app/version.ts` | `APP_VERSION` | `[x]` |
| `src/game/chapters.ts` | Pulau Buah, bab 1 terbuka + 3 terkunci, kartu | `[x]` |
| `src/game/counting.ts` | generator soal 1–10 deterministik, pengecoh masuk akal | `[x]` |
| `src/game/rng.ts` | mulberry32 + shuffle | `[x]` |
| `src/game/session.ts` | state machine bab: `answer` / **`retry`** / `advance`, serialisasi `activeRun` | `[x]` |
| `src/state/GameProvider.tsx` | alur layar, tap tracking, audio, autosave, finalisasi `completedNaturally` | `[x]` |
| `src/state/progress.ts` | terapkan hasil sesi ke save file (session log, mastery, kartu, usage) | `[x]` |
| `src/state/saveModel.ts` | schema + migrasi/sanitasi save (tahan save korup) | `[x]` |
| `src/platform/saveStore.ts` | abstraksi storage + backup + tulis atomik | `[x]` |
| `src/platform/speech.ts` | narator Web Speech `id-ID` (fallback F1) | `[x]` |
| `src/components/*` | `Mascot` (4 ekspresi), `FruitSvg` (6 buah SVG inline), `MuteButton`, `ProgressDots` | `[x]` |
| `src/screens/StartScreen.tsx` | buat/pilih profil (nama, avatar, umur) | `[x]` |
| `src/screens/MapScreen.tsx` | peta bab + koleksi kartu | `[x]` |
| `src/screens/PlayScreen.tsx` | board soal, hitung bareng, shake, burst, dialog berhenti | `[x]` |
| `src/screens/RewardScreen.tsx` | kartu + bintang | `[x]` |
| `src/screens/EndScreen.tsx` | "Sampai jumpa besok" | `[x]` |
| `src/game/session.test.ts`, `src/game/counting.test.ts`, `src/state/progress.test.ts` | unit test | `[x]` ditulis |
| `README.md` | cara run + checklist manual F1 | `[x]` |
| `node_modules/` | dependensi terpasang | `[x]` terpasang |
| `android/`, `scripts/` | signing/keystore (tiket lain: `LOCAL-8707E4`) | `[x]` terpisah |

## 4. Yang sudah selesai (detail)

- [x] UI layer dari nol: `main.tsx`, `App.tsx`, `styles.css` — sebelumnya app **tidak bisa boot** karena `index.html` menunjuk `src/main.tsx` yang tidak ada.
- [x] 5 layar lengkap sesuai alur + shell mute global.
- [x] Counting: tap-per-objek disertai suara angka + badge; anti dobel-hitung (ref + state).
- [x] Bantuan 3 tahap + tombol "Hitung bareng Kiko" (highlight berurutan).
- [x] Audio instruksi per soal, tombol **Dengar**, tombol **mute selalu terlihat**, preferensi persisten.
- [x] Umpan balik: benar 750ms auto-lanjut; salah getar halus 650ms lalu `retry()` soal yang sama; tidak ada layar merah.
- [x] **Bugfix**: `game/session.ts` sebelumnya mengunci soal setelah satu jawaban salah (`answer()` menolak saat `feedback !== 'none'`). Ditambahkan `retry()`.
- [x] Bantuan tahap 3 + requeue soal serupa (sekali) tanpa mereset `hintStage`.
- [x] State sesi lengkap termasuk `completedNaturally: true/false`.
- [x] Persistensi: autosave per soal, resume `activeRun` setelah refresh, backup + migrasi save.
- [x] Unit test: `retry`, bantuan tahap 3 + requeue, round-trip `activeRun`, `completedNaturally`, migrasi save.
- [x] README diperbarui (cara run + checklist verifikasi).

## 5. Sisa pekerjaan (kerjakan berurutan)

### B1 — Pasang dependensi & jalankan verifikasi otomatis ⚠️ BLOCKER
- [x] `npm install`
- [x] `npm test` → 3 file test lulus (`game/session`, `game/counting`, `state/progress`).
- [x] `npm run build` → `tsc --noEmit` + `vite build` tanpa error TS.
- [x] Jika ada error TS/test gagal: tidak ada error, tidak ada patch minimal yang diperlukan.

Catatan: kalau `npm install` tidak bisa (offline), tulis di tiket bahwa verifikasi belum dilakukan — **jangan** tandai selesai.

### B2 — QA manual (bukti DoD #2 & #3)
- [x] Jalankan `npm run dev`, lakukan 8 langkah di §6 di browser.
- [x] Cek DevTools Console: tidak ada error/warning React terlihat selama alur; tidak ditemukan bug pada refresh dan jawaban salah.
- [x] Catat hasil (lulus/gagal + catatan) di §7.

### B3 — Tindak lanjut temuan QA
- [x] Tidak ada bug yang ditemukan di B2, jadi tidak perlu patch.
- [x] Tidak ada perubahan kode, sehingga unit test tetap utuh.

### B4 — (Opsional, bukan blocker F1) Audio rekaman
- [ ] Rekam klip instruksi + angka 1–10, ganti implementasi `speak()` di `src/platform/speech.ts` tanpa mengubah antarmuka (`speak`, `speakNumber`, `speakQuestion`, `configureAudio`).
- [ ] Web Speech tetap jadi fallback kalau klip tidak tersedia. **Belum dikerjakan** (F3 selesai tanpa audio rekaman karena aset klip belum ada).

### B5 — (Di luar scope F1) Capacitor + APK
- [ ] Wrapper Capacitor, build APK release pakai keystore yang **sudah dibekukan** di `docs/KEYSTORE-RELEASE.md`. Tiket terpisah.

> Daftar sisa pekerjaan lintas fase (prioritas P0–P2): [`BACKLOG.md`](./BACKLOG.md).

## 6. Checklist QA manual (semua belum dijalankan)

- [x] 1. `npm run dev` → buat profil Aira → masuk peta → mulai "Hitung Buah" (bab 1).
- [x] 2. Ketuk buah satu-satu → angka keluar berurutan (badge + suara) → selesaikan 10 soal.
- [x] 3. Jawab salah sekali → bantuan muncul, **soal tidak pindah**, jawaban benar dapat dicoba lagi.
- [x] 4. Selesaikan bab → layar hadiah (kartu + bintang) → Selesai → "Sampai jumpa besok".
- [x] 5. Refresh **di tengah bab** → kembali ke soal yang sama (bukan mulai dari awal).
- [x] 6. Refresh **setelah bab selesai** → pilih profil → di peta bab tetap "Selesai" + kartu ada di koleksi.
- [x] 7. Mute di peta → refresh → status mute tetap; progres bab tetap ada.
- [x] 8. Console bersih (tidak ada error/warning React yang terlihat).

## 7. Log verifikasi (isi setelah dijalankan)

| Tanggal | Perintah / langkah | Hasil | Catatan |
|---|---|---|---|
| 2026-11-21 | `npm install` | lulus | Dependensi terpasang; `npm audit` melaporkan 9 advisories (6 moderate, 1 high, 2 critical), tidak ada perubahan runtime F1 |
| 2026-11-21 | `npm test` | lulus | 8 file test, 42 test lulus |
| 2026-11-21 | `npm run build` | lulus | `tsc --noEmit` + Vite build lulus |
| 2026-11-21 | QA browser §6 | lulus | Profil/peta, salah lalu benar, 10 soal, hadiah/penutup, refresh tengah bab, refresh selesai, mute, dan koleksi terverifikasi |
| 2026-11-21 | Koreksi alur level + profil baru | lulus | Setelah buat/pilih profil, layar Easy/Medium/Hard tampil sebelum peta. Profil baru mulai 0 bab dan koleksi kosong |

## 8. Guardrails (JANGAN dilanggar model yang melanjutkan)

1. **Identitas build FROZEN**: `applicationId = id.petualanganangka.app`, keystore `petualanganangka-release.jks`, alias `petualanganangka`. Ganti = update APK ditolak = progres anak hilang. Detail: `docs/KEYSTORE-RELEASE.md`.
2. **Jangan tambah dependency runtime baru** untuk F1. React 18 + Vite + TS + Vitest sudah cukup. Butuh sesuatu? Pakai yang sudah ada atau tulis sendiri.
3. **Tanpa network saat runtime**: tidak ada fetch/CDN/font eksternal. Ilustrasi = SVG inline. Soal digenerate lokal dari seed.
4. **Tanpa drag wajib** dan tanpa input teks untuk anak. Semua tap, target ≥64px.
5. **Jangan hapus `retry()`** di `game/session.ts` — itu bugfix inti (soal tidak boleh terkunci setelah jawaban salah).
6. **Jangan ubah arti `completedNaturally`**: `true` hanya jika 10 soal tuntas.
7. **Jangan ganti key storage** (`petualangan-angka.save.v1`) atau `schemaVersion: 1`; kalau schema berubah, tambahkan migrasi + test, jangan reset save anak.
8. Animasi benar ≤800ms dan **berhenti** (bukan loop). Salah = getar halus, bukan overlay merah.
9. Tombol mute harus tetap terlihat di semua layar.
10. Perubahan minimal & terfokus; jangan refactor struktur repo.

## 9. Prompt siap tempel (hemat token, untuk model free)

```text
Repo: game hitung anak (React 18 + Vite + TS + Vitest, offline, tanpa dependency baru).
Baca HANYA file ini: docs/TICKET-LOCAL-3F0970-F1-hitung-buah.md.
Tugas: kerjakan §5 B1 → B2 → B3 saja.
1) jalankan: npm install && npm test && npm run build
2) perbaiki error TS/test gagal dengan patch minimal (jangan refactor, jangan tambah dependency)
3) jalankan npm run dev, ikuti checklist §6 (8 langkah), pastikan console bersih,
   refresh di tengah bab kembali ke soal yang sama, refresh setelah bab selesai progres tetap ada
4) isi tabel log di §7 dan centang checkbox di §5/§6 yang benar-benar lulus
5) laporkan: perintah yang dijalankan, hasil, bug yang ditemukan+diperbaiki, sisa masalah
Patuhi §8 guardrails. Jangan ubah applicationId/keystore, jangan ganti key localStorage,
jangan hapus retry() di src/game/session.ts, jangan ubah arti completedNaturally.
Kalau npm install gagal (offline), berhenti dan laporkan — jangan tandai selesai.
```

---

**Ringkas**: F1 sudah diimplementasikan penuh di kode (vertical slice 5 layar + counting + audio + persistensi + bugfix + unit test). Yang tersisa hanyalah **menjalankan** `npm install/test/build` dan **QA manual 8 langkah**, lalu memperbaiki temuan apa pun dan mengisi log di §7.
