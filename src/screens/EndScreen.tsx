import { Mascot } from '../components/Mascot';
import { ISLAND, isChapterUnlocked } from '../game/chapters';
import { useGame } from '../state/GameProvider';

/**
 * Layar Penutup — rayakan progres dan undang anak mencoba lagi.
 */
export function EndScreen() {
  const { profile, goToMap } = useGame();
  const completed = profile?.completedChapters ?? [];
  const collection = profile?.collection ?? [];
  const nextChapter = ISLAND.chapters.find(
    (chapter) =>
      !completed.includes(chapter.id) &&
      isChapterUnlocked(chapter, completed),
  );

  return (
    <main className="screen end">
      <Mascot mood="happy" className="end__mascot" />
      <h1 className="end__title">Hebat, kamu makin jago! ⭐</h1>
      <p className="end__note">
        Hari ini kamu sudah menyelesaikan {completed.length} bab dan punya{' '}
        {collection.length} kartu.{' '}
        {nextChapter
          ? `Tantangan berikutnya, Level ${nextChapter.level}: ${nextChapter.title}, sudah menunggu!`
          : 'Kamu sudah membuka semua level. Coba lagi untuk makin mahir bersama Kiko!'}
      </p>
      <button type="button" className="btn btn--ghost" onClick={goToMap}>
        {nextChapter ? 'Lihat tantangan berikutnya' : 'Pilih level lagi'}
      </button>
    </main>
  );
}
