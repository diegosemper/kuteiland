// Arena: bij de zielenlantaarn komen wezens in golven van alle kanten op je af. Tik ze om te slaan.
// Elk verslagen wezen laat een ziel achter; zielen worden zielenkristal. Je wapen bepaalt hoe hard je slaat.
import { TEXT, pick } from '../../texts.js';
import { COLORS, textStyle, shade } from '../../ui/style.js';
import { MinigameScene } from './MinigameScene.js';

export class ArenaScene extends MinigameScene {
  constructor() {
    super('mg-arena');
  }

  get howTo() {
    return TEXT.mgArenaHow;
  }

  build() {
    const { S, W, H, cfg } = this;
    this.makeHud({ lives: cfg.lives });
    this.drawTime(1);
    this.comboText.setColor('#40ffd0');

    const top = this.safe.top + 40 * S;
    this.add.image(28 * S, top + 10 * S, 'icon_zielenkristal').setDisplaySize(26 * S, 26 * S).setDepth(50);
    this.soulText = shade(this.add.text(46 * S, top + 10 * S, '0', textStyle(S, 18, COLORS.text, { fontStyle: '800' })).setOrigin(0, 0.5), S).setDepth(50);

    // de vloer: een ring van sculk rond de speler
    this.cx = W / 2;
    this.cy = H * 0.58;
    const floor = this.add.graphics().setDepth(1);
    floor.fillStyle(0x0c1a22, 1).fillCircle(this.cx, this.cy, Math.min(W, H) * 0.46);
    floor.lineStyle(3 * S, 0x40ffd0, 0.25).strokeCircle(this.cx, this.cy, Math.min(W, H) * 0.46);
    floor.lineStyle(2 * S, 0x40ffd0, 0.15).strokeCircle(this.cx, this.cy, 60 * S);
    this.add.image(this.cx, this.cy, 'glow').setTint(0x40ffd0).setAlpha(0.25).setScale(2.2).setDepth(1);

    this.player = this.add.image(this.cx, this.cy, 'player_idle').setDepth(10);
    this.player.setScale((76 * S) / this.player.height);
    this.slashes = this.add.graphics().setDepth(15);
    this.souls = this.add.particles(0, 0, 'mote', {
      emitting: false, speed: { min: 40 * S, max: 160 * S }, lifespan: 700,
      scale: { start: 2.4 * S, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0x40ffd0, 0xd0fff4],
    }).setDepth(20);
    this.blood = this.add.particles(0, 0, 'mote', {
      emitting: false, speed: { min: 80 * S, max: 220 * S }, lifespan: 400,
      scale: { start: 2 * S, end: 0 }, alpha: { start: 1, end: 0 }, tint: 0x6a2050,
    }).setDepth(19);

    this.enemies = [];
    this.wave = 0;
    this.kills = 0;
    this.soulCount = 0;
    this.lives = cfg.lives;
    this.timeLeft = cfg.timeMs;
    this.waveClearAt = 0;

    this.input.on('pointerdown', (p) => this.strike(p));
  }

  begin() {
    this.nextWave();
  }

  nextWave() {
    const { S, W, H, cfg } = this;
    this.wave++;
    this.comboText.setText(`${TEXT.mgWave} ${this.wave}`);
    this.shout(`${TEXT.mgWave.toUpperCase()} ${this.wave}`, '#40ffd0', this.H * 0.3);
    const n = cfg.perWave[0] + cfg.perWave[1] * (this.wave - 1);
    const R = Math.hypot(W, H) * 0.55;
    for (let i = 0; i < n; i++) {
      this.time.delayedCall(i * 380, () => {
        if (this.ended) return;
        const a = Math.random() * Math.PI * 2;
        this.spawnEnemy(a, R, false);
      });
    }
    if (this.wave % cfg.bruteEvery === 0) {
      this.time.delayedCall(n * 380 + 400, () => { if (!this.ended) this.spawnEnemy(Math.random() * Math.PI * 2, R, true); });
    }
    this.pending = n + (this.wave % cfg.bruteEvery === 0 ? 1 : 0);
  }

  spawnEnemy(a, R, brute) {
    const { S, cfg } = this;
    const hp = (cfg.hpBase + cfg.hpPerWave * (this.wave - 1)) * (brute ? cfg.bruteHp : 1);
    this.pending--;
    const img = this.add.image(this.cx + Math.cos(a) * R, this.cy + Math.sin(a) * R, brute ? 'brute0' : 'crawler0').setDepth(9);
    img.setScale(((brute ? 110 : 64) * S) / img.width);
    img.setFlipX(Math.cos(a) > 0);
    const glow = this.add.image(img.x, img.y, 'glow').setTint(brute ? 0xff3060 : 0x40ffd0).setAlpha(0.5).setScale(brute ? 1 : 0.6).setDepth(8);
    const bar = this.add.graphics().setDepth(12);
    this.enemies.push({
      img, glow, bar, a, r: R, hp, maxHp: hp, brute,
      speed: (cfg.speed + cfg.speedGrow * (this.wave - 1)) * S * (brute ? 0.6 : Phaser.Math.FloatBetween(0.85, 1.2)),
      wobble: Math.random() * 6,
    });
  }

  strike(p) {
    if (!this.started || this.ended) return;
    const { S, cfg } = this;
    let best = null;
    let bd = Infinity;
    for (const e of this.enemies) {
      const d = Math.hypot(e.img.x - p.x, e.img.y - p.y);
      const reach = cfg.tapRadius * S + (e.brute ? 30 * S : 0);
      if (d < reach && d < bd) { best = e; bd = d; }
    }
    if (!best) {
      this.sfx('swing');
      return;
    }
    const dmg = (this.spec.perks.damage || 1) * this.spec.toolMult;
    this.slash(best);
    this.damage(best, dmg);
    // raakt ook wat ernaast staat
    if (this.spec.perks.cleave) {
      for (const e of [...this.enemies]) {
        if (e !== best && Math.hypot(e.img.x - best.img.x, e.img.y - best.img.y) < 80 * S) this.damage(e, dmg * 0.5);
      }
    }
  }

  slash(e) {
    const { S } = this;
    const g = this.slashes;
    g.clear();
    g.lineStyle(5 * S, 0xd0fff4, 0.9);
    const a = Math.random() * Math.PI;
    g.lineBetween(e.img.x - Math.cos(a) * 34 * S, e.img.y - Math.sin(a) * 34 * S, e.img.x + Math.cos(a) * 34 * S, e.img.y + Math.sin(a) * 34 * S);
    this.time.delayedCall(80, () => g.clear());
    this.player.setFlipX(e.img.x < this.cx);
    this.tweens.add({ targets: this.player, x: { from: this.cx + (e.img.x - this.cx) * 0.08, to: this.cx }, y: { from: this.cy + (e.img.y - this.cy) * 0.08, to: this.cy }, duration: 120 });
  }

  damage(e, dmg) {
    const { S } = this;
    if (e.dead) return;
    e.hp -= dmg;
    this.sfx('enemyHit');
    this.blood.explode(6, e.img.x, e.img.y);
    this.floatText(e.img.x, e.img.y - 30 * S, `-${Math.round(dmg * 10) / 10}`, '#ff9a9a', 16);
    e.img.setTintFill(0xffffff);
    this.time.delayedCall(60, () => e.img.active && e.img.clearTint());
    e.r += 18 * S;     // terugslag
    if (e.hp <= 0) this.kill(e);
  }

  kill(e) {
    const { S, cfg } = this;
    e.dead = true;
    this.kills++;
    const value = e.brute ? 5 : 1;
    this.soulCount += value;
    this.soulText.setText(String(this.soulCount));
    this.tweens.add({ targets: this.soulText, scale: { from: 1.5, to: 1 }, duration: 200, ease: 'Back.easeOut' });
    this.souls.explode(e.brute ? 30 : 12, e.img.x, e.img.y);
    this.sfx('enemyDie');
    this.shake(e.brute ? 300 : 70, e.brute ? 0.014 : 0.004);
    if (e.brute) this.shout(pick(TEXT.mgBruteDown), '#40ffd0', this.H * 0.3);
    this.tweens.add({ targets: [e.img, e.glow], alpha: 0, scale: 0, duration: 200, onComplete: () => { e.img.destroy(); e.glow.destroy(); } });
    e.bar.destroy();
    this.enemies = this.enemies.filter((x) => x !== e);
    this.setScore(this.score);
    // zielenbijl-achtige extra's van het wapen
    if (this.spec.perks.shockwave && this.kills % 10 === 0) this.shockwave();
    if (this.spec.perks.lifesteal && this.kills % 15 === 0 && this.lives < cfg.lives) {
      this.lives++;
      this.hearts[this.lives - 1]?.setTexture('heart_full');
      this.floatText(this.cx, this.cy - 60 * S, TEXT.mgLifeBack, '#ff9ad0', 18);
    }
  }

  shockwave() {
    const { S } = this;
    const ring = this.add.circle(this.cx, this.cy, 20 * S).setStrokeStyle(6 * S, 0x40ffd0, 1).setDepth(16);
    this.tweens.add({ targets: ring, radius: 300 * S, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
    this.shout(TEXT.mgShockwave, '#40ffd0', this.H * 0.3);
    for (const e of [...this.enemies]) this.damage(e, 999);
  }

  update(time, delta) {
    if (!this.started || this.ended) return;
    const { S, cfg } = this;
    const dt = Math.min(delta, 50) / 1000;
    this.timeLeft -= dt * 1000;
    this.drawTime(Math.max(0, this.timeLeft / cfg.timeMs));
    if (this.timeLeft <= 0) { this.end(TEXT.mgArenaTime); return; }

    for (const e of this.enemies) {
      e.r -= e.speed * dt;
      e.wobble += dt * 6;
      const x = this.cx + Math.cos(e.a) * e.r;
      const y = this.cy + Math.sin(e.a) * e.r + Math.sin(e.wobble) * 3 * S;
      e.img.setPosition(x, y);
      e.glow.setPosition(x, y);
      // levensbalkje
      e.bar.clear();
      if (e.hp < e.maxHp) {
        const w = (e.brute ? 70 : 40) * S;
        e.bar.fillStyle(0x000000, 0.6).fillRect(x - w / 2, y - e.img.displayHeight / 2 - 10 * S, w, 5 * S);
        e.bar.fillStyle(0x40ffd0, 1).fillRect(x - w / 2, y - e.img.displayHeight / 2 - 10 * S, w * Math.max(0, e.hp / e.maxHp), 5 * S);
      }
      if (e.r <= 34 * S) this.bite(e);
    }
    if (this.ended) return;

    // golf leeg en alles gespawnd? Volgende.
    const spawnedAll = this.pending <= 0 && this.enemies.length === 0;
    if (spawnedAll && !this.waveClearAt) this.waveClearAt = time + 900;
    if (this.waveClearAt && time >= this.waveClearAt && this.enemies.length === 0) {
      this.waveClearAt = 0;
      this.nextWave();
    }
  }

  // een wezen bereikt je: au
  bite(e) {
    const { S } = this;
    e.dead = true;
    this.enemies = this.enemies.filter((x) => x !== e);
    e.img.destroy();
    e.glow.destroy();
    e.bar.destroy();
    this.lives -= e.brute ? 2 : 1;
    this.setLives(Math.max(0, this.lives));
    this.sfx('hurt');
    this.shake(260, 0.016);
    this.flash(0xe0504a, 0.3, 220);
    this.player.setTintFill(0xff6060);
    this.time.delayedCall(100, () => this.player.clearTint());
    if (this.lives <= 0) this.end(pick(TEXT.mgArenaLives));
  }

  get score() {
    return this.soulCount * 10 + (this.wave - 1) * 25;
  }

  reward() {
    const units = Math.floor(this.soulCount / this.cfg.soulsPerUnit);
    const extra = this.gs.mods.extra(`yield.${this.spec.item}`) * Math.floor(units / 3);
    return {
      score: this.score,
      items: { zielenkristal: units + extra },
      xp: this.kills * this.cfg.xpPerKill,
      line: `${TEXT.mgWave.toLowerCase()} ${this.wave} · ${this.kills} ${TEXT.mgKills} · ${this.cfg.soulsPerUnit} ${TEXT.mgSoulsPer}`,
    };
  }
}
