export interface ProgressDotsProps {
  total: number;
  current: number;
  done: boolean;
}

/**
 * Progres bab: 10 titik. Titik terisi = soal yang sudah dilewati.
 * Hanya informasi (tidak bisa di-tap) supaya anak tidak "melompat" soal.
 */
export function ProgressDots({ total, current, done }: ProgressDotsProps) {
  return (
    <div
      className="dots"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(total, done ? total : current + 1)}
      aria-label={`Soal ${Math.min(total, current + 1)} dari ${total}`}
    >
      {Array.from({ length: total }, (_, index) => {
        const state = index < current || (done && index <= current) ? 'done' : index === current ? 'now' : 'todo';
        return <span key={index} className={`dot dot--${state}`} />;
      })}
    </div>
  );
}
