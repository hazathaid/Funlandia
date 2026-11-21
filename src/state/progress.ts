import { skillIdForChapter } from '../game/chapters';
import { accuracy, type ActiveRun, type RunState } from '../game/session';
import type { SaveFile, Session, SkillProgress } from './saveModel';

export interface SessionOutcome {
  run: RunState;
  endedAt: number;
  /** true = anak menyelesaikan 10 soal, bukan keluar di tengah. */
  completedNaturally: boolean;
  cardId?: string;
  activeRun: ActiveRun | null;
}

const MASTERY_ALPHA = 0.25;

function upsertSession(sessions: Session[], next: Session): Session[] {
  const rest = sessions.filter((session) => session.id !== next.id);
  return [...rest, next];
}

function mergeSkillProgress(
  skillId: string,
  existing: SkillProgress | undefined,
  run: RunState,
  now: number,
): SkillProgress {
  const runAccuracy = accuracy(run);
  const mastery = existing
    ? Math.min(1, Math.max(0, existing.mastery * (1 - MASTERY_ALPHA) + runAccuracy * MASTERY_ALPHA))
    : runAccuracy;

  return {
    skillId,
    mastery,
    attempts: (existing?.attempts ?? 0) + run.attempts,
    lastPracticedAt: now,
    commonMistakes: existing?.commonMistakes ?? [],
  };
}

function todayKey(now: number): string {
  const date = new Date(now);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Terapkan hasil sesi ke save file: session log, mastery skill, kartu koleksi,
 * bab selesai, dan pemakaian harian.
 */
export function applySessionOutcome(save: SaveFile, outcome: SessionOutcome): SaveFile {
  const { run, endedAt, completedNaturally } = outcome;

  const session: Session = {
    id: run.sessionId,
    profileId: run.profileId,
    startedAt: run.startedAt,
    endedAt,
    chapterId: run.chapterId,
    itemsAnswered: run.attempts,
    correctCount: run.correctCount,
    hintsUsed: run.hintsUsed,
    completedNaturally,
  };

  const skillId = skillIdForChapter(run.chapterId);
  const profileSkills = save.skillProgress[run.profileId] ?? [];
  const existingSkill = profileSkills.find((skill) => skill.skillId === skillId);
  const nextSkills = [
    ...profileSkills.filter((skill) => skill.skillId !== skillId),
    mergeSkillProgress(skillId, existingSkill, run, endedAt),
  ];

  const gainedCard =
    completedNaturally && outcome.cardId && !save.collection.includes(outcome.cardId)
      ? outcome.cardId
      : null;

  const completedChapters =
    completedNaturally && !save.completedChapters.includes(run.chapterId)
      ? [...save.completedChapters, run.chapterId]
      : save.completedChapters;

  const seconds = Math.max(0, Math.round((endedAt - run.startedAt) / 1000));
  const usageKey = todayKey(endedAt);

  return {
    ...save,
    sessions: upsertSession(save.sessions, session),
    skillProgress: { ...save.skillProgress, [run.profileId]: nextSkills },
    collection: gainedCard ? [...save.collection, gainedCard] : save.collection,
    completedChapters,
    dailyUsage: { ...save.dailyUsage, [usageKey]: (save.dailyUsage[usageKey] ?? 0) + seconds },
    activeRun: outcome.activeRun,
  };
}
