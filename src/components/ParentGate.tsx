import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

const HOLD_MS = 1200;

interface ParentGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Parent gate: tahan dua tombol sampai penuh (boleh bergantian), lalu jawab soal 2 digit.
 * Tujuannya mencegah anak 5 tahun masuk tanpa sengaja, bukan menyembunyikan fitur.
 */
export function ParentGate({ onSuccess, onCancel }: ParentGateProps) {
  const [holdingA, setHoldingA] = useState(false);
  const [holdingB, setHoldingB] = useState(false);
  const [doneA, setDoneA] = useState(false);
  const [doneB, setDoneB] = useState(false);
  const [stage, setStage] = useState<'hold' | 'challenge'>('hold');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const timerA = useRef<number | null>(null);
  const timerB = useRef<number | null>(null);

  const challenge = useMemo(
    () => ({
      a: 7 + Math.floor(Math.random() * 3),
      b: 7 + Math.floor(Math.random() * 3),
    }),
    [],
  );

  useEffect(() => {
    if (doneA && doneB) setStage('challenge');
  }, [doneA, doneB]);

  useEffect(
    () => () => {
      if (timerA.current !== null) window.clearTimeout(timerA.current);
      if (timerB.current !== null) window.clearTimeout(timerB.current);
    },
    [],
  );

  const startHold = (which: 'a' | 'b') => {
    if (which === 'a') {
      if (doneA || timerA.current !== null) return;
      setHoldingA(true);
      timerA.current = window.setTimeout(() => {
        timerA.current = null;
        setHoldingA(false);
        setDoneA(true);
      }, HOLD_MS);
      return;
    }

    if (doneB || timerB.current !== null) return;
    setHoldingB(true);
    timerB.current = window.setTimeout(() => {
      timerB.current = null;
      setHoldingB(false);
      setDoneB(true);
    }, HOLD_MS);
  };

  const stopHold = (which: 'a' | 'b') => {
    if (which === 'a') {
      if (timerA.current !== null) window.clearTimeout(timerA.current);
      timerA.current = null;
      setHoldingA(false);
      return;
    }
    if (timerB.current !== null) window.clearTimeout(timerB.current);
    timerB.current = null;
    setHoldingB(false);
  };

  const holdProps = (which: 'a' | 'b') => ({
    onPointerDown: () => startHold(which),
    onPointerUp: () => stopHold(which),
    onPointerLeave: () => stopHold(which),
    onPointerCancel: () => stopHold(which),
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === ' ' || event.key === 'Enter') startHold(which);
    },
    onKeyUp: () => stopHold(which),
  });

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="parent-gate-title">
      <div className="overlay__card parent-gate">
        <h2 id="parent-gate-title">Khusus orang tua</h2>

        {stage === 'hold' ? (
          <>
            <p>Tahan tiap tombol sampai penuh. Boleh bergantian atau bersamaan.</p>
            <div className="parent-gate__holds">
              <button
                type="button"
                className={`hold-btn ${holdingA ? 'hold-btn--active' : ''} ${
                  doneA ? 'hold-btn--done' : ''
                }`}
                aria-pressed={doneA}
                {...holdProps('a')}
              >
                <span className="hold-btn__fill" aria-hidden="true" />
                <span className="hold-btn__label">{doneA ? 'Siap ✓' : 'Tahan 1'}</span>
              </button>
              <button
                type="button"
                className={`hold-btn ${holdingB ? 'hold-btn--active' : ''} ${
                  doneB ? 'hold-btn--done' : ''
                }`}
                aria-pressed={doneB}
                {...holdProps('b')}
              >
                <span className="hold-btn__fill" aria-hidden="true" />
                <span className="hold-btn__label">{doneB ? 'Siap ✓' : 'Tahan 2'}</span>
              </button>
            </div>
            <div className="overlay__actions">
              <button type="button" className="btn btn--ghost" onClick={onCancel}>
                Batal
              </button>
            </div>
          </>
        ) : (
          <form
            className="parent-gate__form"
            onSubmit={(event) => {
              event.preventDefault();
              if (Number(answer) === challenge.a + challenge.b) {
                onSuccess();
                return;
              }
              setError('Belum tepat. Coba hitung lagi, ya.');
              setAnswer('');
            }}
          >
            <p>
              Untuk orang tua: berapa <strong>{challenge.a} + {challenge.b}</strong>?
            </p>
            <label className="field">
              <span className="field__label">Jawaban</span>
              <input
                className="field__input"
                type="number"
                inputMode="numeric"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                autoFocus
                aria-invalid={error ? true : undefined}
              />
            </label>
            {error ? (
              <p className="parent-gate__error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="overlay__actions">
              <button type="submit" className="btn btn--primary">
                Buka Zona Orang Tua
              </button>
              <button type="button" className="btn btn--ghost" onClick={onCancel}>
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
