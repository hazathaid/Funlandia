/**
 * Port haptic (getar). Web memakai Vibration API; di Capacitor (F5) tinggal
 * ganti implementasi dengan Haptics plugin — pemanggil tidak berubah.
 *
 * Aturan produk: getar hanya untuk umpan balik halus, tidak pernah panjang/keras.
 */

export type HapticPattern = 'tap' | 'soft' | 'correct' | 'nudge';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  soft: [16, 40, 16],
  correct: [12, 48, 12],
  nudge: 24,
};

let enabled = true;

export function setHapticEnabled(next: boolean): void {
  enabled = next;
}

export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function vibrate(pattern: HapticPattern = 'tap'): boolean {
  if (!enabled || !isHapticSupported()) return false;
  try {
    return navigator.vibrate(PATTERNS[pattern]);
  } catch {
    return false;
  }
}

/** Hanya untuk test. */
export function resetHapticForTests(): void {
  enabled = true;
}
