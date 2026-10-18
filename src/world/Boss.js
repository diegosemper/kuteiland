// De Hoeder van de Kern. Loopt traag op je af, slaat met aankondiging op de grond,
// roept kruipers op en schiet in zijn tweede fase met leegte.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { BOSS } from '../art/remote.js';
import { gridToScreen } from '../iso.js';
import { getMeta } from '../systems/Meta.js';

const B = CONFIG.boss;
const { tileW: TW, tileH: TH } = CONFIG.iso;

export class Boss {
  constructor(game, gx, gy) {
    this.game = game;
    this.type = 'enemy';
    this.kind = 'boss';
    this.label = 'SLA';
    this.gx = gx;
    this.gy = gy;
    this.radius = B.radius;
    this.maxHp = B.hp * (1 + B.cycleGrowth * (getMeta().cycle - 1));
    this.hp = this.maxHp;
    this.damage = B.damage;
    this.def = { speed: B.speed, attackMs: B.attackMs, crystals: [0, 0], crystalChance: 0 };
    this.alive = true;
    this.state = 'rising';
    this.phase = 1;
    this.attackAt = 0;
    this.anim = 0;
    this.noKnockback = true;
    const now = game.time.now;
    this.slamAt = now + 3500;
    this.summonAt = now + 7000;
    this.boltAt = now + 4000;

    const s = gridToScreen(gx, gy);
    this.shadow = game.add.image(s.x, s.y, 'shadow').setScale(2.4, 2).setDepth(-5000).setAlpha(0);
    this.sprite = game.add.image(s.x, s.y + 120, 'boss0').setOrigin(BOSS.footX / BOSS.w, BOSS.footY / BOSS.h)
      .setAlpha(0).setDepth(s.y);
    this.hitY = s.y - 110;
    this.topY = s.y - 230;
    this.bar = game.add.graphics().setVisible(false);   // de UI toont een eigen balk
    this.warn = game.add.graphics().setDepth(-4500);
    game.tweens.add({ targets: this.sprite, y: s.y, alpha: 1, duration: 1800, ease: 'Quad.easeOut', onComplete: () => { this.state = 'hunt'; } });
    game.tweens.add({ targets: this.shadow, alpha: 1, duration: 1800 });
    game.cameras.main.shake(1500, 0.006);
  }

  get screen() {
    return gridToScreen(this.gx, this.gy);
  }

  update(time, dt, night) {
    if (!this.alive || this.state !== 'hunt') return;
    const g = this.game;
    const p = g.player;

    if (this.phase === 1 && this.hp / this.maxHp <= B.phase2At) {
      this.phase = 2;
      bus.emit('message', TEXT.bossPhase2, true);
      bus.emit('sfx', 'roar');
      g.cameras.main.shake(800, 0.008);
      this.sprite.setTint(0xffc0e0);
    }
    const ph = this.phase - 1;

    // aanvallen op afstand
    if (!g.dead && time >= this.slamAt) {
      this.slamAt = time + B.slamEveryMs[ph];
      this.slam(p.gx, p.gy);
    }
    if (!g.dead && time >= this.summonAt) {
      this.summonAt = time + B.summonEveryMs[ph];
      for (let i = 0; i < B.summonCount[ph]; i++) {
        const a = Math.random() * Math.PI * 2;
        const sx = Math.round(this.gx + Math.cos(a) * 1.5), sy = Math.round(this.gy + Math.sin(a) * 1.5);
        if (g.island.get(sx, sy)) night.spawnAt('crawler', sx, sy);
      }
      bus.emit('sfx', 'roar');
    }
    if (this.phase === 2 && !g.dead && time >= this.boltAt) {
      this.boltAt = time + B.boltEveryMs;
      this.bolt(p.gx, p.gy);
    }

    // aanraking
    const toPlayer = Math.hypot(p.gx - this.gx, p.gy - this.gy);
    if (!g.dead && toPlayer - this.radius - CONFIG.player.radius <= CONFIG.enemies.attackRange) {
      if (time >= this.attackAt) {
        this.attackAt = time + B.attackMs;
        g.tweens.add({ targets: this.sprite, scaleX: 1.08, scaleY: 0.94, duration: 120, yoyo: true });
        g.hurtPlayer(this.damage, this);
      }
    } else if (!g.dead) {
      // traag op de speler af
      const dx = p.gx - this.gx, dy = p.gy - this.gy, len = Math.hypot(dx, dy) || 1;
      const step = B.speed * (this.phase === 2 ? 1.3 : 1) * night.slowFactorAt(this.gx, this.gy) * dt / 1000;
      const nx = this.gx + dx / len * step, ny = this.gy + dy / len * step;
      if (g.island.has(nx, this.gy)) this.gx = nx;
      if (g.island.has(this.gx, ny)) this.gy = ny;
      const sx = gridToScreen(dx, dy).x;
      if (Math.abs(sx) > 0.01) this.sprite.flipX = sx < 0;
    }

    this.anim += dt;
    this.sprite.setTexture(`boss${Math.floor(this.anim / 220) % 4}`);
    const s = this.screen;
    const bob = Math.sin(time / 500) * 4;
    this.sprite.setPosition(s.x, s.y + bob).setDepth(s.y);
    this.shadow.setPosition(s.x, s.y);
    this.hitY = s.y - 110;
    this.topY = s.y - 230;
  }

  // Aangekondigde klap: rode cirkel op de grond, dan pijn als je er nog staat
  slam(gx, gy) {
    const g = this.game;
    const s = gridToScreen(gx, gy);
    const w = B.slamRadius * TW * Math.SQRT2, h = B.slamRadius * TH * Math.SQRT2;
    const warn = this.warn;
    let t = 0;
    const draw = () => {
      warn.clear();
      warn.fillStyle(0xff3050, 0.12 + 0.2 * t);
      warn.fillEllipse(s.x, s.y, w, h);
      warn.lineStyle(3, 0xff6070, 0.9);
      warn.strokeEllipse(s.x, s.y, w, h);
      warn.fillStyle(0xff6070, 0.35);
      warn.fillEllipse(s.x, s.y, w * t, h * t);
    };
    const tw = g.tweens.addCounter({
      from: 0, to: 1, duration: B.slamWarnMs,
      onUpdate: (c) => { t = c.getValue(); draw(); },
      onComplete: () => {
        warn.clear();
        if (!this.alive) return;
        g.cameras.main.shake(250, 0.01);
        g.island.puff.explode(24, s.x, s.y);
        bus.emit('sfx', 'slam');
        const p = g.player;
        if (Math.hypot(p.gx - gx, p.gy - gy) <= B.slamRadius) {
          g.hurtUntil = 0;
          g.hurtPlayer(B.slamDamage, this);
        }
      },
    });
    this.slamTween = tw;
  }

  // Leegteschot naar waar je nu staat; wie beweegt, ontwijkt
  bolt(gx, gy) {
    const g = this.game;
    const from = { x: this.sprite.x, y: this.hitY };
    const to = gridToScreen(gx, gy);
    const b = g.add.image(from.x, from.y, 'bolt').setTint(0xb070ff).setScale(2).setDepth(6e5)
      .setRotation(Math.atan2(to.y - 40 - from.y, to.x - from.x));
    g.tweens.add({
      targets: b, x: to.x, y: to.y - 40, duration: 650, ease: 'Quad.easeIn',
      onComplete: () => {
        b.destroy();
        g.night.fx.explode(10, to.x, to.y - 40);
        const p = g.player;
        if (Math.hypot(p.gx - gx, p.gy - gy) <= 0.6) {
          g.hurtUntil = 0;
          g.hurtPlayer(B.boltDamage, this);
        }
      },
    });
  }

  hit(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    this.sprite.setTintFill(0xffffff);
    this.game.time.delayedCall(80, () => {
      if (!this.sprite.active) return;
      this.sprite.clearTint();
      if (this.phase === 2) this.sprite.setTint(0xffc0e0);
    });
    bus.emit('boss-hp', this.hp, this.maxHp);
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  vanish(fx) {
    this.alive = false;
    this.warn.destroy();
    this.bar.destroy();
    fx?.explode(60, this.sprite.x, this.hitY);
    this.game.tweens.add({
      targets: [this.sprite, this.shadow], alpha: 0, scale: 1.4, duration: 1600,
      onComplete: () => { this.sprite.destroy(); this.shadow.destroy(); },
    });
  }

  act() {
    return { attack: this };
  }
}
