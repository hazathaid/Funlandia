# LOCAL-1F77E9 — F0: Setup proyek offline-first

Fondasi proyek dengan constraint **offline-first sejak hari pertama**: nol CDN, nol Google Fonts,
nol request jaringan saat runtime. Semua aset ikut bundle dan di-precache service worker.

Stack: **Vite 5 + React 18 + TypeScript + Tailwind 3 + Framer Motion + Zustand + Howler + vite-plugin-pwa**.

---

## 1. Yang dikerjakan di tiket ini

| Scope tiket | Status | Bukti / file |
|---|---|---|
| Init repo + ESLint/Prettier + script npm | ✅ | `eslint.config.js`, `.prettierrc.json`, `package.json` |
| Design token Tailwind (palet, radius 24px, spacing) | ✅ | `src/design/tokens.css`, `tailwind.config.js` |
| Font self-hosted (`@fontsource/baloo-2`, `@fontsource/nunito`) | ✅ | `src/main.tsx`, `src/design/overrides.css` |
| `src/platform/` untuk SaveStore, audio, haptic, orientasi | ✅ | `src/platform/*.ts` |
| PWA shell: manifest, ikon placeholder, SW precache-all | ✅ | `vite.config.ts`, `scripts/generate-icons.mjs` |
| Audit CI: deteksi URL eksternal / fetch keluar | ✅ | `scripts/audit-offline.mjs`, `.github/workflows/ci.yml` |
| Kontras semua pasangan warna ≥ 4.5:1 | ✅ | `src/design/overrides.css`, `scripts/check-contrast.mjs` |

---

## 2. Struktur fondasi

```
src/design/
  tokens.css          token warna/radius/spacing/tipografi + @tailwind directives
  overrides.css       tipografi self-hosted + perbaikan kontras (dimuat paling akhir)
src/platform/
  saveStore.ts        port penyimpanan (localStorage sekarang, Capacitor nanti)
  audio.ts            port SFX — Web Audio sintesis, tanpa file & tanpa network
  haptic.ts           port getar (Vibration API sekarang, Haptics native di F5)
  orientation.ts      port orientasi layar (lock best-effort, no-throw)
  speech.ts           narator id-ID (Web Speech API, fallback sampai F3)
  pwa.ts              registrasi service worker (precache-all)
  index.ts            fasad `platform` + `setSoundEnabled()` (satu sakelar audio)
scripts/
  generate-icons.mjs  ikon PNG placeholder (ditulis manual, tanpa dependency)
  audit-offline.mjs   gate: nol URL/CDN/fetch eksternal, SW wajib precache
  check-contrast.mjs  gate: semua pasangan token ≥ 4.5:1
.github/workflows/ci.yml  lint → audit offline → audit kontras → test → build → audit dist
```

### Aturan arsitektur

1. **Logika game tidak boleh menyentuh platform langsung.** Tidak ada `localStorage`,
   `AudioContext`, `navigator.vibrate`, atau `screen.orientation` di `src/game/**` dan
   `src/screens/**` — semuanya lewat `src/platform/`.
2. **Satu sakelar audio.** `setSoundEnabled()` di `src/platform/index.ts` mematikan narator *dan*
   SFX; dipanggil dari `configureAudio()` yang sudah dipakai `GameProvider` untuk mute & setting.
3. **Tidak ada aset jarak jauh.** Font dari `node_modules` (di-bundle jadi `woff2` lokal), ilustrasi
   SVG inline, ikon di-generate saat `predev`/`prebuild`, SFX disintesis.
4. **Service worker = precache-all.** Tidak ada `runtimeCaching`; `scripts/audit-offline.mjs`
   menggagalkan build kalau kata kunci itu muncul lagi.

### Keputusan teknis

- **Tailwind preflight dimatikan.** Layar F1/F2 sudah diuji ke anak dengan reset sendiri di
  `src/styles.css`; preflight akan mengubah tampilan tanpa playtest. Utility Tailwind tetap aktif
  untuk layar baru (F3+).
- **`base: '/'`.** Scope service worker harus root aplikasi. Capacitor (F5) tetap menyajikan app
  dari `https://localhost/`, jadi tidak ada yang berubah untuk APK.
- **SFX disintesis (Web Audio), bukan file.** F0 = nol byte unduhan. Klip rekaman/musik masuk F3
  lewat Howler dengan file yang di-bundle; kontrak `playSfx()` tidak berubah.
- **Ikon di-generate, bukan blob biner.** `scripts/generate-icons.mjs` menulis PNG RGBA langsung
  (IHDR/IDAT/IEND + zlib), jadi build reproducible dan repo bebas biner.
- **Warna "kuat".** Palet dasar pink (#EF476F) = 3.6:1 dan biru (#118AB2) = 4.0:1 di atas putih —
  tidak lolos untuk teks. Teks memakai `--accent-strong #C1123F`, `--info-strong #0E6E8F`,
  `--success #0B7A5C`, `--muted #5C6079`. Palet dasar tetap dipakai untuk ilustrasi/latar besar.

---

## 3. Perintah

```bash
npm install            # sekali
npm run dev            # vite + generate ikon (predev)
npm run build          # generate ikon + tsc --noEmit + vite build (SW ikut dibuat)
npm run preview        # cek hasil build
npm test               # vitest (logika game + port platform)
npm run lint           # ESLint 9 flat config
npm run format         # Prettier
npm run audit:offline  # gagal kalau ada URL/CDN/fetch eksternal (src + dist)
npm run audit:contrast # tabel kontras semua pasangan token
npm run verify         # lint + audit + test + build (yang dijalankan CI)
```

---

## 4. Checklist verifikasi manual (acceptance criteria)

> **Verifikasi otomatis 2026-11-21:** `npm run verify` lulus (lint, audit offline, audit kontras 22/22, 37 test, build). Offline PWA smoke lulus: service worker aktif, reload dengan `navigator.onLine=false` tetap menampilkan layar mulai, dan semua 10 resource berasal dari `localhost` (nol host eksternal). Lighthouse belum dijalankan.
>
> Dua gate diperbaiki saat audit: `scripts/audit-offline.mjs` tidak lagi memindai bundle `workbox` hasil generate, dan `scripts/check-contrast.mjs` membuang komentar CSS sebelum membaca token (komentar `4.5:1` sempat membuat token terbaca salah).

### 4.1 Build & offline

1. `npm install && npm run build` → selesai tanpa error, `dist/sw.js` + `dist/manifest.webmanifest` ada.
2. `npm run preview`, buka di Chrome, biarkan app ter-load sekali (SW install).
3. DevTools → Application → Service Workers: status **activated and is running**.
4. Network → centang **Offline** *dan* aktifkan mode pesawat di laptop/HP → refresh.
   Layar tetap tampil penuh (boot → layar mulai → peta), tidak ada layar error.
5. Reload dengan tab Network **kosongkan lalu refresh**: semua request berstatus
   `(ServiceWorker)`/cache — **tidak ada** request ke domain luar (nol baris dengan host eksternal).
6. Application → Manifest: nama, ikon 192/512/maskable, `display: standalone`,
   `theme_color #FFF8E7` terbaca; tombol **Install** tersedia.

### 4.2 Lighthouse (mode PWA, build produksi via `npm run preview`)

7. Kategori **PWA**: installable ✔, service worker ✔, offline ✔ (Lighthouse versi baru tidak lagi
   memberi skor PWA, jadi yang dicek adalah audit `Installable` + `Works offline`).
8. Performance/Accessibility: tidak ada pelanggaran kontras (lihat 4.3).

### 4.3 Kontras

9. `npm run audit:contrast` → semua baris `OK`, 22 pasangan ≥ 4.5:1.
10. Spot-check manual di DevTools/Axe: ribbon pink (putih di `#C1123F` = 6.1:1), badge angka
    (putih di `#0E6E8F` = 5.8:1), teks sekunder di krem (5.8:1), teks terkunci di permukaan redup
    (5.4:1), angka yang ditekankan di kartu (6.1:1).

### 4.4 Nol request eksternal (gate otomatis)

11. `npm run audit:offline` → `OK — nol referensi ke domain luar, SW mode precache-all`.
    Script memeriksa `src/`, `index.html`, `public/`, dan `dist/` (setelah build) serta menolak
    `runtimeCaching` di `vite.config.ts`.

### 4.5 Regresi F1/F2

12. Alur tetap jalan: pilih profil → peta → bab → soal → hadiah → penutup.
13. Mute di semua layar: narator **dan** SFX diam, preferensi bertahan setelah refresh.
14. Jawab salah → getar halus + nada rendah (di HP yang mendukung), soal tetap sama.
15. Console bersih (tanpa error/warning React).

---

## 5. Catatan dependency

- `framer-motion`, `zustand`, `howler` sudah masuk `package.json` sesuai stack tiket, tetapi belum
  dipakai runtime: animasi masih CSS (sudah diuji), state masih React Context, audio masih
  disintesis. Rencana pemakaian: Framer Motion untuk transisi layar (F3), Zustand bila state
  melebar (F3), Howler untuk klip rekaman (F3). Tidak menambah byte bundle selama belum di-import.
- `vite-plugin-pwa` mode `injectRegister: null` — registrasi manual di `src/platform/pwa.ts` supaya
  mudah di-no-op-kan saat test.

## 6. Di luar tiket ini

- Implementasi native (Capacitor) untuk SaveStore/audio/haptic/orientasi → F5.
- Klip narator & musik rekaman → F3 (port `playSfx`/`speak` sudah siap).
- Keystore & signing → tiket terpisah `LOCAL-8707E4` (identitas build **frozen**).
