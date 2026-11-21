import { SKILL_FOR_MODE, type ChapterMode } from './questions';

/**
 * Definisi bab untuk vertical slice F1 + konten inti F2.
 * Bab terbuka bertahap: bab berikutnya baru terbuka setelah bab sebelumnya selesai.
 */
export interface Chapter {
  id: string;
  islandId: string;
  title: string;
  subtitle: string;
  mode: ChapterMode;
  skillId: string;
  size: number;
  cardId: string;
  cardName: string;
  /** Id bab yang harus selesai lebih dulu. Bab pertama tidak punya syarat. */
  requires?: string;
}

export interface Island {
  id: string;
  name: string;
  chapters: Chapter[];
}

export const CHAPTER_HITUNG_BUAH_ID = 'pulau-buah-bab-1';

function makeChapter(input: Omit<Chapter, 'skillId'>): Chapter {
  return { ...input, skillId: SKILL_FOR_MODE[input.mode] };
}

export const ISLAND: Island = {
  id: 'pulau-buah',
  name: 'Pulau Buah',
  chapters: [
    makeChapter({
      id: CHAPTER_HITUNG_BUAH_ID,
      islandId: 'pulau-buah',
      title: 'Hitung Buah',
      subtitle: '10 soal menghitung 1-10',
      mode: 'counting',
      size: 10,
      cardId: 'kiko',
      cardName: 'Kiko si Rubah',
    }),
    makeChapter({
      id: 'pulau-buah-bab-2',
      islandId: 'pulau-buah',
      title: 'Tambah Buah',
      subtitle: '10 soal tambah dalam 10',
      mode: 'addition',
      size: 10,
      cardId: 'kancil',
      cardName: 'Kancil',
      requires: CHAPTER_HITUNG_BUAH_ID,
    }),
    makeChapter({
      id: 'pulau-buah-bab-3',
      islandId: 'pulau-buah',
      title: 'Kurang Buah',
      subtitle: '10 soal kurang dalam 10',
      mode: 'subtraction',
      size: 10,
      cardId: 'burung',
      cardName: 'Burung Hantu',
      requires: 'pulau-buah-bab-2',
    }),
    makeChapter({
      id: 'pulau-buah-bab-4',
      islandId: 'pulau-buah',
      title: 'Mana Lebih Banyak',
      subtitle: '10 soal membandingkan',
      mode: 'compare',
      size: 10,
      cardId: 'rusa',
      cardName: 'Rusa',
      requires: 'pulau-buah-bab-3',
    }),
  ],
};

export const ALL_CHAPTERS: Chapter[] = ISLAND.chapters;

export function findChapter(chapterId: string): Chapter | undefined {
  return ALL_CHAPTERS.find((chapter) => chapter.id === chapterId);
}

/** Bab pertama selalu terbuka; sisanya menunggu bab prasyarat selesai. */
export function isChapterUnlocked(chapter: Chapter, completedChapters: string[]): boolean {
  if (!chapter.requires) return true;
  return completedChapters.includes(chapter.requires);
}

export function skillIdForChapter(chapterId: string): string {
  return findChapter(chapterId)?.skillId ?? SKILL_FOR_MODE.counting;
}

/** Nama kartu koleksi; id disimpan di save file. */
export const CARD_NAMES: Record<string, string> = {
  kiko: 'Kiko si Rubah',
  kancil: 'Kancil',
  burung: 'Burung Hantu',
  rusa: 'Rusa',
};

export const CARD_EMOJI: Record<string, string> = {
  kiko: '🦊',
  kancil: '🦌',
  burung: '🦉',
  rusa: '🦌',
};
