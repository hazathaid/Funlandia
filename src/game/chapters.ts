import { SKILL_FOR_MODE, type ChapterMode, type Difficulty } from './questions';

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
  /** Level yang terlihat oleh anak; makin tinggi, soal minimumnya makin menantang. */
  level: number;
  difficultyFloor: Difficulty;
  /** Cerita singkat dari Kisah Rasulullah terkait materi bab. */
  story?: string;
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
      level: 1,
      difficultyFloor: 0,
      story: 'Ketika Nabi Muhammad SAW menghitung hari di langit, Ia mengajarkan kita menghayati setiap nikmat Allah dengan terima kasih.',
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
      level: 2,
      difficultyFloor: 0,
      requires: CHAPTER_HITUNG_BUAH_ID,
      story: 'Salah satu saat, Nabi Muhammad SAW membagi 7 buah kurma kepada cada sahabat. Setiap orang mendapat yang sama. Begitupun dengan memberi kepada anak-anak, kita harus dapat membagi dengan adil dan sepantasnya.',
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
      level: 3,
      difficultyFloor: 1,
      requires: 'pulau-buah-bab-2',
      story: 'Ketika seseorang memberikan sedekah, barangnya sedikit berkurang tapi pahalanya bertambah banyak. Seperti firasat Nabi yang selalu mengajarkan kita memberi dengan hati yang sukma.',
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
      level: 4,
      difficultyFloor: 1,
      requires: 'pulau-buah-bab-3',
      story: "Nabi Muhammad SAW pernah membandingkan orang yang membaca Al-Qur'an dengan buah yang segar. Ia mengajarkan bahwa yang terberat di panggalan adalah amal saleh dan ketakwaan kepada Allah.",
    }),
    makeChapter({
      id: 'pulau-buah-bab-5',
      islandId: 'pulau-buah',
      title: 'Kali Buah',
      subtitle: '10 soal perkalian mudah',
      mode: 'multiplication',
      size: 10,
      cardId: 'lebah',
      cardName: 'Lebah',
      level: 5,
      difficultyFloor: 2,
      requires: 'pulau-buah-bab-4',
      story: 'Nabi Muhammad SAW mengajarkan bahwa amal saleh seperti membagi makanan bermanfaat, setiap kali kita memberikan, pahalanya dikalikali oleh Allah yang Maha Penghasil.',
    }),
    makeChapter({
      id: 'pulau-buah-bab-6',
      islandId: 'pulau-buah',
      title: 'Bagi Buah',
      subtitle: '10 soal pembagian mudah',
      mode: 'division',
      size: 10,
      cardId: 'monyet',
      cardName: 'Monyet',
      level: 6,
      difficultyFloor: 2,
      requires: 'pulau-buah-bab-5',
      story: 'Hadis Shahih: "Nabi Muhammad SAW membagi 7 buah kurma kepada setiap sahabat." Ia mengajarkan kita membagi dengan adil, sehingga setiap orang mendapat bagian yang sama dan merasa bahagia.',
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
  lebah: 'Lebah',
  monyet: 'Monyet',
};

export const CARD_EMOJI: Record<string, string> = {
  kiko: '🦊',
  kancil: '🦌',
  burung: '🦉',
  rusa: '🦌',
  lebah: '🐝',
  monyet: '🐒',
};
