import { describe, expect, it } from 'vitest';
import { buildProfileReport, minutesUsedThisWeek, minutesUsedToday } from './report';
import { createSaveFile, type SaveFile } from './saveModel';

const NOW = new Date('2026-11-21T12:00:00').getTime();

function makeSave(): SaveFile {
  const save = createSaveFile('0.1.0');
  save.profiles = [
    { id: 'p1', name: 'Aira', avatarId: 'rubah', age: '3', createdAt: 0 },
    { id: 'p2', name: 'Bima', avatarId: 'panda', age: '10', createdAt: 0 },
  ];
  save.skillProgress = {
    p1: [
      {
        skillId: 'count-1-10',
        mastery: 0.9,
        attempts: 20,
        lastPracticedAt: NOW,
        commonMistakes: [],
      },
      {
        skillId: 'add-within-10',
        mastery: 0.4,
        attempts: 6,
        lastPracticedAt: NOW,
        commonMistakes: [],
      },
    ],
  };
  save.dailyUsage = {
    '2026-11-21': 300,
    '2026-11-20': 120,
    '2026-11-01': 9999,
  };
  save.sessions = [
    {
      id: 's1',
      profileId: 'p1',
      startedAt: NOW - 60_000,
      endedAt: NOW,
      chapterId: 'pulau-buah-bab-1',
      itemsAnswered: 10,
      correctCount: 9,
      hintsUsed: 1,
      completedNaturally: true,
    },
    {
      id: 's2',
      profileId: 'p1',
      startedAt: NOW - 120_000,
      endedAt: NOW - 60_000,
      chapterId: 'pulau-buah-bab-2',
      itemsAnswered: 4,
      correctCount: 2,
      hintsUsed: 2,
      completedNaturally: false,
    },
    {
      id: 's3',
      profileId: 'p2',
      startedAt: NOW - 60_000,
      endedAt: NOW,
      chapterId: 'pulau-buah-bab-1',
      itemsAnswered: 10,
      correctCount: 10,
      hintsUsed: 0,
      completedNaturally: true,
    },
  ];
  return save;
}

describe('laporan Zona Orang Tua', () => {
  it('menghitung menit hari ini & minggu ini dari dailyUsage', () => {
    const save = makeSave();
    expect(minutesUsedToday(save, NOW)).toBe(5);
    expect(minutesUsedThisWeek(save, NOW)).toBe(7);
  });

  it('menggabungkan skill, sesi, dan completedNaturally per profil', () => {
    const report = buildProfileReport(makeSave(), 'p1', NOW);

    expect(report.sessionsThisWeek).toBe(2);
    expect(report.completedNaturallyRate).toBe(0.5);
    expect(report.minutesThisWeek).toBe(7);

    // Kurikulum lengkap tetap tampil walau belum pernah dilatih.
    expect(report.skills.map((skill) => skill.skillId)).toEqual([
      'count-1-10',
      'add-within-10',
      'sub-within-10',
      'compare-within-10',
    ]);

    const counting = report.skills.find((skill) => skill.skillId === 'count-1-10');
    const addition = report.skills.find((skill) => skill.skillId === 'add-within-10');
    const compare = report.skills.find((skill) => skill.skillId === 'compare-within-10');

    expect(counting?.mastery).toBe(0.9);
    expect(counting?.needsHelp).toBe(false);
    expect(addition?.needsHelp).toBe(true);
    expect(compare?.attempts).toBe(0);
    expect(report.needsHelp.map((skill) => skill.skillId)).toEqual(['add-within-10']);
  });

  it('profil tanpa progres menghasilkan laporan kosong yang aman', () => {
    const save = createSaveFile('0.1.0');
    const report = buildProfileReport(save, 'tidak-ada', NOW);
    expect(report.sessionsThisWeek).toBe(0);
    expect(report.completedNaturallyRate).toBe(0);
    expect(report.needsHelp).toEqual([]);
  });
});
