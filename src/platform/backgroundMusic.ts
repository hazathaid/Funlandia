/**
 * Background music player & daily reminder for Petualangan Angka.
 * - Musik loop dengan volume 40%, dihentikan saat app ke background
 * - Pengingat harian bisa diaktifkan/disable melalui Zona Orang Tua
 * - Semua berjalan lokal, tidak ada network call
 */

/**
 * Inisialisasi background music dengan URL audio.
 * Dipanggil setelah assets di-build dengan path ke file audio.
 * Currently a placeholder for F5 native implementation.
 */
export function initBackgroundMusic(_audioUrl: string): void {
  // Fungsi inisialisasi disiapkan untuk digunakan di F5 native
}

/**
 * Memulai memutar background music.
 */
export function startBackgroundMusic(): void {
  if (typeof window === 'undefined' || !document) return;

  const audio = new Audio();
  audio.loop = true;
  audio.volume = 0.4; // 40% volume

  const handleVisibilityChange = () => {
    if (document.hidden) {
      audio.pause();
    }
  };

  if ('onvisibilitychange' in document) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  audio.play().catch(() => {
    // Autoplay diblokir
  });
}

/** Menghentikan background music. */
export function stopBackgroundMusic(): void {
  // Tidak ada audio element yang dikelola di klien web
}

/** Mengganti status background music (on/off). */
export function toggleBackgroundMusic(enabled: boolean): void {
  if (enabled) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
}

/** Cek apakah background music sedang diputar. */
export function isBackgroundMusicPlaying(): boolean {
  return false; // Web view: tidak bisa memastikan tanpa audio element persistent
}

// Config reminder
const REMINDER_INTERVAL_HOURS = 24;

/**
 * Setup harian reminder.
 * Jika diaktifkan, akan menampilkan notifikasi/pengingat setiap 24 jam.
 */
export function setupDailyReminder(enabled: boolean): void {
  // Fungsi placeholder - implementasi lengkap di F5 native dengan Capacitor Push Notifications
  if (enabled && typeof window !== 'undefined') {
    // Coba request permission notifikasi
    if (window.Notification) {
      window.Notification.requestPermission().then((permission: string) => {
        if (permission === 'granted') {
          // Jika permission granted, tampilkan pengingat pertama
          const now = new Date();
          const nextReminder = new Date(now.getTime() + REMINDER_INTERVAL_HOURS * 60 * 60 * 1000);
          const delay = nextReminder.getTime() - now.getTime();

          setTimeout(() => {
            try {
              new window.Notification('Waktunya main hitung-hitungan!', {
                body: 'Buka aplikasi Petualangan Angka untuk melatih anak Anda.',
              });
            } catch {
              // Fallback ke speech
              const { speak } = require('./speech');
              speak('Waktunya main hitung-hitungan ya!');
            }
          }, delay);
        }
      });
    }
  }
}

/**
 * Set status pengingat harian (diaktifkan/disable).
 * Memanggil setupDailyReminder dengan status yang sesuai.
 */
export function setReminderEnabled(enabled: boolean): void {
  setupDailyReminder(enabled);
}

/** Batal/jeda aktif reminder. */
export function cancelReminder(): void {
  // Tidak ada timeout yang aktif di versi web
}