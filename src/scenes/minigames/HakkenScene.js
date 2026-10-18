// Hakken: een pijl schiet heen en weer over een balk. Tik als hij in het groen staat.
// Elke raak doet schade aan de stam; een omgehakte stam levert hout op en de volgende is taaier.
// Je bijl bepaalt hoe hard je slaat, hoeveel levens je hebt en wat extra hulp je krijgt.
import { CONFIG } from '../../config.js';
import { TEXT, pick } from '../../texts.js';
import { COLORS, textStyle, shade } from '../../ui/style.js';
import { MinigameScene } from './MinigameScene.js';

export class HakkenScene extends MinigameScene {
  constructor() {
    super('mg-hakken');
  }

  get howTo() {
    return TEXT.mgHakkenHow;
  }

  // breedte van de goede zone (deel van de balk); skill Hakken en een stenen bijl maken hem breder
  get zone() {
    const c = this.cfg;
    const mult = this.spec.perks.zoneMult || 1;
    return Math.min(c.zoneMax * mult, (c.zone + this.gs.skills.level('hakken') * c.zonePerLevel) * mult);
  }

  get perfectZone() {
    return Math.min(this.zone * 0.7, this.zone * this.cfg.perfect * (this.spec.perks.perfectMult || 1));
  }

  build() {
    const { S, W, H, cfg } = this;
    const perks = this.spec.perks;
    this.makeHud({ lives: (perks.lives || 3) + this.petLives });
    this.drawTime(1);

    // houtteller linksboven
    const top = this.safe.top + 40 * S;
    this.add.image(28 * S, top + 10 * S, `icon_${this.spec.item}`).setDisplaySize(26 * S, 26 * S).setDepth(50);
    this.woodText = shade(this.add.text(46 * S, top + 10 * S, '0', textStyle(S, 18, COLORS.text, { fontStyle: '800' })).setOrigin(0, 0.5), S).setDepth(50);

    // de boom (of paddenstoel), groot en pixelscherp
    this.groundY = H * 0.6;
    const ground = this.add.graphics().setDepth(1);
    ground.fillStyle(0x2a1c36, 1).fillEllipse(W / 2, this.groundY + 4 * S, 260 * S, 46 * S);
    ground.fillStyle(0x3d2b4d, 1).fillEllipse(W / 2, this.groundY, 230 * S, 34 * S);
    this.makeTree();

    this.chips = this.add.particles(0, 0, 'chip', {
      emitting: false, speed: { min: 140 * S, max: 320 * S }, angle: { min: 190, max: 350 }, gravityY: 900 * S,
      rotate: { min: 0, max: 360 }, lifespan: 800, scale: { min: 1.2 * S, max: 2.4 * S }, alpha: { start: 1, end: 0 },
    }).setDepth(5);
    this.leaves = this.add.particles(0, 0, 'leaf', {
      emitting: false, speedX: { min: -60 * S, max: 60 * S }, speedY: { min: 30 * S, max: 90 * S },
      rotate: { min: 0, max: 360 }, lifespan: 2400, scale: { min: 1.4 * S, max: 2.2 * S }, alpha: { start: 1, end: 0 },
    }).setDepth(5);

    // levensbalk van de stam
    this.logBar = this.add.graphics().setDepth(12);
    this.logLabel = shade(this.add.text(W / 2, 0, '', textStyle(S, 12, COLORS.dim, { fontStyle: '700' })).setOrigin(0.5, 1), S).setDepth(12);

    // de balk
    this.barW = Math.min(W - 48 * S, 360 * S);
    this.barH = 38 * S;
    this.barX = W / 2 - this.barW / 2;
    this.barY = H * 0.74;
    this.bar = this.add.graphics().setDepth(10);
    this.arrow = this.add.graphics().setDepth(11);
    this.drawBar();

    this.add.text(W / 2, this.barY + this.barH + 16 * S, TEXT.mgTapAnywhere, textStyle(S, 12, COLORS.dim))
      .setOrigin(0.5, 0).setDepth(10);

    // stand
    this.pos = 0;
    this.dir = 1;
    this.speed = cfg.speed;
    this.lives = (perks.lives || 3) + this.petLives;
    this.forgive = perks.forgive || 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.damage = 0;
    this.hits = 0;
    this.perfects = 0;
    this.logs = 0;
    this.wood = 0;
    this.logHp = cfg.logHp;
    this.logMax = cfg.logHp;
    this.freezeUntil = 0;
    this.nextTapAt = 0;
    this.timeLeft = cfg.timeMs;
    this.drawArrow();
    this.drawLog();

    this.input.on('pointerdown', () => this.onTap());
  }

  makeTree() {
    const { S, W, H } = this;
    const art = this.spec.art || ['tree'];
    this.targets = art.map((key) => {
      const img = this.add.image(W / 2, this.groundY + 8 * S, key).setOrigin(0.5, 0.9).setDepth(2);
      img.setScale(Math.min((H * 0.34) / img.height, (W * 0.8) / img.width));
      img.baseScale = img.scale;
      return img;
    });
    this.treeTop = this.groundY - this.targets[0].displayHeight * 0.9;
    this.hitPoint = { x: W / 2 - 10 * S, y: this.groundY - this.targets[0].displayHeight * 0.22 };
  }

  drawLog() {
    const { S, W } = this;
    const w = 180 * S;
    const y = this.treeTop - 18 * S;
    const g = this.logBar;
    const f = Math.max(0, this.logHp / this.logMax);
    g.clear();
    g.fillStyle(0x000000, 0.5).fillRoundedRect(W / 2 - w / 2 - 2 * S, y - 2 * S, w + 4 * S, 12 * S, 5 * S);
    g.fillStyle(0x8a5a2e, 1).fillRoundedRect(W / 2 - w / 2, y, Math.max(4 * S, w * f), 8 * S, 4 * S);
    g.fillStyle(0xc89058, 1).fillRect(W / 2 - w / 2 + 2 * S, y + 1 * S, Math.max(0, w * f - 4 * S), 2 * S);
    this.logLabel.setPosition(W / 2, y - 4 * S).setText(`${TEXT.mgLog} ${this.logs + 1}`);
  }

  begin() {}

  drawBar() {
    const { S, barX, barY, barW, barH } = this;
    const g = this.bar;
    const zw = barW * this.zone;
    const pw = barW * this.perfectZone;
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
    // roestige bijl: de pijl 'plakt' in de groene zone
    const inZone = Math.abs(this.pos - 0.5) <= this.zone / 2;
    const slow = inZone ? 1 - (this.spec.perks.slowInZone || 0) : 1;
    this.pos += this.dir * this.speed * slow * dt;
    if (this.pos >= 1) { this.pos = 2 - this.pos; this.dir = -1; }
    if (this.pos <= 0) { this.pos = -this.pos; this.dir = 1; }
    this.drawArrow();
  }

  onTap() {
    if (!this.started || this.ended || this.time.now < this.nextTapAt) return;
    this.nextTapAt = this.time.now + this.cfg.tapCooldownMs;
    const d = Math.abs(this.pos - 0.5);
    if (d <= this.perfectZone / 2) this.hit(true);
    else if (d <= this.zone / 2) this.hit(false);
    else this.miss();
  }

  hit(perfect) {
    const { S, cfg } = this;
    this.combo++;
    this.hits++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    let dmg = (this.spec.perks.damage || 1) * this.spec.toolMult;
    if (perfect) { dmg *= 2; this.perfects++; }
    dmg = Math.round((dmg + Math.floor(this.combo / cfg.comboStep)) * 10) / 10;
    this.damage += dmg;
    this.logHp -= dmg;
    this.speed = Math.min(cfg.speedMax, this.speed + cfg.speedPerCombo);

    // juice
    this.setScore(Math.round(this.damage));
    this.comboText.setText(this.combo > 1 ? `${TEXT.mgCombo} x${this.combo}` : '');
    this.sfx(perfect ? 'mine' : 'chop');
    if (perfect) this.sfx('chop');
    this.shake(perfect ? 140 : 80, perfect ? 0.01 : 0.005);
    this.chips.explode(perfect ? 18 : 9, this.hitPoint.x, this.hitPoint.y);
    if (Math.random() < 0.6) this.leaves.explode(Phaser.Math.Between(1, 3), this.W / 2 + Phaser.Math.Between(-80, 80) * S, this.treeTop + Phaser.Math.Between(20, 90) * S);
    if (!this.felling) {
      for (const t of this.targets) {
        this.tweens.killTweensOf(t);
        t.setAngle(0);
        this.tweens.add({ targets: t, angle: { from: perfect ? -5 : -2.5, to: 0 }, duration: 260, ease: 'Elastic.easeOut' });
      }
    }
    this.floatText(this.hitPoint.x + Phaser.Math.Between(-30, 30) * S, this.hitPoint.y - 30 * S, `-${dmg}`, perfect ? '#ffd98a' : '#e8d6b8', perfect ? 26 : 20);
    if (perfect) {
      this.freezeUntil = this.time.now + 70;       // korte hitstop
      this.flash(0xffffff, 0.22, 120);
      this.shout(pick(TEXT.mgPerfect), '#ffd98a', this.barY - 70 * S);
    }
    if (this.combo % 10 === 0) {
      this.shout(`${TEXT.mgCombo} ${this.combo}!`, '#ff9ad0', this.H * 0.3);
      this.sfx('levelUp');
    }
    if (this.logHp <= 0) this.fell();
    this.drawLog();
  }

  // stam om: hout erbij, volgende stam is taaier
  fell() {
    const { S, cfg, gs, spec } = this;
    this.logs++;
    let n = spec.per + gs.mods.extra(`yield.${spec.item}`) + (spec.effects?.perLogBonus || 0);
    const double = Math.random() < gs.skills.doubleChance('hakken');
    if (double) n *= 2;
    this.wood += n;
    this.woodText.setText(String(this.wood));
    this.tweens.add({ targets: this.woodText, scale: { from: 1.5, to: 1 }, duration: 250, ease: 'Back.easeOut' });
    this.logMax = cfg.logHp + this.logs * cfg.logHpGrow;
    this.logHp += this.logMax;     // overschot telt mee
    this.sfx('fall');
    this.shake(260, 0.016);
    this.shout(double ? `${pick(TEXT.mgTimber)} x2` : pick(TEXT.mgTimber), '#c8f0a0', this.H * 0.3);
    this.floatText(this.W / 2, this.treeTop + 90 * S, `+${n} ${CONFIG.items[spec.item].name.toLowerCase()}`, '#c8f0a0', 22);
    this.chips.explode(30, this.hitPoint.x, this.hitPoint.y);
    this.leaves.explode(10, this.W / 2, this.treeTop + 40 * S);
    // oude boom valt om, nieuwe groeit op
    this.felling = true;
    const old = this.targets;
    for (const t of old) {
      this.tweens.killTweensOf(t);
      this.tweens.add({ targets: t, angle: 88, alpha: 0, duration: 450, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
    }
    this.makeTree();
    for (const t of this.targets) {
      t.setScale(0);
      this.tweens.add({ targets: t, scale: t.baseScale, delay: 300, duration: 300, ease: 'Back.easeOut' });
    }
    this.time.delayedCall(600, () => { this.felling = false; });
  }

  miss() {
    const { S } = this;
    this.combo = 0;
    this.speed = this.cfg.speed;
    this.comboText.setText('');
    // zielenbijl: de eerste misser telt niet
    if (this.forgive > 0) {
      this.forgive--;
      this.sfx('swing');
      this.floatText(this.barX + this.pos * this.barW, this.barY - 30 * S, TEXT.mgForgiven, '#40ffd0', 20);
      return;
    }
    this.lives--;
    this.setLives(this.lives);
    this.sfx('hurt');
    this.shake(200, 0.014);
    this.flash(0xe0504a, 0.3, 200);
    this.floatText(this.barX + this.pos * this.barW, this.barY - 30 * S, TEXT.mgMiss, '#ff8a80', 22);
    if (this.lives <= 0) this.end(pick(TEXT.mgHakkenLives));
  }

  reward() {
    return {
      score: Math.round(this.damage),
      items: { [this.spec.item]: this.wood },
      xp: this.hits * this.cfg.xpPerHit,
      line: `${this.logs} ${TEXT.mgLogs} · ${this.perfects} ${TEXT.mgPerfects} · ${TEXT.mgBestCombo} ${this.maxCombo}`,
    };
  }
}
