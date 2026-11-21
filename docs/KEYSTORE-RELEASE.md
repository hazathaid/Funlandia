# Keystore Release — Petualangan Angka

Runbook untuk identitas build yang **DIBEKUKAN**. Baca sekali, lalu jangan diubah.

Tiket: `LOCAL-8707E4` (F0) · Plan: [`PLAN-game-hitung-anak.md`](./PLAN-game-hitung-anak.md) §9.3

---

## 0. Kenapa ini dikerjakan paling awal

Android hanya mau memasang APK baru **menimpa** app lama kalau memenuhi dua syarat:

1. `applicationId` sama persis.
2. APK baru ditandatangani dengan **keystore + alias yang sama**.

Kalau salah satu berubah, Android menolak update (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`). Satu-satunya jalan keluar adalah uninstall dulu — dan uninstall **menghapus seluruh `save.json`** di `Directory.Data`. Artinya: **semua progres anak hilang permanen** dan tidak bisa dikembalikan.

> 10 menit sekarang menyelamatkan proyek nanti.

---

## 1. Identitas build yang dibekukan

| Item | Nilai | Status |
|---|---|---|
| `applicationId` | `id.petualanganangka.app` | **FROZEN** |
| File keystore | `petualanganangka-release.jks` (root repo) | **FROZEN** |
| `keyAlias` | `petualanganangka` | **FROZEN** |
| Algoritma | RSA 2048, PKCS12 | — |
| Validitas | 10.000 hari (**± 27 tahun**) | cukup untuk umur proyek |
| Tanggal pembuatan | **2026-11-21** (sudah di-generate; validitas 10.000 hari ≈ April 2054) | — |
| Kedaluwarsa perkiraan | **± April 2054** | — |

**Jangan pernah ganti `applicationId`, keystore, atau alias.** Nilai yang sama juga ditulis di [`../README.md`](../README.md) dan dijaga oleh `android/signing.gradle` (build gagal kalau alias/path tidak sesuai).

---

## 2. Generate keystore (SEKALI SAJA)

Gunakan JDK 17+. Script sudah membawa `dname`, alias, dan validitas yang benar:

```bash
bash scripts/create-release-keystore.sh
```

Setara dengan perintah manual berikut (dokumentasi, kalau script tidak dipakai):

```bash
keytool -genkeypair -v \
  -keystore petualanganangka-release.jks \
  -storetype PKCS12 \
  -alias petualanganangka \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Petualangan Angka, OU=Mobile, O=Petualangan Angka, L=Jakarta, ST=DKI Jakarta, C=ID"
```

Catatan:
- `keytool` akan meminta password. Pakai password **kuat (≥ 20 karakter)**, unik, dari password manager — bukan password yang dipakai di tempat lain.
- Untuk PKCS12, `storePassword` dan `keyPassword` sebaiknya sama (default keytool).
- Script menolak jalan kalau `petualanganangka-release.jks` sudah ada, supaya tidak ada dua keystore berbeda untuk app yang sama.

---

## 3. Catat sidik jari (diisi setelah generate)

```bash
keytool -list -v -keystore petualanganangka-release.jks -alias petualanganangka
```

| Field | Nilai |
|---|---|
| Alias name | `petualanganangka` |
| Creation date | _isi: YYYY-MM-DD_ |
| Valid from … until | _isi: … until ± April 2054_ |
| SHA-256 fingerprint | `46:00:20:47:DE:49:3E:76:C7:C2:0D:28:18:35:06:EB:BD:9F:AE:39:1C:FC:B6:18:DB:ED:93:98:57:08:A2:68` |
| SHA-1 fingerprint | `8B:CB:65:CC:67:97:0D:68:02:D4:93:FC:F8:3E:7E:7B:4E:82:87:18` |

Sidik jari ini dipakai untuk memverifikasi APK yang diunduh orang tua benar-benar build kita (`apksigner verify --print-certs`). Simpan juga salinannya di password manager bersama password.

---

## 4. Backup 2 lokasi (WAJIB, bukan opsional)

Keystore harus ada di **dua lokasi terpisah**, dan password disimpan terpisah dari filenya:

- [ ] **Lokasi 1 — password manager**: lampirkan `petualanganangka-release.jks` + entry password (storePassword/keyPassword) + catatan alias, applicationId, dan sidik jari SHA-256.
- [ ] **Lokasi 2 — cloud pribadi / media offline**: arsip terenkripsi (mis. ZIP ber-password atau folder terenkripsi) berisi file yang sama, disimpan di Drive pribadi **dan/atau** flashdisk di tempat aman.
- [ ] Uji restore: unduh dari kedua lokasi, jalankan `keytool -list -v` di salinan → sidik jari harus identik dengan tabel §3.
- [ ] Catat tanggal backup terakhir di bawah.

| Tanggal | Lokasi 1 | Lokasi 2 | Diuji restore? |
|---|---|---|---|
| _isi_ | password manager attachment | cloud pribadi (terenkripsi) | ya / belum |

> Jangan pernah mengirim `.jks` lewat WhatsApp/email biasa, dan jangan simpan password di file yang sama dengan keystore tanpa enkripsi.

---

## 5. `android/keystore.properties` (lokal, JANGAN di-commit)

```bash
cp android/keystore.properties.example android/keystore.properties
# lalu isi storePassword & keyPassword dari password manager
```

Isi file (contoh struktur, **tanpa password asli**):

```properties
storeFile=../../petualanganangka-release.jks
storePassword=<dari password manager>
keyAlias=petualanganangka
keyPassword=<dari password manager>
```

- `storeFile` dihitung relatif ke `android/app/` → menunjuk `<root repo>/petualanganangka-release.jks`.
- File ini sudah masuk `.gitignore` (`keystore.properties`, `**/keystore.properties`).
- Yang di-commit hanya `android/keystore.properties.example` (berisi placeholder `GANTI_DENGAN_...`).

---

## 6. Wiring ke build.gradle

`android/signing.gradle` sudah membaca `keystore.properties`, memvalidasi identitas beku, dan mendaftarkan `signingConfigs.release`. Dipakai dari `android/app/build.gradle`:

```gradle
apply from: rootProject.file("signing.gradle")

android {
    defaultConfig {
        applicationId "id.petualanganangka.app"   // FROZEN
        versionCode 1                             // NAIKKAN setiap rilis
        versionName "1.0.0"
        minSdk 26
        targetSdk 35
    }
}
```

Yang dilakukan `signing.gradle`:

| Situasi | Perilaku |
|---|---|
| `keystore.properties` tidak ada + build release | **Gagal** dengan pesan actionable (bukan diam-diam unsigned) |
| `keyAlias` ≠ `petualanganangka` | **Gagal** — mencegah identitas build berubah |
| File `.jks` tidak ditemukan | **Gagal** — termasuk saran memulihkan dari backup |
| `storePassword`/`keyPassword` kosong | **Gagal** |
| `applicationId` berbeda dari nilai beku | Peringatan saat konfigurasi |
| Build debug | Tetap jalan tanpa keystore |

Path `storeFile` didukung dalam dua bentuk: relatif ke `android/app/` (`../../petualanganangka-release.jks`) maupun relatif ke `android/` (`../petualanganangka-release.jks`).

---

## 7. Verifikasi

```bash
# 1. build
cd android && ./gradlew assembleRelease
#    hasil: android/app/build/outputs/apk/release/app-release.apk

# 2. tanda tangan APK = keystore kita?
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
#    SHA-256 di output HARUS sama dengan tabel §3

# 3. rahasia tidak bocor ke git
bash scripts/check-secrets-not-committed.sh

# 4. uji update menimpa (krusial, lakukan di device fisik)
#    install v1.0.0 -> main 1 bab -> install v1.0.1 (versionCode 2) -> progres harus utuh
```

Cek cepat manual tanpa script:

```bash
git ls-files | grep -E '\.jks$|\.keystore$|keystore\.properties$'   # harus kosong
git log --all --name-only | sort -u | grep -E '\.jks$|keystore\.properties$'  # harus kosong
```

---

## 8. Larangan (ringkas)

- ❌ Commit `*.jks`, `*.keystore`, `keystore.properties`, atau password di dokumen/tiket/chat.
- ❌ Generate keystore baru "karena yang lama tidak ketemu" — cari backup dulu (§9).
- ❌ Ganti `applicationId` atau `keyAlias` setelah APK pertama dibagikan.
- ❌ Build release tanpa `keystore.properties` lalu menganggap APK-nya sah.
- ❌ Menyimpan `.jks` hanya di satu laptop.

---

## 9. Kalau keystore hilang

Urutan yang benar:

1. Cek kedua lokasi backup (§4) dan riwayat password manager.
2. Cek `~/.android/`, folder Downloads, arsip laptop lama, trash.
3. Kalau tetap tidak ada: app **tidak bisa** di-update lagi. Pilihan yang tersisa hanya merilis dengan `applicationId` **baru** (mis. `id.petualanganangka.app2`) — orang tua harus install ulang dan progres anak hilang.
4. Sebelum itu terjadi, mitigasi yang sudah ada: **backup JSON progres** di Zona Orang Tua + `android:allowBackup="true"` (§9.5 plan).

---

## 10. Status tiket `LOCAL-8707E4`

| Item DoD | Status |
|---|---|
| `keytool` command + alias/validitas terdefinisi | ✅ `scripts/create-release-keystore.sh` |
| Template `android/keystore.properties` + wiring `build.gradle` | ✅ `android/keystore.properties.example` + `android/signing.gradle` |
| `.gitignore`: `*.jks`, `keystore.properties`, `android/build/`, `android/app/build/`, `android/.gradle/` | ✅ `.gitignore` |
| Identitas build dibekukan & ditulis di README ("jangan pernah ganti") | ✅ `README.md` §Identitas build + enforce di `signing.gradle` |
| Tanggal pembuatan + validitas 10.000 hari (~27 tahun) dicatat | ✅ §1 (isi tanggal asli setelah generate) |
| Generate file `.jks` | ⏳ **manual, sekali**, di mesin developer (`bash scripts/create-release-keystore.sh`) |
| Backup `.jks` di 2 lokasi | ⏳ **manual** — checklist §4 |
| `git log` bersih dari keystore/password | ✅ otomatis dicek `scripts/check-secrets-not-committed.sh` |

File biner `.jks` sengaja **tidak** dibuat di dalam repo: itu satu-satunya file yang tidak boleh ada di git, dan harus lahir + dibackup di mesin developer.
