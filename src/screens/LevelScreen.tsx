import { Mascot } from '../components/Mascot';
import { useGame } from '../state/GameProvider';

const LEVELS = [
  { difficulty: 0 as const, title: 'Easy', emoji: '🌱', subtitle: 'Mulai perlahan, angka kecil' },
  { difficulty: 1 as const, title: 'Medium', emoji: '🌟', subtitle: 'Tantangan sedikit lebih seru' },
  { difficulty: 2 as const, title: 'Hard', emoji: '🚀', subtitle: 'Untuk anak yang siap tantangan' },
];

/** Pilih tingkat kesulitan setelah memilih atau membuat profil, sebelum masuk peta. */
export function LevelScreen() {
  const { profile, selectDifficulty, goToMap, goToStart } = useGame();
  const selected = profile?.difficulty ?? 0;

  return (
    <main className="screen level-select">
      <header className="level-select__header">
        <button type="button" className="icon-btn" onClick={goToStart} aria-label="Ganti pengguna">
          <span aria-hidden="true">←</span>
        </button>
        <div>
          <h1 className="level-select__title">Pilih Level</h1>
          <p className="level-select__subtitle">Lihat perjalanan Kiko sebelum masuk ke peta pulau.</p>
        </div>
      </header>

      <Mascot mood="happy" className="level-select__mascot" />

      <div className="level-select__list" role="group" aria-label="Pilih level">
        {LEVELS.map((level) => (
          <button
            type="button"
            key={level.title}
            className={`level-card ${selected === level.difficulty ? 'level-card--selected' : ''}`}
            aria-pressed={selected === level.difficulty}
            onClick={() => selectDifficulty(level.difficulty)}
          >
            <span className="level-card__number" aria-hidden="true">{level.emoji}</span>
            <span>
              <strong>{level.title}</strong>
              <small>{level.subtitle}</small>
            </span>
          </button>
        ))}
      </div>

      <button type="button" className="btn btn--primary btn--wide" onClick={goToMap}>
        Masuk Peta Pulau
      </button>
    </main>
  );
}
