import { beforeEach, describe, expect, it } from 'vitest';
import { isSfxEnabled, playSfx, resetAudioForTests, setSfxEnabled, unlockAudio } from './audio';
import { isHapticSupported, resetHapticForTests, setHapticEnabled, vibrate } from './haptic';
import { getOrientation, onOrientationChange } from './orientation';
import { describePlatform, setSoundEnabled } from './index';

describe('platform/audio', () => {
  beforeEach(() => resetAudioForTests());

  it('tidak melempar saat Web Audio tidak tersedia (jsdom)', () => {
    expect(() => playSfx('correct')).not.toThrow();
    expect(() => playSfx('wrong')).not.toThrow();
  });

  it('menghormati mute', () => {
    setSfxEnabled(false);
    expect(isSfxEnabled()).toBe(false);
    setSfxEnabled(true);
    expect(isSfxEnabled()).toBe(true);
  });

  it('unlockAudio aman tanpa AudioContext', async () => {
    await expect(unlockAudio()).resolves.toBeUndefined();
  });
});

describe('platform/haptic', () => {
  beforeEach(() => resetHapticForTests());

  it('no-op (false) kalau Vibration API tidak ada', () => {
    expect(isHapticSupported()).toBe(false);
    expect(vibrate('soft')).toBe(false);
  });

  it('bisa dimatikan lewat setting', () => {
    setHapticEnabled(false);
    expect(vibrate('tap')).toBe(false);
  });
});

describe('platform/orientation', () => {
  it('melaporkan orientasi yang valid', () => {
    expect(['portrait', 'landscape']).toContain(getOrientation());
  });

  it('onOrientationChange mengembalikan unsubscribe', () => {
    const off = onOrientationChange(() => undefined);
    expect(typeof off).toBe('function');
    off();
  });
});

describe('platform/index', () => {
  it('setSoundEnabled menyalakan/mematikan SFX dan narator tanpa error', () => {
    expect(() => setSoundEnabled(false)).not.toThrow();
    expect(isSfxEnabled()).toBe(false);
    expect(() => setSoundEnabled(true)).not.toThrow();
    expect(isSfxEnabled()).toBe(true);
  });

  it('describePlatform melaporkan kemampuan runtime', () => {
    const info = describePlatform();
    expect(['localStorage', 'memory', 'native']).toContain(info.saveStore);
    expect(typeof info.speech).toBe('boolean');
    expect(['portrait', 'landscape']).toContain(info.orientation);
  });
});
