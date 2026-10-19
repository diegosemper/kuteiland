// Afbrokkelen: randtegels krijgen barsten, gaan trillen en vallen de leegte in. Ankers en herstellen redden ze.
import { CONFIG } from '../config.js';
import { TEXT, pick } from '../texts.js';
import { bus } from '../bus.js';
import { gridToScreen } from '../iso.js';
import { TILE_TEX } from '../art/terrain.js';
import { itemForObject } from '../world/objects.js';
import { BRIDGES } from '../art/terrain.js';

const C = CONFIG.crumble;
const key = (gx, gy) => `${gx},${gy}`;
const rand = (a, b) => a + Math.random() * (b - a);
// tegels met deze objecten zijn heilig: boom, kist, je achtergelaten spullen
const ROOTED = ['tree', 'chest', 'grave'];

export class Crumble {
  constructor(game, saved = {}) {
    this.game = game;
    this.cracks = new Map();
    this.nextIn = Number.isFinite(saved.nextIn) ? saved.nextIn : rand(...C.intervalMs);
    this.dust = game.add.particles(0, 0, 'dust', {
      emitting: false,
      speedY: { min: 20, max: 60 },
      speedX: { min: -10, max: 10 },
      lifespan: 1400,
      scale: { min: 0.6, max: 1.4 },
      alpha: { start: 1, end: 0 },
    }).setDepth(-9000);
    // staat afbrokkelen uit, dan ook geen oude barsten terughalen
    if (C.enabled === false) return;
    for (const c of saved.cracks || []) {
      if (game.island.get(c.gx, c.gy)) this.startCrack(c.gx, c.gy, c.t, true);
    }
  }

  get active() {
    return C.enabled !== false && this.game.dayNight.day >= C.startDay;
  }

  anchors() {
    return this.game.objects.filter((o) => o.type === 'anchor');
  }

  isAnchored(gx, gy) {
    return this.anchors().some((a) => a.covers(this.game, gx, gy));
  }

  rooted(gx, gy) {
    return this.game.objects.some((o) => o.gx === gx && o.gy === gy && ROOTED.includes(o.type));
  }

  candidates() {
    // alleen je eigen eiland brokkelt; veroverde eilanden en bruggen blijven
    const home = this.game.island.home;
    if (home.size - this.cracks.size <= C.minTiles) return [];
    const dist = home.edgeDistances();
    return home.sortedTiles().filter((t) => dist.get(key(t.gx, t.gy)) === 1
      && !BRIDGES.includes(t.kind)
      && !this.cracks.has(key(t.gx, t.gy))
      && !this.isAnchored(t.gx, t.gy)
      && !this.rooted(t.gx, t.gy)
      && home.staysConnected(t.gx, t.gy));
  }

  startCrack(gx, gy, t = 0, quiet = false) {
    const tile = this.game.island.get(gx, gy);
    if (!quiet) bus.emit('sfx', 'crack');
    if (!tile) return;
    const s = gridToScreen(gx, gy);
    const overlay = this.game.add.image(s.x, s.y, 'cracks')
      .setOrigin(TILE_TEX.cx / TILE_TEX.w, TILE_TEX.cy / TILE_TEX.h)
      .setDepth(tile.sprite.depth + 0.5).setAlpha(0);
    const warn = this.game.add.image(s.x, s.y - 34, 'warn').setDepth(9e5).setScale(0.8);
    this.game.tweens.add({ targets: warn, y: s.y - 44, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const crack = { gx, gy, t, overlay, warn, baseX: s.x };
    // doelwit voor de actieknop: HERSTEL
    crack.target = {
      type: 'crack', label: 'HERSTEL', gx, gy, radius: 0.5,
      sprite: tile.sprite, topY: s.y - 46, hitY: s.y,
      hitArea: new Phaser.Geom.Rectangle(s.x - 50, s.y - 26, 100, 52),
      act: () => ({ repair: crack }),
    };
    this.cracks.set(key(gx, gy), crack);
    if (!quiet) {
      const first = !this.game.flags.crumbleSeen;
      this.game.flags.crumbleSeen = true;
      bus.emit('message', first ? TEXT.crumbleFirst : pick(TEXT.crumbleStart), first);
    }
  }

  clearCrack(crack) {
    this.cracks.delete(key(crack.gx, crack.gy));
    this.game.tweens.killTweensOf(crack.warn);
    crack.overlay.destroy();
    crack.warn.destroy();
    const tile = this.game.island.get(crack.gx, crack.gy);
    if (tile?.sprite) tile.sprite.x = crack.baseX;
  }

  // Doelwitten voor de actieknop
  targets() {
    return [...this.cracks.values()].map((c) => c.target);
  }

  repairCost() {
    return C.repairCost.find((cost) => Object.entries(cost).every(([k, n]) => this.game.inventory.has(k, n))) || null;
  }

  repair(crack) {
    const g = this.game;
    if (!this.cracks.has(key(crack.gx, crack.gy))) return;
    const cost = this.repairCost();
    if (!cost) {
      bus.emit('message', TEXT.repairCant, true);
      return;
    }
    for (const [k, n] of Object.entries(cost)) g.inventory.remove(k, n);
    const s = gridToScreen(crack.gx, crack.gy);
    g.island.puff.explode(8, s.x, s.y);
    this.clearCrack(crack);
    g.stats.repairs = (g.stats.repairs || 0) + 1;
    g.skills.gain('bouwen', CONFIG.skills.bouwen.xpTile);
    bus.emit('float', { wx: s.x, wy: s.y - 40, text: TEXT.repaired, color: '#d9e8c0' });
  }

  update(time, dt) {
    if (!this.active) return;
    const g = this.game;

    const speed = Math.max(0.3, 1 + g.mods.get('crumble.speed'));
    this.nextIn -= dt * speed / (g.dayNight.isNight ? C.nightFactor : 1);
    if (this.nextIn <= 0) {
      this.nextIn = rand(...C.intervalMs);
      const list = this.candidates();
      if (list.length) {
        const t = list[Math.floor(Math.random() * list.length)];
        this.startCrack(t.gx, t.gy);
      }
    }

    for (const crack of [...this.cracks.values()]) {
      // een anker in de buurt redt hem
      if (this.isAnchored(crack.gx, crack.gy)) {
        this.clearCrack(crack);
        bus.emit('message', TEXT.crumbleHealed, true);
        continue;
      }
      crack.t += dt;
      const tile = g.island.get(crack.gx, crack.gy);
      if (!tile) { this.clearCrack(crack); continue; }
      crack.overlay.setAlpha(Math.min(1, 0.25 + crack.t / C.crackMs));
      if (crack.t > C.crackMs) {
        // laatste fase: trillen en gruis
        const f = (crack.t - C.crackMs) / C.shakeMs;
        const dx = Math.sin(time * 0.09) * (1 + f * 3);
        tile.sprite.x = crack.baseX + dx;
        crack.overlay.x = crack.baseX + dx;
        crack.warn.setTint(0xff7050);
        if (Math.random() < dt / 120) {
          const s = gridToScreen(crack.gx, crack.gy);
          this.dust.explode(2, s.x + (Math.random() - 0.5) * 80, s.y + 20);
        }
      }
      if (crack.t >= C.crackMs + C.shakeMs) this.fall(crack);
    }
  }

  fall(crack) {
    const g = this.game;
    const { gx, gy } = crack;
    const tile = g.island.get(gx, gy);
    this.clearCrack(crack);
    if (!tile) return;

    // de tegel en alles erop valt
    const falling = [tile.sprite, ...(tile.tufts || [])];
    tile.sprite = null;
    tile.tufts = [];

    for (const o of g.objects.filter((x) => x.gx === gx && x.gy === gy)) {
      const item = itemForObject(o);
      if (item) {
        g.inventory.add(item, 1);
        bus.emit('message', `${TEXT.objectFell} ${CONFIG.items[item].name.toLowerCase()}.`, true);
      }
      g.removeObject(o);
    }
    for (const e of g.night.enemies.filter((x) => Math.round(x.gx) === gx && Math.round(x.gy) === gy)) {
      e.vanish(g.night.fx);
      g.night.enemies = g.night.enemies.filter((x) => x !== e);
    }

    g.island.removeTile(gx, gy);
    bus.emit('sfx', 'fall');
    g.stats.tilesLost = (g.stats.tilesLost || 0) + 1;

    for (const s of falling) {
      g.tweens.add({
        targets: s, y: s.y + 520, alpha: 0, angle: (Math.random() - 0.5) * 30,
        duration: 1600, ease: 'Quad.easeIn',
        onComplete: () => s.destroy(),
      });
    }
    const s = gridToScreen(gx, gy);
    this.dust.explode(20, s.x, s.y + 10);

    // stond de speler erop? Op het nippertje wegspringen.
    const p = g.player;
    if (!g.dead && Math.round(p.gx) === gx && Math.round(p.gy) === gy) {
      const spot = g.freeTileNear(gx, gy);
      if (spot) {
        p.gx = spot.gx;
        p.gy = spot.gy;
        p.sync();
      }
      g.hurtUntil = 0;
      g.hurtPlayer(C.fallDamage);
      bus.emit('message', TEXT.playerShoved, true);
    } else if (!g.build.active) {
      bus.emit('message', pick(TEXT.crumbleFell));
    }
    g.build.redraw();
    g.objectives.check();
  }

  serialize() {
    return {
      nextIn: Math.round(this.nextIn),
      cracks: [...this.cracks.values()].map((c) => ({ gx: c.gx, gy: c.gy, t: Math.round(c.t) })),
    };
  }
}
