import {
  COUNTING_SKILL_ID as COUNTING_SKILL,
  FRUITS,
  generateChapter,
  type FruitId,
} from './counting';
import { createRng, shuffle, type Rng } from './rng';

/** Mode bab F2+. Semua mode memakai bentuk soal yang sama untuk state machine sesi. */
export type ChapterMode = 'counting' | 'addition' | 'subtraction' | 'compare' | 'multiplication' | 'division';

export const COUNTING_SKILL_ID = COUNTING_SKILL;
export const ADDITION_SKILL_ID = 'add-within-10';
export const SUBTRACTION_SKILL_ID = 'sub-within-10';
export const COMPARE_SKILL_ID = 'compare-within-10';
export const MULTIPLICATION_SKILL_ID = 'mult-within-100';
export const DIVISION_SKILL_ID = 'div-within-10';

export const SKILL_FOR_MODE: Record<ChapterMode, string> = {
  counting: COUNTING_SKILL_ID,
  addition: ADDITION_SKILL_ID,
  subtraction: SUBTRACTION_SKILL_ID,
  compare: COMPARE_SKILL_ID,
  multiplication: MULTIPLICATION_SKILL_ID,
  division: DIVISION_SKILL_ID,
};

/** 0 = mudah, 1 = sedang, 2 = sulit. Diturunkan dari mastery tersimpan. */
export type Difficulty = 0 | 1 | 2;

export function difficultyFromMastery(mastery: number): Difficulty {
  if (!Number.isFinite(mastery) || mastery < 0.5) return 0;
  if (mastery < 0.8) return 1;
  return 2;
}

export interface QuestionBase {
  /** Stabil per seed+index → aman dipakai sebagai React key maupun id soal. */
  id: string;
  kind: ChapterMode;
  skillId: string;
  /** Jawaban benar selalu berupa angka supaya state machine sesi tetap generik. */
  answer: number;
  options: number[];
}

/** Soal perhitungan biasa. */
export interface ComputationQuestion extends QuestionBase {
  kind: ChapterMode;
  skillId: string;
  /** Angka pertama kali (untuk komutatif: a * b atau a ÷ b = q) */
  a: number;
  /** Angka kedua (untuk pembagi) */
  b: number;
}

/** Soal perhitungan perkalian: a × b = answer */
export interface MultiplicationQuestion extends ComputationQuestion {
  kind: 'multiplication';
  skillId: typeof MULTIPLICATION_SKILL_ID;
  fruit: FruitId;
}

/** Soal perhitungan pembagian: a ÷ b = q (sampai habis) */
export interface DivisionQuestion extends ComputationQuestion {
  kind: 'division';
  skillId: typeof DIVISION_SKILL_ID;
  fruit: FruitId;
}

/** Gabungan semua tipe soal. */
export type GameQuestion =
  | CountingQuestion
  | AdditionQuestion
  | SubtractionQuestion
  | CompareQuestion
  | MultiplicationQuestion
  | DivisionQuestion;

export interface GenerateQuestionsInput {
  mode: ChapterMode;
  seed: string;
  size: number;
  difficulty?: Difficulty;
}

/** Generate soal sesuai mode. */
export function generateQuestions(input: GenerateQuestionsInput): GameQuestion[] {
  const difficulty = input.difficulty ?? 0;
  switch (input.mode) {
    case 'addition':
      return generateAddition(input.seed, input.size, difficulty);
    case 'subtraction':
      return generateSubtraction(input.seed, input.size, difficulty);
    case 'compare':
      return generateCompare(input.seed, input.size, difficulty);
    case 'counting':
    default:
      return generateCounting(input.seed, input.size);
    case 'multiplication':
      return generateMultiplication(input.seed, input.size, difficulty);
    case 'division':
      return generateDivision(input.seed, input.size, difficulty);
  }
}

function generateCounting(seed: string, size: number): CountingQuestion[] {
  return generateChapter(seed, size).map((question) => ({
    ...question,
    kind: 'counting',
    answer: question.count,
  }));
}

/**
 * Bangka opsi jawaban untuk soal komputasi.
 * Mengembalikan array pilihan yang diacak, selalu menyertakan jawaban benar.
 */
function buildNumericOptions(answer: number, rng: Rng, max = 100): number[] {
  const optionCount = answer <= 20 ? 3 : 4;
  const candidates: number[] = [];

  // Generate distractors dengan delta berbeda untuk tiap operasi
  const deltas = getDeltasForOperation(answer, max);
  for (const delta of deltas) {
    const value = answer + delta;
    if (value >= 1 && value <= max && value !== answer && !candidates.includes(value)) {
      candidates.push(value);
    }
  }

  const distractors = shuffle(candidates, rng).slice(0, optionCount - 1);
  for (let value = 1; value <= max && distractors.length < optionCount - 1; value += 1) {
    if (value !== answer && !distractors.includes(value)) distractors.push(value);
  }

  return shuffle([answer, ...distractors], rng);
}

/** Dapatkan daftar delta distractors berdasarkan operasi */
function getDeltasForOperation(answer: number, max: number): number[] {
  // Untuk perkalian: gunakan pembagi dan perkalian kecil
  // Untuk pembagian: gunakan pembilang dan perkalian kecil
  const deltas: number[] = [];

  // Coba beberapa delta yang mungkin
  for (const delta of [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5]) {
    // Cek apakah delta valid untuk answer ini
    let valid = false;

    if (answer >= 5 && answer <= max - 5) {
      valid = true;
    }

    if (valid && !deltas.includes(delta)) {
      deltas.push(delta);
    }
  }

  // Pastikan kita mendapat minimal 3 delta
  while (deltas.length < 3) {
    const last = deltas[deltas.length - 1] || 0;
    const next = last + (Math.sign(last) || 1) * (deltas.length + 1);
    if (!deltas.includes(next)) {
      deltas.push(next);
    }
  }

  return deltas.slice(0, 4);
}

/** Ambil `size` pasangan dari daftar kandidat; kalau kurang, ulangi secara deterministik. */
function samplePairs<T>(pairs: readonly T[], size: number, rng: Rng): T[] {
  if (pairs.length === 0) return [];
  const shuffled = shuffle(pairs, rng);
  const result = shuffled.slice(0, size);
  while (result.length < size) {
    result.push(shuffled[result.length % shuffled.length]);
  }
  return result;
}

function additionPairs(difficulty: Difficulty): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const maxOperand = difficulty === 0 ? 3 : 5;
  const minSum = difficulty === 2 ? 6 : 2;
  const maxSum = difficulty === 0 ? 5 : 10;

  for (let a = difficulty === 2 ? 2 : 1; a <= (difficulty === 2 ? 8 : maxOperand); a += 1) {
    for (let b = difficulty === 2 ? 2 : 1; b <= (difficulty === 2 ? 8 : maxOperand); b += 1) {
      const sum = a + b;
      if (sum >= minSum && sum <= maxSum) pairs.push([a, b]);
    }
  }

  return pairs;
}

function generateAddition(seed: string, size: number, difficulty: Difficulty): AdditionQuestion[] {
  const rng = createRng(`${seed}:addition`);
  return samplePairs(additionPairs(difficulty), size, rng).map(([a, b], index) => ({
    id: `${seed}-${index}`,
    kind: 'addition',
    skillId: ADDITION_SKILL_ID,
    fruit: rng.pick(FRUITS),
    a,
    b,
    answer: a + b,
    options: buildNumericOptions(a + b, rng, 10),
  }));
}

function subtractionPairs(difficulty: Difficulty): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const minA = difficulty === 0 ? 2 : difficulty === 1 ? 2 : 6;
  const maxA = difficulty === 0 ? 5 : 10;

  for (let a = minA; a <= maxA; a += 1) {
    for (let b = 1; b < a; b += 1) {
      if (a - b >= 1) pairs.push([a, b]);
    }
  }

  return pairs;
}

function generateSubtraction(
  seed: string,
  size: number,
  difficulty: Difficulty,
): SubtractionQuestion[] {
  const rng = createRng(`${seed}:subtraction`);
  return samplePairs(subtractionPairs(difficulty), size, rng).map(([a, b], index) => ({
    id: `${seed}-${index}`,
    kind: 'subtraction',
    skillId: SUBTRACTION_SKILL_ID,
    fruit: rng.pick(FRUITS),
    a,
    b,
    answer: a - b,
    options: buildNumericOptions(a - b, rng, 10),
  }));
}

function comparePairs(difficulty: Difficulty): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const min = difficulty === 0 ? 1 : difficulty === 1 ? 1 : 3;
  const max = difficulty === 0 ? 5 : 10;

  for (let left = min; left <= max; left += 1) {
    for (let right = min; right <= max; right += 1) {
      if (left === right) continue;
      if (difficulty === 2 && Math.abs(left - right) > 3) continue;
      pairs.push([left, right]);
    }
  }

  return pairs;
}

function generateCompare(seed: string, size: number, difficulty: Difficulty): CompareQuestion[] {
  const rng = createRng(`${seed}:compare`);
  return samplePairs(comparePairs(difficulty), size, rng).map(([leftBase, rightBase], index) => {
    const [left, right] = rng.next() < 0.5 ? [rightBase, leftBase] : [leftBase, rightBase];
    return {
      id: `${seed}-${index}`,
      kind: 'compare',
      skillId: COMPARE_SKILL_ID,
      fruit: rng.pick(FRUITS),
      left,
      right,
      answer: Math.max(left, right),
      options: [left, right] as [number, number],
    };
  });
}

/** Daftar pasangan faktor untuk perkalian per difficulty */
function multiplicationPairs(difficulty: Difficulty): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const maxFactor = difficulty === 0 ? 5 : difficulty === 1 ? 8 : 12;
  const minProduct = difficulty === 0 ? 2 : difficulty === 1 ? 6 : 10;
  const maxProduct = difficulty === 0 ? 10 : 50;

  for (let a = 1; a <= maxFactor; a += 1) {
    for (let b = 1; b <= maxFactor; b += 1) {
      const product = a * b;
      if (product >= minProduct && product <= maxProduct) pairs.push([a, b]);
    }
  }

  return pairs;
}

/** Daftar pasangan pembagi & pembilang untuk pembagian per difficulty */
function divisionPairs(difficulty: Difficulty): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const maxDivisor = difficulty === 0 ? 5 : difficulty === 1 ? 7 : 10;
  const minQuotient = difficulty === 0 ? 2 : difficulty === 1 ? 3 : 5;
  const maxQuotient = difficulty === 0 ? 5 : 10;

  for (let divisor = 1; divisor <= maxDivisor; divisor += 1) {
    for (let quotient = minQuotient; quotient <= maxQuotient; quotient += 1) {
      const dividend = divisor * quotient;
      if (dividend <= 100) pairs.push([divisor, quotient]);
    }
  }

  return pairs;
}

function generateMultiplication(
  seed: string,
  size: number,
  difficulty: Difficulty,
): MultiplicationQuestion[] {
  const rng = createRng(`${seed}:multiplication`);
  return samplePairs(multiplicationPairs(difficulty), size, rng).map(([a, b], index) => ({
    id: `${seed}-${index}`,
    kind: 'multiplication',
    skillId: MULTIPLICATION_SKILL_ID,
    fruit: rng.pick(FRUITS),
    a,
    b,
    answer: a * b,
    options: buildNumericOptions(a * b, rng, 100),
  }));
}

function generateDivision(
  seed: string,
  size: number,
  difficulty: Difficulty,
): DivisionQuestion[] {
  const rng = createRng(`${seed}:division`);
  return samplePairs(divisionPairs(difficulty), size, rng).map(([divisor, quotient], index) => ({
    id: `${seed}-${index}`,
    kind: 'division',
    skillId: DIVISION_SKILL_ID,
    fruit: rng.pick(FRUITS),
    a: divisor * quotient, // pembilang
    b: divisor, // pembagi
    answer: quotient,
    options: buildNumericOptions(quotient, rng, 10),
  }));
}

/** Ambil `size` pasangan dari daftar kandidat; kalau kurang, ulangi secara deterministik. */
function samplePairs<T>(pairs: readonly T[], size: number, rng: Rng): T[] {
  if (pairs.length === 0) return [];
  const shuffled = shuffle(pairs, rng);
  const result = shuffled.slice(0, size);
  while (result.length < size) {
    result.push(shuffled[result.length % shuffled.length]);
  }
  return result;
}