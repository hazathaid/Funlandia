/**
 * Narator sederhana: mendukung audio bundle + Web Speech API (id-ID) sebagai fallback F1.
 * Audio bundle berisi klip-rekaman yang sudah di-embed di aplikasi (tanpa network).
 * Jika audio bundle tidak tersedia, gunakan Web Speech Synthesis sebagai fallback.
 * Tidak ada network call — semuanya berjalan lokal di WebView.
 */
import { setSfxEnabled } from './audio';

export const NUMBER_WORDS = [
  'nol',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
] as const;

export let enabled = true;

// Peta nama klip ke URL audio lokal (disetel setelah assets di-build)
// Contoh: {'number-1': '/assets/audio/number-1.mp3'}
export const audioClips: Record<string, string> = {};

// Elemen audio yang sudah dimuat
export const audioElements: Record<string, HTMLAudioElement> = {};

// Voice cache untuk Web Speech Synthesis
let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesBound = false;

/**
 * Memuat peta klip audio dari objek URL.
 * Dipanggil setelah build saat assets tersedia.
 */
export function loadAudioClips(clips: Record<string, string>): void {
  for (const [key, src] of Object.entries(clips)) {
    const audio = new Audio(src);
    audioElements[key] = audio;
  }
}

/**
 * Memainkan klip audio berdasarkan key.
 * Jika klip tidak tersedia atau gagal diputar, fallback ke Web Speech Synthesis.
 */
export function playAudioClip(key: string, fallbackText?: string): boolean {
  const audio = audioElements[key];
  if (audio && audio.src) {
    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Audio dimulai successfully
        }).catch(() => {
          // Autoplay diblokir, fallback ke speech synthesis
          if (fallbackText) speak(fallbackText);
        });
      }
      return true;
    } catch {
      // Ignore play errors
    }
  }
  // Fallback ke Web Speech Synthesis
  if (fallbackText) {
    speak(fallbackText);
    return false;
  }
  return false;
}

/**
 * Sakelar audio tunggal: narator + SFX. Dipanggil dari GameProvider saat boot,
 * tombol mute, dan perubahan setting di Zona Orang Tua.
 */
export function configureAudio(next: { enabled: boolean }): void {
  enabled = next.enabled;
  setSfxEnabled(next.enabled);

  if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* diabaikan */
    }
  }
}

/**
 * Narator sederhana: Web Speech API (id-ID) sebagai fallback F1.
 * Nanti di F3 diganti klip rekaman yang di-bundle, tapi antarmuka ini tetap.
 * Tidak ada network call — speech synthesis berjalan lokal di WebView.
 */
export function speak(text: string, options?: { rate?: number; pitch?: number }): void {
  if (!enabled || !text) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = options?.rate ?? 0.85;
    utterance.pitch = options?.pitch ?? 1.1;
    utterance.volume = 1;
    const voice = pickIndonesianVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Audio tidak boleh membuat game crash.
  }
}

export function isAudioEnabled(): boolean {
  return enabled;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickIndonesianVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((voice) => voice.lang === 'id-ID') ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('id')) ??
    null;

  if (!cachedVoice && !voicesBound) {
    voicesBound = true;
    // Di Android daftar voice sering baru terisi setelah event ini.
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedVoice = null;
      pickIndonesianVoice();
    });
  }

  return cachedVoice;
}

export function speakNumber(value: number): void {
  speak(numberToWord(value), { rate: 0.9, pitch: 1.15 });
}

export function speakQuestion(input: { fruitLabel: string; count: number }): void {
  speak(`Ada berapa ${input.fruitLabel}? Ketuk satu-satu ya.`);
}

export function speakInstruction(input: InstructionInput): void {
  const { fruitLabel, count } = input;
  const key = `instruction-${count}`;
  playAudioClip(key, `Ada berapa ${fruitLabel}? Ketuk satu-satu ya.`);
}

export interface InstructionInput {
  fruitLabel: string;
  count: number;
}

export const FRUIT_LABELS: Record<string, string> = {
  apel: 'apel',
  pisang: 'pisang',
  jeruk: 'jeruk',
  stroberi: 'stroberi',
  anggur: 'anggur',
  semangka: 'semangka',
};

export function numberToWord(value: number): string {
  return NUMBER_WORDS[value] ?? String(value);
}