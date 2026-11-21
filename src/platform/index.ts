// eslint-disable react-refresh/only-export-components
/**
* eslint-disable react-refresh/only-export-components
 * Satu pintu untuk semua kemampuan platform.
 * Logika game hanya boleh bergantung pada modul ini / port di folder ini —
 * TIDAK boleh menyentuh localStorage, AudioContext, navigator.vibrate langsung.
 * Implementasi native (Capacitor) menyusul di F5 dengan kontrak yang sama.
 * ⚠️ eslintrc: fast refresh rule adjusted for utility module (bukan component)
 * eslint-disable react-refresh/only-export-components
 */
import { createWebSaveStore, type SaveStore } from './saveStore';
import { isSfxEnabled, playSfx, setSfxEnabled, unlockAudio, type SfxName } from './audio';
import { isHapticSupported, setHapticEnabled, vibrate } from './haptic';
import { getOrientation, type ScreenOrientationName } from './orientation';
import { configureAudio, isSpeechSupported } from './speech';
import { initBackgroundMusic, startBackgroundMusic, stopBackgroundMusic, toggleBackgroundMusic, isBackgroundMusicPlaying, setupDailyReminder, setReminderEnabled, cancelReminder } from './backgroundMusic';

export * from './audio';
export * from './haptic';
export * from './orientation';
export * from './saveStore';
export {
  speak,
  speakNumber,
  speakQuestion,
  numberToWord,
  FRUIT_LABELS,
  isSpeechSupported,
  speakInstruction,
} from './speech';

/**
* eslint-disable react-refresh/only-export-components
 * Satu sakelar untuk semua suara: narator (speech) + SFX (Web Audio).
 * Menghormati setting `sfxOn` di save file, jadi mute ikut tersimpan.
 */
export function setSoundEnabled(enabled: boolean): void {
  configureAudio({ enabled });
  setSfxEnabled(enabled);
}

/**
* eslint-disable react-refresh/only-export-components
 * Background music player & daily reminder for Petualangan Angka.
 * - Musik loop dengan volume 40%, dihentikan saat app ke background
 * - Pengingat harian bisa diaktifkan/disable melalui Zona Orang Tua
 * - Semua berjalan lokal, tidak ada network call
 */
export { initBackgroundMusic, startBackgroundMusic, stopBackgroundMusic, toggleBackgroundMusic, isBackgroundMusicPlaying, setupDailyReminder, setReminderEnabled, cancelReminder };

export interface PlatformInfo {
  saveStore: 'localStorage' | 'memory' | 'native';
  speech: boolean;
  sfx: boolean;
  haptic: boolean;
  orientation: ScreenOrientationName;
}

export function describePlatform(): PlatformInfo {
  const hasLocalStorage = (() => {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  })();

  return {
    saveStore: hasLocalStorage ? 'localStorage' : 'memory',
    speech: isSpeechSupported(),
    sfx: isSfxEnabled(),
    haptic: isHapticSupported(),
    orientation: getOrientation(),
  };
}

export interface Platform {
  createSaveStore: (appVersion: string) => SaveStore;
  playSfx: (name: SfxName) => void;
  unlockAudio: () => Promise<void>;
  vibrate: typeof vibrate;
  setSoundEnabled: typeof setSoundEnabled;
  setHapticEnabled: typeof setHapticEnabled;
  describe: typeof describePlatform;
  initBackgroundMusic: typeof initBackgroundMusic;
  startBackgroundMusic: typeof startBackgroundMusic;
  stopBackgroundMusic: typeof stopBackgroundMusic;
  toggleBackgroundMusic: typeof toggleBackgroundMusic;
  isBackgroundMusicPlaying: typeof isBackgroundMusicPlaying;
  setupDailyReminder: typeof setupDailyReminder;
  setReminderEnabled: typeof setReminderEnabled;
  cancelReminder: typeof cancelReminder;
}

export const platform: Platform = {
  createSaveStore: createWebSaveStore,
  playSfx,
  unlockAudio,
  vibrate,
  setSoundEnabled,
  setHapticEnabled,
  describe: describePlatform,
  initBackgroundMusic,
  startBackgroundMusic,
  stopBackgroundMusic,
  toggleBackgroundMusic,
  isBackgroundMusicPlaying,
  setupDailyReminder,
  setReminderEnabled,
  cancelReminder,
};