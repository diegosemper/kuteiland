// Grijphaak: wrakstukken drijven van links naar rechts door de leegte. Tik waar je de haak heen wilt schieten.
// Klein en snel levert het meest op; je hebt maar een paar schoten. Je haak bepaalt hoeveel en hoe makkelijk.
import { CONFIG } from '../../config.js';
import { TEXT, pick } from '../../texts.js';
import { COLORS, textStyle, shade } from '../../ui/style.js';
import { MinigameScene } from './MinigameScene.js';

export class GrijphaakScene extends MinigameScene {
  constructor() {
    super('mg-grijphaak');
  }

  get howTo() {
    return TEXT.mgGrijphaakHow;
  }

  build() {
    const { S, W, H, cfg } = this;
    const perks = this.spec.perks;
    this.makeHud({ lives: 0 });
    this.drawTime(1);
    this.comboText.setColor('#b8a6d9');

    // buitteller linksboven
    const top = this.safe.top + 40 * S;
    this.add.image(28 * S, top + 10 * S, `icon_${this.spec.item}`).setDisplaySize(26 * S, 26 * S).setDepth(50);
    this.lootText = shade(this.add.text(46 * S, top + 10 * S, '0', textStyle(S, 18, COLORS.text, { fontStyle: '800' })).setOrigin(0, 0.5), S).setDepth(50);

    // het platform met de lier, onderin
    this.base = { x: W / 2, y: H - this.safe.bottom - 110 * S };
    const plat = this.add.graphics().setDepth(8);
    const bw = 72 * S;
    for (let i = 0; i < 3; i++) {
      this.add.image(this.base.x - bw + i * bw * 0.66 + bw * 0.33, this.base.y + 40 * S, 'flat_rust_ore')
        .setDisplaySize(bw * 0.66, bw * 0.66).setDepth(7);
    }
    plat.fillStyle(0x3a2a48, 1).fillRect(this.base.x - 14 * S, this.base.y - 6 * S, 28 * S, 30 * S);
    plat.fillStyle(0x8a8a96, 1).fillCircle(this.base.x, this.base.y, 12 * S);
    plat.fillStyle(0x5a5a66, 1).fillCircle(this.base.x, this.base.y, 6 * S);

    // schoten als haakjes onder de lier
    this.shots = perks.shots || 7;
    this.shotIcons = [];
    for (let i = 0; i < this.shots; i++) {
      const x = W / 2 + (i - (this.shots - 1) / 2) * 22 * S;
      this.shotIcons.push(this.add.image(x, this.base.y + 92 * S, 'mg_hook').setDisplaySize(16 * S, 15 * S).setDepth(9));
    }

    this.rope = this.add.graphics().setDepth(10);
    this.hookImg = this.add.image(this.base.x, this.base.y, 'mg_hook').setDisplaySize(30 * S, 28 * S).setDepth(11);
    this.hook = null;          // { x, y, vx, vy, state: 'out'|'back', caught: [] }
    this.wrecks = [];
    this.loot = {};
    this.points = 0;
    this.catches = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.timeLeft = cfg.timeMs;
    this.nextSpawnAt = 0;

    this.sparkle = this.add.particles(0, 0, 'mote', {
      emitting: false, speed: { min: 60 * S, max: 220 * S }, lifespan: 600,
      scale: { start: 2 * S, end: 0 }, alpha: { start: 1, end: 0 }, tint: 0xffd9a0,
    }).setDepth(20);
    this.add.text(W / 2, this.base.y + 112 * S, TEXT.mgTapToAim, textStyle(S, 12, COLORS.dim)).setOrigin(0.5, 0).setDepth(9);

    this.input.on('pointerdown', (p) => this.fire(p));
  }

  begin() {
    // meteen een paar wrakken in beeld
    for (let i = 0; i < 3; i++) this.spawn(this.W * (0.15 + i * 0.3));
  }

  spawn(x = null) {
    const { S, W, H, cfg } = this;
    const total = cfg.kinds.reduce((s, k) => s + k.weight, 0);
    let roll = Math.random() * total;
    const kind = cfg.kinds.find((k) => (roll -= k.weight) < 0) || cfg.kinds[0];
    const size = 70 * S * kind.scale;
    const y = Phaser.Math.Between(H * 0.2, H * 0.6);
    const img = this.add.image(x ?? -size, y, kind.tex).setDepth(4);
    img.setScale(size / img.width);
    let glow = null;
    if (kind.glow) {
      glow = this.add.image(img.x, y, 'glow').setTint(kind.glow).setAlpha(0.6).setScale(size / 60).setDepth(3);
      this.tweens.add({ targets: glow, alpha: 0.25, duration: 400, yoyo: true, repeat: -1 });
    }
    const speed = Phaser.Math.FloatBetween(kind.speed[0], kind.speed[1]) * W;
    this.wrecks.push({ img, glow, kind, size, speed, bob: Math.random() * Math.PI * 2, baseY: y, spin: Phaser.Math.FloatBetween(-40, 40) });
  }

  fire(p) {
    if (!this.started || this.ended || this.hook || this.shots <= 0) return;
    if (p.y > this.base.y - 20 * this.S) return;
    const { S } = this;
    const dx = p.x - this.base.x;
    const dy = p.y - this.base.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = this.cfg.hookSpeed * S * (this.spec.perks.speedMult || 1);
    this.shots--;
    const icon = this.shotIcons[this.shots];
    this.tweens.add({ targets: icon, alpha: 0.15, scale: icon.scale * 0.7, duration: 200 });
    this.hook = { x: this.base.x, y: this.base.y, vx: dx / len * speed, vy: dy / len * speed, state: 'out', caught: [] };
    this.hookImg.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
    this.sfx('swing');
  }

  update(time, delta) {
    if (!this.started || this.ended) return;
    const dt = Math.min(delta, 50) / 1000;
    const { S, W, H, cfg } = this;
    this.timeLeft -= dt * 1000;
    this.drawTime(Math.max(0, this.timeLeft / cfg.timeMs));

    // wrakken drijven
    if (time >= this.nextSpawnAt) {
      this.nextSpawnAt = time + Phaser.Math.Between(cfg.spawnMs[0], cfg.spawnMs[1]);
      this.spawn();
    }
    for (const w of this.wrecks) {
      if (w.hooked) continue;
      w.bob += dt * 2;
      w.img.x += w.speed * dt;
      w.img.y = w.baseY + Math.sin(w.bob) * 6 * S;
      w.img.angle += w.spin * dt;
      if (w.glow) w.glow.setPosition(w.img.x, w.img.y);
    }
    this.wrecks = this.wrecks.filter((w) => {
      if (w.hooked || w.img.x < W + w.size) return true;
      w.img.destroy();
      w.glow?.destroy();
      return false;
    });

    this.updateHook(dt);

    if (this.timeLeft <= 0) { this.end(TEXT.mgGrijphaakTime); return; }
    if (this.shots <= 0 && !this.hook) this.end(pick(TEXT.mgGrijphaakShots));
  }

  updateHook(dt) {
    const { S } = this;
    const h = this.hook;
    const g = this.rope;
    g.clear();
    if (!h) {
      this.hookImg.setPosition(this.base.x, this.base.y - 14 * S).setRotation(0);
      return;
    }
    const speed = this.cfg.hookSpeed * S * (this.spec.perks.speedMult || 1);
    if (h.state === 'out') {
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      // vangen?
      const reach = this.cfg.catchRadius * S * (this.spec.perks.catchMult || 1);
      for (const w of this.wrecks) {
        if (w.hooked) continue;
        if (Math.hypot(w.img.x - h.x, w.img.y - h.y) <= reach + w.size * 0.35) {
          w.hooked = true;
          h.caught.push(w);
          this.onHooked(w);
          // sterrenhaak schiet door voor een tweede vangst
          if (!this.spec.perks.pierce || h.caught.length >= 2) { h.state = 'back'; break; }
        }
      }
      if (h.x < -20 * S || h.x > this.W + 20 * S || h.y < this.timeBarY) {
        h.state = 'back';
        if (!h.caught.length) this.onMissed();
      }
    } else {
      const dx = this.base.x - h.x;
      const dy = this.base.y - h.y;
      const d = Math.hypot(dx, dy);
      const step = speed * 1.15 * dt;
      if (d <= step) {
        for (const w of h.caught) this.bankWreck(w);
        this.hook = null;
        this.hookImg.setPosition(this.base.x, this.base.y - 14 * S).setRotation(0);
        return;
      }
      h.x += dx / d * step;
      h.y += dy / d * step;
      h.caught.forEach((w, i) => {
        w.img.setPosition(h.x + i * 10 * S, h.y + 18 * S + i * 10 * S);
        w.glow?.setPosition(w.img.x, w.img.y);
      });
    }
    // touw met een klein beetje doorhang
    g.lineStyle(3 * S, 0xc8a870, 1);
    const mx = (this.base.x + h.x) / 2;
    const my = (this.base.y + h.y) / 2 + (h.state === 'back' ? 14 : 6) * S;
    g.beginPath();
    g.moveTo(this.base.x, this.base.y);
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(this.base.x, this.base.y), new Phaser.Math.Vector2(mx, my), new Phaser.Math.Vector2(h.x, h.y));
    for (const pt of curve.getPoints(12)) g.lineTo(pt.x, pt.y);
    g.strokePath();
    this.hookImg.setPosition(h.x, h.y);
  }

  onHooked(w) {
    const { S } = this;
    this.sfx('enemyHit');
    this.shake(90, 0.006);
    this.sparkle.explode(14, w.img.x, w.img.y);
    this.tweens.add({ targets: w.img, scale: w.img.scale * 1.25, duration: 90, yoyo: true });
    if (w.kind.points >= 4) this.shout(pick(TEXT.mgNiceCatch), '#ffd98a', this.H * 0.68);
  }

  onMissed() {
    this.streak = 0;
    this.comboText.setText('');
    this.floatText(this.hook.x, Math.max(this.hook.y, this.timeBarY + 30 * this.S), TEXT.mgMiss, '#ff8a80', 20);
    this.sfx('hurt');
  }

  // binnengehaald: buit erbij
  bankWreck(w) {
    const { S } = this;
    this.catches++;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const bonus = 1 + Math.floor(this.streak / 3) * 0.5;
    this.points += Math.round(w.kind.points * 10 * bonus);
    this.setScore(this.points);
    if (this.streak > 1) this.comboText.setText(`${TEXT.mgStreak} x${this.streak}`);
    const parts = [];
    for (const [k, n] of Object.entries(w.kind.loot)) {
      this.loot[k] = (this.loot[k] || 0) + n;
      parts.push(`+${n} ${CONFIG.items[k].name.toLowerCase()}`);
    }
    this.lootText.setText(String(this.loot[this.spec.item] || 0));
    this.tweens.add({ targets: this.lootText, scale: { from: 1.5, to: 1 }, duration: 250, ease: 'Back.easeOut' });
    this.floatText(this.base.x, this.base.y - 60 * S, parts.join('  '), '#e8d6b8', 18);
    this.sfx('pickup');
    this.sparkle.explode(10, this.base.x, this.base.y);
    w.img.destroy();
    w.glow?.destroy();
    this.wrecks = this.wrecks.filter((x) => x !== w);
  }

  reward() {
    // extra roest uit mijlpalen en collecties: per paar vangsten
    const items = { ...this.loot };
    const extra = this.gs.mods.extra(`yield.${this.spec.item}`) * Math.ceil(this.catches / 3);
    if (extra) items[this.spec.item] = (items[this.spec.item] || 0) + extra;
    return {
      score: this.points,
      items,
      xp: this.catches * this.cfg.xpPerCatch,
      line: `${this.catches} ${TEXT.mgCatches} · ${TEXT.mgBestStreak} ${this.bestStreak}`,
    };
  }
}
