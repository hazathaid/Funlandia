/**
 * Port orientasi layar. Game didesain untuk portrait; di web, lock hanya bisa
 * saat fullscreen/terpasang (PWA), jadi semua fungsi di sini "best effort" dan
 * tidak pernah melempar error. Capacitor (F5) memakai ScreenOrientation plugin.
 */

export type ScreenOrientationName = 'portrait' | 'landscape';

export function getOrientation(): ScreenOrientationName {
  if (typeof window === 'undefined') return 'portrait';
  return window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape';
}

export async function lockOrientation(target: ScreenOrientationName): Promise<boolean> {
  if (typeof screen === 'undefined' || !screen.orientation) return false;
  const lock = (
    screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
  ).lock;
  if (typeof lock !== 'function') return false;

  try {
    await lock.call(screen.orientation, target);
    return true;
  } catch {
    // Browser menolak tanpa fullscreen — bukan kondisi fatal.
    return false;
  }
}

export async function unlockOrientation(): Promise<void> {
  if (typeof screen === 'undefined' || !screen.orientation) return;
  try {
    screen.orientation.unlock?.();
  } catch {
    /* diabaikan */
  }
}

export function onOrientationChange(
  listener: (orientation: ScreenOrientationName) => void,
): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const query = window.matchMedia('(orientation: portrait)');
  const handler = () => listener(query.matches ? 'portrait' : 'landscape');
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}
