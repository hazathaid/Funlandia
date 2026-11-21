import { useCallback, useEffect, useRef, useState } from 'react';
import { FruitSvg } from '../components/FruitSvg';
import { Mascot, type MascotMood } from '../components/Mascot';
import { ProgressDots } from '../components/ProgressDots';
import { findChapter } from '../game/chapters';
import type {
  AdditionQuestion,
  CompareQuestion,
  CountingQuestion,
  DivisionQuestion,
  GameQuestion,
  MultiplicationQuestion,
  SubtractionQuestion,
} from '../game/questions';
import type { RunState } from '../game/session';
import { playSfx } from '../platform/audio';
import { vibrate } from '../platform/haptic';
import { FRUIT_LABELS, numberToWord, speak, speakNumber } from '../platform/speech';
import { useGame } from '../state/GameProvider';

/** Animasi benar: <=800ms lalu berhenti (bukan loop). Salah: getar halus, bukan layar merah. */
const CORRECT_ANIM_MS = 750;
const WRONG_ANIM_MS = 650;
const COUNT_ALONG_STEP_MS = 520;

export function PlayScreen() {
  const { run, question } = useGame();
  if (!run || !question) return null;
  return <PlayBoard run={run} question={question} />;
}

function tappableCountFor(question: GameQuestion): number {
  switch (question.kind) {
    case 'counting':
      return question.count;
    case 'addition':
      return question.a + question.b;
    case 'subtraction':
      return question.answer;
    case 'compare':
    case 'multiplication':
    case 'division':
      return 0;
  }
}

function PlayBoard({ run, question }: { run: RunState; question: GameQuestion }) {
  const { tapped, tapObject, chooseAnswer, retryWrong, nextQuestion, hearQuestion, quitChapter } =
    useGame();
  const [countingIndex, setCountingIndex] = useState(-1);
  const [compareGlow, setCompareGlow] = useState<'left' | 'right' | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const countTimers = useRef<number[]>([]);
  const autoHinted = useRef<string>('');

  const chapter = findChapter(run.chapterId);
  const fruitLabel = FRUIT_LABELS[question.fruit] ?? 'buah';
  const solved = run.feedback === 'correct';
  const wrong = run.feedback === 'wrong';
  const tappableCount = tappableCountFor(question);
  const countedAll = tappableCount > 0 && tapped.length >= tappableCount;

  const stopCountAlong = useCallback(() => {
    countTimers.current.forEach((id) => window.clearTimeout(id));
    countTimers.current = [];
    setCountingIndex(-1);
    setCompareGlow(null);
  }, []);

  /** Hitung bersama Kiko: objek disorot satu-satu sambil menyebut angkanya. */
  const playCountAlong = useCallback(() => {
    stopCountAlong();

    if (question.kind === 'compare') {
      countTimers.current.push(
        window.setTimeout(() => {
          setCompareGlow('left');
          speak(`Kiri ${numberToWord(question.left)}.`);
        }, 250),
      );
      countTimers.current.push(
        window.setTimeout(() => {
          setCompareGlow('right');
          speak(`Kanan ${numberToWord(question.right)}.`);
        }, 250 + COUNT_ALONG_STEP_MS * 2),
      );
      countTimers.current.push(
        window.setTimeout(() => setCompareGlow(null), 250 + COUNT_ALONG_STEP_MS * 4),
      );
      return;
    }

    if (question.kind === 'multiplication' || question.kind === 'division') {
      const operator = question.kind === 'multiplication' ? 'kali' : 'dibagi';
      speak(`${numberToWord(question.a)} ${operator} ${numberToWord(question.b)} sama dengan ${numberToWord(question.answer)}.`);
      return;
    }

    const total = tappableCountFor(question);
    for (let index = 0; index < total; index += 1) {
      countTimers.current.push(
        window.setTimeout(() => {
          setCountingIndex(index);
          speakNumber(index + 1);
        }, 250 + index * COUNT_ALONG_STEP_MS),
      );
    }
    countTimers.current.push(
      window.setTimeout(() => setCountingIndex(-1), 250 + total * COUNT_ALONG_STEP_MS + 400),
    );
  }, [question, stopCountAlong]);

  // Soal baru → hentikan hitung bersama yang mungkin masih jalan.
  useEffect(() => {
    stopCountAlong();
  }, [question.id, stopCountAlong]);

  // Keluar layar soal → tidak boleh ada timer/audio yang tertinggal.
  useEffect(() => () => stopCountAlong(), [stopCountAlong]);

  // Benar → bintang muncul singkat, lalu lanjut otomatis ke soal berikutnya.
  useEffect(() => {
    if (!solved) return;
    playSfx('correct');
    vibrate('correct');
    const timer = window.setTimeout(() => nextQuestion(), CORRECT_ANIM_MS);
    return () => window.clearTimeout(timer);
  }, [solved, nextQuestion]);

  // Salah → getar halus selesai, soal yang sama dibuka lagi (bantuan tetap tersimpan).
  useEffect(() => {
    if (!wrong) return;
    playSfx('wrong');
    vibrate('soft');
    const timer = window.setTimeout(() => retryWrong(), WRONG_ANIM_MS);
    return () => window.clearTimeout(timer);
  }, [wrong, retryWrong]);

  // Bantuan tahap 2: hitung bersama otomatis satu kali, setelah getar "salah" selesai.
  useEffect(() => {
    if (run.hintStage < 2 || solved) return;
    const key = `${question.id}:${run.cursor}:${run.hintStage}`;
    if (autoHinted.current === key) return;
    autoHinted.current = key;
    const timer = window.setTimeout(() => playCountAlong(), WRONG_ANIM_MS + 200);
    countTimers.current.push(timer);
    return () => window.clearTimeout(timer);
  }, [run.hintStage, run.cursor, question.id, solved, playCountAlong]);

  const mood: MascotMood = solved ? 'happy' : wrong || run.hintStage > 0 ? 'thinking' : 'idle';

  const promptHint =
    question.kind === 'compare'
      ? 'Ketuk keranjang yang lebih banyak.'
      : question.kind === 'multiplication' || question.kind === 'division'
        ? 'Pilih jawaban yang tepat, ya.'
      : countedAll
        ? 'Sekarang pilih jumlahnya, ya.'
        : 'Ketuk buahnya satu-satu.';

  return (
    <main className={`screen play ${wrong ? 'play--wrong' : ''}`}>
      <header className="play__header">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setConfirmQuit(true)}
          aria-label="Berhenti dulu"
        >
          <span aria-hidden="true">⬅</span>
        </button>
        <div className="play__chapter">
          <span className="play__chapter-title">{chapter?.title ?? 'Soal'}</span>
          <ProgressDots total={run.queue.length} current={run.cursor} done={solved} />
        </div>
      </header>

      <section className="play__prompt">
        <div className="play__prompt-text">
          <h1 className="prompt__text">{renderPrompt(question, fruitLabel)}</h1>
          <p className="prompt__hint">{promptHint}</p>
        </div>
        <div className="play__prompt-side">
          <Mascot mood={mood} className="prompt__mascot" />
          <button type="button" className="btn btn--speak" onClick={hearQuestion}>
            <span aria-hidden="true">🔊</span> Dengar
          </button>
        </div>
      </section>

      {question.kind === 'compare' ? (
        <CompareBoard
          question={question}
          selected={run.selected}
          solved={solved}
          wrong={wrong}
          hintStage={run.hintStage}
          glow={compareGlow}
          fruitLabel={fruitLabel}
          onChoose={chooseAnswer}
        />
      ) : (
        <FruitBoard
          question={question}
          tapped={tapped}
          countingIndex={countingIndex}
          solved={solved}
          fruitLabel={fruitLabel}
          onTap={tapObject}
        />
      )}

      {question.kind !== 'compare' ? (
        <section className={`options ${wrong ? 'options--shake' : ''}`} aria-label="Pilih jumlah">
          {question.options.map((option) => {
            const isChosen = run.selected === option;
            const isCorrectChoice = solved && option === question.answer;
            const isWrongChoice = wrong && isChosen;
            const reveal = !solved && run.hintStage >= 3 && option === question.answer;
            return (
              <button
                key={option}
                type="button"
                className={`option ${isCorrectChoice ? 'option--correct' : ''} ${
                  isWrongChoice ? 'option--wrong' : ''
                } ${reveal ? 'option--reveal' : ''}`}
                onClick={() => chooseAnswer(option)}
                disabled={solved}
                aria-label={`Jawaban ${option}`}
              >
                <span className="option__number">{option}</span>
                <span className="option__dots" aria-hidden="true">
                  {Array.from({ length: option }, (_, dot) => (
                    <span key={dot} className="option__dot" />
                  ))}
                </span>
                {reveal ? <span className="option__tag">Ini jawabannya</span> : null}
              </button>
            );
          })}
        </section>
      ) : (
        <div className={`options options--placeholder ${wrong ? 'options--shake' : ''}`} aria-hidden="true" />
      )}

      <p
        className={`feedback ${solved ? 'feedback--correct' : ''} ${wrong ? 'feedback--wrong' : ''}`}
        role="status"
        aria-live="polite"
      >
        {solved
          ? `Hebat! Jawabannya ${question.answer}.`
          : wrong
            ? 'Belum tepat. Ayo coba lagi, ya.'
            : run.hintStage > 0
              ? 'Kiko bantu hitung. Tekan tombol hitung bareng.'
              : ''}
      </p>

      {run.hintStage > 0 && !solved ? (
        <button type="button" className="btn btn--hint" onClick={playCountAlong}>
          <span aria-hidden="true">👆</span> Hitung bareng Kiko
        </button>
      ) : null}

      {solved ? (
        <div className="burst" aria-hidden="true">
          <span className="burst__star burst__star--a">⭐</span>
          <span className="burst__star burst__star--b">✨</span>
          <span className="burst__star burst__star--c">⭐</span>
        </div>
      ) : null}

      {confirmQuit ? (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="quit-title">
          <div className="overlay__card">
            <Mascot mood="thinking" className="overlay__mascot" />
            <h2 id="quit-title">Mau berhenti dulu?</h2>
            <p>Soal yang sudah dikerjakan tetap tersimpan.</p>
            <div className="overlay__actions">
              <button type="button" className="btn btn--primary" onClick={() => setConfirmQuit(false)}>
                Lanjut main
              </button>
              <button type="button" className="btn btn--ghost" onClick={quitChapter}>
                Ya, berhenti
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function renderPrompt(question: GameQuestion, fruitLabel: string) {
  switch (question.kind) {
    case 'addition':
      return (
        <>
          <strong>{question.a}</strong> + <strong>{question.b}</strong> = ?
        </>
      );
    case 'subtraction':
      return (
        <>
          <strong>{question.a}</strong> − <strong>{question.b}</strong> = ?
        </>
      );
    case 'compare':
      return <>Mana yang lebih banyak?</>;
    case 'multiplication':
      return <><strong>{question.a}</strong> × <strong>{question.b}</strong> = ?</>;
    case 'division':
      return <><strong>{question.a}</strong> ÷ <strong>{question.b}</strong> = ?</>;
    case 'counting':
    default:
      return (
        <>
          Ada berapa <strong>{fruitLabel}</strong>?
        </>
      );
  }
}

interface FruitTileProps {
  fruit: string;
  index: number;
  tapOrder: number;
  autoCounted: boolean;
  eaten: boolean;
  solved: boolean;
  label: string;
  onTap: (index: number) => void;
}

function FruitTile({ fruit, index, tapOrder, autoCounted, eaten, solved, label, onTap }: FruitTileProps) {
  const isTapped = tapOrder >= 0;
  const badge = isTapped ? tapOrder + 1 : autoCounted ? index + 1 : null;

  return (
    <button
      type="button"
      className={`fruit ${isTapped ? 'fruit--counted' : ''} ${autoCounted ? 'fruit--glow' : ''} ${
        eaten ? 'fruit--eaten' : ''
      }`}
      onClick={() => onTap(index)}
      disabled={solved || eaten}
      aria-label={`${label} ${index + 1}${isTapped ? `, hitungan ke ${tapOrder + 1}` : ''}${
        eaten ? ', sudah dimakan' : ''
      }`}
    >
      <FruitSvg fruit={fruit} className="fruit__svg" />
      {eaten ? <span className="fruit__eaten-mark" aria-hidden="true">✕</span> : null}
      {badge !== null && !eaten ? <span className="fruit__badge">{badge}</span> : null}
    </button>
  );
}

interface FruitBoardProps {
  question: CountingQuestion | AdditionQuestion | SubtractionQuestion | MultiplicationQuestion | DivisionQuestion;
  tapped: number[];
  countingIndex: number;
  solved: boolean;
  fruitLabel: string;
  onTap: (index: number) => void;
}

function FruitBoard({ question, tapped, countingIndex, solved, fruitLabel, onTap }: FruitBoardProps) {
  const tile = (index: number, eaten = false) => (
    <FruitTile
      key={index}
      fruit={question.fruit}
      index={index}
      tapOrder={tapped.indexOf(index)}
      autoCounted={countingIndex >= index}
      eaten={eaten}
      solved={solved}
      label={fruitLabel}
      onTap={onTap}
    />
  );

  if (question.kind === 'counting') {
    return (
      <section className="fruit-grid" aria-label={`Buah ${fruitLabel}`}>
        {Array.from({ length: question.count }, (_, index) => tile(index))}
      </section>
    );
  }

  if (question.kind === 'addition') {
    return (
      <section className="equation" aria-label={`${question.a} tambah ${question.b}`}>
        <div className="equation__group">
          {Array.from({ length: question.a }, (_, index) => tile(index))}
        </div>
        <span className="equation__op" aria-hidden="true">
          +
        </span>
        <div className="equation__group">
          {Array.from({ length: question.b }, (_, index) => tile(question.a + index))}
        </div>
      </section>
    );
  }

  if (question.kind === 'multiplication' || question.kind === 'division') {
    const operator = question.kind === 'multiplication' ? '×' : '÷';
    return (
      <section className="equation" aria-label={`${question.a} ${operator} ${question.b}`}>
        <div className="equation__group equation__group--wide">
          <strong>{question.a}</strong>
          <span className="equation__op" aria-hidden="true">{operator}</span>
          <strong>{question.b}</strong>
          <span className="equation__op" aria-hidden="true">= ?</span>
        </div>
      </section>
    );
  }

  return (
    <section className="equation" aria-label={`${question.a} kurang ${question.b}`}>
      <div className="equation__group equation__group--wide">
        {Array.from({ length: question.a }, (_, index) =>
          tile(index, index >= question.answer),
        )}
      </div>
    </section>
  );
}

interface CompareBoardProps {
  question: CompareQuestion;
  selected: number | null;
  solved: boolean;
  wrong: boolean;
  hintStage: number;
  glow: 'left' | 'right' | null;
  fruitLabel: string;
  onChoose: (option: number) => void;
}

function CompareBoard({
  question,
  selected,
  solved,
  wrong,
  hintStage,
  glow,
  fruitLabel,
  onChoose,
}: CompareBoardProps) {
  const sides = [
    { key: 'left' as const, label: 'Kiri', count: question.left },
    { key: 'right' as const, label: 'Kanan', count: question.right },
  ];
  const showCount = hintStage >= 2 || solved;

  return (
    <section
      className={`compare ${wrong ? 'compare--shake' : ''}`}
      aria-label="Pilih keranjang yang lebih banyak"
    >
      {sides.map((side) => {
        const isChosen = selected === side.count;
        const isCorrect = solved && side.count === question.answer;
        const isWrong = wrong && isChosen;
        const reveal = !solved && hintStage >= 3 && side.count === question.answer;
        return (
          <button
            key={side.key}
            type="button"
            className={`basket ${glow === side.key ? 'basket--glow' : ''} ${
              isCorrect ? 'basket--correct' : ''
            } ${isWrong ? 'basket--wrong' : ''} ${reveal ? 'basket--reveal' : ''}`}
            onClick={() => onChoose(side.count)}
            disabled={solved}
            aria-label={`Keranjang ${side.label} berisi ${side.count} ${fruitLabel}`}
          >
            <span className="basket__label">{side.label}</span>
            <span className="basket__fruits">
              {Array.from({ length: side.count }, (_, index) => (
                <FruitSvg key={index} fruit={question.fruit} className="basket__fruit" />
              ))}
            </span>
            {showCount ? <span className="basket__count">{side.count}</span> : null}
            {reveal ? <span className="basket__tag">Ini jawabannya</span> : null}
          </button>
        );
      })}
    </section>
  );
}
