import { Mascot } from '../components/Mascot';
import { useGame } from '../state/GameProvider';

/**
 * Layar Penutup — titik berhenti natural.
 * Tidak ada tombol "lanjut terus"; hanya jalan keluar yang kalem.
 */
export function EndScreen() {
  const { save, goToStart } = useGame();

  return (
    <main className="screen end">
      <Mascot mood="sleep" className="end__mascot" />
      <h1 className="end__title">Sampai jumpa besok 🌙</h1>
      <p className="end__note">
        Hari ini kamu sudah menyelesaikan {save.completedChapters.length} bab dan punya{' '}
        {save.collection.length} kartu. Kiko mau tidur dulu, ya.
      </p>
      <button type="button" className="btn btn--ghost" onClick={goToStart}>
        Kembali ke awal
      </button>
    </main>
  );
}
