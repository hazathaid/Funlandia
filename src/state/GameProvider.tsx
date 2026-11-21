import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { APP_VERSION } from '../app/version';
import { findChapter, isChapterUnlocked } from '../game/chapters';
import {
  difficultyFromMastery,
  generateQuestions,
  type GameQuestion,
} from '../game/questions';
import {
  advance as advanceRun,
  answer as answerRun,
  createRun,
  currentQuestionIndex,
  fromActiveRun,
  retry as retryRun,
  toActiveRun,
  type RunState,
} from '../game/session';
import { createWebSaveStore } from '../platform/saveStore';
import {
  FRUIT_LABELS,
  configureAudio,
  numberToWord,
  speak,
  speakNumber,
  speakQuestion,
} from '../platform/speech';
import { applySessionOutcome } from '../state/progress';
import {
  addProfile as addProfileToSave,
  applySettings,
  createId,
  createSaveFile,
  parseImportedSave,
  resetProgressInSave,
  type Profile,
  type SaveFile,
  type Settings,
} from '../state/saveModel';

export type Screen = 'boot' | 'start' | 'map' | 'play' | 'reward' | 'end' | 'parent';

export interface RewardCard {
  id: string;
  name: string;
}

interface GameContextValue {
  save: SaveFile;
  screen: Screen;
  profile: Profile | null;
  run: RunState | null;
  question: GameQuestion | null;
  chapterQuestions: GameQuestion[];
  /** Indeks objek yang sudah diketuk anak, urut sesuai ketukan (0-based). */
  tapped: number[];
  rewardCard: RewardCard | null;
  audioOn: boolean;
  createProfile: (input: { name: string; avatarId: string; ageGroup: Profile['ageGroup'] }) => void;
  selectProfile: (profileId: string) => void;
  startChapter: (chapterId: string) => void;
  tapObject: (index: number) => void;
  resetTaps: () => void;
  chooseAnswer: (option: number) => void;
  retryWrong: () => void;
  nextQuestion: () => void;
  hearQuestion: () => void;
  quitChapter: () => void;
  goToMap: () => void;
  goToStart: () => void;
  finishToEnd: () => void;
  toggleAudio: () => void;
  openParentZone: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  restoreSave: (raw: string) => { ok: boolean; error?: string };
  resetProgress: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function makeSeed(chapterId: string, now: number): string {
  return `${chapterId}-${now.toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

function speakInstruction(question: GameQuestion): void {
  const fruitLabel = FRUIT_LABELS[question.fruit] ?? 'buah';
  switch (question.kind) {
    case 'addition':
      speak(
        `Ada berapa ${fruitLabel} semuanya? ${numberToWord(question.a)} tambah ${numberToWord(
          question.b,
        )}.`,
      );
      break;
    case 'subtraction':
      speak(
        `Ada ${numberToWord(question.a)} ${fruitLabel}. ${numberToWord(question.b)} dimakan. Berapa yang tersisa?`,
      );
      break;
    case 'compare':
      speak('Mana yang lebih banyak? Keranjang kiri atau keranjang kanan?');
      break;
    case 'counting':
    default:
      speakQuestion({ fruitLabel, count: question.count });
      break;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createWebSaveStore(APP_VERSION), []);
  const [save, setSave] = useState<SaveFile>(() => createSaveFile(APP_VERSION));
  const [screen, setScreen] = useState<Screen>('boot');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [rewardCard, setRewardCard] = useState<RewardCard | null>(null);
  const [tapped, setTapped] = useState<number[]>([]);
  const finalizedSessions = useRef<Set<string>>(new Set());
  // Ref + state: ketukan cepat (anak 5 tahun) tidak boleh dobel-hitung sebelum re-render.
  const tapOrder = useRef<number[]>([]);

  const profile = useMemo(
    () => save.profiles.find((item) => item.id === profileId) ?? null,
    [save.profiles, profileId],
  );

  const chapter = run ? findChapter(run.chapterId) : undefined;
  const chapterQuestions = useMemo(
    () =>
      run && chapter
        ? generateQuestions({
            mode: chapter.mode,
            seed: run.seed,
            size: chapter.size,
            difficulty: run.difficulty,
          })
        : [],
    [run, chapter],
  );
  const question = run ? chapterQuestions[currentQuestionIndex(run)] ?? null : null;
  const questionId = question?.id ?? null;

  const commitSave = useCallback(
    (updater: (previous: SaveFile) => SaveFile) => {
      setSave((previous) => {
        const next = updater(previous);
        void store.save(next);
        return next;
      });
    },
    [store],
  );

  // Boot: baca save, restore sesi yang terputus karena refresh/HP mati.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loaded = await store.load();
      if (cancelled) return;

      const nextSave = loaded ?? createSaveFile(APP_VERSION);
      setSave(nextSave);
      configureAudio({ enabled: nextSave.settings.sfxOn });

      const active = nextSave.activeRun;
      const activeProfile = active
        ? nextSave.profiles.find((item) => item.id === active.profileId)
        : undefined;

      if (active && activeProfile && findChapter(active.chapterId)) {
        setProfileId(activeProfile.id);
        setRun(fromActiveRun(active));
        setScreen('play');
        return;
      }

      setScreen('start');
    })();

    return () => {
      cancelled = true;
    };
  }, [store]);

  const resetTaps = useCallback(() => {
    tapOrder.current = [];
    setTapped([]);
  }, []);

  // Soal berganti (termasuk setelah refresh) → hitungan ketukan mulai dari nol + audio instruksi.
  useEffect(() => {
    resetTaps();
    if (!question) return;
    speakInstruction(question);
    // question sengaja tidak masuk deps: cukup id-nya, supaya audio tidak dobel.
  }, [questionId, resetTaps]);

  const selectProfile = useCallback(
    (nextProfileId: string) => {
      const selected = save.profiles.find((item) => item.id === nextProfileId);
      if (!selected) return;
      setProfileId(selected.id);
      setRun(null);
      setRewardCard(null);
      setScreen('map');
      speak(`Halo ${selected.name}, ayo main!`);
    },
    [save.profiles],
  );

  const createProfile = useCallback(
    (input: { name: string; avatarId: string; ageGroup: Profile['ageGroup'] }) => {
      const now = Date.now();
      const next = addProfileToSave(save, { ...input, now });
      const created = next.profiles[next.profiles.length - 1];
      commitSave(() => next);
      if (created) {
        setProfileId(created.id);
        setRun(null);
        setScreen('map');
        speak(`Halo ${created.name}, ayo main!`);
      }
    },
    [save, commitSave],
  );

  const startChapter = useCallback(
    (chapterId: string) => {
      const selectedChapter = findChapter(chapterId);
      if (!selectedChapter || !profile) return;
      if (!isChapterUnlocked(selectedChapter, save.completedChapters)) return;

      const now = Date.now();
      const existingSkill = save.skillProgress[profile.id]?.find(
        (skill) => skill.skillId === selectedChapter.skillId,
      );
      const nextRun = createRun({
        sessionId: createId('session'),
        profileId: profile.id,
        chapterId,
        seed: makeSeed(chapterId, now),
        size: selectedChapter.size,
        difficulty: difficultyFromMastery(existingSkill?.mastery ?? 0),
        now,
      });

      setRewardCard(null);
      resetTaps();
      setRun(nextRun);
      setScreen('play');
      commitSave((previous) => ({ ...previous, activeRun: toActiveRun(nextRun) }));
    },
    [profile, save.completedChapters, save.skillProgress, commitSave, resetTaps],
  );

  /** Tap objek satu per satu: suara angka mengikuti jumlah ketukan (satu, dua, tiga, ...). */
  const tapObject = useCallback((index: number) => {
    const order = tapOrder.current;
    const existingOrder = order.indexOf(index);

    // Mengetuk objek yang sama lagi = mengulang angkanya (bukan membatalkan hitungan).
    if (existingOrder >= 0) {
      speakNumber(existingOrder + 1);
      return;
    }

    const next = [...order, index];
    tapOrder.current = next;
    setTapped(next);
    speakNumber(next.length);
  }, []);

  const chooseAnswer = useCallback(
    (option: number) => {
      if (!run || !question) return;
      const next = answerRun(run, option, question.answer);
      if (next === run) return;

      setRun(next);
      if (next.feedback === 'correct') {
        speak(`Hebat! ${numberToWord(question.answer)}.`);
      } else if (next.feedback === 'wrong') {
        speak('Belum tepat. Ayo coba lagi, ya.');
      }

      if (next.status === 'playing') {
        // Autosave setiap soal dijawab: anak yang keluar di tengah bab tidak kehilangan progres.
        commitSave((previous) => ({ ...previous, activeRun: toActiveRun(next) }));
      }
    },
    [run, question, commitSave],
  );

  /** Getar halus selesai → soal yang sama dibuka lagi tanpa menghapus bantuan. */
  const retryWrong = useCallback(() => {
    setRun((current) => {
      if (!current) return current;
      const next = retryRun(current);
      return next === current ? current : next;
    });
  }, []);

  const nextQuestion = useCallback(() => {
    if (!run) return;
    const next = advanceRun(run, Date.now());
    if (next === run) return;

    setRun(next);
    if (next.status === 'playing') {
      commitSave((previous) => ({ ...previous, activeRun: toActiveRun(next) }));
    }
  }, [run, commitSave]);

  const hearQuestion = useCallback(() => {
    if (!question) return;
    speakInstruction(question);
  }, [question]);

  // Bab selesai → catat hasil (completedNaturally: true), beri kartu, pindah ke layar hadiah.
  useEffect(() => {
    if (!run || screen !== 'play' || run.status !== 'finished') return;
    if (finalizedSessions.current.has(run.sessionId)) return;
    finalizedSessions.current.add(run.sessionId);

    const finishedAt = run.finishedAt ?? Date.now();
    const finishedChapter = findChapter(run.chapterId);
    const card: RewardCard | null = finishedChapter
      ? { id: finishedChapter.cardId, name: finishedChapter.cardName }
      : null;

    commitSave((previous) =>
      applySessionOutcome(previous, {
        run,
        endedAt: finishedAt,
        completedNaturally: true,
        cardId: finishedChapter?.cardId,
        activeRun: null,
      }),
    );
    setRewardCard(card);
    setScreen('reward');
    speak('Kamu dapat kartu baru! Hebat!');
  }, [run, screen, commitSave]);

  const quitChapter = useCallback(() => {
    if (!run) {
      setScreen('map');
      return;
    }

    if (run.status === 'playing' && run.attempts > 0) {
      const endedAt = Date.now();
      commitSave((previous) =>
        applySessionOutcome(previous, {
          run,
          endedAt,
          completedNaturally: false,
          activeRun: null,
        }),
      );
    } else {
      commitSave((previous) => ({ ...previous, activeRun: null }));
    }

    resetTaps();
    setRun(null);
    setScreen('map');
  }, [run, commitSave, resetTaps]);

  const goToMap = useCallback(() => {
    resetTaps();
    setRun(null);
    setRewardCard(null);
    setScreen('map');
  }, [resetTaps]);

  const goToStart = useCallback(() => {
    resetTaps();
    setRun(null);
    setRewardCard(null);
    setProfileId(null);
    setScreen('start');
  }, [resetTaps]);

  const finishToEnd = useCallback(() => {
    setScreen('end');
  }, []);

  const toggleAudio = useCallback(() => {
    const enabled = !save.settings.sfxOn;
    configureAudio({ enabled });
    commitSave((previous) => ({
      ...previous,
      settings: { ...previous.settings, sfxOn: enabled, musicOn: enabled },
    }));
    if (enabled) speak('Suara aktif');
  }, [save.settings.sfxOn, commitSave]);

  const openParentZone = useCallback(() => {
    setScreen('parent');
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      commitSave((previous) => applySettings(previous, patch));
      if (typeof patch.sfxOn === 'boolean') configureAudio({ enabled: patch.sfxOn });
    },
    [commitSave],
  );

  const restoreSave = useCallback(
    (raw: string) => {
      try {
        const next = parseImportedSave(raw, APP_VERSION);
        commitSave(() => next);
        resetTaps();
        setRun(null);
        setRewardCard(null);
        setProfileId(null);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Backup tidak bisa dibaca.',
        };
      }
    },
    [commitSave, resetTaps],
  );

  const resetProgress = useCallback(() => {
    commitSave((previous) => resetProgressInSave(previous));
    resetTaps();
    setRun(null);
    setRewardCard(null);
    setProfileId(null);
    setScreen('start');
  }, [commitSave, resetTaps]);

  const value: GameContextValue = {
    save,
    screen,
    profile,
    run,
    question,
    chapterQuestions,
    tapped,
    rewardCard,
    audioOn: save.settings.sfxOn,
    createProfile,
    selectProfile,
    startChapter,
    tapObject,
    resetTaps,
    chooseAnswer,
    retryWrong,
    nextQuestion,
    hearQuestion,
    quitChapter,
    goToMap,
    goToStart,
    finishToEnd,
    toggleAudio,
    openParentZone,
    updateSettings,
    restoreSave,
    resetProgress,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/* eslint-disable react-refresh/only-export-components */
export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame harus dipakai di dalam <GameProvider>');
  return context;
}
