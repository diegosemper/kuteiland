// Koken: houd de zwavelketel op temperatuur. Vinger op het scherm = vuur aan, loslaten = afkoelen.
// De groene zone schuift op en neer; zolang de meter erin staat, vult het brouwsel. Vol = zwavel.
// Te heet en hij kookt over (leven kwijt). Soms valt er een roestklont in: plots een stuk kouder.
import { CONFIG } from '../../config.js';
import { TEXT, pick } from '../../texts.js';
import { COLORS, textStyle, shade } from '../../ui/style.js';
import { MinigameScene } from './MinigameScene.js';

export class KokenScene extends MinigameScene {
  constructor() {
    super('mg-koken');
  }

  get howTo() {
    return TEXT.mgKokenHow;
  }

  get zoneH() {
    return this.cfg.zone + this.gs.skills.level('bouwen') * this.cfg.zonePerLevel;
  }

  build() {
    const { S, W, H, cfg } = this;
    this.makeHud({ lives: this.maxLives });
    this.drawTime(1);
    this.comboText.setColor('#fff0a0');

    const top = this.safe.top + 40 * S;
    this.add.image(28 * S, top + 10 * S, `icon_${this.spec.item}`).setDisplaySize(26 * S, 26 * S).setDepth(50);
    this.countText = shade(this.add.text(46 * S, top + 10 * S, '0', textStyle(S, 18, COLORS.text, { fontStyle: '800' })).setOrigin(0, 0.5), S).setDepth(50);

    // de ketel
    this.kx = W * 0.42;
    this.ky = H * 0.6;
    const pot = 150 * S;
    this.fire = this.add.particles(0, 0, 'mote', {
      x: { min: this.kx - pot * 0.4, max: this.kx + pot * 0.4 }, y: this.ky + pot * 0.62,
      speedY: { min: -160 * S, max: -60 * S }, speedX: { min: -20, max: 20 }, lifespan: 500,
      scale: { start: 3 * S, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xff8a30, 0xffd040, 0xff5020], frequency: 60,
    }).setDepth(4);
    for (let i = 0; i < 3; i++) {
      this.add.image(this.kx + (i - 1) * pot * 0.4, this.ky + pot * 0.62, 'flat_cobble').setDisplaySize(pot * 0.4, pot * 0.3).setDepth(3);
    }
    this.add.image(this.kx, this.ky, 'flat_iron').setDisplaySize(pot * 1.15, pot).setTint(0x6a6a78).setDepth(5);
    this.liquid = this.add.image(this.kx, this.ky - pot * 0.38, 'flat_sulfur').setDisplaySize(pot * 0.86, pot * 0.2).setDepth(6);
    this.bubbles = this.add.particles(0, 0, 'mote', {
      x: { min: this.kx - pot * 0.38, max: this.kx + pot * 0.38 }, y: this.ky - pot * 0.42,
      speedY: { min: -60 * S, max: -20 * S }, lifespan: 600, scale: { start: 1.5 * S, end: 3 * S }, alpha: { start: 0.8, end: 0 },
      tint: 0xfff080, frequency: 200,
    }).setDepth(7);
    this.splash = this.add.particles(0, 0, 'mote', {
      emitting: false, speed: { min: 150 * S, max: 380 * S }, angle: { min: 200, max: 340 }, gravityY: 700 * S,
      lifespan: 900, scale: { start: 2.5 * S, end: 0 }, tint: 0xfff060,
    }).setDepth(20);
    this.potTop = this.ky - pot * 0.5;

    // de thermometer rechts
    this.mx = W - 56 * S;
    this.mTop = this.timeBarY + 50 * S;
    this.mH = H * 0.5;
    this.meter = this.add.graphics().setDepth(10);
    // brouwsel-voortgang onder de ketel
    this.brewBar = this.add.graphics().setDepth(10);
    this.add.text(this.kx, this.ky + pot * 0.95, TEXT.mgKokenHold, textStyle(S, 12, COLORS.dim)).setOrigin(0.5, 0).setDepth(10);

    this.temp = 0.35;
    this.vel = 0;
    this.zoneY = 0.5;           // midden van de zone (0 = onder, 1 = boven)
    this.zonePhase = Math.random() * 6;
    this.brew = 0;
    this.brews = 0;
    this.inZoneMs = 0;
    this.lives = this.maxLives;
    this.timeLeft = cfg.timeMs;
    this.nextClumpAt = 0;
    this.overheat = 0;
    this.drawMeter();
  }

  begin() {
    this.nextClumpAt = this.time.now + Phaser.Math.Between(...this.cfg.clumpEvery);
  }

  drawMeter() {
    const { S, mx, mTop, mH } = this;
    const g = this.meter;
    const w = 30 * S;
    g.clear();
    g.fillStyle(0x000000, 0.5).fillRoundedRect(mx - w / 2 - 4 * S, mTop - 4 * S, w + 8 * S, mH + 8 * S, 10 * S);
    g.fillStyle(0x2a1f36, 1).fillRoundedRect(mx - w / 2, mTop, w, mH, 8 * S);
    // gevarenstrook bovenin
    g.fillStyle(0xe0504a, 0.6).fillRect(mx - w / 2, mTop, w, mH * 0.04);
    // groene zone
    const zh = this.zoneH * mH;
    const zc = mTop + (1 - this.zoneY) * mH;
    g.fillStyle(0x6fbf6a, 1).fillRect(mx - w / 2, zc - zh / 2, w, zh);
    // de wijzer
    const y = mTop + (1 - this.temp) * mH;
    const hot = this.temp > 0.9;
    g.fillStyle(hot ? 0xff6050 : 0xffffff, 1).fillRect(mx - w / 2 - 8 * S, y - 3 * S, w + 16 * S, 6 * S);
    g.fillTriangle(mx - w / 2 - 20 * S, y - 9 * S, mx - w / 2 - 20 * S, y + 9 * S, mx - w / 2 - 8 * S, y);
  }

  drawBrew() {
    const { S, kx, ky } = this;
    const w = 160 * S;
    const y = ky + 95 * S;
    const g = this.brewBar;
    g.clear();
    g.fillStyle(0x000000, 0.5).fillRoundedRect(kx - w / 2, y, w, 10 * S, 5 * S);
    g.fillStyle(0xfff060, 1).fillRoundedRect(kx - w / 2, y, Math.max(6 * S, w * this.brew), 10 * S, 5 * S);
  }

  inZone() {
    return Math.abs(this.temp - this.zoneY) <= this.zoneH / 2;
  }

  update(time, delta) {
    if (!this.started || this.ended) return;
    const { cfg } = this;
    const dt = Math.min(delta, 50) / 1000;
    this.timeLeft -= dt * 1000;
    this.drawTime(Math.max(0, this.timeLeft / cfg.timeMs));
    if (this.timeLeft <= 0) { this.end(TEXT.mgKokenTime); return; }

    // vuur: vinger erop = heter
    const heating = this.input.activePointer.isDown;
    this.vel += (heating ? cfg.heatAcc : -cfg.coolAcc) * dt;
    this.vel *= 1 - cfg.damping * dt;
    this.vel = Phaser.Math.Clamp(this.vel, -cfg.maxVel, cfg.maxVel);
    this.temp += this.vel * dt;
    if (this.temp < 0) { this.temp = 0; this.vel = 0; }
    this.fire.frequency = heating ? 25 : 140;
    this.bubbles.frequency = Math.max(30, 300 - this.temp * 280);

    // de zone zwerft
    const zs = cfg.zoneSpeed + (cfg.timeMs - this.timeLeft) / 1000 * cfg.zoneSpeedGrow;
    this.zonePhase += dt * zs * 6;
    const half = this.zoneH / 2;
    this.zoneY = Phaser.Math.Clamp(0.5 + Math.sin(this.zonePhase) * 0.3 + Math.sin(this.zonePhase * 2.3) * 0.08, half + 0.04, 0.92 - half);

    // brouwen
    if (this.inZone()) {
      this.brew += dt * 1000 / cfg.brewMs;
      this.inZoneMs += dt * 1000;
      this.comboText.setText(TEXT.mgKokenGood);
      if (this.brew >= 1) this.brewDone();
    } else {
      this.comboText.setText(this.temp > this.zoneY ? TEXT.mgKokenHot : TEXT.mgKokenCold);
    }

    // overkoken
    if (this.temp >= 1) {
      this.boilOver();
      if (this.ended) return;
    }

    // roestklont
    if (time >= this.nextClumpAt) {
      this.nextClumpAt = time + Phaser.Math.Between(...cfg.clumpEvery);
      this.dropClump();
    }

    this.drawMeter();
    this.drawBrew();
    this.setScoreQuiet(this.score);
  }

  get score() {
    return this.brews * 100 + Math.floor(this.inZoneMs / 100);
  }

  setScoreQuiet(n) {
    if (this.scoreText.text !== String(n)) this.scoreText.setText(String(n));
  }

  brewDone() {
    const { S, spec } = this;
    this.brew = 0;
    this.brews++;
    const n = spec.per + (this.gs.mods.extra(`yield.${spec.item}`) || 0);
    this.made = (this.made || 0) + n;
    this.countText.setText(String(this.made));
    this.tweens.add({ targets: this.countText, scale: { from: 1.5, to: 1 }, duration: 250, ease: 'Back.easeOut' });
    this.splash.explode(16, this.kx, this.potTop);
    this.floatText(this.kx, this.potTop - 30 * S, `+${n} ${CONFIG.items[spec.item].name.toLowerCase()}`, '#fff0a0', 20);
    this.sfx('craft');
    this.shake(80, 0.004);
    if (this.brews % 5 === 0) this.shout(pick(TEXT.mgKokenStreak), '#fff0a0', this.H * 0.3);
  }

  boilOver() {
    this.lives--;
    this.setLives(this.lives);
    this.temp = 0.45;
    this.vel = -0.2;
    this.brew = Math.max(0, this.brew - 0.5);
    this.splash.explode(40, this.kx, this.potTop);
    this.sfx('hurt');
    this.shake(280, 0.016);
    this.flash(0xfff060, 0.35, 250);
    this.shout(pick(TEXT.mgKokenOver), '#ff8a80', this.H * 0.35);
    if (this.lives <= 0) this.end(pick(TEXT.mgKokenLives));
  }

  dropClump() {
    const { S } = this;
    const img = this.add.image(this.kx + Phaser.Math.Between(-40, 40) * S, this.timeBarY + 30 * S, 'drift_scrap').setDepth(8);
    img.setScale((50 * S) / img.width);
    this.floatText(img.x, img.y + 30 * S, TEXT.mgKokenClump, '#e0a090', 14);
    this.tweens.add({
      targets: img, y: this.potTop, angle: 200, duration: 700, ease: 'Quad.easeIn',
      onComplete: () => {
        img.destroy();
        if (this.ended) return;
        this.temp = Math.max(0, this.temp - this.cfg.clumpDrop);
        this.vel = Math.min(this.vel, 0);
        this.splash.explode(12, this.kx, this.potTop);
        this.sfx('place');
        this.shake(100, 0.006);
      },
    });
  }

  reward() {
    return {
      score: this.score,
      items: { [this.spec.item]: this.made || 0 },
      xp: this.brews * this.cfg.xpPerBrew,
      line: `${this.brews} ${TEXT.mgBrews} · ${Math.round(this.inZoneMs / 1000)} s ${TEXT.mgInZone}`,
    };
  }
}
