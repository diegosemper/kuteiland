// Het zwevende eiland: tegels, de rotsklomp eronder en vallend gruis.
import { CONFIG } from '../config.js';
import { gridToScreen } from '../iso.js';
import { mulberry32 } from '../rng.js';

const key = (gx, gy) => `${gx},${gy}`;
const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class Island {
  constructor(scene) {
    this.scene = scene;
    this.tiles = new Map();
    this.markers = [];
    this.spawn = { gx: 0, gy: 0 };

    CONFIG.island.layout.forEach((row, gy) => {
      [...row].forEach((ch, gx) => {
        if (ch === '.' || ch === ' ') return;
        this.tiles.set(key(gx, gy), { gx, gy });
        if (ch === 'T') this.markers.push({ type: 'tree', gx, gy });
        if (ch === 'C') this.markers.push({ type: 'chest', gx, gy });
        if (ch === 'P') this.spawn = { gx, gy };
      });
    });

    this.build(mulberry32(CONFIG.island.seed));
  }

  // Staat dit punt (in tegel-coördinaten) op het eiland?
  has(gx, gy) {
    return this.tiles.has(key(Math.round(gx), Math.round(gy)));
  }

  // Afstand tot de rand: 1 = randtegel, 2 = één stap naar binnen, enz.
  edgeDistances() {
    const dist = new Map();
    let frontier = [];
    for (const t of this.tiles.values()) {
      if (NEIGHBOURS.some(([dx, dy]) => !this.tiles.has(key(t.gx + dx, t.gy + dy)))) {
        dist.set(key(t.gx, t.gy), 1);
        frontier.push(t);
      }
    }
    while (frontier.length) {
      const next = [];
      for (const t of frontier) {
        const d = dist.get(key(t.gx, t.gy));
        for (const [dx, dy] of NEIGHBOURS) {
          const k = key(t.gx + dx, t.gy + dy);
          if (this.tiles.has(k) && !dist.has(k)) {
            dist.set(k, d + 1);
            next.push(this.tiles.get(k));
          }
        }
      }
      frontier = next;
    }
    return dist;
  }

  build(rnd) {
    const scene = this.scene;
    const BD = CONFIG.iso.blockDepth;
    const dist = this.edgeDistances();
    const tiles = [...this.tiles.values()].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));

    let minX = Infinity, maxX = -Infinity, maxY = -Infinity, sumX = 0, sumY = 0;

    for (const t of tiles) {
      const s = gridToScreen(t.gx, t.gy);
      const order = t.gx + t.gy;

      // Bovenlaag
      scene.add.image(s.x, s.y, `dirt${Math.floor(rnd() * 3)}`)
        .setOrigin(0.5, 1 / 3)
        .setDepth(-10000 + order);

      // Rotsklomp eronder: dieper in het midden, ondiep aan de rand
      const d = dist.get(key(t.gx, t.gy)) || 1;
      const layers = d * 3 - 1 + Math.floor(rnd() * 2);
      for (let k = 1; k <= layers; k++) {
        const v = Math.round(255 * Math.max(0.3, 1 - k * 0.09));
        scene.add.image(s.x, s.y + k * BD, `rock${Math.floor(rnd() * 2)}`)
          .setOrigin(0.5, 1 / 3)
          .setTint(Phaser.Display.Color.GetColor(v, v, v))
          .setDepth(-10000 - k * 100 + order);
      }

      minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x);
      maxY = Math.max(maxY, s.y + layers * BD);
      sumX += s.x; sumY += s.y;
    }

    this.center = { x: sumX / tiles.length, y: sumY / tiles.length };

    // Gruis dat langzaam onder het eiland vandaan valt
    scene.add.particles(0, 0, 'dust', {
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(minX - 8, maxY - 24, maxX - minX + 16, 20),
      },
      speedY: { min: 4, max: 12 },
      lifespan: 5000,
      frequency: 260,
      alpha: { start: 0.9, end: 0 },
    }).setDepth(-20000);
  }
}
