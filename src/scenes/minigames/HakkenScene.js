// Hakken: een pijl schiet heen en weer over een balk. Tik als hij in de goede zone staat.
// Raak = hout en combo; combo maakt het hout meer en de pijl sneller. Drie keer mis en het is over.
import { TEXT, pick } from '../../texts.js';
import { COLORS } from '../../ui/style.js';
import { MinigameScene } from './MinigameScene.js';

export class HakkenScene extends MinigameScene {
  constructor() {
    super('mg-hakken');
  }

  get howTo() {
    return TEXT.mgHakkenHow;
  }

  // breedte van de goede zone (deel van de balk); skill Hakken maakt hem breder
  get zone() {
    const c = this.cfg;
    return Math.min(c.zoneMax, c.zone + this.gs.skills.level('hakken') * c.zonePerLevel);
  }

  build() {
    const { S, W, H, cfg } = this;
    this.makeHud({ lives: cfg.lives });
    this.drawTime(1);

    // de boom (of paddenstoel), groot en pixelscherp
    const groundY = H * 0.6;
    const ground = this.add.graphics().setDepth(1);
    ground.fillStyle(0x2a1c36, 1).fillEllipse(W / 2, groundY + 4 * S, 260 * S, 46 * S);
    ground.fillStyle(0x3d2b4d, 1).fillEllipse(W / 2, groundY, 230 * S, 34 * S);
    const art = this.spec.art || ['tree'];
    this.targets = art.map((key) => {
      const img = this.add.image(W / 2, groundY + 8 * S, key).setOrigin(0.5, 0.9).setDepth(2);
      const scale = Math.min((H * 0.36) / img.height, (W * 0.8) / img.width);
      img.setScale(scale);
      return img;
    });
    this.treeTop = groundY - this.targets[0].displayHeight * 0.9;
    this.hitPoint = { x: W / 2 - 10 * S, y: groundY - this.targets[0].displayHeight * 0.22 };

    this.chips = this.add.particles(0, 0, 'chip', {
      emitting: false, speed: { min: 140 * S, max: 320 * S }, angle: { min: 190, max: 350 }, gravityY: 900 * S,
      rotate: { min: 0, max: 360 }, lifespan: 800, scale: { min: 1.2 * S, max: 2.4 * S }, alpha: { start: 1, end: 0 },
    }).setDepth(5);
    this.leaves = this.add.particles(0, 0, 'leaf', {
      emitting: false, speedX: { min: -60 * S, max: 60 * S }, speedY: { min: 30 * S, max: 90 * S },
      rotate: { min: 0, max: 360 }, lifespan: 2400, scale: { min: 1.4 * S, max: 2.2 * S }, alpha: { start: 1, end: 0 },
    }).setDepth(5);

    // de balk
    this.barW = Math.min(W - 48 * S, 360 * S);
    this.barH = 38 * S;
    this.barX = W / 2 - this.barW / 2;
    this.barY = H * 0.74;
    this.bar = this.add.graphics().setDepth(10);
    this.arrow = this.add.graphics().setDepth(11);
    this.drawBar();

    this.add.text(W / 2, this.barY + this.barH + 16 * S, TEXT.mgTapAnywhere, {
      fontFamily: 'system-ui, sans-serif', fontSize: `${Math.round(12 * S)}px`, color: COLORS.dim,
    }).setOrigin(0.5, 0).setDepth(10);

    // stand
    this.pos = 0;
    this.dir = 1;
    this.speed = cfg.speed;
    this.lives = cfg.lives;
    this.combo = 0;
    this.maxCombo = 0;
    this.points = 0;
    this.hits = 0;
    this.perfects = 0;
    this.doubles = 0;
    this.freezeUntil = 0;
    this.nextTapAt = 0;
    this.timeLeft = cfg.timeMs;
    this.drawArrow();

    this.input.on('pointerdown', () => this.onTap());
  }

  begin() {
    this.startedAt = this.time.now;
  }

  drawBar() {
    const { S, barX, barY, barW, barH } = this;
    const g = this.bar;
    const zw = barW * this.zone;
    const pw = zw * this.cfg.perfect;
    g.clear();
    g.fillStyle(0x000000, 0.5).fillRoundedRect(barX - 4 * S, barY - 4 * S, barW + 8 * S, barH + 8 * S, 10 * S);
    g.fillStyle(0x2a1f36, 1).fillRoundedRect(barX, barY, barW, barH, 8 * S);
    g.fillStyle(0x6fbf6a, 1).fillRect(barX + barW / 2 - zw / 2, barY, zw, barH);
    g.fillStyle(0xa8f09a, 1).fillRect(barX + barW / 2 - zw / 2, barY, zw, 4 * S);
    g.fillStyle(0xffd98a, 1).fillRect(barX + barW / 2 - pw / 2, barY, pw, barH);
    g.lineStyle(2 * S, 0xb8a6d9, 0.6).strokeRoundedRect(barX, barY, barW, barH, 8 * S);
  }

  drawArrow() {
    const { S, barX, barY, barW, barH } = this;
    const x = barX + this.pos * barW;
    const g = this.arrow;
    g.clear();
    g.fillStyle(0xffffff, 1).fillRect(x - 2 * S, barY - 6 * S, 4 * S, barH + 12 * S);
    g.fillTriangle(x - 11 * S, barY - 20 * S, x + 11 * S, barY - 20 * S, x, barY - 6 * S);
    g.fillStyle(0x000000, 0.35).fillRect(x + 2 * S, barY - 6 * S, 2 * S, barH + 12 * S);
  }

  update(time, delta) {
    if (!this.started || this.ended) return;
    const dt = Math.min(delta, 50) / 1000;
    this.timeLeft -= dt * 1000;
    this.drawTime(Math.max(0, this.timeLeft / this.cfg.timeMs));
    if (this.timeLeft <= 0) {
      this.end(TEXT.mgHakkenTime);
      return;
    }
    if (time < this.freezeUntil) return;
    this.pos += this.dir * this.speed * dt;
    if (this.pos >= 1) { this.pos = 2 - this.pos; this.dir = -1; }
    if (this.pos <= 0) { this.pos = -this.pos; this.dir = 1; }
    this.drawArrow();
  }

  onTap() {
    if (!this.started || this.ended || this.time.now < this.nextTapAt) return;
    this.nextTapAt = this.time.now + this.cfg.tapCooldownMs;
    const d = Math.abs(this.pos - 0.5);
    const zone = this.zone;
    if (d <= (zone * this.cfg.perfect) / 2) this.hit(true);
    else if (d <= zone / 2) this.hit(false);
    else this.miss();
  }

  hit(perfect) {
    const { S, cfg } = this;
    this.combo++;
    this.hits++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    let pts = 1 + Math.floor(this.combo / cfg.comboStep);
    if (perfect) { pts *= 2; this.perfects++; }
    const double = Math.random() < this.gs.skills.doubleChance('hakken');
    if (double) { pts *= 2; this.doubles++; }
    this.points += pts;
    this.speed = Math.min(cfg.speedMax, this.speed + cfg.speedPerCombo);

    // juice
    this.setScore(this.points);
    this.comboText.setText(this.combo > 1 ? `${TEXT.mgCombo} x${this.combo}` : '');
    this.sfx(perfect ? 'mine' : 'chop');
    if (perfect) this.sfx('chop');
    this.shake(perfect ? 140 : 80, perfect ? 0.01 : 0.005);
    this.chips.explode(perfect ? 18 : 9, this.hitPoint.x, this.hitPoint.y);
    if (Math.random() < 0.6) this.leaves.explode(Phaser.Math.Between(1, 3), this.W / 2 + Phaser.Math.Between(-80, 80) * S, this.treeTop + Phaser.Math.Between(20, 90) * S);
    for (const t of this.targets) {
      this.tweens.killTweensOf(t);
      t.setAngle(0);
      this.tweens.add({ targets: t, angle: { from: perfect ? -5 : -2.5, to: 0 }, duration: 260, ease: 'Elastic.easeOut' });
    }
    const label = `+${pts}${double ? ` ${TEXT.doubleDrop}` : ''}`;
    this.floatText(this.hitPoint.x + Phaser.Math.Between(-30, 30) * S, this.hitPoint.y - 30 * S, label, double ? '#ffd98a' : '#e8d6b8', perfect ? 26 : 20);
    if (perfect) {
      this.freezeUntil = this.time.now + 70;       // korte hitstop
      this.flash(0xffffff, 0.22, 120);
      this.shout(pick(TEXT.mgPerfect), '#ffd98a', this.barY - 70 * S);
    }
    if (this.combo % 10 === 0) {
      this.shout(`${TEXT.mgCombo} ${this.combo}!`, '#ff9ad0', this.H * 0.3);
      this.sfx('levelUp');
    }
  }

  miss() {
    const { S } = this;
    this.lives--;
    this.combo = 0;
    this.speed = this.cfg.speed;
    this.comboText.setText('');
    this.setLives(this.lives);
    this.sfx('hurt');
    this.shake(200, 0.014);
    this.flash(0xe0504a, 0.3, 200);
    this.floatText(this.barX + this.pos * this.barW, this.barY - 30 * S, TEXT.mgMiss, '#ff8a80', 22);
    if (this.lives <= 0) this.end(pick(TEXT.mgHakkenLives));
  }

  reward() {
    const { gs, spec, cfg } = this;
    let amount = Math.round(this.points * spec.rate * cfg.yieldMult * spec.toolMult);
    // mijlpalen van Hakken: +x per 'opbrengst' (één per paar raak)
    amount += gs.mods.extra(`yield.${spec.item}`) * Math.ceil(this.hits / cfg.hitsPerYield);
    return {
      score: this.points,
      items: { [spec.item]: amount },
      xp: this.hits * cfg.xpPerHit,
      line: `${this.hits} ${TEXT.mgHits} · ${this.perfects} ${TEXT.mgPerfects} · ${TEXT.mgBestCombo} ${this.maxCombo}`,
    };
  }
}
