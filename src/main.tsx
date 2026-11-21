import { createRoot } from 'react-dom/client';

// Font SELF-HOSTED: disalin dari node_modules ke bundle oleh Vite.
// Tidak ada <link> ke Google Fonts / CDN apa pun (dijaga `npm run audit:offline`).
import '@fontsource/baloo-2/400.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';

import './design/tokens.css';
import './styles.css';
import './design/overrides.css';

import { App } from './App';
import { unlockAudio } from './platform/audio';
import { registerServiceWorker } from './platform/pwa';
import { GameProvider } from './state/GameProvider';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Elemen #root tidak ditemukan di index.html');
}

// Browser mengunci AudioContext sampai ada gesture; buka sekali di sentuhan pertama.
const unlockOnFirstGesture = () => {
  void unlockAudio();
  window.removeEventListener('pointerdown', unlockOnFirstGesture);
};
window.addEventListener('pointerdown', unlockOnFirstGesture);

// Sengaja tanpa <StrictMode>: efek finalisasi bab menulis save file (side effect),
// dan double-invoke di dev akan menghitung durasi sesi dua kali.
createRoot(container).render(
  <GameProvider>
    <App />
  </GameProvider>,
);

// Shell PWA (precache-all). Offline-ready setelah kunjungan pertama.
registerServiceWorker();
