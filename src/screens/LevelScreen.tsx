import { Mascot } from '../components/Mascot';
import { ISLAND, isChapterUnlocked } from '../game/chapters';
import { useGame } from '../state/GameProvider';

/** Langkah singkat setelah memilih profil: anak melihat progres level sebelum peta. */
export function LevelScreen() {
  const { save, goToMap, goToStart } = useGame();

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

      <ol className="level-select__list" aria-label="Daftar level">
        {ISLAND.chapters.map((chapter) => {
          const done = save.completedChapters.includes(chapter.id);
          const unlocked = isChapterUnlocked(chapter, save.completedChapters);
          return (
            <li key={chapter.id} className={`level-card ${done ? 'level-card--done' : ''}`}>
              <span className="level-card__number" aria-hidden="true">{chapter.level}</span>
              <span>
                <strong>Level {chapter.level}: {chapter.title}</strong>
                <small>{done ? 'Sudah selesai' : unlocked ? 'Siap dimainkan' : 'Masih terkunci'}</small>
              </span>
              <span aria-hidden="true">{done ? '⭐' : unlocked ? '✨' : '🔒'}</span>
            </li>
          );
        })}
      </ol>

      <button type="button" className="btn btn--primary btn--wide" onClick={goToMap}>
        Masuk Peta Pulau
      </button>
    </main>
  );
}
