import { isActiveRunLike, type ActiveRun } from '../game/session';

/**
 * schemaVersion wajib ada dari v1.0.0.
 * Update APK manual tanpa migrasi server → kode harus bisa membaca save lama.
 */
export const SCHEMA_VERSION = 1;

export interface Profile {
  id: string;
  name: string;
  avatarId: string;
  age: '3' | '6' | '10';
  createdAt: number;
  difficulty?: 0 | 1 | 2;
  completedChapters?: string[];
  collection?: string[];
}

export interface SkillProgress {
  skillId: string;
  /** 0..1, exponential moving average akurasi. */
  mastery: number;
  attempts: number;
  lastPracticedAt: number;
  commonMistakes: string[];
}

export interface Session {
  id: string;
  profileId: string;
  startedAt: number;
  endedAt: number;
  chapterId: string;
  itemsAnswered: number;
  correctCount: number;
  hintsUsed: number;
  /** true hanya kalau anak berhenti karena bab selesai, bukan karena keluar. */
  completedNaturally: boolean;
}

export interface Settings {
  dailyLimitMin: number;
  musicOn: boolean;
  sfxOn: boolean;
  reminderOn: boolean;
  orientationLock: boolean;
}

export interface SaveFile {
  schemaVersion: number;
  appVersion: string;
  profiles: Profile[];
  skillProgress: Record<string, SkillProgress[]>;
  collection: string[];
  /** Tambahan F1: bab yang sudah selesai, dipakai untuk membuka bab berikutnya. */
  completedChapters: string[];
  settings: Settings;
  dailyUsage: Record<string, number>;
  sessions: Session[];
  /** Sesi yang sedang berjalan supaya refresh di tengah bab tidak menghilangkan progres. */
  activeRun: ActiveRun | null;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyLimitMin: 15,
  musicOn: true,
  sfxOn: true,
  reminderOn: false,
  orientationLock: true,
};

export const AVATARS = ['rubah', 'kelinci', 'panda', 'katak'] as const;

export function createSaveFile(appVersion: string): SaveFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    appVersion,
    profiles: [],
    skillProgress: {},
    collection: [],
    completedChapters: [],
    settings: { ...DEFAULT_SETTINGS },
    dailyUsage: {},
    sessions: [],
    activeRun: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asAge(value: unknown): Profile['age'] {
  return value === '10' ? '10' : value === '6' ? '6' : '3';
}

function normalizeProfile(value: unknown): Profile | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    avatarId: asString(value.avatarId, 'rubah'),
    age: asAge(value.age),
    createdAt: asNumber(value.createdAt, Date.now()),
    difficulty: value.difficulty === 1 ? 1 : value.difficulty === 2 ? 2 : 0,
    completedChapters: asArray(value.completedChapters).filter(
      (item): item is string => typeof item === 'string',
    ),
    collection: asArray(value.collection).filter(
      (item): item is string => typeof item === 'string',
    ),
  };
}

function normalizeSkillProgress(value: unknown): SkillProgress | null {
  if (!isRecord(value)) return null;
  const skillId = asString(value.skillId);
  if (!skillId) return null;
  return {
    skillId,
    mastery: Math.min(1, Math.max(0, asNumber(value.mastery))),
    attempts: Math.max(0, Math.floor(asNumber(value.attempts))),
    lastPracticedAt: asNumber(value.lastPracticedAt),
    commonMistakes: asArray(value.commonMistakes).filter(
      (item): item is string => typeof item === 'string',
    ),
  };
}

function normalizeSession(value: unknown): Session | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const profileId = asString(value.profileId);
  const chapterId = asString(value.chapterId);
  if (!id || !profileId || !chapterId) return null;
  return {
    id,
    profileId,
    startedAt: asNumber(value.startedAt),
    endedAt: asNumber(value.endedAt),
    chapterId,
    itemsAnswered: Math.max(0, Math.floor(asNumber(value.itemsAnswered))),
    correctCount: Math.max(0, Math.floor(asNumber(value.correctCount))),
    hintsUsed: Math.max(0, Math.floor(asNumber(value.hintsUsed))),
    completedNaturally: asBoolean(value.completedNaturally, false),
  };
}

function normalizeSettings(value: unknown): Settings {
  const raw = isRecord(value) ? value : {};
  return {
    dailyLimitMin: asNumber(raw.dailyLimitMin, DEFAULT_SETTINGS.dailyLimitMin),
    musicOn: asBoolean(raw.musicOn, DEFAULT_SETTINGS.musicOn),
    sfxOn: asBoolean(raw.sfxOn, DEFAULT_SETTINGS.sfxOn),
    reminderOn: asBoolean(raw.reminderOn, DEFAULT_SETTINGS.reminderOn),
    orientationLock: asBoolean(raw.orientationLock, DEFAULT_SETTINGS.orientationLock),
  };
}

/**
 * Migrasi / sanitasi save file.
 * - Save kosong / korup → save baru (jangan crash ke layar kosong).
 * - Field baru ditambahkan dengan default, field asing dibuang.
 * - Kalau nanti schemaVersion naik, tambahkan cabang migrasi di sini (v1 → v2, dst).
 */
export function migrate(raw: unknown, appVersion: string): SaveFile {
  const base = createSaveFile(appVersion);
  if (!isRecord(raw)) return base;

  const profiles = asArray(raw.profiles)
    .map(normalizeProfile)
    .filter((profile): profile is Profile => profile !== null);

  const skillProgress: Record<string, SkillProgress[]> = {};
  if (isRecord(raw.skillProgress)) {
    for (const [profileId, list] of Object.entries(raw.skillProgress)) {
      const normalized = asArray(list)
        .map(normalizeSkillProgress)
        .filter((item): item is SkillProgress => item !== null);
      if (normalized.length > 0) skillProgress[profileId] = normalized;
    }
  }

  const collection = Array.from(
    new Set(asArray(raw.collection).filter((id): id is string => typeof id === 'string')),
  );

  const completedChapters = Array.from(
    new Set(asArray(raw.completedChapters).filter((id): id is string => typeof id === 'string')),
  );

  // Migrasi data lama: progres global hanya diberikan kepada profil pertama.
  // Profil lama tanpa field per-profil tidak boleh membuat profil baru
  // langsung mewarisi bab atau kartu yang sudah dikerjakan profil lain.
  const scopedProfiles = profiles.map((profile, index) => ({
    ...profile,
    difficulty: profile.difficulty ?? 0,
    completedChapters:
      profile.completedChapters?.length || index > 0
        ? (profile.completedChapters ?? [])
        : completedChapters,
    collection:
      profile.collection?.length || index > 0
        ? (profile.collection ?? [])
        : collection,
  }));

  const dailyUsage: Record<string, number> = {};
  if (isRecord(raw.dailyUsage)) {
    for (const [date, seconds] of Object.entries(raw.dailyUsage)) {
      const value = asNumber(seconds, -1);
      if (value >= 0) dailyUsage[date] = value;
    }
  }

  const sessions = asArray(raw.sessions)
    .map(normalizeSession)
    .filter((session): session is Session => session !== null);

  return {
    ...base,
    schemaVersion: SCHEMA_VERSION,
    appVersion,
    profiles: scopedProfiles,
    skillProgress,
    collection,
    completedChapters,
    settings: normalizeSettings(raw.settings),
    dailyUsage,
    sessions,
    activeRun: isActiveRunLike(raw.activeRun) ? raw.activeRun : null,
  };
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

export function addProfile(
  save: SaveFile,
  input: { name: string; avatarId: string; age: Profile['age']; now: number },
): SaveFile {
  const name = input.name.trim().slice(0, 16) || 'Anak';
  const difficulty = input.age === '3' ? 0 : input.age === '6' ? 1 : 2;
  const profile: Profile = {
    id: createId('profile'),
    name,
    avatarId: input.avatarId || AVATARS[0],
    age: input.age,
    createdAt: input.now,
    difficulty,
    completedChapters: [],
    collection: [],
  };
  return { ...save, profiles: [...save.profiles, profile] };
}

export function setProfileDifficulty(
  save: SaveFile,
  profileId: string,
  difficulty: 0 | 1 | 2,
): SaveFile {
  return {
    ...save,
    profiles: save.profiles.map((profile) =>
      profile.id === profileId ? { ...profile, difficulty } : profile,
    ),
  };
}

/** Ubah sebagian setting tanpa menyentuh progres anak. */
export function applySettings(save: SaveFile, patch: Partial<Settings>): SaveFile {
  return { ...save, settings: { ...save.settings, ...patch } };
}

/**
 * Reset progres: profil, skill, kartu, sesi, dan pemakaian harian dibuang.
 * Setting orang tua (batas waktu, mute, pengingat) sengaja dipertahankan.
 */
export function resetProgressInSave(save: SaveFile): SaveFile {
  return {
    ...createSaveFile(save.appVersion),
    settings: { ...save.settings },
  };
}

/** Backup manual untuk Zona Orang Tua: JSON rapi yang bisa disimpan ke Drive/WhatsApp. */
export function serializeSaveFile(save: SaveFile, appVersion: string): string {
  return JSON.stringify({ ...save, schemaVersion: SCHEMA_VERSION, appVersion }, null, 2);
}

/**
 * Baca file backup. Melempar error kalau JSON rusak / bukan objek,
 * supaya UI bisa menampilkan pesan dan TIDAK menimpa save yang ada.
 */
export function parseImportedSave(raw: string, appVersion: string): SaveFile {
  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('File backup tidak bisa dibaca (bukan JSON).');
  }

  if (!isRecord(data)) {
    throw new Error('Isi file backup tidak dikenali.');
  }

  return migrate(data, appVersion);
}
