import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Offline-first: tidak ada CDN, tidak ada remote asset. Semua aset masuk bundle
// dan SEMUA-nya di-precache service worker (tidak ada runtimeCaching sama sekali).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registrasi manual di src/platform/pwa.ts supaya bisa di-no-op-kan saat test.
      injectRegister: null,
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon-180.png'],
      manifest: {
        id: '/',
        name: 'Petualangan Angka',
        short_name: 'Petualangan Angka',
        description: 'Game hitung-hitungan offline untuk anak 5–8 tahun.',
        lang: 'id',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFF8E7',
        theme_color: '#FFF8E7',
        categories: ['education', 'games', 'kids'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache-all: seluruh hasil build (termasuk woff2 font) ikut di-install
        // saat service worker pertama kali aktif. Tidak ada glob untuk domain luar.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  // Base harus absolut ('/') supaya scope service worker = root aplikasi.
  // Di Capacitor (F5) webView tetap menyajikan app dari https://localhost/.
  base: '/',
  build: {
    target: 'es2019',
    assetsInlineLimit: 4096,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
