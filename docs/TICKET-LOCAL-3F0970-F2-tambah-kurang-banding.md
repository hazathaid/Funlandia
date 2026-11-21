# TICKET LOCAL-3F0970 — F2: Mode Tambah, Kurang, dan Bandingkan

> Lanjutan dari [`TICKET-LOCAL-3F0970-F1-hitung-buah.md`](./TICKET-LOCAL-3F0970-F1-hitung-buah.md).
> F1 tetap utuh; F2 menambah mode soal baru di atas state machine yang sama.

| Field | Nilai |
|---|---|
| Key | `LOCAL-3F0970` (lokal, belum di-sync ke Jira) |
| Judul | F2: Mode Tambah/Kurang + Bandingkan, generator soal, adaptive, 3 tahap bantuan |
| Tipe / Prioritas | Story / High |
| Status | **Done** (implementasi + unit test + build + QA browser otomatis lulus) |
| Repo | `/Users/macbookpro/projects/games-buat-anak` |
| Basis | Plan `docs/PLAN-game-hitung-anak.md` §5 (level 3–5) dan §11 F2 |

## 0. Ringkasan status

| Area | Status | Keterangan |
|---|---|---|
| Generator soal 4 mode | ✅ | `counting`, `addition`, `subtraction`, `compare`, deterministik dari seed |
| Pilihan jawaban | ✅ | 3–4 pilihan angka; pengecoh ±1/±2/±3; valid 1–10 |
| Adaptive difficulty | ✅ | 3 level dari `mastery` tersimpan (0–0.49 mudah, 0.5–0.79 sedang, ≥0.8 sulit) |
| Bantuan 3 tahap | ✅ | Berlaku untuk semua mode; tahap 3 menandai jawaban + requeue soal |
| Peta bab progresif | ✅ | 4 bab, bab berikutnya terbuka setelah bab sebelumnya selesai |
| Mastery per skill | ✅ | `skillProgress` menyimpan `count-1-10`, `add-within-10`, `sub-within-10`, `compare-within-10` |
| Resume setelah refresh | ✅ | `activeRun` menyimpan `difficulty`; save lama tanpa field ini tetap terbaca |
| Unit test | ✅ | 21 test lulus (4 file) |
| Build | ✅ | `tsc --noEmit` + `vite build` lulus |
| QA browser manual | ⏳ | Belum dijalankan di sesi ini; langkah ada di §4 |

## 1. Alur yang sekarang berjalan

```
Peta Pulau
  ├─ Bab 1 Hitung Buah        (terbuka sejak awal)
  ├─ Bab 2 Tambah Buah        (terbuka setelah Bab 1 selesai)
  ├─ Bab 3 Kurang Buah        (terbuka setelah Bab 2 selesai)
  └─ Bab 4 Mana Lebih Banyak  (terbuka setelah Bab 3 selesai)
        ↓
  10 soal sesuai mode → bantuan 3 tahap → hadiah → penutup
```

## 2. Spesifikasi yang diimplementasikan

### 2.1 Mode soal

| Mode | Soal | Representasi | Jawaban |
|---|---|---|---|
| `counting` | "Ada berapa apel?" | Buah bisa diketuk satu-satu | Jumlah buah |
| `addition` | "3 + 2 = ?" | Dua kelompok buah + tanda `+` | Hasil tambah |
| `subtraction` | "5 − 2 = ?" | 5 buah, 2 buah ditandai sudah dimakan | Sisa buah |
| `compare` | "Mana yang lebih banyak?" | Dua keranjang buah | Jumlah keranjang yang lebih banyak |

- Semua mode memakai `answer: number` sehingga `game/session.ts` tidak perlu dipecah per mode.
- `compare` memakai dua tombol keranjang besar; angka keranjang disembunyikan sampai bantuan tahap 2.
- Tap-per-objek tetap tersedia untuk `counting`, `addition`, dan `subtraction` (objek yang tersisa).

### 2.2 Adaptive difficulty

`difficultyFromMastery(mastery)`:

| Mastery | Level | Efek |
|---|---|---|
| `< 0.5` | 0 (mudah) | Tambah maksimal 5; bandingkan 1–5; kurang dari angka kecil |
| `0.5 – 0.79` | 1 (sedang) | Tambah/kurang dalam 10; bandingkan 1–10 |
| `≥ 0.8` | 2 (sulit) | Tambah hasil ≥ 6; kurang dari 6–10; bandingkan selisih ≤ 3 |

- Level dipilih saat bab dimulai dari `skillProgress` profil untuk skill mode tersebut.
- Level ikut disimpan di `activeRun` supaya soal tetap sama setelah refresh.

### 2.3 Bantuan 3 tahap (semua mode)

1. Salah pertama → dorongan teks + tombol "Hitung bareng Kiko".
2. Salah kedua → Kiko menyorot objek/keranjang berurutan sambil menyebut angkanya.
3. Salah ketiga → jawaban benar ditandai "Ini jawabannya" + soal serupa dijadwalkan ulang sekali.

`retry()` di `game/session.ts` tidak diubah: soal yang sama tetap bisa dicoba lagi setelah getar halus.

## 3. File yang berubah / ditambah

| File | Perubahan |
|---|---|
| `src/game/questions.ts` | **Baru.** Tipe 4 mode, `SKILL_FOR_MODE`, generator, adaptive difficulty, opsi jawaban |
| `src/game/questions.test.ts` | **Baru.** 7 test generator + difficulty |
| `src/game/chapters.ts` | 4 bab progresif, `requires`, `isChapterUnlocked`, `skillIdForChapter`, `CARD_EMOJI` |
| `src/game/session.ts` | `difficulty` di `RunState`/`ActiveRun` (opsional untuk save lama) |
| `src/state/progress.ts` | Mastery disimpan per skill mode, bukan hardcode counting |
| `src/state/GameProvider.tsx` | Generate soal per mode, audio per mode, difficulty adaptif saat mulai bab |
| `src/screens/PlayScreen.tsx` | Board tambah/kurang/bandingkan, prompt & feedback per mode |
| `src/screens/MapScreen.tsx` | Unlock progresif + ikon mode + emoji kartu |
| `src/screens/RewardScreen.tsx` | Teks hadiah tidak lagi khusus "menghitung" |
| `src/platform/speech.ts` | `numberToWord()` untuk instruksi tambah/kurang |
| `src/styles.css` | Gaya equation, buah dimakan, keranjang bandingkan, shake compare |
| `src/state/progress.test.ts` | Test mastery per skill mode |
| `src/game/session.test.ts` | Test round-trip `difficulty` + kompatibilitas save lama |

## 4. Verifikasi

| Tanggal | Perintah / langkah | Hasil | Catatan |
|---|---|---|---|
| 2026-11-21 | `npx tsc --noEmit` | lulus | Tidak ada error TS |
| 2026-11-21 | `npm test` | lulus | 7 file, 37 test (suite penuh repo) |
| 2026-11-21 | `npm run build` | lulus | Vite build sukses |
| 2026-11-21 | Smoke headless Chrome (`--dump-dom` ke dev server) | lulus | Layar Mulai tampil, root tidak kosong |
| 2026-11-21 | QA browser otomatis (Chrome DevTools Protocol) | lulus | 4 bab selesai, unlock progresif, tap tambah, buah dimakan disabled, compare, wrong 3× → reveal + requeue, refresh resume, mute persist, adaptive difficulty = 2 pada mastery 0.95, console bersih |

### 4.1 Checklist QA (lulus 2026-11-21 lewat Chrome headless)

- [x] 1. Selesaikan Bab 1 → Bab 2 "Tambah Buah" terbuka.
- [x] 2. Kerjakan soal tambah: dua kelompok buah tampil; 7 buah diketuk → 7 badge berurutan.
- [x] 3. Jawab salah 3× → "Ini jawabannya" muncul, queue bertambah 10 → 11 (requeue).
- [x] 4. Selesaikan Bab 2 → Bab 3 terbuka; buah yang dimakan `disabled` (3 buah − 1 dimakan = 2 bisa diketuk).
- [x] 5. Selesaikan Bab 3 → Bab 4 terbuka; keranjang yang lebih banyak berhasil dipilih.
- [x] 6. Refresh di tengah bab → prompt sama ("Ada berapa semangka?") dan `activeRun` dipakai lagi.
- [x] 7. Mute tetap terlihat; status mati bertahan setelah refresh; console bersih (0 issue).
- [x] 8. Main lagi dengan mastery tambah 0.95 → `activeRun.difficulty` = 2 (sulit).

## 5. Sisa pekerjaan / backlog

- [x] QA browser §4.1.
- [ ] Audio rekaman — instruksi tambah/kurang/bandingkan masih memakai Web Speech API; butuh aset klip (ditunda).
- [x] Zona Orang Tua, laporan per skill, batas waktu → selesai di F3.
- [ ] Capacitor + APK release (F5, tiket terpisah).

> Daftar sisa pekerjaan lintas fase (prioritas P0–P2): [`BACKLOG.md`](./BACKLOG.md).

## 6. Guardrails yang tetap berlaku

1. `applicationId`, keystore, dan alias **tidak berubah**.
2. Tidak ada dependency runtime baru.
3. Tanpa network saat runtime.
4. Semua interaksi tap; target ≥64px.
5. `retry()` dan arti `completedNaturally` tidak diubah.
6. Key storage `petualangan-angka.save.v1` dan `schemaVersion: 1` tidak berubah.
7. Animasi benar ≤800ms dan berhenti; salah = getar halus.
8. Tombol mute tetap terlihat di semua layar.
