// Bewoners: een bed en wie erin slaapt. Een bewoner scharrelt wat rond zijn bed, heeft een baan,
// en werkt mee per minigame die jij speelt.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { BED } from '../art/residents.js';
import { PLAYER } from '../art/character.js';
import { gridToScreen } from '../iso.js';
import { textStyle, shade } from '../ui/style.js';

export class Bed {
  constructor(scene, gx, gy) {
    this.scene = scene;
    this.type = 'bed';
    this.label = null;
    this.gx = gx;
    this.gy = gy;
    this.radius = 0.36;
    const s = gridToScreen(gx, gy);
    this.shadow = scene.add.image(s.x + 4, s.y + 6, 'shadow').setScale(1.3, 1).setDepth(-5000);
    this.sprite = scene.add.image(s.x, s.y, 'bed').setOrigin(BED.ox / BED.w, BED.oy / BED.h).setDepth(s.y);
    this.topY = s.y - 40;
    this.hitY = s.y - 20;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 55, s.y - 45, 110, 60);
  }

  act() {
    return { message: TEXT.bedTouch };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy };
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}

const C = () => CONFIG.castaways;

export class Castaway {
  constructor(scene, gx, gy, data) {
    this.scene = scene;
    this.type = 'castaway';
    this.label = 'PRAAT';
    this.gx = gx;
    this.gy = gy;
    this.radius = 0.18;
    this.name = data.name;
    this.job = data.job;
    this.rounds = data.rounds || 0;
    this.store = data.store || 0;
    this.tint = data.tint ?? C().tints[0];
    this.bed = data.bed || [gx, gy];
    this.walkTime = 0;
    this.goal = null;
    this.nextMoveAt = scene.time.now + 1000 + Math.random() * 3000;
    this.nextHitAt = 0;
    this.shadow = scene.add.image(0, 0, 'shadow').setScale(0.5).setDepth(-5000);
    this.sprite = scene.add.image(0, 0, 'player_idle').setOrigin(PLAYER.footX / PLAYER.w, PLAYER.footY / PLAYER.h)
      .setTint(this.tint).setScale(0.92);
    this.tag = shade(scene.add.text(0, 0, this.name, textStyle(1, 13, '#e6dcf2', { fontStyle: '700' })).setOrigin(0.5, 1), 1);
    this.sync();
  }

  get def() {
    return C().jobs[this.job];
  }

  get level() {
    return Math.min(C().maxLevel, 1 + Math.floor(this.rounds / C().roundsPerLevel));
  }

  get topY() {
    return this.sprite.y - 120;
  }

  get hitY() {
    return this.sprite.y - 50;
  }

  get hitArea() {
    return new Phaser.Geom.Rectangle(this.sprite.x - 25, this.sprite.y - 110, 50, 115);
  }

  sync() {
    const s = gridToScreen(this.gx, this.gy);
    this.sprite.setPosition(s.x, s.y).setDepth(s.y);
    this.shadow.setPosition(s.x, s.y);
    this.tag.setPosition(s.x, s.y - 112).setDepth(9e5);
  }

  // Elke frame: af en toe een stukje rondlopen bij het bed
  update(time, dt, game) {
    if (!this.goal && time >= this.nextMoveAt) {
      this.nextMoveAt = time + 2500 + Math.random() * 4000;
      const [bx, by] = this.bed;
      const tx = bx + (Math.random() - 0.5) * 3;
      const ty = by + (Math.random() - 0.5) * 3;
      if (game.island.has(Math.round(tx), Math.round(ty))) this.goal = { gx: tx, gy: ty };
    }
    if (this.goal) {
      const dx = this.goal.gx - this.gx, dy = this.goal.gy - this.gy;
      const d = Math.hypot(dx, dy);
      if (d < 0.05) {
        this.goal = null;
        this.sprite.setTexture('player_idle');
      } else {
        const step = Math.min(d, 1.1 * dt / 1000);
        const nx = this.gx + dx / d * step, ny = this.gy + dy / d * step;
        if (game.island.has(Math.round(nx), Math.round(ny))) { this.gx = nx; this.gy = ny; } else this.goal = null;
        this.sprite.setFlipX(gridToScreen(dx, dy).x < 0);
        this.walkTime += dt;
        this.sprite.setTexture(`player_walk${Math.floor(this.walkTime / 120) % PLAYER.walkFrames}`);
      }
      this.sync();
    }
  }

  // Werk na een minigame: geeft { item, n } terug (of null)
  work() {
    this.rounds++;
    const d = this.def;
    if (!d.item) return null;
    this.store += d.per * (1 + (this.level - 1) * C().perLevel);
    const n = Math.floor(this.store);
    this.store -= n;
    return n > 0 ? { item: d.item, n } : null;
  }

  act() {
    return { openCastaway: this };
  }

  serialize() {
    return {
      type: this.type, gx: Math.round(this.gx * 10) / 10, gy: Math.round(this.gy * 10) / 10,
      name: this.name, job: this.job, rounds: this.rounds, store: Math.round(this.store * 100) / 100, tint: this.tint, bed: this.bed,
    };
  }

  destroy() {
    for (const o of [this.sprite, this.shadow, this.tag]) o.destroy();
  }
}
