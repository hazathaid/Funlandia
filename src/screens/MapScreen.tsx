import { Mascot } from '../components/Mascot';
import { CARD_EMOJI, CARD_NAMES, ISLAND, isChapterUnlocked } from '../game/chapters';
import type { ChapterMode } from '../game/questions';
import { useGame } from '../state/GameProvider';
import { minutesUsedToday } from '../state/report';
import { AVATAR_EMOJI } from './StartScreen';

const MODE_ICON: Record<ChapterMode, string> = {
  counting: '🍎',
  addition: '➕',
  subtraction: '➖',
  compare: '⚖️',
  multiplication: '✖️',
  division: '➗',
};

/**
 * Peta Pulau: bab terbuka bertahap (menunjukkan ada kelanjutan,
 * tanpa tombol "main terus" yang menggoda).
 */
export function MapScreen() {
  const { profile, save, startChapter, finishToEnd, goToStart } = useGame();
  const completed = save.completedChapters;
  const minutesToday = minutesUsedToday(save, Date.now());
  const restSuggested = minutesToday >= save.settings.dailyLimitMin;

  return (
    <main className="screen map">
      <header className="map__header">
        <button
          type="button"
          className="icon-btn map__switch-profile"
          onClick={goToStart}
          aria-label="Kembali untuk ganti pengguna"
          title="Ganti pengguna"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div className="profile-chip">
          <span aria-hidden="true">{AVATAR_EMOJI[profile?.avatarId ?? 'rubah'] ?? '🦊'}</span>
          <span>{profile?.name ?? 'Anak'}</span>
        </div>
        <div className="star-chip" aria-label={`${completed.length} bab selesai`}>
          <span aria-hidden="true">⭐</span>
          <span>{completed.length}</span>
        </div>
      </header>

      <div className="map__intro">
        <Mascot mood="idle" className="map__mascot" />
        <div>
          <h1 className="map__title">Peta Pulau</h1>
          <p className="map__subtitle">Bantu Kiko menyalakan mercusuar dengan bintang angka.</p>
        </div>
      </div>

      {restSuggested ? (
        <section className="rest-banner" aria-label="Ajakan istirahat">
          <Mascot mood="sleep" className="rest-banner__mascot" />
          <div className="rest-banner__text">
            <strong>Kiko mengantuk.</strong>
            <p>Kamu sudah main {minutesToday} menit hari ini. Istirahat dulu, ya.</p>
          </div>
          <button type="button" className="btn btn--ghost btn--small" onClick={finishToEnd}>
            Istirahat
          </button>
        </section>
      ) : null}

      <section className="island" aria-label={`Pulau ${ISLAND.name}`}>
        <h2 className="island__name">{ISLAND.name}</h2>
        <ol className="chapter-list">
          {ISLAND.chapters.map((chapter) => {
            const isDone = completed.includes(chapter.id);
            const locked = !isChapterUnlocked(chapter, completed);
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  className={`chapter-node ${isDone ? 'chapter-node--done' : ''} ${
                    locked ? 'chapter-node--locked' : ''
                  }`}
                  disabled={locked}
                  onClick={() => startChapter(chapter.id)}
                  aria-label={`${chapter.title} ${isDone ? '(sudah selesai)' : locked ? '(terkunci)' : ''}`}
                >
                  <span className="chapter-node__icon" aria-hidden="true">
                    {locked ? '🔒' : isDone ? '⭐' : MODE_ICON[chapter.mode]}
                  </span>
                  <span className="chapter-node__text">
                    <span className="chapter-node__title">
                      Level {chapter.level} · {chapter.title}
                    </span>
                    <span className="chapter-node__sub">
                      {locked
                        ? 'Selesaikan bab sebelumnya dulu'
                        : isDone
                          ? 'Selesai — main lagi'
                          : chapter.subtitle}
                    </span>
                  </span>
                  {isDone ? (
                    <span className="chapter-node__badge" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="collection" aria-label="Koleksi kartu">
        <h2 className="section-title">Koleksi kartu</h2>
        <div className="collection__row">
          {save.collection.length === 0 ? (
            <p className="collection__empty">Selesaikan 1 bab untuk dapat kartu pertamamu.</p>
          ) : (
            save.collection.map((cardId) => (
              <div key={cardId} className="collection__card">
                <span aria-hidden="true">{CARD_EMOJI[cardId] ?? '🦊'}</span>
                <span>{CARD_NAMES[cardId] ?? cardId}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
