// Afdaling: je valt door het gat van je kristalboor de leegte in. Sleep links en rechts, ontwijk stenen en
// wezens, pak kristallen. Druk op TERUG om met je buit naar boven te gaan. Geraakt = alles van deze duik kwijt
// (tenzij je harnas de klap opvangt). Hoe dieper, hoe meer elk kristal waard is, en hoe drukker het wordt.
import { TEXT, pick } from '../../texts.js';
import { COLORS, textStyle, shade, makeButton } from '../../ui/style.js';
import { MinigameScene } from './MinigameScene.js';

export class AfdalingScene extends MinigameScene {
  constructor() {
    super('mg-afdaling');
  }

  get howTo() {
    return TEXT.mgAfdalingHow;
  }

  build() {
    const { S, W, H } = this;
    const perks = this.spec.perks;
    this.shields = (perks.shields || 0) + (this.spec.pet?.shield || 0);
    this.makeHud({ lives: this.shields });
    this.timeBar.setVisible(false);
    this.comboText.setColor('#b8a6d9');

    // buit linksboven (nog niet binnen!)
    const top = this.safe.top + 40 * S;
    this.add.image(28 * S, top + 10 * S, 'icon_leegtekristal').setDisplaySize(26 * S, 26 * S).setDepth(50);
    this.crystalText = shade(this.add.text(46 * S, top + 10 * S, '0', textStyle(S, 18, COLORS.text, { fontStyle: '800' })).setOrigin(0, 0.5), S).setDepth(50);
    this.starIcon = this.add.image(28 * S, top + 40 * S, 'icon_sterrenstof').setDisplaySize(22 * S, 22 * S).setDepth(50).setVisible(false);
    this.starText = shade(this.add.text(46 * S, top + 40 * S, '0', textStyle(S, 15, COLORS.text, { fontStyle: '800' })).setOrigin(0, 0.5), S).setDepth(50).setVisible(false);

    // schachtwanden
    this.wallW = 26 * S;
    this.walls = [];
    const bs = this.wallW;
    for (let i = 0; i < Math.ceil(H / bs) + 2; i++) {
      for (const x of [bs / 2, W - bs / 2]) {
        this.walls.push(this.add.image(x, i * bs, i % 3 ? 'flat_deepslate' : 'flat_obsidian').setDisplaySize(bs, bs).setDepth(3));
      }
    }

    // de speler
    this.px = W / 2;
    this.py = H * 0.3;
    this.targetX = W / 2;
    this.halo = this.add.image(this.px, this.py, 'glow').setTint(0xd9c2ff).setAlpha(0.45).setScale(1.1).setDepth(8);
    this.player = this.add.image(this.px, this.py, 'player_idle').setDepth(10);
    this.player.setScale((70 * S) / this.player.height);
    this.trail = this.add.particles(0, 0, 'mote', {
      follow: this.player, followOffset: { y: -20 * S }, speedY: { min: -120 * S, max: -60 * S }, speedX: { min: -20, max: 20 },
      lifespan: 500, scale: { start: 1.6 * S, end: 0 }, alpha: { start: 0.6, end: 0 }, tint: 0xb48cff, frequency: 40,
    }).setDepth(9);
    this.sparkle = this.add.particles(0, 0, 'mote', {
      emitting: false, speed: { min: 60 * S, max: 220 * S }, lifespan: 500,
      scale: { start: 2 * S, end: 0 }, alpha: { start: 1, end: 0 }, tint: 0xd9c2ff,
    }).setDepth(20);
    this.chips = this.add.particles(0, 0, 'stonechip', {
      emitting: false, speed: { min: 120 * S, max: 300 * S }, lifespan: 700, gravityY: 600 * S,
      scale: { min: 1.2 * S, max: 2.4 * S }, alpha: { start: 1, end: 0 },
    }).setDepth(20);

    // TERUG-knop rechtsboven
    this.backBtn = makeButton(this, W - 76 * S, this.timeBarY + 10 * S, 120 * S, 44 * S, TEXT.mgAfdalingBack, () => this.cashOut(), 14);
    this.backBtn.setDepth(60).setVisible(false);

    this.things = [];
    this.dist = 0;           // afgelegde afstand in pixels
    this.nextRowAt = H * 0.6;
    this.elapsed = 0;
    this.crystals = 0;
    this.stars = 0;
    this.invulnUntil = 0;

    this.input.on('pointerdown', (p) => { if (!this.isOnButton(p)) this.targetX = p.x; });
    this.input.on('pointermove', (p) => { if (p.isDown && !this.isOnButton(p)) this.targetX = p.x; });
  }

  isOnButton(p) {
    return this.backBtn.visible && this.backBtn.getBounds().contains(p.x, p.y);
  }

  begin() {
    this.backBtn.setVisible(true);
  }

  get meters() {
    return (this.dist / this.H) * this.cfg.metersPerScreen;
  }

  get fallSpeed() {
    const c = this.cfg;
    const v = Math.min(c.fallMax, c.fallSpeed + this.elapsed * c.fallGrow) * (this.spec.perks.slowFall || 1);
    return v * this.H;
  }

  // ---------- dingen in de schacht ----------

  spawnRow() {
    const { S, W, H, cfg } = this;
    const fx = this.spec.effects || {};
    const lane = (i, n) => this.wallW + 30 * S + ((W - 2 * this.wallW - 60 * S) * (i + 0.5 + (Math.random() - 0.5) * 0.6)) / n;
    const slots = Phaser.Utils.Array.Shuffle([0, 1, 2]);
    const y = H + 60 * S;
    const m = this.meters;
    const danger = Math.min(0.85, (cfg.obstacle + m * cfg.obstacleGrow) * (fx.dangerMult || 1));
    if (Math.random() < danger) this.spawnObstacle(lane(slots[0], 3), y);
    // dieper is het soms dubbel zo druk
    if (m > 250 && Math.random() < danger * 0.4) this.spawnObstacle(lane(slots[1], 3), y + 40 * S);
    if (Math.random() < cfg.crystal) this.spawnCrystal(lane(slots[2], 3), y + 20 * S);
  }

  spawnObstacle(x, y) {
    const { S, cfg } = this;
    if (Math.random() < cfg.creature) {
      const img = this.add.image(x, y, 'crawler0').setDepth(6);
      img.setScale((70 * S) / img.width);
      // rode gloed, zodat je ze in het donker ziet aankomen
      const glow = this.add.image(x, y, 'glow').setTint(0xff4040).setAlpha(0.9).setScale(1).setDepth(5);
      this.things.push({ kind: 'creature', img, glow, r: 22 * S, baseX: x, phase: Math.random() * 6, amp: Phaser.Math.Between(30, 70) * S });
      return;
    }
    const n = Phaser.Math.Between(1, 2);
    const bs = 52 * S;
    const imgs = [];
    for (let i = 0; i < n; i++) {
      imgs.push(this.add.image(x + (i - (n - 1) / 2) * bs, y, Math.random() < 0.5 ? 'flat_cobble' : 'flat_stone').setDisplaySize(bs, bs).setDepth(6));
    }
    this.things.push({ kind: 'rock', imgs, w: n * bs, h: bs, x, y });
  }

  spawnCrystal(x, y) {
    const { S, cfg } = this;
    const fx = this.spec.effects || {};
    const m = this.meters;
    const star = m >= cfg.star[0] && Math.random() < cfg.star[1] * (fx.starMult || 1);
    const img = this.add.image(x, y, star ? 'icon_sterrenstof' : 'mg_shard').setDepth(7);
    img.setScale((star ? 34 : 30) * S / img.width);
    const glow = this.add.image(x, y, 'glow').setTint(star ? 0xfff0b0 : 0xb48cff).setAlpha(0.5).setScale(0.5).setDepth(5);
    const value = star ? 1 : (1 + Math.floor(m / cfg.valueEvery)) * (fx.valueMult || 1);
    this.things.push({ kind: star ? 'star' : 'crystal', img, glow, r: 18 * S, value });
  }

  // ---------- spellus ----------

  update(time, delta) {
    if (!this.started || this.ended) return;
    const dt = Math.min(delta, 50) / 1000;
    const { S, W, H, cfg } = this;
    this.elapsed += dt;
    const v = this.fallSpeed;
    const dy = v * dt;
    this.dist += dy;

    // wanden schuiven omhoog
    const bs = this.wallW;
    for (const w of this.walls) {
      w.y -= dy;
      if (w.y < -bs) w.y += Math.ceil(H / bs + 2) * bs;
    }
    // speler volgt je vinger
    const minX = this.wallW + 22 * S, maxX = W - this.wallW - 22 * S;
    this.targetX = Phaser.Math.Clamp(this.targetX, minX, maxX);
    const prev = this.px;
    this.px += (this.targetX - this.px) * Math.min(1, cfg.follow * dt);
    this.player.setPosition(this.px, this.py + Math.sin(time / 180) * 3 * S);
    this.halo.setPosition(this.px, this.py);
    this.player.setAngle(Phaser.Math.Clamp((this.px - prev) / (dt * S) * 0.08, -25, 25));
    this.player.setFlipX(this.px < prev);
    if (time < this.invulnUntil) this.player.setAlpha(Math.floor(time / 80) % 2 ? 0.3 : 1);
    else this.player.setAlpha(1);

    // nieuwe rijen
    while (this.dist >= this.nextRowAt) {
      this.nextRowAt += cfg.spawnEvery * H;
      this.spawnRow();
    }

    // alles omhoog, botsen en pakken
    const magnet = this.spec.perks.magnet ? cfg.magnetRange * S : 0;
    for (const t of this.things) {
      if (t.kind === 'rock') {
        t.y -= dy;
        t.imgs.forEach((img, i) => img.setY(t.y));
        if (time >= this.invulnUntil && this.rectHit(t)) this.hit(t);
        continue;
      }
      t.img.y -= dy;
      if (t.kind === 'creature') {
        t.phase += dt * 2.2;
        t.img.x = t.baseX + Math.sin(t.phase) * t.amp;
        t.img.setFlipX(Math.cos(t.phase) < 0);
        t.img.x = Phaser.Math.Clamp(t.img.x, minX, maxX);
        t.glow.setPosition(t.img.x, t.img.y);
        if (time >= this.invulnUntil && Math.hypot(t.img.x - this.px, t.img.y - this.py) < t.r + cfg.hitRadius * S) this.hit(t);
        continue;
      }
      // kristal of ster
      if (magnet) {
        const d = Math.hypot(t.img.x - this.px, t.img.y - this.py);
        if (d < magnet) { t.img.x += (this.px - t.img.x) * Math.min(1, 6 * dt); t.img.y += (this.py - t.img.y) * Math.min(1, 6 * dt); }
      }
      t.glow.setPosition(t.img.x, t.img.y);
      t.img.angle += 90 * dt;
      if (!t.taken && Math.hypot(t.img.x - this.px, t.img.y - this.py) < t.r + cfg.hitRadius * S) this.take(t);
    }
    this.things = this.things.filter((t) => {
      const y = t.kind === 'rock' ? t.y : t.img.y;
      if (!t.gone && y > -80 * S) return true;
      if (t.kind === 'rock') t.imgs.forEach((i) => i.destroy());
      else { t.img.destroy(); t.glow?.destroy(); }
      return false;
    });

    this.comboText.setText(`${Math.floor(this.meters)} m`);
    this.setScoreQuiet(Math.floor(this.meters));
  }

  setScoreQuiet(n) {
    if (this.scoreText.text !== String(n)) this.scoreText.setText(String(n));
  }

  rectHit(t) {
    const r = this.cfg.hitRadius * this.S * 0.85;
    const cx = Phaser.Math.Clamp(this.px, t.x - t.w / 2, t.x + t.w / 2);
    const cy = Phaser.Math.Clamp(this.py, t.y - t.h / 2, t.y + t.h / 2);
    return Math.hypot(cx - this.px, cy - this.py) < r;
  }

  take(t) {
    const { S } = this;
    t.taken = true;
    t.gone = true;
    this.sparkle.explode(12, t.img.x, t.img.y);
    if (t.kind === 'star') {
      this.stars += t.value;
      this.starIcon.setVisible(true);
      this.starText.setVisible(true).setText(String(this.stars));
      this.shout(TEXT.mgStar, '#fff0b0', this.H * 0.45);
      this.sfx('levelUp');
    } else {
      this.crystals += t.value;
      this.crystalText.setText(String(this.crystals));
      this.tweens.add({ targets: this.crystalText, scale: { from: 1.5, to: 1 }, duration: 200, ease: 'Back.easeOut' });
      this.sfx('pickup');
    }
    this.floatText(t.img.x, t.img.y - 20 * S, `+${t.value}`, t.kind === 'star' ? '#fff0b0' : '#d9c2ff', 18);
  }

  hit(t) {
    const { S } = this;
    const x = t.kind === 'rock' ? t.x : t.img.x;
    const y = t.kind === 'rock' ? t.y : t.img.y;
    this.chips.explode(16, x, y);
    t.gone = true;
    if (this.shields > 0) {
      // harnas vangt de klap op
      this.shields--;
      this.setLives(this.shields);
      this.invulnUntil = this.time.now + 1300;
      this.sfx('enemyHit');
      this.shake(200, 0.012);
      this.flash(0xffffff, 0.25, 160);
      this.shout(TEXT.mgArmorSaved, '#b8e0a0', this.H * 0.45);
      return;
    }
    this.sfx('hurt');
    this.sfx('fall');
    this.shake(400, 0.02);
    this.flash(0xe0504a, 0.4, 300);
    this.lost = true;
    if (this.spec.perks.keepHalf) {
      this.crystals = Math.floor(this.crystals / 2);
      this.stars = Math.floor(this.stars / 2);
    } else {
      this.crystals = 0;
      this.stars = 0;
    }
    this.tweens.add({ targets: this.player, angle: 540, alpha: 0, y: this.H + 100 * S, duration: 900, ease: 'Quad.easeIn' });
    this.backBtn.setVisible(false);
    this.end(this.spec.perks.keepHalf ? TEXT.mgAfdalingHalf : pick(TEXT.mgAfdalingLost));
  }

  cashOut() {
    if (!this.started || this.ended) return;
    this.sfx('craft');
    this.backBtn.setVisible(false);
    this.tweens.add({ targets: this.player, y: -100 * this.S, duration: 600, ease: 'Quad.easeIn' });
    this.end(this.crystals + this.stars ? TEXT.mgAfdalingSafe : TEXT.mgAfdalingEmpty);
  }

  reward() {
    const items = { leegtekristal: this.crystals };
    if (this.stars) items.sterrenstof = this.stars;
    const m = Math.floor(this.meters);
    return {
      score: m,
      lost: !!this.lost,
      items,
      xp: (m / 100) * this.cfg.xpPer100m,
      line: `${m} m · ${this.lost ? TEXT.mgAfdalingHitLine : TEXT.mgAfdalingSafeLine}`,
    };
  }
}
