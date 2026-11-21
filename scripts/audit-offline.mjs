#!/usr/bin/env node
/**
 * Audit offline-first (gate CI).
 *
 * Gagal (exit 1) kalau menemukan:
 *  - URL http(s) ke domain luar di source / index.html / public / hasil build,
 *  - Google Fonts, CDN (unpkg/jsdelivr/cdnjs), atau protocol-relative `//host`,
 *  - fetch/XHR ke URL absolut,
 *  - service worker dengan runtimeCaching (harus precache-all).
 *
 * Namespace XML (www.w3.org) dan URL pesan error React BUKAN request jaringan,
 * jadi masuk allowlist. Tambah host ke ALLOWED_HOSTS hanya kalau benar-benar aman.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ALLOWED_HOSTS = new Set([
  'www.w3.org', // namespace SVG/XML — tidak pernah di-fetch
  'react.dev', // teks pesan error React di bundle produksi
  'reactjs.org',
  'localhost',
  '127.0.0.1',
]);

const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.html',
  '.json',
  '.svg',
  '.txt',
  '.webmanifest',
]);

const SOURCE_TARGETS = ['src', 'public', 'index.html'];
const BUILD_TARGETS = ['dist'];

const BANNED_SUBSTRINGS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'googletagmanager',
  'google-analytics',
  'firebaseio',
];

const violations = [];

function walk(path, files) {
  const absolute = join(ROOT, path);
  if (!existsSync(absolute)) return files;
  const stats = statSync(absolute);

  if (stats.isFile()) {
    if (TEXT_EXT.has(extname(absolute))) files.push(path);
    return files;
  }

  for (const entry of readdirSync(absolute)) {
    walk(join(path, entry), files);
  }
  return files;
}

function addViolation(file, line, text, reason) {
  violations.push({ file, line, text: text.trim().slice(0, 120), reason });
}

function checkFile(file) {
  const content = readFileSync(join(ROOT, file), 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    for (const banned of BANNED_SUBSTRINGS) {
      if (line.includes(banned)) {
        addViolation(file, lineNumber, line, `domain terlarang: ${banned}`);
      }
    }

    for (const match of line.matchAll(/https?:\/\/([^\s"'`)<>]+)/g)) {
      const host = match[1].split(/[/?#]/)[0];
      if (!ALLOWED_HOSTS.has(host)) {
        addViolation(file, lineNumber, match[0], `URL eksternal: ${host}`);
      }
    }

    if (/(fetch|XMLHttpRequest|axios)\s*(\(|\.)/.test(line) && /https?:/.test(line)) {
      addViolation(file, lineNumber, line, 'request jaringan ke URL absolut');
    }

    if (/(src|href)\s*=\s*["']\/\//.test(line) || /@import\s+(url\()?\s*["']?\s*\/\//.test(line)) {
      addViolation(file, lineNumber, line, 'URL protocol-relative (domain luar)');
    }

    if (/url\(\s*["']?https?:/.test(line)) {
      addViolation(file, lineNumber, line, 'CSS url() ke domain luar');
    }
  });
}

const files = [...SOURCE_TARGETS, ...BUILD_TARGETS]
  .flatMap((target) => walk(target, []))
  // File SW/workbox di-generate oleh vite-plugin-pwa dan berisi string internal
  // (mis. bit.ly/wb-precache) yang bukan request aplikasi. Cek konfigurasinya
  // lewat vite.config.ts di bawah, bukan lewat bundle hasil generate.
  .filter((file) => !/^dist\/(sw\.js|workbox-.*\.js)$/.test(file));
for (const file of files) checkFile(file);

// Service worker wajib precache-all, bukan runtimeCaching.
const viteConfigPath = join(ROOT, 'vite.config.ts');
if (existsSync(viteConfigPath)) {
  const viteConfig = readFileSync(viteConfigPath, 'utf8');
  // Abaikan komentar supaya dokumentasi "tanpa runtimeCaching" tidak dianggap konfigurasi.
  const viteConfigCode = viteConfig
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  if (viteConfigCode.includes('runtimeCaching')) {
    violations.push({
      file: 'vite.config.ts',
      line: 0,
      text: 'runtimeCaching',
      reason: 'service worker harus precache-all (hapus runtimeCaching)',
    });
  }
  if (!viteConfig.includes('globPatterns')) {
    violations.push({
      file: 'vite.config.ts',
      line: 0,
      text: 'workbox.globPatterns',
      reason: 'precache-all butuh globPatterns eksplisit',
    });
  }
}

console.log(`[audit:offline] ${files.length} file diperiksa (source + build bila ada).`);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(
      `  ✖ ${violation.file}:${violation.line} — ${violation.reason}\n    ${violation.text}`,
    );
  }
  console.error(`\n[audit:offline] GAGAL: ${violations.length} pelanggaran offline-first.`);
  process.exit(1);
}

console.log('[audit:offline] OK — nol referensi ke domain luar, SW mode precache-all.');
