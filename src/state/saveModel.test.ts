import { describe, expect, it } from 'vitest';
import {
  applySettings,
  createSaveFile,
  parseImportedSave,
  resetProgressInSave,
  serializeSaveFile,
} from './saveModel';

function makeSave() {
  const save = createSaveFile('0.1.0');
  save.profiles = [
    {
      id: 'p1',
      name: 'Aira',
      avatarId: 'rubah',
      ageGroup: '5-6',
      createdAt: 1000,
      difficulty: 1,
      completedChapters: ['pulau-buah-bab-1'],
      collection: ['kiko'],
    },
  ];
  save.collection = ['kiko'];
  save.completedChapters = ['pulau-buah-bab-1'];
  save.settings = { ...save.settings, sfxOn: false, dailyLimitMin: 20 };
  return save;
}

describe('backup & pengaturan Zona Orang Tua', () => {
  it('backup lalu restore mempertahankan profil, kartu, dan setting', () => {
    const save = makeSave();
    const raw = serializeSaveFile(save, '0.1.0');
    const restored = parseImportedSave(raw, '0.1.0');

    expect(restored.profiles).toEqual(save.profiles);
    expect(restored.collection).toEqual(['kiko']);
    expect(restored.completedChapters).toEqual(['pulau-buah-bab-1']);
    expect(restored.settings.sfxOn).toBe(false);
    expect(restored.settings.dailyLimitMin).toBe(20);
    expect(restored.schemaVersion).toBe(1);
  });

  it('file backup rusak ditolak, bukan menimpa save', () => {
    expect(() => parseImportedSave('bukan-json', '0.1.0')).toThrow();
    expect(() => parseImportedSave('"teks"', '0.1.0')).toThrow();
    expect(() => parseImportedSave('[]', '0.1.0')).toThrow();
  });

  it('setting berubah tanpa menyentuh progres', () => {
    const save = makeSave();
    const updated = applySettings(save, { dailyLimitMin: 30, reminderOn: true });

    expect(updated.settings.dailyLimitMin).toBe(30);
    expect(updated.settings.reminderOn).toBe(true);
    expect(updated.profiles).toEqual(save.profiles);
    expect(updated.collection).toEqual(['kiko']);
  });

  it('reset progres membersihkan data anak tapi mempertahankan setting', () => {
    const reset = resetProgressInSave(makeSave());

    expect(reset.profiles).toEqual([]);
    expect(reset.collection).toEqual([]);
    expect(reset.completedChapters).toEqual([]);
    expect(reset.sessions).toEqual([]);
    expect(reset.activeRun).toBeNull();
    expect(reset.settings.dailyLimitMin).toBe(20);
    expect(reset.settings.sfxOn).toBe(false);
  });
});
