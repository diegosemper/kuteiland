// Een nachtwezen. Kruipt over de rand omhoog en jaagt op de speler; wat in de weg staat, slaat het kapot.
import { CONFIG } from '../config.js';
import { CREATURES } from '../art/creatures.js';
import { gridToScreen } from '../iso.js';

const FRAME_MS = 120;

export class Enemy {
  constructor(game, kind, gx, gy, night) {
    this.game = game;
    this.kind = kind;
    this.type = 'enemy';
    this.label = 'SLA';
    const def = CONFIG.enemies[kind];
    const E = CONFIG.enemies;
    this.def = def;
    this.maxHp = def.hp * (1 + E.hpGrowth * (night - 1));
    this.hp = this.maxHp;
    this.damage = def.damage * (1 + E.damageGrowth * (night - 1));
    this.radius = def.radius;
    this.gx = gx;
    this.gy = gy;
    this.state = 'rising';
    this.anim = Math.random() * 1000;
    this.attackAt = 0;
    this.alive = true;

    const art = CREATURES[kind];
    const s = gridToScreen(gx, gy);
    this.shadow = game.add.image(s.x, s.y, 'shadow').setScale(kind === 'brute' ? 0.9 : 0.6).setDepth(-5000).setAlpha(0);
    this.sprite = game.add.image(s.x, s.y + 60, `${kind}0`)
      .setOrigin(art.footX / art.w, art.footY / art.h).setAlpha(0).setDepth(s.y);
    this.hitY = s.y - (kind === 'brute' ? 70 : 18);
    this.topY = s.y - (kind === 'brute' ? 140 : 45);

    // omhoog kruipen uit de leegte
    game.tweens.add({
      targets: this.sprite, y: s.y, alpha: 1, duration: 900, ease: 'Quad.easeOut',
      onComplete: () => { this.state = 'hunt'; },
    });
    game.tweens.add({ targets: this.shadow, alpha: 1, duration: 900 });

    this.bar = game.add.graphics().setDepth(9e5).setVisible(false);
  }

  get screen() {
    return gridToScreen(this.gx, this.gy);
  }

  // Elke frame: kies een stap via het stromingsveld naar de speler
  update(time, dt, night) {
    if (!this.alive || this.state !== 'hunt') return;
    const game = this.game;
    const p = game.player;
    let speed = this.def.speed * night.slowFactorAt(this.gx, this.gy);

    const toPlayer = Math.hypot(p.gx - this.gx, p.gy - this.gy);
    const gap = toPlayer - this.radius - CONFIG.player.radius;

    // aanvallen als de speler dichtbij is
    if (!game.dead && gap <= CONFIG.enemies.attackRange) {
      this.tryAttack(time, () => game.hurtPlayer(this.damage, this));
      this.animate(dt * 0.4);
      return;
    }

    // staat er een verdedigingswerk voor zijn neus? Kapotslaan.
    const blocker = night.blockerNear(this);
    if (blocker) {
      this.tryAttack(time, () => night.hitStructure(blocker, this.damage));
      this.animate(dt * 0.4);
      return;
    }

    // volgende stap
    let aim;
    if (toPlayer < 1.5 && !game.dead) aim = { gx: p.gx, gy: p.gy };
    else aim = night.nextStep(this.gx, this.gy) || { gx: p.gx, gy: p.gy };
    const dx = aim.gx - this.gx, dy = aim.gy - this.gy;
    const len = Math.hypot(dx, dy);
    if (len > 0.02) {
      const step = Math.min(len, speed * dt / 1000);
      const nx = this.gx + dx / len * step, ny = this.gy + dy / len * step;
      // per as bewegen, zodat ze langs bomen en kisten glijden
      if (game.island.has(nx, this.gy) && !night.blockedAt(nx, this.gy, this.radius)) this.gx = nx;
      if (game.island.has(this.gx, ny) && !night.blockedAt(this.gx, ny, this.radius)) this.gy = ny;
      const sx = gridToScreen(dx, dy).x;
      if (Math.abs(sx) > 0.01) this.sprite.flipX = sx < 0;
    }
    this.animate(dt);
    this.sync();
  }

  tryAttack(time, hit) {
    if (time < this.attackAt) return;
    if (!this.attackAt) {
      // korte aanloop voor de eerste klap
      this.attackAt = time + 450;
      return;
    }
    this.attackAt = time + this.def.attackMs;
    // uithalen
    this.game.tweens.add({ targets: this.sprite, scaleX: 1.18, scaleY: 0.86, duration: 90, yoyo: true });
    hit();
  }

  animate(dt) {
    this.anim += dt;
    this.sprite.setTexture(`${this.kind}${Math.floor(this.anim / FRAME_MS) % CREATURES[this.kind].frames}`);
  }

  sync() {
    const s = this.screen;
    this.sprite.setPosition(s.x, s.y).setDepth(s.y);
    this.shadow.setPosition(s.x, s.y);
    this.hitY = s.y - (this.kind === 'brute' ? 70 : 18);
    this.topY = s.y - (this.kind === 'brute' ? 140 : 45);
    if (this.bar.visible) this.drawBar();
  }

  drawBar() {
    const b = this.bar;
    const w = this.kind === 'brute' ? 60 : 40;
    b.clear();
    b.fillStyle(0x000000, 0.6);
    b.fillRect(this.sprite.x - w / 2 - 1, this.topY - 9, w + 2, 6);
    b.fillStyle(0xb070ff, 1);
    b.fillRect(this.sprite.x - w / 2, this.topY - 8, w * Math.max(0, this.hp / this.maxHp), 4);
  }

  // geraakt; geeft true terug als het wezen dood is
  hit(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    this.sprite.setTintFill(0xffffff);
    this.game.time.delayedCall(80, () => this.sprite.active && this.sprite.clearTint());
    // klein stukje terug geduwd
    const p = this.game.player;
    const dx = this.gx - p.gx, dy = this.gy - p.gy, len = Math.hypot(dx, dy) || 1;
    const nx = this.gx + dx / len * 0.18, ny = this.gy + dy / len * 0.18;
    if (this.game.island.has(nx, ny)) { this.gx = nx; this.gy = ny; }
    this.bar.setVisible(true);
    this.sync();
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  // oplossen in paarse rook
  vanish(fx) {
    this.alive = false;
    fx?.explode(this.kind === 'brute' ? 26 : 14, this.sprite.x, this.hitY);
    this.bar.destroy();
    this.game.tweens.add({
      targets: [this.sprite, this.shadow], alpha: 0, duration: 400,
      onComplete: () => { this.sprite.destroy(); this.shadow.destroy(); },
    });
  }

  act(game) {
    return { attack: this };
  }
}
