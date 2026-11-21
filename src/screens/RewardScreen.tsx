import { Mascot } from '../components/Mascot';
import { useGame } from '../state/GameProvider';

/**
 * Layar Hadiah: kartu hewan (terprediksi, bukan gacha) + bintang.
 * Bintang dihitung dari jumlah percobaan dibanding jumlah soal, jadi anak yang
 * butuh bantuan tetap dapat hadiah — tidak ada hukuman.
 * Hanya satu tombol utama "Selesai" → langsung ke layar penutup.
 */
export function RewardScreen() {
  const { rewardCard, run, save, finishToEnd } = useGame();

  const totalQuestions = run ? Math.max(1, run.queue.length) : 1;
  const attempts = run?.attempts ?? totalQuestions;
  const stars = attempts <= totalQuestions ? 3 : attempts <= totalQuestions + Math.ceil(totalQuestions / 2) ? 2 : 1;
  const isNew = rewardCard ? save.collection.includes(rewardCard.id) : false;

  return (
    <main className="screen reward">
      <div className="reward__card">
        <span className="reward__ribbon">{isNew ? 'Kartu baru!' : 'Kartu koleksimu'}</span>
        <Mascot mood="happy" className="reward__mascot" />
        <h1 className="reward__title">{rewardCard?.name ?? 'Kiko si Rubah'}</h1>
        <div className="stars" aria-label={`Dapat ${stars} bintang`}>
          {Array.from({ length: 3 }, (_, index) => (
            <span key={index} className={`star ${index < stars ? 'star--on' : ''}`} aria-hidden="true">
              ⭐
            </span>
          ))}
        </div>
        <p className="reward__note">
          Kartu ini tersimpan di koleksimu. Kamu sudah menyelesaikan {totalQuestions} soal sampai habis!
        </p>
      </div>

      <button type="button" className="btn btn--primary btn--wide" onClick={finishToEnd}>
        Selesai
      </button>
    </main>
  );
}
