import { Mascot } from '../components/Mascot';
import { ISLAND, isChapterUnlocked } from '../game/chapters';
import { useGame } from '../state/GameProvider';

/**
 * Layar Penutup — rayakan progres dan undang anak mencoba lagi.
 */
export function EndScreen() {
  const { save, goToMap } = useGame();
  const nextChapter = ISLAND.chapters.find(
    (chapter) =>
      !save.completedChapters.includes(chapter.id) &&
      isChapterUnlocked(chapter, save.completedChapters),
  );

  return (
    <main className="screen end">
      <Mascot mood="happy" className="end__mascot" />
      <h1 className="end__title">Hebat, kamu makin jago! ⭐</h1>
      <p className="end__note">
        Hari ini kamu sudah menyelesaikan {save.completedChapters.length} bab dan punya{' '}
        {save.collection.length} kartu.{' '}
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
