#!/usr/bin/env node
/**
 * Pemeriksa kontras WCAG (gate CI) — target semua pasangan teks/latar >= 4.5:1.
 *
 * Token dibaca LANGSUNG dari CSS (:root), jadi tidak ada duplikasi nilai:
 *   urutan baca = tokens.css → styles.css → overrides.css (mengikuti cascade).
 * Kalau ada pasangan yang gagal, hentikan build dan perbaiki tokennya.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CSS_FILES = ['src/design/tokens.css', 'src/styles.css', 'src/design/overrides.css'];
const MIN_RATIO = 4.5;

const PAIRS = [
  ['--text', '--bg', 'teks utama di latar krem'],
  ['--text', '--card', 'teks utama di kartu putih'],
  ['--text', '--primary', 'teks di tombol madu'],
  ['--text', '--secondary', 'teks di badge mint'],
  ['--text', '--surface-muted', 'teks di permukaan redup'],
  ['--text', '--primary-soft', 'teks di madu lembut'],
  ['--text', '--info-soft', 'teks di biru lembut'],
  ['--text', '--danger-soft', 'teks di pink lembut'],
  ['--muted', '--bg', 'teks sekunder di krem'],
  ['--muted', '--card', 'teks sekunder di kartu'],
  ['--muted', '--surface-muted', 'teks sekunder di permukaan redup'],
  ['--muted', '--primary-soft', 'teks sekunder di madu lembut'],
  ['--muted', '--info-soft', 'teks sekunder di biru lembut'],
  ['--on-accent', '--accent-strong', 'teks putih di ribbon pink'],
  ['--on-info', '--info-strong', 'teks putih di badge biru'],
  ['--success', '--bg', 'umpan balik benar di krem'],
  ['--success', '--card', 'umpan balik benar di kartu'],
  ['--success', '--secondary-soft', 'umpan balik benar di mint lembut'],
  ['--danger', '--danger-soft', 'umpan balik salah di pink lembut'],
  ['--danger', '--card', 'umpan balik salah di kartu'],
  ['--accent-strong', '--bg', 'penekanan angka di krem'],
  ['--accent-strong', '--card', 'penekanan angka di kartu'],
];

function parseTokens() {
  const tokens = new Map();

  for (const file of CSS_FILES) {
    let css;
    try {
      css = readFileSync(join(ROOT, file), 'utf8');
    } catch {
      continue;
    }

    // Komentar CSS sering memuat "4.5:1" / "3.6:1". Tanpa dibuang, titik dua di
    // komentar membuat deklarasi berikutnya salah dibaca dan token hilang.
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');

    for (const block of css.match(/:root\s*\{[^}]*\}/g) ?? []) {
      const body = block.slice(block.indexOf('{') + 1, block.lastIndexOf('}'));
      for (const declaration of body.split(';')) {
        const colon = declaration.indexOf(':');
        if (colon < 0) continue;
        const name = declaration.slice(0, colon).trim();
        const value = declaration.slice(colon + 1).trim();
        if (!name.startsWith('--') || !value) continue;
        tokens.set(name, value);
      }
    }
  }

  return tokens;
}

function resolveToken(name, tokens, depth = 0) {
  const raw = tokens.get(name);
  if (raw === undefined) return null;
  if (depth > 8) return null;

  const reference = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (reference) return resolveToken(reference[1], tokens, depth + 1);
  return raw;
}

function toRgb(value) {
  if (typeof value !== 'string') return null;
  const hex = value.trim().toLowerCase();

  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return [
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
      parseInt(hex[3] + hex[3], 16),
    ];
  }
  if (/^#[0-9a-f]{6}$/.test(hex)) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }
  const rgb = hex.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function luminance([r, g, b]) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const tokens = parseTokens();
const failures = [];

console.log(`[audit:contrast] ${tokens.size} token dibaca dari ${CSS_FILES.length} file CSS.`);

for (const [fgName, bgName, label] of PAIRS) {
  const fgValue = resolveToken(fgName, tokens);
  const bgValue = resolveToken(bgName, tokens);
  const fg = toRgb(fgValue);
  const bg = toRgb(bgValue);

  if (!fg || !bg) {
    failures.push({ label, ratio: 0, detail: `token tidak bisa dibaca (${fgName}/${bgName})` });
    continue;
  }

  const ratio = contrast(fg, bg);
  const status = ratio >= MIN_RATIO ? 'OK  ' : 'GAGAL';
  console.log(
    `  ${status} ${ratio.toFixed(2).padStart(5)}:1  ${fgName} di ${bgName} — ${label} (${fgValue} / ${bgValue})`,
  );

  if (ratio < MIN_RATIO) {
    failures.push({ label, ratio, detail: `${fgName} di ${bgName}` });
  }
}

if (failures.length > 0) {
  console.error('\n[audit:contrast] GAGAL — pasangan di bawah 4.5:1:');
  for (const failure of failures) {
    console.error(`  ✖ ${failure.detail} (${failure.label}) — ${failure.ratio.toFixed(2)}:1`);
  }
  process.exit(1);
}

console.log(`\n[audit:contrast] OK — ${PAIRS.length} pasangan >= ${MIN_RATIO}:1.`);
