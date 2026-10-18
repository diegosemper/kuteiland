import { getDpr } from './display.js';
import { BootScene } from './scenes/BootScene.js';
import { BackgroundScene } from './scenes/BackgroundScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { HakkenScene } from './scenes/minigames/HakkenScene.js';
import { ProefScene } from './scenes/minigames/ProefScene.js';
import { DelvenScene } from './scenes/minigames/DelvenScene.js';
import { GrijphaakScene } from './scenes/minigames/GrijphaakScene.js';
import { AfdalingScene } from './scenes/minigames/AfdalingScene.js';
import { KokenScene } from './scenes/minigames/KokenScene.js';
import { SterrenvangstScene } from './scenes/minigames/SterrenvangstScene.js';
import { ArenaScene } from './scenes/minigames/ArenaScene.js';

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
  // minigames als laatste: die liggen over alles heen
  scene: [BootScene, BackgroundScene, GameScene, UIScene, HakkenScene, DelvenScene, GrijphaakScene, AfdalingScene, KokenScene, SterrenvangstScene, ArenaScene, ProefScene],
});

// Opstartscherm: het spel staat stil tot je op 'tik om te spelen' drukt
window.addEventListener('kuteiland-start', () => {
  game.scene.resume('Game');
  game.scene.resume('UI');
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
  // nieuwe versie actief geworden? Eén keer herladen, zodat je meteen de nieuwe code hebt.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}
