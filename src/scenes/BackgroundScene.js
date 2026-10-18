// De leegte: kleurverloop, mist, verre eilanden, zwevende deeltjes en de gloed van de Kern.
import { getDpr } from '../display.js';

const MOTES = 50;

export class BackgroundScene extends Phaser.Scene {
  constructor() {
    super('Background');
  }

  create() {
    this.S = getDpr();
    this.bg = this.add.image(0, 0, 'void').setOrigin(0);

    // De Kern in de verte
    this.kernHalo = this.add.image(0, 0, 'glow').setTint(0x7a4fd0).setAlpha(0.35);
    this.kern = this.add.image(0, 0, 'glow').setTint(0xb48cff).setAlpha(0.5);
    this.kernCore = this.add.image(0, 0, 'glow').setTint(0xf2eaff).setAlpha(0.9);
    this.tweens.add({
      targets: [this.kern, this.kernHalo],
      alpha: '-=0.12',
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Lagen: verre mist, verre eilanden, dichtere mist. f = hoe sterk ze meebewegen met de camera.
    this.layers = [];
    const add = (img, fx, fy, par) => {
      this.layers.push({ img, fx, fy, par });
      return img;
    };
    for (const [fx, fy, sc, a] of [[0.2, 0.35, 5, 0.12], [0.75, 0.55, 6, 0.1], [0.4, 0.85, 7, 0.14]]) {
      const m = add(this.add.image(0, 0, 'mist').setTint(0x5b3d8a).setAlpha(a).setScale(sc * this.S * 0.5), fx, fy, 0.02);
      this.tweens.add({ targets: m, angle: { from: -2, to: 2 }, duration: 14000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    for (const [fx, fy, sc, a] of [[0.12, 0.22, 0.45, 0.55], [0.88, 0.42, 0.3, 0.4], [0.7, 0.78, 0.55, 0.35]]) {
      const isle = add(this.add.image(0, 0, 'farisle').setScale(sc * this.S).setAlpha(a), fx, fy, 0.04 + sc * 0.05);
      isle.bob = Math.random() * Math.PI * 2;
    }
    for (const [fx, fy, sc, a] of [[0.85, 0.15, 6, 0.08], [0.1, 0.65, 5, 0.1]]) {
      add(this.add.image(0, 0, 'mist').setTint(0x8a6ac0).setAlpha(a).setScale(sc * this.S * 0.5), fx, fy, 0.1);
    }

    this.motes = [];
    for (let i = 0; i < MOTES; i++) {
      const depth = Math.random();   // 0 = ver weg, 1 = dichtbij
      this.motes.push({
        x: Math.random(), y: Math.random(),
        speed: 0.004 + depth * 0.014,
        par: 0.05 + depth * 0.35,
        img: this.add.image(0, 0, 'mote')
          .setTint(0xc9b6ee)
          .setScale((0.25 + depth * 0.45) * this.S)
          .setAlpha(0.15 + depth * 0.45),
      });
    }

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.layout();
  }

  layout() {
    const { width: w, height: h } = this.scale;
    this.bg.setDisplaySize(w, h);
    const m = Math.max(w, h);
    this.kernHalo.setScale(m / 128 * 0.9);
    this.kern.setScale(m / 128 * 0.28);
    this.kernCore.setScale(0.18 * this.S);
  }

  update(time, delta) {
    const { width: w, height: h } = this.scale;
    const cam = this.scene.get('Game').cameras.main;
    const sx = cam.scrollX * cam.zoom;
    const sy = cam.scrollY * cam.zoom;

    const kx = w * 0.8 - sx * 0.01;
    const ky = h * 0.13 - sy * 0.01;
    this.kernHalo.setPosition(kx, ky);
    this.kern.setPosition(kx, ky);
    this.kernCore.setPosition(kx, ky);

    for (const l of this.layers) {
      const bob = l.img.bob !== undefined ? Math.sin(time / 2400 + l.img.bob) * 6 * this.S : 0;
      l.img.setPosition(l.fx * w - sx * l.par, l.fy * h - sy * l.par + bob);
    }

    for (const m of this.motes) {
      m.y -= m.speed * delta / 1000;
      if (m.y < 0) m.y += 1;
      const x = Phaser.Math.Wrap(m.x * w - sx * m.par, 0, w);
      const y = Phaser.Math.Wrap(m.y * h - sy * m.par, 0, h);
      m.img.setPosition(x, y);
    }
  }
}
