import { describe, expect, it } from 'vitest';
import { advance, answer, createRun, type RunState } from '../game/session';
import { applySessionOutcome } from './progress';
import { createSaveFile, migrate } from './saveModel';

function finishedRun(): RunState {
  let run = createRun({
    sessionId: 'sess-1',
    profileId: 'p1',
    chapterId: 'pulau-buah-bab-1',
    seed: 'seed-abc',
    size: 2,
    now: 1000,
  });

  run = advance(answer(run, 1, 1), 2000);
  run = advance(answer(run, 1, 1), 4000);
  return run;
}

describe('menyimpan hasil sesi', () => {
  it('bab selesai → completedNaturally true, kartu & bab tercatat, activeRun dibersihkan', () => {
    const save = createSaveFile('0.1.0');
    const next = applySessionOutcome(save, {
      run: finishedRun(),
      endedAt: 5000,
      completedNaturally: true,
      cardId: 'kiko',
      activeRun: null,
    });

    expect(next.sessions).toHaveLength(1);
    expect(next.sessions[0]?.completedNaturally).toBe(true);
    expect(next.sessions[0]?.itemsAnswered).toBe(2);
    expect(next.completedChapters).toEqual(['pulau-buah-bab-1']);
    expect(next.collection).toEqual(['kiko']);
    expect(next.activeRun).toBeNull();
    expect(next.skillProgress.p1?.[0]?.mastery).toBeGreaterThan(0);
    expect(Object.values(next.dailyUsage)[0]).toBe(4); // 1000ms → 5000ms
  });

  it('mastery dicatat per skill mode, bukan selalu skill menghitung', () => {
    let run = createRun({
      sessionId: 'sess-add',
      profileId: 'p1',
      chapterId: 'pulau-buah-bab-2',
      seed: 'seed-add',
      size: 2,
      difficulty: 1,
      now: 1000,
    });

    run = advance(answer(run, 1, 1), 2000);
    run = advance(answer(run, 1, 1), 4000);

    const next = applySessionOutcome(createSaveFile('0.1.0'), {
      run,
      endedAt: 5000,
      completedNaturally: true,
      cardId: 'kancil',
      activeRun: null,
    });

    expect(next.skillProgress.p1?.map((skill) => skill.skillId)).toEqual(['add-within-10']);
    expect(next.completedChapters).toEqual(['pulau-buah-bab-2']);
    expect(next.collection).toEqual(['kancil']);
  });

  it('berhenti di tengah bab → completedNaturally false, tanpa kartu', () => {
    const save = createSaveFile('0.1.0');
    const run = answer(
      createRun({
        sessionId: 'sess-2',
        profileId: 'p1',
        chapterId: 'pulau-buah-bab-1',
        seed: 'seed-abc',
        size: 10,
        now: 1000,
      }),
      1,
      2,
    );

    const next = applySessionOutcome(save, {
      run,
      endedAt: 2000,
      completedNaturally: false,
      cardId: 'kiko',
      activeRun: null,
    });

    expect(next.sessions[0]?.completedNaturally).toBe(false);
    expect(next.completedChapters).toEqual([]);
    expect(next.collection).toEqual([]);
  });

  it('migrasi save mempertahankan progres bab & status sesi', () => {
    const migrated = migrate(
      {
        schemaVersion: 1,
        profiles: [{ id: 'p1', name: 'Aira', avatarId: 'rubah', ageGroup: '5-6' }],
        completedChapters: ['pulau-buah-bab-1'],
        collection: ['kiko'],
        sessions: [
          {
            id: 'sess-1',
            profileId: 'p1',
            chapterId: 'pulau-buah-bab-1',
            startedAt: 1000,
            endedAt: 5000,
            itemsAnswered: 10,
            correctCount: 9,
            hintsUsed: 1,
            completedNaturally: true,
          },
        ],
        settings: { sfxOn: false },
      },
      '0.1.0',
    );

    expect(migrated.profiles).toHaveLength(1);
    expect(migrated.completedChapters).toEqual(['pulau-buah-bab-1']);
    expect(migrated.collection).toEqual(['kiko']);
    expect(migrated.sessions[0]?.completedNaturally).toBe(true);
    expect(migrated.settings.sfxOn).toBe(false); // preferensi mute ikut tersimpan
    expect(migrated.activeRun).toBeNull();
  });

  it('save korup tetap menghasilkan save baru yang bisa dimainkan', () => {
    const migrated = migrate('bukan-json', '0.1.0');
    expect(migrated.profiles).toEqual([]);
    expect(migrated.schemaVersion).toBe(1);
  });
});
