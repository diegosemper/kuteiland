// De nacht: wezens laten opkruipen, hun route naar de speler, lampen, torens en gedropte kristallen.
import { CONFIG } from '../config.js';
import { TEXT, pick } from '../texts.js';
import { bus } from '../bus.js';
import { gridToScreen } from '../iso.js';
import { Enemy } from '../world/Enemy.js';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const key = (gx, gy) => `${gx},${gy}`;

export class Night {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.pickups = [];
    this.queue = [];
    this.field = new Map();
    this.fieldAt = 0;
    this.fieldFrom = '';

    this.fx = game.add.particles(0, 0, 'mote', {
      emitting: false,
      tint: [0x9b6bff, 0x3a2050, 0xd9c2ff],
      speed: { min: 30, max: 120 },
      lifespan: 800,
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 },
    }).setDepth(5e5);
  }

  // ---------- begin en einde ----------

  // Plan wanneer welke wezens komen. elapsed: hoeveel van de nacht al voorbij is (bij laden).
  start(n, elapsed = 0) {
    const E = CONFIG.enemies;
    const crawlers = Math.round(E.perNight.base + E.perNight.extra * (n - 1));
    const brutes = n >= E.brutesFrom ? Math.floor((n - E.brutesFrom) / 2) + 1 : 0;
    const window = CONFIG.dayNight.nightMs * E.spawnSpread;
    const kinds = [...Array(crawlers).fill('crawler'), ...Array(brutes).fill('brute')]
      .sort(() => Math.random() - 0.5);
    // in golfjes van twee of drie tegelijk
    const waves = Math.max(1, Math.ceil(kinds.length / 2.5));
    this.queue = kinds.map((kind, i) => ({ kind, at: (Math.floor(i / 2.5) / waves) * window + Math.random() * 2500 }))
      .sort((a, b) => a.at - b.at);
    if (elapsed > 0) {
      // halverwege geladen: de rest komt in de tijd die nog over is
      const left = Math.max(5000, window - elapsed);
      this.queue = this.queue.slice(Math.floor(this.queue.length * Math.min(0.6, elapsed / window)))
        .map((q, i, arr) => ({ ...q, at: elapsed + (i / arr.length) * left }));
    }
    this.nightNum = n;
  }

  end() {
    this.queue = [];
    // de Hoeder trekt zich niets aan van de zon
    for (const e of this.enemies) if (e.kind !== 'boss') e.vanish(this.fx);
    this.enemies = this.enemies.filter((e) => e.kind === 'boss');
    for (const o of this.game.objects) o.healFull?.();
    // kristallen die nog liggen, komen vanzelf naar je toe
    for (const p of this.pickups) p.gx = this.game.player.gx, p.gy = this.game.player.gy;
  }

  get active() {
    return this.enemies.length > 0;
  }

  // ---------- opkruipen ----------

  spawn(kind) {
    const { island, player, objects } = this.game;
    const occupied = new Set(objects.filter((o) => o.type !== 'grave').map((o) => key(o.gx, o.gy)));
    const dist = island.edgeDistances();
    if (!this.field.size) this.rebuildField();
    let edge = island.sortedTiles().filter((t) => dist.get(key(t.gx, t.gy)) === 1 && !occupied.has(key(t.gx, t.gy))
      && this.field.has(key(t.gx, t.gy)));
    const far = edge.filter((t) => Math.hypot(t.gx - player.gx, t.gy - player.gy) >= 2.5);
    if (far.length) edge = far;
    if (!edge.length) return;
    const t = edge[Math.floor(Math.random() * edge.length)];
    this.enemies.push(new Enemy(this.game, kind, t.gx, t.gy, this.nightNum || this.game.dayNight.night));
  }

  spawnAt(kind, gx, gy) {
    const e = new Enemy(this.game, kind, gx, gy, this.nightNum || this.game.dayNight.night);
    this.enemies.push(e);
    return e;
  }

  // ---------- route ----------

  passable(gx, gy) {
    const { island, objects } = this.game;
    if (!island.get(gx, gy)) return false;
    // gewone objecten blokkeren; verdediging niet (daar slaan ze doorheen)
    return !objects.some((o) => o.gx === gx && o.gy === gy && !o.defense && o.type !== 'grave');
  }

  rebuildField() {
    const p = this.game.player;
    const start = { gx: Math.round(p.gx), gy: Math.round(p.gy) };
    this.field = new Map([[key(start.gx, start.gy), 0]]);
    const queue = [start];
    while (queue.length) {
      const c = queue.shift();
      const d = this.field.get(key(c.gx, c.gy));
      for (const [dx, dy] of DIRS) {
        const nx = c.gx + dx, ny = c.gy + dy;
        if (this.field.has(key(nx, ny)) || !this.passable(nx, ny)) continue;
        if (dx && dy && (!this.passable(c.gx + dx, c.gy) || !this.passable(c.gx, c.gy + dy))) continue;
        this.field.set(key(nx, ny), d + 1);
        queue.push({ gx: nx, gy: ny });
      }
    }
  }

  // Het midden van de volgende tegel richting speler
  nextStep(gx, gy) {
    const cx = Math.round(gx), cy = Math.round(gy);
    const here = this.field.get(key(cx, cy));
    // eerst naar het midden van de eigen tegel als je ver van het midden zit
    if (here === undefined) return null;
    let best = null, bestD = here;
    for (const [dx, dy] of DIRS) {
      const d = this.field.get(key(cx + dx, cy + dy));
      if (d === undefined || d >= bestD) continue;
      if (dx && dy && (!this.field.has(key(cx + dx, cy)) || !this.field.has(key(cx, cy + dy)))) continue;
      best = { gx: cx + dx, gy: cy + dy };
      bestD = d;
    }
    return best;
  }

  // Verdedigingswerk vlak voor een wezen?
  blockerNear(e) {
    for (const o of this.game.objects) {
      if (!o.defense) continue;
      const gap = Math.hypot(o.gx - e.gx, o.gy - e.gy) - o.radius - e.radius;
      if (gap <= 0.12) return o;
    }
    return null;
  }

  // Botst een wezen op deze plek tegen iets?
  blockedAt(gx, gy, r) {
    return this.game.objects.find((o) => o.type !== 'grave' && Math.hypot(o.gx - gx, o.gy - gy) < o.radius + r) || null;
  }

  hitStructure(o, dmg) {
    if (!o.damage) return;
    if (o.damage(dmg)) {
      this.fx.explode(14, o.sprite.x, o.hitY);
      this.game.removeObject(o);
      bus.emit('message', pick(TEXT.structureLost), true);
    }
  }

  // ---------- licht ----------

  lamps() {
    return this.game.objects.filter((o) => o.type === 'lamp' && o.lit);
  }

  slowFactorAt(gx, gy) {
    let f = 1;
    for (const l of this.lamps()) {
      if (Math.hypot(l.gx - gx, l.gy - gy) <= l.def.light) f = Math.min(f, l.def.slow);
    }
    return f;
  }

  // Alle lichtbronnen voor het nachtoverlay: wereldpositie en straal in tegels
  lights() {
    const g = this.game;
    const list = [];
    if (!g.dead) list.push({ x: g.player.sprite.x, y: g.player.sprite.y - 50, r: 1.5 });
    for (const o of g.objects) {
      if (o.type === 'lamp' && o.lit) list.push({ x: o.sprite.x, y: o.lightY, r: o.def.light });
      if (o.type === 'tower') list.push({ x: o.sprite.x, y: o.lightY, r: CONFIG.defenses.tower.light });
      if (o.type === 'generator') list.push({ x: o.sprite.x, y: o.hitY, r: 0.8 });
      if (o.type === 'grave') list.push({ x: o.sprite.x, y: o.hitY, r: 0.6 });
      if (o.type === 'anchor' || o.type === 'note') list.push({ x: o.sprite.x, y: o.lightY, r: 0.7 });
      if (o.type === 'node' && o.node !== 'wrak') list.push({ x: o.sprite.x, y: o.lightY, r: 1.1 });
      if (o.type === 'kern') list.push({ x: o.sprite.x, y: o.lightY, r: 3.2 });
    }
    for (const p of this.pickups) list.push({ x: p.sprite.x, y: p.sprite.y, r: 0.6 });
    for (const t of g.island.glowTiles()) list.push({ x: t.x, y: t.y, r: 2.2 });
    for (const e of this.enemies) list.push({ x: e.sprite.x, y: e.hitY, r: e.kind === 'boss' ? 1.6 : 0.45 });
    return list;
  }

  // ---------- schade en buit ----------

  damageEnemy(e, dmg, byPlayer) {
    if (!e.alive) return;
    if (e.hit(dmg)) this.killed(e, byPlayer);
  }

  killed(e, byPlayer) {
    e.vanish(this.fx);
    this.enemies = this.enemies.filter((x) => x !== e);
    const g = this.game;
    bus.emit('sfx', 'enemyDie');
    if (e.kind === 'boss') {
      g.onBossDefeated(e);
      return;
    }
    g.stats.kills = (g.stats.kills || 0) + 1;
    g.collect('wezens', 1);
    if (byPlayer) g.skills.gain('vechten', CONFIG.skills.vechten.xpKill);
    const [min, max] = e.def.crystals;
    if (Math.random() < e.def.crystalChance) {
      const n = Math.max(1, min + Math.floor(Math.random() * (max - min + 1)));
      for (let i = 0; i < n; i++) this.dropCrystal(e.gx + (Math.random() - 0.5) * 0.4, e.gy + (Math.random() - 0.5) * 0.4);
    }
    if (!this.enemies.length && !this.queue.length && g.dayNight.isNight && !g.boss?.alive) bus.emit('message', TEXT.nightCleared);
  }

  dropCrystal(gx, gy) {
    const s = gridToScreen(gx, gy);
    const g = this.game;
    const glow = g.add.image(s.x, s.y - 16, 'glow').setTint(0x9b6bff).setAlpha(0.5).setScale(0.45).setDepth(s.y);
    const sprite = g.add.image(s.x, s.y - 16, 'icon_leegtekristal').setScale(0.5).setDepth(s.y + 0.5);
    g.tweens.add({ targets: [sprite, glow], y: s.y - 26, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.pickups.push({ gx, gy, sprite, glow });
  }

  collectPickups() {
    const g = this.game;
    if (g.dead) return;
    for (const p of [...this.pickups]) {
      if (Math.hypot(p.gx - g.player.gx, p.gy - g.player.gy) > 1.1) continue;
      this.pickups = this.pickups.filter((x) => x !== p);
      g.tweens.killTweensOf([p.sprite, p.glow]);
      const t = g.player.sprite;
      g.tweens.add({
        targets: [p.sprite, p.glow], x: t.x, y: t.y - 50, scale: 0.15, duration: 280, ease: 'Quad.easeIn',
        onComplete: () => {
          p.sprite.destroy();
          p.glow.destroy();
          g.inventory.add('leegtekristal', 1);
          g.collect('leegtekristal', 1);
          g.stats.crystals = (g.stats.crystals || 0) + 1;
          bus.emit('float', { wx: t.x, wy: t.y - 110, text: '+1 leegtekristal', color: '#d9c2ff' });
        },
      });
    }
  }

  // ---------- torens ----------

  fireTowers(time) {
    const g = this.game;
    const D = CONFIG.defenses.tower;
    for (const t of g.objects) {
      if (t.type !== 'tower' || time < t.nextShotAt) continue;
      let target = null, best = D.range;
      for (const e of this.enemies) {
        if (!e.alive || e.state !== 'hunt') continue;
        const d = Math.hypot(e.gx - t.gx, e.gy - t.gy);
        if (d <= best) { best = d; target = e; }
      }
      if (!target) continue;
      t.nextShotAt = time + D.cooldownMs;
      const from = { x: t.sprite.x + 12, y: t.aimY };
      const to = { x: target.sprite.x, y: target.hitY };
      const bolt = g.add.image(from.x, from.y, 'bolt').setDepth(6e5)
        .setRotation(Math.atan2(to.y - from.y, to.x - from.x));
      g.tweens.add({
        targets: bolt, x: to.x, y: to.y, duration: Math.max(120, Math.hypot(to.x - from.x, to.y - from.y) * 1.4),
        onComplete: () => {
          bolt.destroy();
          this.fx.explode(5, to.x, to.y);
          this.damageEnemy(target, D.damage, false);
        },
      });
    }
  }

  // ---------- elke frame ----------

  update(time, dt) {
    const g = this.game;
    const dn = g.dayNight;

    if (dn.isNight) {
      const elapsed = dn.t - CONFIG.dayNight.dayMs;
      while (this.queue.length && this.queue[0].at <= elapsed) this.spawn(this.queue.shift().kind);
    }

    // lampen gaan aan als het donker wordt
    const lit = dn.darkness > 0.35;
    for (const o of g.objects) if (o.type === 'lamp') o.setLit(lit);

    if (this.enemies.length) {
      const from = key(Math.round(g.player.gx), Math.round(g.player.gy));
      if (time > this.fieldAt || from !== this.fieldFrom) {
        this.rebuildField();
        this.fieldAt = time + 500;
        this.fieldFrom = from;
      }
      for (const e of [...this.enemies]) e.update(time, dt, this);
      // lampen verbranden wat in hun licht staat
      for (const l of this.lamps()) {
        for (const e of [...this.enemies]) {
          if (e.state !== 'hunt' || Math.hypot(l.gx - e.gx, l.gy - e.gy) > l.def.light) continue;
          e.hp -= l.def.burnPerSec * dt / 1000;
          if (Math.random() < dt / 300) this.fx.explode(1, e.sprite.x, e.hitY);
          if (e.hp <= 0 && e.alive) { e.alive = false; this.killed(e, false); }
        }
      }
      this.fireTowers(time);
    }
    this.collectPickups();
  }
}
