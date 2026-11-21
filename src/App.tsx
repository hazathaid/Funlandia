import { Mascot } from './components/Mascot';
import { MuteButton } from './components/MuteButton';
import { EndScreen } from './screens/EndScreen';
import { MapScreen } from './screens/MapScreen';
import { ParentZoneScreen } from './screens/ParentZoneScreen';
import { PlayScreen } from './screens/PlayScreen';
import { RewardScreen } from './screens/RewardScreen';
import { StartScreen } from './screens/StartScreen';
import { useGame } from './state/GameProvider';

/**
 * Layar Mulai → Peta Pulau → 10 soal → Hadiah → Penutup.
 * Tombol mute di-render di shell supaya SELALU terlihat di semua layar.
 */
export function App() {
  const { screen } = useGame();

  return (
    <div className="app-shell">
      <MuteButton />
      {screen === 'boot' ? (
        <div className="boot" role="status">
          <Mascot mood="idle" className="boot__mascot" />
          <p>Sebentar ya, Kiko sedang menyiapkan buah…</p>
        </div>
      ) : null}
      {screen === 'start' ? <StartScreen /> : null}
      {screen === 'map' ? <MapScreen /> : null}
      {screen === 'play' ? <PlayScreen /> : null}
      {screen === 'reward' ? <RewardScreen /> : null}
      {screen === 'end' ? <EndScreen /> : null}
      {screen === 'parent' ? <ParentZoneScreen /> : null}
    </div>
  );
}
