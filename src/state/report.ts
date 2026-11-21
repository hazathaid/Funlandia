import type { SaveFile } from './saveModel';

export const SKILL_LABELS: Record<string, string> = {
  'count-1-10': 'Menghitung 1–10',
  'add-within-10': 'Tambah dalam 10',
  'sub-within-10': 'Kurang dalam 10',
  'compare-within-10': 'Membandingkan',
};

export const SKILL_ORDER = [
  'count-1-10',
  'add-within-10',
  'sub-within-10',
  'compare-within-10',
];

/** Ambang "perlu dibantu": sudah cukup latihan tapi penguasaan masih rendah. */
const NEEDS_HELP_MASTERY = 0.6;
const NEEDS_HELP_MIN_ATTEMPTS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SkillReport {
  skillId: string;
  label: string;
  mastery: number;
  attempts: number;
  needsHelp: boolean;
}

export interface ProfileReport {
  profileId: string;
  skills: SkillReport[];
  needsHelp: SkillReport[];
  minutesToday: number;
  minutesThisWeek: number;
  sessionsThisWeek: number;
  completedNaturallyRate: number;
}

function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function minutesUsedToday(save: SaveFile, now: number): number {
  return Math.round((save.dailyUsage[dayKey(now)] ?? 0) / 60);
}

export function minutesUsedThisWeek(save: SaveFile, now: number): number {
  let seconds = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    seconds += save.dailyUsage[dayKey(now - offset * DAY_MS)] ?? 0;
  }
  return Math.round(seconds / 60);
}

export function buildProfileReport(save: SaveFile, profileId: string, now: number): ProfileReport {
  const stored = save.skillProgress[profileId] ?? [];
  const byId = new Map(stored.map((skill) => [skill.skillId, skill]));

  const skills: SkillReport[] = SKILL_ORDER.map((skillId) => {
    const skill = byId.get(skillId);
    const mastery = Math.min(1, Math.max(0, skill?.mastery ?? 0));
    const attempts = skill?.attempts ?? 0;
    return {
      skillId,
      label: SKILL_LABELS[skillId] ?? skillId,
      mastery,
      attempts,
      needsHelp: attempts >= NEEDS_HELP_MIN_ATTEMPTS && mastery < NEEDS_HELP_MASTERY,
    };
  });

  // Skill di luar kurikulum saat ini (kalau nanti bertambah) tetap ditampilkan.
  for (const skill of stored) {
    if (skills.some((item) => item.skillId === skill.skillId)) continue;
    const mastery = Math.min(1, Math.max(0, skill.mastery));
    skills.push({
      skillId: skill.skillId,
      label: SKILL_LABELS[skill.skillId] ?? skill.skillId,
      mastery,
      attempts: skill.attempts,
      needsHelp: skill.attempts >= NEEDS_HELP_MIN_ATTEMPTS && mastery < NEEDS_HELP_MASTERY,
    });
  }

  const weekStart = now - 7 * DAY_MS;
  const sessionsThisWeek = save.sessions.filter(
    (session) => session.profileId === profileId && session.endedAt >= weekStart,
  );
  const completedNaturally = sessionsThisWeek.filter(
    (session) => session.completedNaturally,
  ).length;

  return {
    profileId,
    skills,
    needsHelp: skills.filter((skill) => skill.needsHelp),
    minutesToday: minutesUsedToday(save, now),
    minutesThisWeek: minutesUsedThisWeek(save, now),
    sessionsThisWeek: sessionsThisWeek.length,
    completedNaturallyRate:
      sessionsThisWeek.length === 0 ? 0 : completedNaturally / sessionsThisWeek.length,
  };
}
