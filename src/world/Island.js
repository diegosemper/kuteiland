// Het zwevende eiland: grondtegels, de rotsklomp eronder, graspollen, gruis en mist.
import { CONFIG } from '../config.js';
import { gridToScreen } from '../iso.js';
import { mulberry32 } from '../rng.js';
import { getNoise } from '../art/index.js';
import { tileTexture, undersideTexture, grassAmount, TILE_TEX } from '../art/terrain.js';

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
    const N = getNoise();
    const tiles = [...this.tiles.values()].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    const ox = TILE_TEX.cx / TILE_TEX.w, oy = TILE_TEX.cy / TILE_TEX.h;

    let sumX = 0, sumY = 0;
    for (const t of tiles) {
      const s = gridToScreen(t.gx, t.gy);
      const texKey = `tile_${t.gx}_${t.gy}`;
      tileTexture(scene, texKey, t.gx, t.gy, N);
      scene.add.image(s.x, s.y, texKey).setOrigin(ox, oy).setDepth(-10000 + t.gx + t.gy);
      sumX += s.x;
      sumY += s.y;
    }
    this.center = { x: sumX / tiles.length, y: sumY / tiles.length };

    // Rotsklomp eronder
    const u = undersideTexture(scene, 'underside', tiles, this.edgeDistances(), N, rnd);
    scene.add.image(u.x, u.y, 'underside').setOrigin(0).setScale(u.scale).setDepth(-20000);
    this.bottom = u.maxBottom;

    this.addTufts(tiles, N, rnd);

    // Gruis dat langzaam onder het eiland vandaan valt
    const drops = u.bottoms;
    scene.add.particles(0, 0, 'dust', {
      emitCallback: (p) => {
        const b = drops[Math.floor(Math.random() * drops.length)];
        p.x = b.x + (Math.random() - 0.5) * 8;
        p.y = b.y - 6;
      },
      speedY: { min: 10, max: 28 },
      lifespan: 5000,
      frequency: 220,
      scale: { min: 0.4, max: 1 },
      alpha: { start: 0.9, end: 0 },
    }).setDepth(-19990);

    // Mist rond de onderkant
    const mistY = (this.center.y + this.bottom) / 2 + 40;
    [[-150, -20500, 0.22, 3.2], [140, -20500, 0.18, 2.6], [10, -19980, 0.1, 3.6]].forEach(([dx, depth, alpha, sc], i) => {
      const m = scene.add.image(u.centerX + dx, mistY + i * 30, 'mist')
        .setTint(0x7a5aa8).setAlpha(alpha).setScale(sc, sc * 0.7).setDepth(depth);
      scene.tweens.add({
        targets: m, x: m.x + (i % 2 ? -60 : 60), duration: 9000 + i * 2500,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });
  }

  addTufts(tiles, N, rnd) {
    const scene = this.scene;
    const { tileW: TW, tileH: TH } = CONFIG.iso;
    const blocked = this.markers.map((m) => gridToScreen(m.gx, m.gy));
    for (const t of tiles) {
      const s = gridToScreen(t.gx, t.gy);
      const n = Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const lx = (rnd() - 0.5) * TW * 0.7, ly = (rnd() - 0.5) * TH * 0.7;
        if (Math.abs(lx) / (TW * 0.35) + Math.abs(ly) / (TH * 0.35) > 1) continue;
        const x = s.x + lx, y = s.y + ly;
        if (grassAmount(N, x, y) < 0.5) continue;
        if (blocked.some((b) => Math.hypot(b.x - x, (b.y - y) * 2) < 40)) continue;
        const tuft = scene.add.image(x, y, 'tuft').setOrigin(0.5, 1).setDepth(y)
          .setScale(0.8 + rnd() * 0.6).setFlipX(rnd() < 0.5);
        scene.tweens.add({
          targets: tuft, angle: { from: -3, to: 3 }, duration: 1600 + rnd() * 1400,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd() * 1500,
        });
      }
    }
  }
}
