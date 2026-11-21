#!/usr/bin/env node
/**
 * Generator ikon placeholder PWA — TANPA dependency dan TANPA download.
 *
 * PNG ditulis manual (IHDR/IDAT/IEND + zlib) supaya repo tidak menyimpan blob
 * biner dan build tetap reproducible di mesin mana pun.
 * Jalankan otomatis oleh `predev` / `prebuild`, atau manual: `npm run icons`.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'icons');

// Sama dengan src/design/tokens.css
const CREAM = [255, 248, 231];
const HONEY = [255, 183, 3];
const NAVY = [43, 45, 66];

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = (CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolor + alpha
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function insideRoundedSquare(px, py, min, max, radius) {
  const cx = Math.min(Math.max(px, min + radius), max - radius);
  const cy = Math.min(Math.max(py, min + radius), max - radius);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/** Madu penuh, lingkaran navy di tengah, tiga titik krem = "menghitung buah". */
function sample(px, py, size, maskable) {
  if (!maskable) {
    const margin = size * 0.05;
    if (!insideRoundedSquare(px, py, margin, size - margin, size * 0.22)) return null;
  }

  const cx = size / 2;
  const cy = size / 2;
  const dx = px - cx;
  const dy = py - cy;
  const circle = size * 0.33;
  if (dx * dx + dy * dy > circle * circle) return HONEY;

  const dot = size * 0.062;
  for (const offset of [-0.135, 0, 0.135]) {
    const ddx = px - (cx + offset * size);
    if (ddx * ddx + dy * dy <= dot * dot) return CREAM;
  }
  return NAVY;
}

function renderIcon(size, { maskable = false } = {}) {
  const samples = size >= 512 ? 2 : 3;
  const out = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let hits = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          const color = sample(px, py, size, maskable);
          if (!color) continue;
          r += color[0];
          g += color[1];
          b += color[2];
          hits += 1;
        }
      }

      const index = (y * size + x) * 4;
      if (hits === 0) {
        out[index + 3] = 0;
        continue;
      }
      out[index] = Math.round(r / hits);
      out[index + 1] = Math.round(g / hits);
      out[index + 2] = Math.round(b / hits);
      out[index + 3] = Math.round((hits / (samples * samples)) * 255);
    }
  }

  return encodePng(size, size, out);
}

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Petualangan Angka">
  <rect x="2" y="2" width="60" height="60" rx="14" fill="#FFB703" stroke="#2B2D42" stroke-width="4"/>
  <circle cx="32" cy="32" r="20" fill="#2B2D42"/>
  <circle cx="23" cy="32" r="4" fill="#FFF8E7"/>
  <circle cx="32" cy="32" r="4" fill="#FFF8E7"/>
  <circle cx="41" cy="32" r="4" fill="#FFF8E7"/>
</svg>
`;

const TARGETS = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon-180.png', 180, {}],
];

mkdirSync(OUT_DIR, { recursive: true });

for (const [name, size, options] of TARGETS) {
  writeFileSync(join(OUT_DIR, name), renderIcon(size, options));
  console.log(`[icons] ${name} ${size}x${size}`);
}

writeFileSync(join(OUT_DIR, 'favicon.svg'), FAVICON);
console.log('[icons] favicon.svg');
