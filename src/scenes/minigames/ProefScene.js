// Tijdelijke minigame voor bronnen waarvan de echte minigame nog gebouwd wordt.
// Blokjes lichten op; tik ze voor ze doven. Simpel, maar het hele systeem (start, score, resultaat) werkt ermee.
import { TEXT } from '../../texts.js';
import { MinigameScene } from './MinigameScene.js';

export class ProefScene extends MinigameScene {
  constructor() {
    super('mg-proef');
  }

  get title() {
    return (this.spec.name || 'Proef').toUpperCase();
  }

  get scoreKey() {
    return `proef-${this.spec.id}`;
  }

  get howTo() {
    return TEXT.mgProefHow;
  }

  build() {
    this.makeHud({ lives: 0 });
    this.drawTime(1);
    this.points = 0;
    this.taps = 0;
    this.timeLeft = this.cfg.timeMs;
    this.blocks = [];
    this.chips = this.add.particles(0, 0, 'stonechip', {
      emitting: false, speed: { min: 100 * this.S, max: 260 * this.S }, gravityY: 700 * this.S,
      lifespan: 600, scale: { min: 1.2 * this.S, max: 2.2 * this.S }, alpha: { start: 1, end: 0 },
    }).setDepth(5);
  }

  begin() {
    this.spawnEvent = this.time.addEvent({ delay: this.cfg.spawnMs, loop: true, callback: () => this.spawn() });
    this.spawn();
  }

  spawn() {
    if (this.ended) return;
    const { S, W, H } = this;
    const size = 64 * S;
    const x = Phaser.Math.Between(size, W - size);
    const y = Phaser.Math.Between(H * 0.25, H * 0.85);
    const b = this.add.image(x, y, `icon_${this.spec.item}`).setDisplaySize(size, size).setDepth(4).setInteractive();
    const sx = b.scaleX;
    b.setScale(0);
    this.tweens.add({ targets: b, scale: sx, duration: 160, ease: 'Back.easeOut' });
    b.on('pointerdown', () => {
      if (this.ended || !b.active) return;
      this.points++;
      this.setScore(this.points);
      this.chips.explode(10, b.x, b.y);
      this.floatText(b.x, b.y - 30 * S, '+1');
      this.sfx('mine');
      this.shake(60, 0.004);
      b.destroy();
    });
    this.time.delayedCall(this.cfg.lifeMs, () => {
      if (!b.active) return;
      this.tweens.add({ targets: b, alpha: 0, scale: 0, duration: 150, onComplete: () => b.destroy() });
    });
  }

  update(time, delta) {
    if (!this.started || this.ended) return;
    this.timeLeft -= Math.min(delta, 50);
    this.drawTime(Math.max(0, this.timeLeft / this.cfg.timeMs));
    if (this.timeLeft <= 0) {
      this.spawnEvent?.remove();
      this.end(TEXT.mgProefEnd);
    }
  }

  reward() {
    const { gs, spec, cfg } = this;
    let amount = Math.round(this.points * spec.rate * cfg.yieldMult * spec.toolMult);
    amount += gs.mods.extra(`yield.${spec.item}`) * Math.ceil(this.points / 4);
    return { score: this.points, items: { [spec.item]: amount }, xp: this.points * cfg.xpPerHit };
  }
}
