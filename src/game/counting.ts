import { createRng, shuffle, type Rng } from './rng';

/** Skill level 1 di kurikulum: membilang 1-10 dengan objek konkret. */
export const COUNTING_SKILL_ID = 'count-1-10';

export const FRUITS = ['apel', 'pisang', 'jeruk', 'stroberi', 'anggur', 'semangka'] as const;
export type FruitId = (typeof FRUITS)[number];

export interface CountingQuestion {
  /** Stabil per seed+index → aman dipakai sebagai React key maupun id soal. */
  id: string;
  skillId: typeof COUNTING_SKILL_ID;
  fruit: FruitId;
  count: number;
  options: number[];
}

/** Satu bab = 10 soal, jumlah 1-10 muncul tepat sekali (tidak ada soal duplikat). */
export const CHAPTER_SIZE = 10;

function buildOptions(count: number, rng: Rng): number[] {
  // Anak 5 tahun: maksimal 4 pilihan, minimal 3 supaya bukan soal tebak-tebakan.
  const optionCount = count <= 5 ? 3 : 4;
  const nearMisses = [count - 1, count + 1, count - 2, count + 2, count - 3, count + 3].filter(
    (n) => n >= 1 && n <= 10,
  );

  const distractors: number[] = [];
  for (const n of shuffle(nearMisses, rng)) {
    if (distractors.length >= optionCount - 1) break;
    if (n !== count && !distractors.includes(n)) distractors.push(n);
  }

  // Jaring pengaman: kalau pengecoh masuk akal kurang, ambil angka lain yang valid.
  for (let n = 1; n <= 10 && distractors.length < optionCount - 1; n += 1) {
    if (n !== count && !distractors.includes(n)) distractors.push(n);
  }

  return shuffle([count, ...distractors], rng);
}

/**
 * Generate satu bab deterministik dari seed.
 * Jumlah soal 1..10 diacak urutannya, jadi setiap bab selalu lengkap dan tanpa duplikat.
 */
export function generateChapter(seed: string, size: number = CHAPTER_SIZE): CountingQuestion[] {
  const rng = createRng(seed);
  const counts = shuffle(
    Array.from({ length: 10 }, (_, i) => i + 1),
    rng,
  ).slice(0, Math.min(size, 10));

  return counts.map((count, index) => ({
    id: `${seed}-${index}`,
    skillId: COUNTING_SKILL_ID,
    fruit: rng.pick(FRUITS),
    count,
    options: buildOptions(count, rng),
  }));
}
