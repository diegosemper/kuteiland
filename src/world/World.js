// De wereld: het starteiland plus de verre eilanden. Biedt dezelfde methodes als één eiland,
// zodat speler, wezens, bouwen en routes niet hoeven te weten op welk eiland iets ligt.
import { CONFIG } from '../config.js';
import { Island, layoutFromConfig } from './Island.js';

const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const OBJECT_CHARS = { W: { type: 'node', node: 'wrak' }, K: { type: 'node', node: 'kristalader' }, S: { type: 'node', node: 'sterrenader' }, X: { type: 'kern' } };

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
    CONFIG.islands.forEach((def, i) => {
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
