#!/usr/bin/env bash
# ============================================================================
# scripts/check-secrets-not-committed.sh
#
# Verifikasi bagian "DEFINISI SELESAI" tiket keystore:
#   "git log TIDAK mengandung file keystore/password"
#
# Cek 3 hal:
#   1. Tidak ada *.jks / *.keystore / keystore.properties yang TRACKED.
#   2. Tidak ada file itu di SELURUH riwayat git (semua branch).
#   3. Tidak ada password signing yang tertulis di file yang di-commit.
#   4. .gitignore memuat pola wajib.
#
# Pakai:  bash scripts/check-secrets-not-committed.sh
# Exit 0 = bersih. Exit 1 = ada kebocoran, JANGAN push.
# ============================================================================
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

FAIL=0
RED=""; YELLOW=""; RESET=""
if [ -t 1 ]; then RED=$'\033[31m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'; fi

fail() { echo "${RED}GAGAL${RESET} $*"; FAIL=1; }
ok()   { echo "OK    $*"; }

SECRET_PATTERN='(^|/)([^/]*\.jks|[^/]*\.keystore|keystore\.properties)$'

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "${YELLOW}LEWATI${RESET} Folder ini bukan git repo — pemeriksaan riwayat tidak bisa dijalankan."
  echo "       Jalankan lagi setelah 'git init'."
  exit 0
fi

echo "== 1. File rahasia yang tracked di index =="
TRACKED="$(git ls-files | grep -E "${SECRET_PATTERN}" | grep -v 'keystore\.properties\.example' || true)"
if [ -n "${TRACKED}" ]; then
  fail "file rahasia ikut ter-track:"; echo "${TRACKED}" | sed 's/^/        /'
  echo "        Perbaiki: git rm --cached <file> lalu commit."
else
  ok "tidak ada *.jks / *.keystore / keystore.properties di index"
fi

echo
echo "== 2. File rahasia di riwayat git (semua branch) =="
HISTORY="$(git log --all --pretty=format: --name-only \
  | grep -E "${SECRET_PATTERN}" | grep -v 'keystore\.properties\.example' | sort -u || true)"
if [ -n "${HISTORY}" ]; then
  fail "file rahasia PERNAH ada di riwayat git:"; echo "${HISTORY}" | sed 's/^/        /'
  echo "        Kalau isinya password/keystore asli: rotasi password & pertimbangkan 'git filter-repo'."
else
  ok "riwayat git bersih dari file keystore/password"
fi

echo
echo "== 3. Password signing yang ikut ter-commit =="
LEAK="$(git grep -nIE 'storePassword=[^[:space:]]{6,}|keyPassword=[^[:space:]]{6,}' \
  -- . ':!*.example' 2>/dev/null | grep -vE 'GANTI_|YOUR_|xxx|\$\{' || true)"
if [ -n "${LEAK}" ]; then
  fail "kemungkinan password signing ter-commit:"; echo "${LEAK}" | sed 's/^/        /'
else
  ok "tidak ada nilai storePassword/keyPassword di file yang di-commit"
fi

echo
echo "== 4. Pola wajib di .gitignore =="
for pattern in '*.jks' 'keystore.properties' 'android/build/' 'android/app/build/' 'android/.gradle/'; do
  if git check-ignore -q "dummy-${pattern%/}" 2>/dev/null || grep -qF -- "${pattern}" .gitignore 2>/dev/null; then
    ok ".gitignore memuat '${pattern}'"
  else
    fail ".gitignore TIDAK memuat '${pattern}'"
  fi
done

echo
if [ "${FAIL}" -eq 0 ]; then
  echo "${RED:-}SEMUA CEK LULUS — aman untuk commit/push.${RESET}"
else
  echo "${RED}ADA MASALAH — JANGAN push sebelum diperbaiki.${RESET}"
fi
exit "${FAIL}"
