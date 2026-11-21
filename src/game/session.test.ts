import { describe, expect, it } from 'vitest';
import {
  advance,
  answer,
  createRun,
  fromActiveRun,
  isActiveRunLike,
  retry,
  toActiveRun,
  type ActiveRun,
} from './session';

function newRun() {
  return createRun({
    sessionId: 'sess-1',
    profileId: 'p1',
    chapterId: 'pulau-buah-bab-1',
    seed: 'seed-abc',
    size: 3,
    now: 1000,
  });
}

describe('sesi satu bab', () => {
  it('jawaban salah memberi bantuan dan soal tidak terkunci', () => {
    const run = newRun();
    const wrong = answer(run, 2, 3);

    expect(wrong.feedback).toBe('wrong');
    expect(wrong.hintStage).toBe(1);
    expect(wrong.hintsUsed).toBe(1);
    // selama animasi getar belum selesai, tap tambahan diabaikan
    expect(answer(wrong, 3, 3)).toBe(wrong);

    const retried = retry(wrong);
    expect(retried.feedback).toBe('none');
    expect(retried.selected).toBeNull();
    expect(retried.hintStage).toBe(1); // bantuan tidak direset = anak tidak dihukum

    const right = answer(retried, 3, 3);
    expect(right.feedback).toBe('correct');
    expect(right.correctCount).toBe(1);
    expect(right.attempts).toBe(2);
  });

  it('retry hanya berlaku untuk feedback salah', () => {
    const run = newRun();
    expect(retry(run)).toBe(run);
    const right = answer(run, 1, 1);
    expect(retry(right)).toBe(right);
  });

  it('tahap bantuan 3 mengulang soal serupa lalu bab selesai', () => {
    let run = newRun();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      run = retry(answer(run, attempt + 1, 5));
    }
    expect(run.hintStage).toBe(3);
    expect(run.requeuePending).toBe(0);

    run = advance(answer(run, 5, 5), 2000);
    expect(run.requeued).toEqual([0]);
    expect(run.queue).toEqual([0, 1, 2, 0]);
    expect(run.cursor).toBe(1);

    let clock = 3000;
    while (run.status === 'playing') {
      run = advance(answer(run, 5, 5), clock);
      clock += 1000;
    }

    expect(run.status).toBe('finished');
    expect(run.finishedAt).not.toBeNull();
    expect(run.cursor).toBe(run.queue.length - 1);
  });

  it('sesi bisa disimpan dan dilanjutkan setelah refresh', () => {
    const run = advance(answer(newRun(), 1, 1), 2000);
    const active = toActiveRun(run);

    expect(isActiveRunLike(active)).toBe(true);

    const restored = fromActiveRun(active);
    expect(restored.cursor).toBe(1);
    expect(restored.queue).toEqual(run.queue);
    expect(restored.feedback).toBe('none');
    expect(restored.status).toBe('playing');
  });

  it('tingkat kesulitan adaptif ikut tersimpan saat resume', () => {
    const run = createRun({
      sessionId: 'sess-2',
      profileId: 'p1',
      chapterId: 'pulau-buah-bab-2',
      seed: 'seed-add',
      size: 3,
      difficulty: 2,
      now: 1000,
    });

    expect(run.difficulty).toBe(2);
    expect(fromActiveRun(toActiveRun(run)).difficulty).toBe(2);
    // Save lama tanpa field difficulty tetap diterima dan jatuh ke level mudah.
    const legacy = { ...toActiveRun(run) } as Record<string, unknown>;
    delete legacy.difficulty;
    expect(isActiveRunLike(legacy)).toBe(true);
    expect(fromActiveRun(legacy as unknown as ActiveRun).difficulty).toBe(0);
  });

  it('activeRun korup ditolak (cursor di luar queue)', () => {
    const active = toActiveRun(advance(answer(newRun(), 1, 1), 2000));
    expect(isActiveRunLike({ ...active, cursor: 99 })).toBe(false);
    expect(isActiveRunLike({ ...active, queue: ['a'] })).toBe(false);
    expect(isActiveRunLike(null)).toBe(false);
  });
});
