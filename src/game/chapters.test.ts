import { describe, expect, it } from 'vitest';
import { ISLAND, isChapterUnlocked } from './chapters';

describe('progres level pulau buah', () => {
  it('naik berurutan dan tingkat minimumnya tidak menurun', () => {
    expect(ISLAND.chapters.map((chapter) => chapter.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(ISLAND.chapters.map((chapter) => chapter.difficultyFloor)).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it('hanya level pertama yang terbuka pada awal permainan', () => {
    expect(isChapterUnlocked(ISLAND.chapters[0], [])).toBe(true);
    expect(isChapterUnlocked(ISLAND.chapters[1], [])).toBe(false);
    expect(isChapterUnlocked(ISLAND.chapters[1], [ISLAND.chapters[0].id])).toBe(true);
  });
});
