import { describe, expect, it } from 'vitest';
import {
  ADDITION_SKILL_ID,
  COMPARE_SKILL_ID,
  DIVISION_SKILL_ID,
  MULTIPLICATION_SKILL_ID,
  SUBTRACTION_SKILL_ID,
  difficultyFromMastery,
  generateQuestions,
  type Difficulty,
} from './questions';

function validOptions(answer: number, options: number[], max = 10) {
  expect(options.length).toBeGreaterThanOrEqual(3);
  expect(options.length).toBeLessThanOrEqual(4);
  expect(new Set(options).size).toBe(options.length);
  expect(options).toContain(answer);
  expect(options.every((option) => option >= 1 && option <= max)).toBe(true);
}

describe('difficulty adaptif', () => {
  it('naik saat mastery tinggi', () => {
    expect(difficultyFromMastery(0)).toBe(0);
    expect(difficultyFromMastery(0.49)).toBe(0);
    expect(difficultyFromMastery(0.5)).toBe(1);
    expect(difficultyFromMastery(0.79)).toBe(1);
    expect(difficultyFromMastery(0.8)).toBe(2);
    expect(difficultyFromMastery(Number.NaN)).toBe(0);
  });
});

describe('generator soal F2', () => {
  it('tambah: jawaban = a + b, maksimal 10, deterministik', () => {
    const chapter = generateQuestions({ mode: 'addition', seed: 'seed-add', size: 10 });
    expect(chapter).toHaveLength(10);
    expect(chapter.every((question) => question.kind === 'addition')).toBe(true);

    for (const question of chapter) {
      if (question.kind !== 'addition') continue;
      expect(question.skillId).toBe(ADDITION_SKILL_ID);
      expect(question.answer).toBe(question.a + question.b);
      expect(question.answer).toBeLessThanOrEqual(10);
      validOptions(question.answer, question.options);
    }

    expect(generateQuestions({ mode: 'addition', seed: 'seed-add', size: 10 })).toEqual(chapter);
  });

  it('tambah level mudah memakai jumlah kecil', () => {
    const chapter = generateQuestions({
      mode: 'addition',
      seed: 'seed-add-easy',
      size: 10,
      difficulty: 0,
    });
    for (const question of chapter) {
      if (question.kind !== 'addition') continue;
      expect(question.answer).toBeLessThanOrEqual(5);
    }
  });

  it('kurang: jawaban = a - b dan tidak pernah 0', () => {
    const chapter = generateQuestions({ mode: 'subtraction', seed: 'seed-sub', size: 10 });
    expect(chapter).toHaveLength(10);

    for (const question of chapter) {
      if (question.kind !== 'subtraction') continue;
      expect(question.skillId).toBe(SUBTRACTION_SKILL_ID);
      expect(question.answer).toBe(question.a - question.b);
      expect(question.answer).toBeGreaterThanOrEqual(1);
      expect(question.a).toBeLessThanOrEqual(10);
      validOptions(question.answer, question.options);
    }
  });

  it('bandingkan: dua keranjang berbeda, jawaban = yang lebih banyak', () => {
    const chapter = generateQuestions({ mode: 'compare', seed: 'seed-cmp', size: 10 });
    expect(chapter).toHaveLength(10);

    for (const question of chapter) {
      if (question.kind !== 'compare') continue;
      expect(question.skillId).toBe(COMPARE_SKILL_ID);
      expect(question.left).not.toBe(question.right);
      expect(question.answer).toBe(Math.max(question.left, question.right));
      expect(question.options).toEqual([question.left, question.right]);
    }
  });

  it('hitung tetap kompatibel dengan F1', () => {
    const chapter = generateQuestions({ mode: 'counting', seed: 'seed-count', size: 10 });
    expect(chapter).toHaveLength(10);
    for (const question of chapter) {
      if (question.kind !== 'counting') continue;
      expect(question.answer).toBe(question.count);
      validOptions(question.answer, question.options);
    }
  });

  it('perkalian: produk benar, pilihan valid, dan deterministik', () => {
    const chapter = generateQuestions({ mode: 'multiplication', seed: 'seed-mul', size: 10 });
    expect(chapter).toHaveLength(10);
    for (const question of chapter) {
      if (question.kind !== 'multiplication') continue;
      expect(question.skillId).toBe(MULTIPLICATION_SKILL_ID);
      expect(question.answer).toBe(question.a * question.b);
      validOptions(question.answer, question.options, 100);
    }
    expect(generateQuestions({ mode: 'multiplication', seed: 'seed-mul', size: 10 })).toEqual(chapter);
  });

  it('pembagian: selalu habis dibagi, pilihan valid, dan deterministik', () => {
    const chapter = generateQuestions({ mode: 'division', seed: 'seed-div', size: 10 });
    expect(chapter).toHaveLength(10);
    for (const question of chapter) {
      if (question.kind !== 'division') continue;
      expect(question.skillId).toBe(DIVISION_SKILL_ID);
      expect(question.a % question.b).toBe(0);
      expect(question.answer).toBe(question.a / question.b);
      validOptions(question.answer, question.options);
    }
    expect(generateQuestions({ mode: 'division', seed: 'seed-div', size: 10 })).toEqual(chapter);
  });

  it('difficulty berbeda menghasilkan tingkat kesulitan berbeda', () => {
    const levels: Difficulty[] = [0, 1, 2];
    const compareMax = levels.map((difficulty) => {
      const chapter = generateQuestions({
        mode: 'compare',
        seed: 'seed-level',
        size: 10,
        difficulty,
      });
      return Math.max(
        ...chapter.flatMap((question) =>
          question.kind === 'compare' ? [question.left, question.right] : [],
        ),
      );
    });

    expect(compareMax[0]).toBeLessThanOrEqual(5);
    expect(compareMax[1]).toBeLessThanOrEqual(10);
    expect(compareMax[2]).toBeLessThanOrEqual(10);
  });
});
