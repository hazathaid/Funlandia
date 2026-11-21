import { useGame } from '../state/GameProvider';

/**
 * Tombol mute selalu terlihat di semua layar (pojok kanan atas).
 * zIndex > overlay dialog supaya tetap terjangkau saat konfirmasi berhenti.
 * Preferensi disimpan di save file, jadi tidak berubah setelah refresh.
 */
export function MuteButton() {
  const { audioOn, toggleAudio } = useGame();

  return (
    <button
      type="button"
      className={`mute-btn ${audioOn ? '' : 'mute-btn--off'}`}
      onClick={toggleAudio}
      aria-pressed={!audioOn}
      aria-label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
      title={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
      style={{ zIndex: 60 }}
    >
      <span aria-hidden="true">{audioOn ? '🔊' : '🔇'}</span>
    </button>
  );
}
