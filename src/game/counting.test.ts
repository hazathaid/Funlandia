import { describe, expect, it } from 'vitest';
import { generateChapter } from './counting';

describe('generator soal Hitung Buah', () => {
  const chapter = generateChapter('seed-abc', 10);

  it('berisi 10 soal dengan jumlah 1-10 tanpa duplikat', () => {
    expect(chapter).toHaveLength(10);
    expect([...chapter.map((question) => question.count)].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('deterministik: seed sama menghasilkan soal sama (resume setelah refresh)', () => {
    expect(generateChapter('seed-abc', 10)).toEqual(chapter);
  });

  it('setiap soal punya 3-4 pilihan valid dan memuat jawaban benar', () => {
    for (const question of chapter) {
      expect(question.options.length).toBeGreaterThanOrEqual(3);
      expect(question.options.length).toBeLessThanOrEqual(4);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options).toContain(question.count);
      expect(question.options.every((option) => option >= 1 && option <= 10)).toBe(true);
    }
  });
});
