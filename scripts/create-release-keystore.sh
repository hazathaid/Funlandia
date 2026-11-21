#!/usr/bin/env bash
# ============================================================================
# scripts/create-release-keystore.sh
#
# Membuat keystore release Petualangan Angka SEKALI SAJA.
# Kalau file-nya sudah ada, script menolak jalan (mencegah keystore ganda).
#
# Password TIDAK pernah ditulis ke disk / log / shell history
# (dibaca dengan `read -s`, diteruskan ke keytool via stdin-free prompt).
#
# Pakai:  bash scripts/create-release-keystore.sh
# Detail: docs/KEYSTORE-RELEASE.md
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYSTORE_FILE="${REPO_ROOT}/petualanganangka-release.jks"
ALIAS="petualanganangka"          # DIBEKUKAN — jangan ganti
KEYSIZE=2048
VALIDITY_DAYS=10000              # ~27 tahun
DNAME="CN=Petualangan Angka, OU=Mobile, O=Petualangan Angka, L=Jakarta, ST=DKI Jakarta, C=ID"

if ! command -v keytool >/dev/null 2>&1; then
  echo "ERROR: 'keytool' tidak ditemukan. Install JDK 17+ dulu (mis. brew install openjdk@17)." >&2
  exit 1
fi

if [ -e "${KEYSTORE_FILE}" ]; then
  echo "ERROR: ${KEYSTORE_FILE} sudah ada." >&2
  echo "JANGAN membuat keystore baru — identitas build dibekukan." >&2
  echo "Kalau ini benar-benar keystore yang hilang total, baca docs/KEYSTORE-RELEASE.md §Pemulihan." >&2
  exit 1
fi

echo "Membuat keystore: ${KEYSTORE_FILE}"
echo "  alias    : ${ALIAS} (DIBEKUKAN)"
echo "  algoritma: RSA ${KEYSIZE}"
echo "  validitas: ${VALIDITY_DAYS} hari (~27 tahun)"
echo
echo "Gunakan password KUAT (min. 20 karakter) yang juga kamu simpan di password manager."
echo "CATAT di password manager SEKARANG, sebelum lanjut."

keytool -genkeypair -v \
  -keystore "${KEYSTORE_FILE}" \
  -storetype PKCS12 \
  -alias "${ALIAS}" \
  -keyalg RSA \
  -keysize "${KEYSIZE}" \
  -validity "${VALIDITY_DAYS}" \
  -dname "${DNAME}"

echo
echo "=== SIDIK JARI (fingerprint) — catat di docs/KEYSTORE-RELEASE.md ==="
keytool -list -v -keystore "${KEYSTORE_FILE}" -alias "${ALIAS}" \
  | grep -E "Alias name|Creation date|Valid from|SHA1:|SHA256:" || true

echo
echo "LANGKAH WAJIB BERIKUTNYA:"
echo "  1. Backup ${KEYSTORE_FILE} + password ke 2 lokasi terpisah"
echo "     (attachment password manager + cloud pribadi/offline)."
echo "  2. cp android/keystore.properties.example android/keystore.properties lalu isi password."
echo "  3. bash scripts/check-secrets-not-committed.sh  (harus lulus)"
