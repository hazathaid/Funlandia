import { migrate, type SaveFile } from '../state/saveModel';

export const SAVE_KEY = 'petualangan-angka.save.v1';
export const SAVE_BACKUP_KEY = `${SAVE_KEY}.bak`;
export const SAVE_TMP_KEY = `${SAVE_KEY}.tmp`;
export const SAVE_CORRUPT_KEY = `${SAVE_KEY}.corrupt`;

/**
 * Abstraksi penyimpanan (web: localStorage, nanti native: @capacitor/filesystem).
 * Logika game tidak boleh menyentuh storage langsung.
 */
export interface SaveStore {
  load(): Promise<SaveFile | null>;
  save(data: SaveFile): Promise<void>;
  clear(): Promise<void>;
}

function probeStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = '__petualangan_angka_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    // Mode private / storage diblokir: tetap bisa main, hanya tidak persisten.
    return null;
  }
}

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  } as Storage;
}

function parse(raw: string | null): { data: unknown; ok: boolean } {
  if (!raw) return { data: null, ok: false };
  try {
    return { data: JSON.parse(raw) as unknown, ok: true };
  } catch {
    return { data: null, ok: false };
  }
}

export function createWebSaveStore(appVersion: string, storage?: Storage): SaveStore {
  const store = storage ?? probeStorage() ?? createMemoryStorage();

  return {
    async load() {
      const primary = parse(store.getItem(SAVE_KEY));
      let data: unknown = primary.data;
      let ok = primary.ok;

      if (!ok) {
        // Jaring pengaman: coba backup sebelum menyerah.
        const backup = parse(store.getItem(SAVE_BACKUP_KEY));
        if (backup.ok) {
          data = backup.data;
          ok = true;
        }
      }

      if (!ok) {
        const rawPrimary = store.getItem(SAVE_KEY);
        if (rawPrimary) store.setItem(SAVE_CORRUPT_KEY, rawPrimary);
        return null;
      }

      const rawVersion =
        typeof data === 'object' && data !== null
          ? (data as { schemaVersion?: unknown }).schemaVersion
          : undefined;

      if (rawVersion !== undefined && rawVersion !== 1) {
        // v1 satu-satunya skema; backup dulu sebelum menulis hasil migrasi.
        const rawPrimary = store.getItem(SAVE_KEY);
        if (rawPrimary) store.setItem(SAVE_BACKUP_KEY, rawPrimary);
      }

      return migrate(data, appVersion);
    },

    async save(next) {
      const serialized = JSON.stringify({ ...next, schemaVersion: 1, appVersion });
      try {
        const previous = store.getItem(SAVE_KEY);
        if (previous) store.setItem(SAVE_BACKUP_KEY, previous);
        // Tulis ke kunci sementara dulu supaya app yang mati di tengah simpan
        // tidak meninggalkan save setengah jadi.
        store.setItem(SAVE_TMP_KEY, serialized);
        store.setItem(SAVE_KEY, serialized);
        store.removeItem(SAVE_TMP_KEY);
      } catch {
        // Kuota penuh: jangan crash, biarkan sesi jalan di memori.
      }
    },

    async clear() {
      store.removeItem(SAVE_KEY);
      store.removeItem(SAVE_BACKUP_KEY);
      store.removeItem(SAVE_TMP_KEY);
    },
  };
}
