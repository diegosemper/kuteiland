// Het zwevende eiland: tegels (aarde, vlonder, puinblok), de rotsklomp eronder, graspollen, gruis en mist.
import { CONFIG } from '../config.js';
import { gridToScreen } from '../iso.js';
import { mulberry32 } from '../rng.js';
import { getNoise } from '../art/index.js';
import { tileTexture, undersideTexture, grassAmount, TILE_TEX } from '../art/terrain.js';

const key = (gx, gy) => `${gx},${gy}`;
const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Startopstelling uit CONFIG: tegels plus waar boom, kist en speler staan
export function layoutFromConfig() {
  const tiles = [];
  const objects = [];
  let spawn = { gx: 0, gy: 0 };
  CONFIG.island.layout.forEach((row, gy) => {
    [...row].forEach((ch, gx) => {
      if (ch === '.' || ch === ' ') return;
      tiles.push([gx, gy, 'dirt']);
      if (ch === 'T') objects.push({ type: 'tree', gx, gy });
      if (ch === 'C') objects.push({ type: 'chest', gx, gy });
      if (ch === 'P') spawn = { gx, gy };
    });
  });
  return { tiles, objects, spawn };
}

export class Island {
  // tileList: [[gx, gy, kind], ...]   blockedSpots: plekken van objecten (daar geen graspollen)
  constructor(scene, tileList, blockedSpots = []) {
    this.scene = scene;
    this.blockedSpots = blockedSpots;
    this.N = getNoise();
    this.tiles = new Map();
    this.undersideVersion = 0;
    this.drops = [];

    for (const [gx, gy, kind] of tileList) this.tiles.set(key(gx, gy), { gx, gy, kind: kind || 'dirt' });
    for (const t of this.sortedTiles()) this.createTileSprite(t);

    this.center = this.computeCenter();
    this.rebuildUnderside();
    this.addTufts(mulberry32(CONFIG.island.seed));
    this.addAmbience();
  }

  // Staat dit punt (in tegel-coördinaten) op het eiland?
  has(gx, gy) {
    return this.tiles.has(key(Math.round(gx), Math.round(gy)));
  }

  get(gx, gy) {
    return this.tiles.get(key(gx, gy));
  }

  get size() {
    return this.tiles.size;
  }

  sortedTiles() {
    return [...this.tiles.values()].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
  }

  serialize() {
    return [...this.tiles.values()].map((t) => [t.gx, t.gy, t.kind]);
  }

  computeCenter() {
    let sx = 0, sy = 0;
    for (const t of this.tiles.values()) {
      const s = gridToScreen(t.gx, t.gy);
      sx += s.x; sy += s.y;
    }
    return { x: sx / this.tiles.size, y: sy / this.tiles.size };
  }

  createTileSprite(t) {
    const s = gridToScreen(t.gx, t.gy);
    const texKey = `tile_${t.gx}_${t.gy}`;
    tileTexture(this.scene, texKey, t.gx, t.gy, this.N, t.kind);
    t.sprite = this.scene.add.image(s.x, s.y, texKey)
      .setOrigin(TILE_TEX.cx / TILE_TEX.w, TILE_TEX.cy / TILE_TEX.h)
      .setDepth(-10000 + t.gx + t.gy);
    return t.sprite;
  }

  // Lege plekken die aan het eiland grenzen: hier kan een nieuw blok
  freeEdgeSpots() {
    const spots = new Map();
    for (const t of this.tiles.values()) {
      for (const [dx, dy] of NEIGHBOURS) {
        const gx = t.gx + dx, gy = t.gy + dy;
        if (!this.tiles.has(key(gx, gy))) spots.set(key(gx, gy), { gx, gy });
      }
    }
    return [...spots.values()];
  }

  canAddTile(gx, gy) {
    return !this.tiles.has(key(gx, gy)) && NEIGHBOURS.some(([dx, dy]) => this.tiles.has(key(gx + dx, gy + dy)));
  }

  addTile(gx, gy, kind) {
    if (!this.canAddTile(gx, gy)) return false;
    const t = { gx, gy, kind };
    this.tiles.set(key(gx, gy), t);
    const sprite = this.createTileSprite(t);

    // blok valt op zijn plek
    const y = sprite.y;
    sprite.setY(y - 40).setAlpha(0);
    this.scene.tweens.add({ targets: sprite, y, alpha: 1, duration: 280, ease: 'Bounce.easeOut' });
    const s = gridToScreen(gx, gy);
    this.scene.time.delayedCall(180, () => this.puff.explode(10, s.x, s.y + 6));

    this.center = this.computeCenter();
    this.rebuildUnderside();
    return true;
  }

  // Tegel verwijderen (afgebrokkeld). De sprite valt al door Crumble; hier alleen opruimen.
  removeTile(gx, gy, keepTexture = false) {
    const t = this.get(gx, gy);
    if (!t) return;
    this.tiles.delete(key(gx, gy));
    t.tufts?.forEach((s) => s.destroy());
    const texKey = `tile_${gx}_${gy}`;
    t.sprite?.destroy();
    if (!keepTexture && this.scene.textures.exists(texKey)) this.scene.textures.remove(texKey);
    this.center = this.computeCenter();
    this.rebuildUnderside();
  }

  // Blijft het eiland één geheel als deze tegel weg is?
  staysConnected(gx, gy) {
    const rest = [...this.tiles.values()].filter((t) => t.gx !== gx || t.gy !== gy);
    if (!rest.length) return false;
    const seen = new Set([key(rest[0].gx, rest[0].gy)]);
    const queue = [rest[0]];
    while (queue.length) {
      const c = queue.shift();
      for (const [dx, dy] of NEIGHBOURS) {
        const k = key(c.gx + dx, c.gy + dy);
        if (seen.has(k) || !this.tiles.has(k) || (c.gx + dx === gx && c.gy + dy === gy)) continue;
        seen.add(k);
        queue.push(this.tiles.get(k));
      }
    }
    return seen.size === rest.length;
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

  // De rotsklomp eronder opnieuw tekenen (na elke verandering van het eiland)
  rebuildUnderside() {
    const scene = this.scene;
    const oldKey = this.undersideKey;
    this.undersideKey = `underside_${this.undersideVersion++}`;
    const u = undersideTexture(scene, this.undersideKey, this.sortedTiles(), this.edgeDistances(),
      this.N, mulberry32(CONFIG.island.seed));
    if (!this.underside) {
      this.underside = scene.add.image(u.x, u.y, this.undersideKey).setOrigin(0).setDepth(-20000);
    }
    this.underside.setTexture(this.undersideKey).setPosition(u.x, u.y).setScale(u.scale);
    if (oldKey) scene.textures.remove(oldKey);
    this.bottom = u.maxBottom;
    this.undersideCenterX = u.centerX;
    this.drops.length = 0;
    this.drops.push(...u.bottoms);
  }

  addAmbience() {
    const scene = this.scene;
    const drops = this.drops;
    // gruis dat langzaam onder het eiland vandaan valt
    scene.add.particles(0, 0, 'dust', {
      emitCallback: (p) => {
        const b = drops[Math.floor(Math.random() * drops.length)];
        if (!b) return;
        p.x = b.x + (Math.random() - 0.5) * 8;
        p.y = b.y - 6;
      },
      speedY: { min: 10, max: 28 },
      lifespan: 5000,
      frequency: 220,
      scale: { min: 0.4, max: 1 },
      alpha: { start: 0.9, end: 0 },
    }).setDepth(-19990);

    // stofwolkje bij het plaatsen van een blok
    this.puff = scene.add.particles(0, 0, 'puff', {
      emitting: false,
      speed: { min: 20, max: 70 },
      angle: { min: 150, max: 390 },
      lifespan: 600,
      scale: { start: 0.8, end: 2 },
      alpha: { start: 0.6, end: 0 },
    }).setDepth(5e5);

    // mist rond de onderkant
    const mistY = (this.center.y + this.bottom) / 2 + 40;
    [[-150, -20500, 0.22, 3.2], [140, -20500, 0.18, 2.6], [10, -19980, 0.1, 3.6]].forEach(([dx, depth, alpha, sc], i) => {
      const m = scene.add.image(this.undersideCenterX + dx, mistY + i * 30, 'mist')
        .setTint(0x7a5aa8).setAlpha(alpha).setScale(sc, sc * 0.7).setDepth(depth);
      scene.tweens.add({
        targets: m, x: m.x + (i % 2 ? -60 : 60), duration: 9000 + i * 2500,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });
  }

  addTufts(rnd) {
    const scene = this.scene;
    const N = this.N;
    const { tileW: TW, tileH: TH } = CONFIG.iso;
    const blocked = (this.blockedSpots || []).map((m) => gridToScreen(m.gx, m.gy));
    for (const t of this.sortedTiles()) {
      if (t.kind !== 'dirt') continue;
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
        t.tufts = t.tufts || [];
        t.tufts.push(tuft);
        scene.tweens.add({
          targets: tuft, angle: { from: -3, to: 3 }, duration: 1600 + rnd() * 1400,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd() * 1500,
        });
      }
    }
  }

  // Graspollen op een tegel weghalen (als er iets op gebouwd wordt)
  clearTufts(gx, gy) {
    const t = this.get(gx, gy);
    t?.tufts?.forEach((s) => s.destroy());
    if (t) t.tufts = [];
  }
}
