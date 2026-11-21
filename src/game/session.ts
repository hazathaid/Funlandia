import type { Difficulty } from './questions';

/**
 * State machine satu bab (framework-agnostic, tanpa React).
 * Semua transisi pure supaya bisa di-unit-test dan gampang di-resume setelah refresh.
 */
export type HintStage = 0 | 1 | 2 | 3;
export type Feedback = 'none' | 'correct' | 'wrong';

export interface RunState {
  sessionId: string;
  chapterId: string;
  profileId: string;
  seed: string;
  /** Tingkat kesulitan adaptif yang dipilih saat bab dimulai. */
  difficulty: Difficulty;
  /** Urutan indeks soal pada hasil generateChapter(seed). Bisa berisi soal yang diulang. */
  queue: number[];
  cursor: number;
  attempts: number;
  correctCount: number;
  hintsUsed: number;
  hintStage: HintStage;
  feedback: Feedback;
  selected: number | null;
  requeued: number[];
  requeuePending: number | null;
  startedAt: number;
  finishedAt: number | null;
  status: 'playing' | 'finished';
}

/** Bentuk ringkas yang disimpan di save file (bisa dibaca ulang tanpa duplikasi soal). */
export interface ActiveRun {
  sessionId: string;
  chapterId: string;
  profileId: string;
  seed: string;
  /** Opsional agar save lama (sebelum F2) tetap bisa dibaca. */
  difficulty?: Difficulty;
  queue: number[];
  cursor: number;
  attempts: number;
  correctCount: number;
  hintsUsed: number;
  startedAt: number;
  requeued: number[];
}

export interface CreateRunInput {
  sessionId: string;
  profileId: string;
  chapterId: string;
  seed: string;
  size?: number;
  difficulty?: Difficulty;
  now: number;
}

export function createRun(input: CreateRunInput): RunState {
  const size = input.size ?? 10;
  return {
    sessionId: input.sessionId,
    chapterId: input.chapterId,
    profileId: input.profileId,
    seed: input.seed,
    difficulty: input.difficulty ?? 0,
    queue: Array.from({ length: size }, (_, index) => index),
    cursor: 0,
    attempts: 0,
    correctCount: 0,
    hintsUsed: 0,
    hintStage: 0,
    feedback: 'none',
    selected: null,
    requeued: [],
    requeuePending: null,
    startedAt: input.now,
    finishedAt: null,
    status: 'playing',
  };
}

export function currentQuestionIndex(run: RunState): number {
  return run.queue[run.cursor] ?? 0;
}

export function isLastQuestion(run: RunState): boolean {
  return run.cursor + 1 >= run.queue.length;
}

/**
 * Anak menekan salah satu pilihan jawaban.
 * Benar -> feedback 'correct'. Salah -> naik satu tahap bantuan (maks 3).
 */
export function answer(run: RunState, option: number, correct: number): RunState {
  if (run.status !== 'playing' || run.feedback !== 'none') return run;

  const attempts = run.attempts + 1;

  if (option === correct) {
    return {
      ...run,
      attempts,
      selected: option,
      feedback: 'correct',
      correctCount: run.correctCount + 1,
    };
  }

  const hintStage = (run.hintStage < 3 ? run.hintStage + 1 : 3) as HintStage;
  const stageAdvanced = hintStage !== run.hintStage;
  const currentIndex = run.queue[run.cursor] ?? null;

  return {
    ...run,
    attempts,
    selected: option,
    feedback: 'wrong',
    hintStage,
    hintsUsed: run.hintsUsed + (stageAdvanced ? 1 : 0),
    // Tahap 3 = jawaban sudah ditunjukkan → soal serupa dijadwalkan ulang sekali.
    requeuePending:
      stageAdvanced && hintStage === 3 && currentIndex !== null ? currentIndex : run.requeuePending,
  };
}

/**
 * Anak sudah melihat getar halus "belum tepat" → soal yang sama dibuka lagi.
 * Bantuan (hintStage) TIDAK direset: anak tidak pernah dihukum, hanya dibantu.
 * Tanpa ini soal akan terkunci setelah satu jawaban salah.
 */
export function retry(run: RunState): RunState {
  if (run.status !== 'playing' || run.feedback !== 'wrong') return run;
  return { ...run, feedback: 'none', selected: null };
}

/** Maju ke soal berikutnya (dipanggil UI setelah animasi umpan balik selesai). */
export function advance(run: RunState, now: number): RunState {
  if (run.status !== 'playing' || run.feedback === 'none') return run;

  let queue = run.queue;
  let requeued = run.requeued;

  if (run.requeuePending !== null && !run.requeued.includes(run.requeuePending)) {
    const insertAt = Math.min(run.cursor + 3, queue.length);
    queue = [
      ...queue.slice(0, insertAt),
      run.requeuePending,
      ...queue.slice(insertAt),
    ];
    requeued = [...run.requeued, run.requeuePending];
  }

  const nextCursor = run.cursor + 1;
  const finished = nextCursor >= queue.length;

  return {
    ...run,
    queue,
    requeued,
    requeuePending: null,
    // Saat selesai, cursor tetap di soal terakhir supaya layar tidak "kosong".
    cursor: finished ? run.cursor : nextCursor,
    hintStage: 0,
    feedback: 'none',
    selected: null,
    status: finished ? 'finished' : 'playing',
    finishedAt: finished ? now : null,
  };
}

export function accuracy(run: Pick<RunState, 'attempts' | 'correctCount'>): number {
  if (run.attempts === 0) return 0;
  return run.correctCount / run.attempts;
}

export function toActiveRun(run: RunState): ActiveRun {
  return {
    sessionId: run.sessionId,
    chapterId: run.chapterId,
    profileId: run.profileId,
    seed: run.seed,
    difficulty: run.difficulty,
    queue: [...run.queue],
    cursor: run.cursor,
    attempts: run.attempts,
    correctCount: run.correctCount,
    hintsUsed: run.hintsUsed,
    startedAt: run.startedAt,
    requeued: [...run.requeued],
  };
}

/** Bentuk minimal yang perlu divalidasi sebelum dipakai (save file bisa saja korup). */
export interface ActiveRunLike {
  sessionId?: unknown;
  chapterId?: unknown;
  profileId?: unknown;
  seed?: unknown;
  difficulty?: unknown;
  queue?: unknown;
  cursor?: unknown;
  attempts?: unknown;
  correctCount?: unknown;
  hintsUsed?: unknown;
  startedAt?: unknown;
  requeued?: unknown;
}

export function isActiveRunLike(value: unknown): value is ActiveRun {
  if (typeof value !== 'object' || value === null) return false;
  const run = value as ActiveRunLike;
  return (
    typeof run.sessionId === 'string' &&
    typeof run.chapterId === 'string' &&
    typeof run.profileId === 'string' &&
    typeof run.seed === 'string' &&
    (run.difficulty === undefined ||
      (typeof run.difficulty === 'number' &&
        Number.isInteger(run.difficulty) &&
        run.difficulty >= 0 &&
        run.difficulty <= 2)) &&
    Array.isArray(run.queue) &&
    run.queue.every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0) &&
    typeof run.cursor === 'number' &&
    Number.isInteger(run.cursor) &&
    run.cursor >= 0 &&
    run.cursor < run.queue.length &&
    typeof run.attempts === 'number' &&
    typeof run.correctCount === 'number' &&
    typeof run.hintsUsed === 'number' &&
    typeof run.startedAt === 'number' &&
    Array.isArray(run.requeued)
  );
}

export function fromActiveRun(active: ActiveRun): RunState {
  return {
    sessionId: active.sessionId,
    chapterId: active.chapterId,
    profileId: active.profileId,
    seed: active.seed,
    difficulty: active.difficulty ?? 0,
    queue: [...active.queue],
    cursor: active.cursor,
    attempts: active.attempts,
    correctCount: active.correctCount,
    hintsUsed: active.hintsUsed,
    hintStage: 0,
    feedback: 'none',
    selected: null,
    requeued: [...active.requeued],
    requeuePending: null,
    startedAt: active.startedAt,
    finishedAt: null,
    status: 'playing',
  };
}
