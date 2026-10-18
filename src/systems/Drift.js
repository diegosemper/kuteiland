// Drijvend wrak: takken, wrakstukken en kratjes zweven langs het eiland. Tik ze aan voor ze weg zijn.
import { CONFIG } from '../config.js';
import { bus } from '../bus.js';
import { screenToGrid } from '../iso.js';

const SPAN = 1150;   // hoe ver links/rechts van het eiland ze beginnen en verdwijnen
const GLOW = { branch: 0xe6dcf2, scrap: 0xe09060, crate: 0xf0d090 };

const rand = (a, b) => a + Math.random() * (b - a);

export class Drift {
  constructor(game) {
    this.game = game;
    this.items = [];
    this.nextAt = 2500;
  }

  pickKind() {
    let r = Math.random();
    for (const [kind, def] of Object.entries(CONFIG.drift.kinds)) {
      if ((r -= def.chance) <= 0) return kind;
    }
    return 'branch';
  }

  spawn() {
    const { game } = this;
    const kind = this.pickKind();
    const c = game.island.center;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const front = Math.random() < 0.6;
    // voorlangs (onder de voorrand) of achterlangs (achter de achterrand)
    const y = front ? c.y + rand(110, 230) : c.y - rand(150, 260);
    const x = c.x - dir * SPAN;
    const depth = front ? y + 3000 : -20001;

    const glow = game.add.image(x, y, 'glow').setTint(GLOW[kind]).setAlpha(0.4).setScale(1.7).setDepth(depth - 0.5);
    const sprite = game.add.image(x, y, `drift_${kind}`).setDepth(depth).setFlipX(dir < 0).setScale(1.5);
    sprite.setAngle(rand(-15, 15));
    game.tweens.add({ targets: glow, alpha: 0.18, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.items.push({
      kind, x, y, baseY: y, sprite, glow,
      vx: dir * rand(...CONFIG.drift.speed),
      phase: Math.random() * Math.PI * 2,
      spin: rand(-6, 6),
      caught: false,
    });
  }

  update(time, dt) {
    if (time >= this.nextAt) {
      this.spawn();
      this.nextAt = time + rand(...CONFIG.drift.intervalMs) / (1 + this.game.mods.get('drift.rate'));
    }
    const c = this.game.island.center;
    for (const it of [...this.items]) {
      if (it.caught) continue;
      it.x += it.vx * dt / 1000;
      it.y = it.baseY + Math.sin(time / 900 + it.phase) * 8;
      it.sprite.setPosition(it.x, it.y).setAngle(it.sprite.angle + it.spin * dt / 1000);
      it.glow.setPosition(it.x, it.y);
      if (Math.abs(it.x - c.x) > SPAN + 50) this.remove(it);
    }
  }

  remove(it) {
    this.items = this.items.filter((x) => x !== it);
    this.game.tweens.killTweensOf(it.glow);
    it.sprite.destroy();
    it.glow.destroy();
  }

  // Drijver onder de vinger (ruim tikvlak)
  itemAt(wx, wy) {
    let best = null, bestD = 70;
    for (const it of this.items) {
      if (it.caught) continue;
      const d = Math.hypot(wx - it.x, wy - it.y);
      if (d < bestD) { best = it; bestD = d; }
    }
    return best;
  }

  gridPos(it) {
    return screenToGrid(it.x, it.y);
  }

  inRange(it) {
    const g = this.gridPos(it);
    const p = this.game.player;
    return Math.hypot(g.gx - p.gx, g.gy - p.gy) <= CONFIG.drift.grabRange;
  }

  alive(it) {
    return this.items.includes(it) && !it.caught;
  }

  // Vangen: vliegt naar de speler, dan de buit erbij
  collect(it) {
    const { game } = this;
    it.caught = true;
    const target = game.player.sprite;
    game.tweens.add({
      targets: [it.sprite, it.glow],
      x: target.x,
      y: target.y - 50,
      scale: 0.3,
      duration: 380,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.remove(it);
        const loot = CONFIG.drift.kinds[it.kind].loot;
        let i = 0;
        for (const [item, [min, max]] of Object.entries(loot)) {
          const n = min + Math.floor(Math.random() * (max - min + 1)) + game.mods.extra('drift.loot');
          game.inventory.add(item, n);
          game.collect(item, n);
          if (item === 'roest') game.stats.roest = (game.stats.roest || 0) + n;
          bus.emit('float', {
            wx: target.x, wy: target.y - 110 - i * 26,
            text: `+${n} ${CONFIG.items[item].name.toLowerCase()}`, color: '#e8d6b8',
          });
          i++;
        }
        game.stats.caught = (game.stats.caught || 0) + 1;
        bus.emit('drift-caught', it.kind);
      },
    });
  }
}
