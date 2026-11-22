import { Mascot } from '../components/Mascot';
import { useGame } from '../state/GameProvider';

/**
 * Layar Hadiah: kartu hewan (terprediksi, bukan gacha) + bintang.
 * Bintang dihitung dari jumlah percobaan dibanding jumlah soal, jadi anak yang
 * butuh bantuan tetap dapat hadiah — tidak ada hukuman.
 * Tombol kartu bisa diklik untuk melihat hikmah dari kisah Rasulullah
 * yang relevan dengan materi chapter yang terakhir dimainkan.
 * Hanya satu tombol utama "Selesai" → langsung ke layar penutup.
 */
export function RewardScreen() {
  const { rewardCard, run, profile, finishToEnd } = useGame();

  const totalQuestions = run ? Math.max(1, run.queue.length) : 1;
  const attempts = run?.attempts ?? totalQuestions;
  const stars = attempts <= totalQuestions ? 3 : attempts <= totalQuestions + Math.ceil(totalQuestions / 2) ? 2 : 1;
  const isNew = rewardCard ? (profile?.collection ?? []).includes(rewardCard.id) : false;

  // Hikmah-kisah Rasulullah per chapter theme, diacak setiap kali kartu diklik
  const chapterId = run?.chapterId ?? '';
  const chapterNumber = chapterId ? parseInt(chapterId.replace('pulau-buah-bab-', ''), 10) : 1;

  // Daftar hikmah per chapter (1-6)
  const wisdomStories: Record<number, string[]> = {
    1: [
      'Ketika Nabi Muhammad SAW menghitung hari di langit, Ia mengajarkan kita menghayati setiap nikmat Allah dengan terima kasih.',
      'Setiap nikmat yang Allah berikan, hendaklah dihindari dari ketidaktawaangan dan dipertahankan dengan syukur.',
      'Kau sungguh diberikan rizki yang tidak terhitung jumlahnya, maka jadilah orang yang syukur.',
    ],
    2: [
      'Salah satu saat, Nabi Muhammad SAW membagi 7 buah kurma kepada cada sahabat. Setiap orang mendapat yang sama.',
      'Kebaikan yang dikabulkan Allah berganda-banding, maka berikanlah kebaikan kepada orang lain.',
      'Berikanlah sesama makhluk dengan adil, sesungguhnya Allah mencintai orang-orang yang adil.',
    ],
    3: [
      'Ketika seseorang memberikan sedekah, barangnya sedikit berkurang tapi pahalanya bertambah banyak.',
      'Siapa yang memberikan sedekah dengan nailahnya, maka Allah akan menggandakan rizkinya.',
      'Kurangilah barang duniawi demi memperoleh keberkahan yang abadi di sisi Allah.',
    ],
    4: [
      "Nabi Muhammad SAW pernah membandingkan orang yang membaca Al-Qur'an dengan buah yang segar.",
      'Yang terberat di panggunpalan amal saleh, maka hendaklah kita selalu mengerjakan kebaikan.',
      'Beda-beda umat, namun satu dalam ketakwaan, ajarlah baik kepada sesama makhluk.',
    ],
    5: [
      'Nabi Muhammad SAW mengajarkan bahwa amal saleh seperti membagi makanan bermanfaat.',
      'Setiap kali kamu berbuat kebaikan, pahalanya dikali lipat-lipat oleh Allah yang Maha Penghasil.',
      'Siapa yang berbuat saleh, bagi laki-laki atau perempuan, dan beriman, maka pasti Kami akan hidupkan nyawanya dengan kehidupan yang baik.',
    ],
    6: [
      'Hadis Shahih: "Nabi Muhammad SAW membagi 7 buah kurma kepada setiap sahabat."',
      'Membagi dengan adil sehingga setiap orang merasa bahagia dan terima kasih.',
      'Sesungguhnya Allah memerintahkan kita berbuat adil, bahkan (hukum) hingga kepada orang yang musuhmu.',
    ],
  };

  const storyPool: string[] = wisdomStories[chapterNumber] || [];
  const randomStory =
    storyPool.length > 0
      ? storyPool[Math.floor(Math.random() * storyPool.length)]
      : '';

  const handleCardClick = () => {
    if (randomStory) {
      alert(randomStory);
    }
  };

  return (
    <main className="screen reward">
      <div className="reward__card" onClick={handleCardClick} aria-label="Klik untuk melihat hikmah">
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
