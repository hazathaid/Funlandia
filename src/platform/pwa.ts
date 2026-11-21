/**
 * Registrasi service worker (vite-plugin-pwa, mode precache-all).
 * Sengaja tanpa console.log: console harus bersih (syarat checklist F1).
 * Kalau plugin tidak aktif (mode test / dev tanpa SW), registrasi tidak terjadi.
 */
import { registerSW } from 'virtual:pwa-register';

let registered = false;

export function registerServiceWorker(): void {
  if (registered || typeof window === 'undefined') return;
  registered = true;

  try {
    registerSW({
      immediate: true,
      onRegisterError(error: unknown) {
        if (import.meta.env.DEV) {
          console.warn('[pwa] service worker gagal didaftarkan', error);
        }
      },
    });
  } catch {
    // Offline tetap jalan selama app sudah ter-load; jangan sampai boot gagal.
  }
}
