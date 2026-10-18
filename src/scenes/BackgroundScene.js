// De leegte: kleurverloop, zwevende deeltjes en in de verte de gloed van de Kern.
import { getDpr } from '../display.js';

const MOTES = 60;

export class BackgroundScene extends Phaser.Scene {
  constructor() {
    super('Background');
  }

  create() {
    this.S = getDpr();
    this.bg = this.add.image(0, 0, 'void').setOrigin(0);

    this.kern = this.add.image(0, 0, 'glow').setTint(0x9b6bff).setAlpha(0.3);
    this.kernCore = this.add.image(0, 0, 'glow').setTint(0xe8dcff).setAlpha(0.7);
    this.tweens.add({
      targets: [this.kern, this.kernCore],
      alpha: '-=0.12',
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.motes = [];
    for (let i = 0; i < MOTES; i++) {
      const depth = Math.random();   // 0 = ver weg, 1 = dichtbij
      this.motes.push({
        x: Math.random(), y: Math.random(),
        speed: 0.004 + depth * 0.012,
        par: 0.05 + depth * 0.35,
        img: this.add.image(0, 0, 'mote')
          .setScale((1 + depth * 1.5) * this.S)
          .setAlpha(0.15 + depth * 0.35),
      });
    }

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.layout();
  }

  layout() {
    const { width: w, height: h } = this.scale;
    this.bg.setDisplaySize(w, h);
    this.kern.setScale(Math.max(w, h) / 128 * 0.45);
    this.kernCore.setScale(0.12 * this.S);
  }

  update(time, delta) {
    const { width: w, height: h } = this.scale;
    const cam = this.scene.get('Game').cameras.main;
    const sx = cam.scrollX * cam.zoom;
    const sy = cam.scrollY * cam.zoom;

    const kx = w * 0.8 - sx * 0.02;
    const ky = h * 0.14 - sy * 0.02;
    this.kern.setPosition(kx, ky);
    this.kernCore.setPosition(kx, ky);

    for (const m of this.motes) {
      m.y -= m.speed * delta / 1000;
      if (m.y < 0) m.y += 1;
      const x = Phaser.Math.Wrap(m.x * w - sx * m.par, 0, w);
      const y = Phaser.Math.Wrap(m.y * h - sy * m.par, 0, h);
      m.img.setPosition(x, y);
    }
  }
}
