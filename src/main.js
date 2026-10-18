import { getDpr } from './display.js';
import { BootScene } from './scenes/BootScene.js';
import { BackgroundScene } from './scenes/BackgroundScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

// Het canvas draait op de echte pixeldichtheid van het scherm (begrensd) en wordt
// met CSS teruggeschaald, zodat pixel art en tekst scherp blijven op telefoons.
function canvasSize() {
  const d = getDpr();
  return { w: Math.round(window.innerWidth * d), h: Math.round(window.innerHeight * d), zoom: 1 / d };
}

const size = canvasSize();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b0612',
  antialias: true,
  scale: {
    mode: Phaser.Scale.NONE,
    width: size.w,
    height: size.h,
    zoom: size.zoom,
  },
  input: { activePointers: 3 },
  // volgorde = tekenvolgorde: achtergrond onder, UI boven
  scene: [BootScene, BackgroundScene, GameScene, UIScene],
});

// Voor testen: ?debug in de URL maakt het spel bereikbaar via window.kuteiland
if (new URLSearchParams(location.search).has('debug')) window.kuteiland = game;

function onResize() {
  const s = canvasSize();
  game.scale.resize(s.w, s.h);
  game.scale.setZoom(s.zoom);
}
window.addEventListener('resize', onResize);
window.visualViewport?.addEventListener('resize', onResize);

// Geen zoomen, geen contextmenu, geen dubbeltik-zoom op iOS
for (const ev of ['gesturestart', 'gesturechange', 'contextmenu', 'dblclick']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}

// PWA: service worker alleen op https of localhost (anders weigert de browser hem toch)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
