// Sterrenvangst: sterren vallen van alle kanten naar je antenne. Wijs met je vinger waar de schotel
// heen moet. Sterren vangen, meteoren juist laten gaan: een gevangen meteoor kost een leven.
import { TEXT, pick } from '../../texts.js';
import { COLORS, textStyle, shade } from '../../ui/style.js';
import { MinigameScene } from './MinigameScene.js';

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class SterrenvangstScene extends MinigameScene {
  constructor() {
    super('mg-sterrenvangst');
  }

  get howTo() {
    return TEXT.mgSterrenHow;
  }

  get arc() {
    return this.cfg.arc + this.gs.skills.level('delven') * this.cfg.arcPerLevel;
  }

  build() {
    const { S, W, H, cfg } = this;
    this.makeHud({ lives: cfg.lives });
    this.drawTime(1);
    this.comboText.setColor('#fff0b0');

    const top = this.safe.top + 40 * S;
    this.add.image(28 * S, top + 10 * S, `icon_${this.spec.item}`).setDisplaySize(26 * S, 26 * S).setDepth(50);
    this.countText = shade(this.add.text(46 * S, top + 10 * S, '0', textStyle(S, 18, COLORS.text, { fontStyle: '800' })).setOrigin(0, 0.5), S).setDepth(50);

    // sterrenhemel
    for (let i = 0; i < 70; i++) {
      const st = this.add.image(Math.random() * W, Math.random() * H, 'mote').setScale((0.5 + Math.random()) * S).setAlpha(0.3 + Math.random() * 0.5).setDepth(-80);
      this.tweens.add({ targets: st, alpha: 0.1, duration: 800 + Math.random() * 1600, yoyo: true, repeat: -1 });
    }

    // antenne in het midden
    this.cx = W / 2;
    this.cy = H * 0.58;
    this.dishR = 74 * S;
    const ant = this.add.graphics().setDepth(5);
    ant.fillStyle(0x3a3a46, 1).fillRect(this.cx - 5 * S, this.cy - 10 * S, 10 * S, 70 * S);
    ant.fillStyle(0x8a8a96, 1).fillRect(this.cx - 26 * S, this.cy + 56 * S, 52 * S, 14 * S);
    this.core = this.add.image(this.cx, this.cy - 14 * S, 'flat_star_ore').setDisplaySize(26 * S, 26 * S).setDepth(6);
    this.coreGlow = this.add.image(this.cx, this.cy - 14 * S, 'glow').setTint(0xfff0b0).setAlpha(0.5).setScale(0.8).setDepth(4);
    this.ring = this.add.graphics().setDepth(4);
    this.dish = this.add.graphics().setDepth(8);
    this.angle = -Math.PI / 2;
    this.targetAngle = this.angle;

    this.sparkle = this.add.particles(0, 0, 'mote', {
      emitting: false, speed: { min: 60 * S, max: 240 * S }, lifespan: 600,
      scale: { start: 2.2 * S, end: 0 }, alpha: { start: 1, end: 0 }, tint: 0xfff0b0,
    }).setDepth(20);
    this.rubble = this.add.particles(0, 0, 'stonechip', {
      emitting: false, speed: { min: 120 * S, max: 300 * S }, lifespan: 700, gravityY: 500 * S,
      scale: { min: 1.2 * S, max: 2.4 * S }, alpha: { start: 1, end: 0 }, tint: 0xff7050,
    }).setDepth(20);

    this.things = [];
    this.stars = 0;
    this.caught = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lives = cfg.lives;
    this.timeLeft = cfg.timeMs;
    this.nextSpawnAt = 0;
    this.spawnR = Math.hypot(W, H) * 0.55;
    this.drawDish();

    const aim = (p) => { this.targetAngle = Math.atan2(p.y - this.cy, p.x - this.cx); };
    this.input.on('pointerdown', aim);
    this.input.on('pointermove', (p) => { if (p.isDown) aim(p); });
  }

  begin() {
    this.nextSpawnAt = this.time.now + 300;
  }

  drawDish() {
    const { S, cx, cy, dishR } = this;
    const g = this.dish;
    g.clear();
    g.lineStyle(10 * S, 0xddd6ee, 1);
    g.beginPath();
    g.arc(cx, cy, dishR, this.angle - this.arc, this.angle + this.arc);
    g.strokePath();
    g.lineStyle(4 * S, 0xb48cff, 0.9);
    g.beginPath();
    g.arc(cx, cy, dishR + 7 * S, this.angle - this.arc * 0.8, this.angle + this.arc * 0.8);
    g.strokePath();
    this.ring.clear().lineStyle(2 * S, 0xb8a6d9, 0.18).strokeCircle(cx, cy, dishR);
  }

  spawn() {
    const { S, cfg } = this;
    const elapsed = (cfg.timeMs - this.timeLeft) / 1000;
    const a = Math.random() * Math.PI * 2;
    const roll = Math.random();
    const meteor = roll < cfg.meteor + elapsed * cfg.meteorGrow;
    const gold = !meteor && Math.random() < cfg.gold;
    const kind = meteor ? 'meteor' : gold ? 'gold' : 'star';
    const tex = meteor ? 'flat_obsidian' : 'mg_star';
    const img = this.add.image(this.cx + Math.cos(a) * this.spawnR, this.cy + Math.sin(a) * this.spawnR, tex).setDepth(7);
    img.setDisplaySize((meteor ? 34 : gold ? 34 : 26) * S, (meteor ? 34 : gold ? 34 : 26) * S);
    if (gold) img.setTint(0xffd040);
    if (meteor) img.setTint(0xff7050);
    const glow = this.add.image(img.x, img.y, 'glow').setTint(meteor ? 0xff4020 : gold ? 0xffd040 : 0xfff0b0).setAlpha(meteor ? 0.7 : 0.5).setScale(0.45).setDepth(6);
    const speed = (cfg.speed + elapsed * cfg.speedGrow) * S * (gold ? 1.35 : 1) * Phaser.Math.FloatBetween(0.85, 1.15);
    this.things.push({ kind, img, glow, a, r: this.spawnR, speed, spin: Phaser.Math.FloatBetween(-200, 200) });
  }

  update(time, delta) {
    if (!this.started || this.ended) return;
    const { cfg } = this;
    const dt = Math.min(delta, 50) / 1000;
    this.timeLeft -= dt * 1000;
    this.drawTime(Math.max(0, this.timeLeft / cfg.timeMs));
    if (this.timeLeft <= 0) { this.end(TEXT.mgSterrenTime); return; }

    // schotel draait naar je vinger
    const d = wrap(this.targetAngle - this.angle);
    this.angle += d * Math.min(1, 16 * dt);
    this.drawDish();

    if (time >= this.nextSpawnAt) {
      const elapsed = (cfg.timeMs - this.timeLeft) / 1000;
      const f = Math.max(0.55, 1 - elapsed / 120);
      this.nextSpawnAt = time + Phaser.Math.Between(cfg.spawnMs[0], cfg.spawnMs[1]) * f;
      this.spawn();
    }

    for (const t of this.things) {
      t.r -= t.speed * dt;
      t.img.setPosition(this.cx + Math.cos(t.a) * t.r, this.cy + Math.sin(t.a) * t.r);
      t.img.angle += t.spin * dt;
      t.glow.setPosition(t.img.x, t.img.y);
      if (!t.done && t.r <= this.dishR) this.resolve(t);
      if (t.r <= 10 * this.S) t.gone = true;
    }
    this.things = this.things.filter((t) => {
      if (!t.gone) return true;
      t.img.destroy();
      t.glow.destroy();
      return false;
    });
  }

  resolve(t) {
    const { S } = this;
    t.done = true;
    const hit = Math.abs(wrap(t.a - this.angle)) <= this.arc;
    if (t.kind === 'meteor') {
      if (!hit) return;              // ontweken: hij vliegt door en spat uiteen op de antenne
      t.gone = true;
      this.combo = 0;
      this.comboText.setText('');
      this.lives--;
      this.setLives(this.lives);
      this.rubble.explode(20, t.img.x, t.img.y);
      this.sfx('hurt');
      this.shake(250, 0.016);
      this.flash(0xe0504a, 0.3, 220);
      this.shout(pick(TEXT.mgMeteor), '#ff8a80', this.H * 0.32);
      if (this.lives <= 0) this.end(pick(TEXT.mgSterrenLives));
      return;
    }
    if (!hit) {
      // gemist: hij fizzelt op de antenne
      this.combo = 0;
      this.comboText.setText('');
      this.tweens.add({ targets: [t.img, t.glow], alpha: 0, duration: 250 });
      return;
    }
    t.gone = true;
    const value = t.kind === 'gold' ? 3 : 1;
    this.stars += value;
    this.caught++;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    if (this.combo > 2) this.comboText.setText(`${TEXT.mgStreak} x${this.combo}`);
    this.sparkle.explode(t.kind === 'gold' ? 22 : 10, t.img.x, t.img.y);
    this.sfx('pickup');
    if (t.kind === 'gold') { this.sfx('levelUp'); this.shout(TEXT.mgGoldStar, '#ffd040', this.H * 0.32); }
    this.floatText(t.img.x, t.img.y - 16 * S, `+${value}`, t.kind === 'gold' ? '#ffd040' : '#fff0b0', 16);
    this.tweens.add({ targets: this.coreGlow, scale: { from: 1.3, to: 0.8 }, duration: 250 });
    this.setScore(this.score);
    this.countText.setText(String(this.units));
    if (this.combo % 10 === 0) this.shout(`${TEXT.mgStreak} ${this.combo}!`, '#ff9ad0', this.H * 0.26);
  }

  get units() {
    return Math.floor(this.stars / this.cfg.starsPerUnit);
  }

  get score() {
    return this.stars * 10 + this.bestCombo * 5;
  }

  reward() {
    const extra = this.gs.mods.extra(`yield.${this.spec.item}`) * Math.floor(this.units / 3);
    return {
      score: this.score,
      items: { [this.spec.item]: this.units + extra },
      xp: this.stars * this.cfg.xpPerStar,
      line: `${this.caught} ${TEXT.mgCaught} · ${TEXT.mgBestStreak} ${this.bestCombo} · ${this.cfg.starsPerUnit} ${TEXT.mgStarsPer}`,
    };
  }
}
