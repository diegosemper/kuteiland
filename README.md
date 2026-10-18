# Kuteiland

Mobiel isometrisch overlevingsspel op een zwevend eiland boven de leegte. Zie [PLAN.md](PLAN.md) voor het volledige plan.

**Status:** fase 1 (basis) en fase 2 (bouwen en craften) klaar.

## Lokaal spelen

Je hebt alleen [Node.js](https://nodejs.org) nodig, verder geen installatie.

```
npm start
```

- Op de computer: open `http://localhost:8080`
- Op je telefoon (zelfde wifi): open het adres dat `npm start` toont, bijvoorbeeld `http://192.168.1.23:8080`.
  Vraagt Windows om netwerktoegang voor Node? Kies "Toestaan" voor privénetwerken.

Besturing op de computer: WASD of pijltjes om te lopen, spatie of E voor actie, I voor de rugzak, B voor bouwen.

Testen met `?debug` achter de URL maakt het spel bereikbaar als `window.kuteiland` in de console.

## Publiceren op GitHub Pages

1. Maak op GitHub een nieuwe (lege) repository, bijvoorbeeld `kuteiland`.
2. Koppel en push:
   ```
   git remote add origin https://github.com/<jouw-naam>/kuteiland.git
   git push -u origin main
   ```
3. Op GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, kies `main` en map `/ (root)`.
4. Na een minuutje staat het spel op `https://<jouw-naam>.github.io/kuteiland/`.
5. Op je telefoon: open die link en kies **Toevoegen aan beginscherm** (iPhone: deelknop; Android: menu met drie puntjes).

## Structuur

```
index.html              pagina, laadt Phaser en src/main.js
manifest.webmanifest    PWA-manifest
sw.js                   service worker (offline spelen)
lib/phaser.min.js       Phaser 3.90
icons/                  app-iconen (opnieuw maken: npm run icons)
src/
  config.js             ALLE balansgetallen en instellingen
  texts.js              alle teksten die de speler ziet
  art/                  alle graphics, in code getekend
  iso.js                isometrische omrekening
  scenes/               Boot, Background (leegte), Game (wereld), UI (knoppen)
  world/                Island, Player, Tree, Chest, Workbench, Generator
  systems/              Inventory, Crafting, Building, Objectives, save
  ui/                   Joystick, knoppen, panelen (rugzak, kist, werkbank), bouwbalk, doelen
tools/                  lokale server en icoongenerator
```

Nieuwe bestanden in `src/`? Zet ze ook in de `CORE`-lijst in `sw.js` en verhoog daar `CACHE`.
