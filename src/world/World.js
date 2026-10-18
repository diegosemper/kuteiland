// De wereld: het starteiland plus de verre eilanden. Biedt dezelfde methodes als één eiland,
// zodat speler, wezens, bouwen en routes niet hoeven te weten op welk eiland iets ligt.
import { CONFIG } from '../config.js';
import { Island, layoutFromConfig } from './Island.js';
import { getMeta } from '../systems/Meta.js';
import { mulberry32 } from '../rng.js';

// De verre eilanden voor deze cyclus. Cyclus 1 is altijd hetzelfde; daarna wisselen eilanden
// binnen hun ring van plek en liggen sommige gespiegeld. De Kern blijft in het midden.
export function islandDefs() {
  // Het Lek: er zijn geen verre eilanden meer. Grondstoffen komen uit bronnen die je zelf bouwt.
  if (!CONFIG.remoteIslands) return [];
  const cycle = getMeta().cycle;
  if (cycle <= 1) return CONFIG.islands;
  const rnd = mulberry32(cycle * 7919);
  const defs = CONFIG.islands.map((d) => ({ ...d }));
  for (const ring of [1, 2]) {
    const group = defs.filter((d) => (d.ring || 1) === ring && d.id !== 'kern');
    const offsets = group.map((d) => d.offset);
    for (let i = offsets.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [offsets[i], offsets[j]] = [offsets[j], offsets[i]];
    }
    group.forEach((d, i) => { d.offset = offsets[i]; });
  }
  for (const d of defs) {
    if (d.id === 'kern' || rnd() < 0.5) continue;
    // spiegelen over de diagonaal
    const rows = d.layout.length, cols = Math.max(...d.layout.map((r) => r.length));
    d.layout = Array.from({ length: cols }, (_, x) => Array.from({ length: rows }, (_, y) => d.layout[y][x] || '.').join(''));
  }
  return defs;
}

const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const OBJECT_CHARS = {
  W: { type: 'node', node: 'wrak' }, K: { type: 'node', node: 'kristalader' }, S: { type: 'node', node: 'sterrenader' },
  Z: { type: 'node', node: 'zwavelader' }, M: { type: 'node', node: 'paddenstoel' }, I: { type: 'node', node: 'ijsader' },
  E: { type: 'node', node: 'zielenader' }, X: { type: 'kern' }, O: { type: 'portal' },
};

// Tegels en objecten van een ver eiland uit CONFIG.islands
export function remoteLayout(def) {
  const tiles = [];
  const objects = [];
  const [ox, oy] = def.offset;
  def.layout.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      const gx = ox + x, gy = oy + y;
      tiles.push([gx, gy, def.kind]);
      if (OBJECT_CHARS[ch]) objects.push({ ...OBJECT_CHARS[ch], gx, gy });
      if (ch === 'N') objects.push({ type: 'note', note: def.note, gx, gy });
      if (ch === 'A') objects.push({ type: 'altar', boss: def.boss, gx, gy });
    });
  });
  return { tiles, objects };
}

export class World {
  // saved: { home: [...], asveld: [...], ... } of null
  constructor(scene, saved, objectSpots) {
    this.scene = scene;
    this.islands = [];
    const start = layoutFromConfig();
    this.islands.push(new Island(scene, saved?.home || start.tiles, objectSpots, { id: 'home', name: 'Je eiland' }));
    islandDefs().forEach((def, i) => {
      const tiles = saved?.[def.id] || remoteLayout(def).tiles;
      this.islands.push(new Island(scene, tiles, objectSpots, { id: def.id, name: def.name, seed: 100 + i * 17 }));
    });
  }

  get home() {
    return this.islands[0];
  }

  byId(id) {
    return this.islands.find((i) => i.id === id);
  }

  islandAt(gx, gy) {
    return this.islands.find((i) => i.get(gx, gy)) || null;
  }

  has(gx, gy) {
    const x = Math.round(gx), y = Math.round(gy);
    return this.islands.some((i) => i.get(x, y));
  }

  get(gx, gy) {
    for (const i of this.islands) {
      const t = i.get(gx, gy);
      if (t) return t;
    }
    return undefined;
  }

  get tiles() {
    const all = new Map();
    for (const i of this.islands) for (const [k, t] of i.tiles) all.set(k, t);
    return all;
  }

  get size() {
    return this.islands.reduce((n, i) => n + i.size, 0);
  }

  get center() {
    return this.home.center;
  }

  get puff() {
    return this.home.puff;
  }

  sortedTiles() {
    return [...this.tiles.values()].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
  }

  edgeDistances() {
    const all = new Map();
    for (const i of this.islands) for (const [k, d] of i.edgeDistances()) all.set(k, d);
    return all;
  }

  freeEdgeSpots() {
    const spots = new Map();
    for (const i of this.islands) {
      for (const s of i.freeEdgeSpots()) if (!this.get(s.gx, s.gy)) spots.set(`${s.gx},${s.gy}`, s);
    }
    return [...spots.values()];
  }

  // Grenst deze plek aan de Kern? Daar kan alleen een sterrenbrug.
  nextToKern(gx, gy) {
    const kern = this.byId('kern');
    return !!kern && NEIGHBOURS.some(([dx, dy]) => kern.get(gx + dx, gy + dy));
  }

  canAddTile(gx, gy, kind) {
    if (this.get(gx, gy)) return false;
    if (!NEIGHBOURS.some(([dx, dy]) => this.get(gx + dx, gy + dy))) return false;
    if (this.nextToKern(gx, gy) && kind !== 'starbridge') return false;
    return true;
  }

  // Nieuwe tegel hoort bij het eiland waar hij aan vast zit (het starteiland gaat voor)
  addTile(gx, gy, kind) {
    if (!this.canAddTile(gx, gy, kind)) return false;
    const owner = this.islands.find((i) => NEIGHBOURS.some(([dx, dy]) => i.get(gx + dx, gy + dy)));
    return owner.addTile(gx, gy, kind);
  }

  removeTile(gx, gy) {
    this.islandAt(gx, gy)?.removeTile(gx, gy);
  }

  clearTufts(gx, gy) {
    this.islandAt(gx, gy)?.clearTufts(gx, gy);
  }

  // Posities van lichtblokken (voor het nachtlicht)
  glowTiles() {
    // alleen opnieuw zoeken als het aantal tegels veranderd is
    const size = this.size;
    if (this.glowCache && this.glowSize === size) return this.glowCache;
    const out = [];
    for (const i of this.islands) {
      for (const t of i.tiles.values()) {
        if (t.kind === 'glow' && t.sprite) out.push({ x: t.sprite.x, y: t.sprite.y - 20 });
      }
    }
    this.glowCache = out;
    this.glowSize = size;
    return out;
  }

  serialize() {
    const out = {};
    for (const i of this.islands) out[i.id] = i.serialize();
    return out;
  }
}
