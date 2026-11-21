/**
 * Port audio (SFX + musik) — implementasi web untuk F0.
 *
 * Kenapa disintesis, bukan file: F0 harus nol byte unduhan dan nol request.
 * Efek suara di bawah dibuat dari oscillator Web Audio (tanpa aset, tanpa network).
 * Klip rekaman (narator, musik) masuk F3 lewat Howler dengan file yang di-bundle;
 * kontrak fungsi di file ini yang dipakai layar, jadi backend cukup ditukar.
 */

export type SfxName = 'tap' | 'correct' | 'wrong' | 'star' | 'card';

interface Tone {
  freq: number;
  ms: number;
  type?: OscillatorType;
  gain?: number;
}

interface SfxSpec {
  tones: Tone[];
}

const SFX: Record<SfxName, SfxSpec> = {
  tap: { tones: [{ freq: 660, ms: 70, type: 'triangle', gain: 0.1 }] },
  correct: {
    tones: [
      { freq: 784, ms: 90, type: 'triangle', gain: 0.12 },
      { freq: 988, ms: 90, type: 'triangle', gain: 0.12 },
      { freq: 1319, ms: 170, type: 'triangle', gain: 0.12 },
    ],
  },
  wrong: {
    tones: [
      { freq: 330, ms: 120, type: 'sine', gain: 0.1 },
      { freq: 262, ms: 170, type: 'sine', gain: 0.1 },
    ],
  },
  star: {
    tones: [
      { freq: 1047, ms: 80, type: 'sine', gain: 0.1 },
      { freq: 1568, ms: 140, type: 'sine', gain: 0.08 },
    ],
  },
  card: {
    tones: [
      { freq: 523, ms: 100, type: 'triangle', gain: 0.12 },
      { freq: 659, ms: 100, type: 'triangle', gain: 0.12 },
      { freq: 784, ms: 200, type: 'triangle', gain: 0.12 },
    ],
  },
};

type AudioContextCtor = typeof AudioContext;

let enabled = true;
let context: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (context) return context;
  if (typeof window === 'undefined') return null;

  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;

  if (!Ctor) return null;

  try {
    context = new Ctor();
  } catch {
    // WebView tanpa Web Audio: game tetap jalan tanpa SFX.
    context = null;
  }
  return context;
}

export function setSfxEnabled(next: boolean): void {
  enabled = next;
  if (!next && context) {
    try {
      void context.suspend();
    } catch {
      /* diabaikan */
    }
  }
}

export function isSfxEnabled(): boolean {
  return enabled;
}

/** Dipanggil pada gesture pertama anak (kebijakan autoplay browser). */
export async function unlockAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
  } catch {
    /* diabaikan */
  }
}

export function playSfx(name: SfxName): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    // Jangan blokir UI: resume berjalan sendiri, nada tetap dijadwalkan.
    void unlockAudio();
  }

  try {
    let at = ctx.currentTime + 0.01;
    for (const tone of SFX[name].tones) {
      const duration = tone.ms / 1000;
      const peak = tone.gain ?? 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = tone.type ?? 'triangle';
      osc.frequency.setValueAtTime(tone.freq, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + duration + 0.02);

      at += duration * 0.85;
    }
  } catch {
    // Audio tidak boleh pernah membuat game crash.
  }
}

export function stopAllSfx(): void {
  if (!context) return;
  try {
    void context.suspend();
  } catch {
    /* diabaikan */
  }
}

/** Hanya untuk test: lepas context supaya tiap test mulai dari nol. */
export function resetAudioForTests(): void {
  enabled = true;
  context = null;
}
