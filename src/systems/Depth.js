// De Diepte: eindeloze golven op het eiland van de Kern. Elke golf zwaarder, elke golf betere buit.
// Doodgaan of STOP bij de poort beëindigt de tocht. Je beste diepte wordt bewaard.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { Enemy } from '../world/Enemy.js';
import { recordDepth } from './Meta.js';

const D = CONFIG.depth;
const key = (gx, gy) => `${gx},${gy}`;

export class Depth {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.level = 0;
    this.wave = [];
    this.nextWaveAt = 0;
  }

  start() {
    this.active = true;
    this.level = 0;
    this.wave = [];
    this.nextWaveAt = this.game.time.now + 1500;
    bus.emit('message', TEXT.depthStart, true);
    bus.emit('sfx', 'roar');
    bus.emit('depth', this.level);
  }

  stop(reason) {
    if (!this.active) return;
    this.active = false;
    for (const e of this.wave) if (e.alive) e.vanish(this.game.night.fx);
    this.game.night.enemies = this.game.night.enemies.filter((e) => !this.wave.includes(e));
    this.wave = [];
    const best = this.game.stats.bestDepth || 0;
    bus.emit('message', `${reason === 'dood' ? TEXT.depthDied : TEXT.depthStopped} ${TEXT.depthReached} ${this.level}. ${TEXT.depthBest} ${best}.`, true);
    bus.emit('depth', null);
  }

  // Randtegels van het Kern-eiland: daar kruipen ze omhoog
  spawnTiles() {
    const kern = this.game.island.byId('kern');
    if (!kern) return [];
    const dist = kern.edgeDistances();
    const taken = new Set(this.game.objects.map((o) => key(o.gx, o.gy)));
    return kern.sortedTiles().filter((t) => dist.get(key(t.gx, t.gy)) === 1 && !taken.has(key(t.gx, t.gy)));
  }

  spawnWave() {
    const g = this.game;
    this.level++;
    const n = D.crawlers[0] + D.crawlers[1] * this.level;
    const brutes = Math.floor(this.level / D.brutesEvery);
    const strength = 2 + this.level * D.strength;
    const tiles = this.spawnTiles();
    if (!tiles.length) return;
    this.wave = [];
    for (let i = 0; i < n + brutes; i++) {
      const t = tiles[Math.floor(Math.random() * tiles.length)];
      const e = new Enemy(g, i < brutes ? 'brute' : 'crawler', t.gx, t.gy, strength);
      e.depth = true;
      g.night.enemies.push(e);
      this.wave.push(e);
    }
    bus.emit('message', `${TEXT.depthLabel} ${this.level}.`, true);
    bus.emit('depth', this.level);
  }

  // Buit voor een uitgespeelde golf
  reward() {
    const g = this.game;
    const L = this.level;
    const loot = { zielenkristal: 1 + Math.floor(L / 3), leegtekristal: 2 + L };
    if (Math.random() < Math.min(0.5, 0.03 * L)) loot.leegtehart = 1;
    const p = g.player.sprite;
    let i = 0;
    for (const [k, n] of Object.entries(loot)) {
      g.inventory.add(k, n);
      g.collect(k, n);
      bus.emit('float', { wx: p.x, wy: p.y - 120 - i * 26, text: `+${n} ${CONFIG.items[k].name.toLowerCase()}`, color: '#d9c2ff' });
      i++;
    }
    if (L > (g.stats.bestDepth || 0)) g.stats.bestDepth = L;
    recordDepth(L);
    g.objectives.check();
    g.saveNow();
  }

  update(time) {
    if (!this.active) return;
    if (this.game.dead) return;
    if (this.wave.length) {
      if (this.wave.every((e) => !e.alive)) {
        this.wave = [];
        this.reward();
        this.nextWaveAt = time + D.breakMs;
        bus.emit('message', TEXT.depthCleared, true);
      }
      return;
    }
    if (time >= this.nextWaveAt) this.spawnWave();
  }
}
