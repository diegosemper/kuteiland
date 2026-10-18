// Service worker: zorgt dat het spel installeerbaar is en offline blijft werken.
// Strategie: eerst het netwerk (zodat updates meteen binnenkomen), bij geen verbinding de cache.
// Verhoog CACHE bij grote wijzigingen om oude bestanden op te ruimen.
const CACHE = 'kuteiland-v6';

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './lib/phaser.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './src/bus.js',
  './src/config.js',
  './src/controls.js',
  './src/display.js',
  './src/iso.js',
  './src/main.js',
  './src/noise.js',
  './src/rng.js',
  './src/texts.js',
  './src/art/anchor.js',
  './src/art/character.js',
  './src/art/creatures.js',
  './src/art/defenses.js',
  './src/art/drift.js',
  './src/art/fx.js',
  './src/art/icons.js',
  './src/art/index.js',
  './src/art/props.js',
  './src/art/structures.js',
  './src/art/terrain.js',
  './src/art/util.js',
  './src/scenes/BackgroundScene.js',
  './src/scenes/BootScene.js',
  './src/scenes/GameScene.js',
  './src/scenes/UIScene.js',
  './src/systems/Building.js',
  './src/systems/Crafting.js',
  './src/systems/Crumble.js',
  './src/systems/DayNight.js',
  './src/systems/Drift.js',
  './src/systems/Inventory.js',
  './src/systems/Night.js',
  './src/systems/Objectives.js',
  './src/systems/Pathfinding.js',
  './src/systems/Skills.js',
  './src/systems/save.js',
  './src/ui/ActionButton.js',
  './src/ui/AnchorPanel.js',
  './src/ui/BuildBar.js',
  './src/ui/ChestPanel.js',
  './src/ui/ClockHud.js',
  './src/ui/CraftPanel.js',
  './src/ui/DeathScreen.js',
  './src/ui/HeartsHud.js',
  './src/ui/InventoryPanel.js',
  './src/ui/Joystick.js',
  './src/ui/NightOverlay.js',
  './src/ui/ObjectiveHud.js',
  './src/ui/Panel.js',
  './src/ui/SkillXpBar.js',
  './src/ui/SkillsPanel.js',
  './src/ui/Toast.js',
  './src/ui/style.js',
  './src/world/Anchor.js',
  './src/world/Chest.js',
  './src/world/Defenses.js',
  './src/world/Enemy.js',
  './src/world/Generator.js',
  './src/world/Grave.js',
  './src/world/Health.js',
  './src/world/Island.js',
  './src/world/Player.js',
  './src/world/Tree.js',
  './src/world/Workbench.js',
  './src/world/objects.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(CORE.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
        .then((hit) => hit || Response.error())),
  );
});
