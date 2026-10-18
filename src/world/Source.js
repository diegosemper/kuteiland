// Een bron die je zelf bouwt: roestmagneet of kristalboor. Tikken opent zijn minigame.
import { CONFIG } from '../config.js';
import { MAGNET, DRILL, KETTLE, ANTENNA, SOULLAMP } from '../art/structures.js';
import { gridToScreen } from '../iso.js';

const ART = {
  magneet: ['src_magneet', MAGNET], boor: ['src_boor', DRILL], ketel: ['src_ketel', KETTLE],
  antenne: ['src_antenne', ANTENNA], lantaarn: ['src_lantaarn', SOULLAMP],
};
const GLOW = { magneet: 0xe08a50, boor: 0xb48cff, ketel: 0xfff060, antenne: 0xfff0b0, lantaarn: 0x40ffd0 };

export class Source {
  constructor(scene, gx, gy, data) {
    this.scene = scene;
    this.type = 'source';
    this.kind = data.kind;
    this.def = CONFIG.sources[this.kind];
    this.label = this.def.label;
    this.gx = gx;
    this.gy = gy;
    this.radius = 0.34;
    const [key, A] = ART[this.kind];
    const s = gridToScreen(gx, gy);
    this.shadow = scene.add.image(s.x + 4, s.y + 6, 'shadow').setScale(1.3, 1.1).setDepth(-5000);
    this.sprite = scene.add.image(s.x, s.y, key).setOrigin(A.ox / A.w, A.oy / A.h).setDepth(s.y);
    this.topY = s.y - (A.oy - 10);
    this.hitY = s.y - A.oy * 0.4;
    this.lightY = s.y - 30;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 50, s.y - A.oy, 100, A.oy + 20);
    // een zacht schijnsel, zodat je ziet dat hij werkt
    const tint = GLOW[this.kind];
    this.glow = scene.add.image(s.x, s.y - 20, 'glow').setTint(tint).setAlpha(0.2).setScale(0.7, 0.4).setDepth(s.y - 1);
    scene.tweens.add({ targets: this.glow, alpha: 0.08, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (this.kind === 'magneet') {
      scene.tweens.add({ targets: this.sprite, y: s.y - 2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  act() {
    this.scene.tweens.add({ targets: this.sprite, scaleX: { from: 1.06, to: 1 }, scaleY: { from: 0.94, to: 1 }, duration: 160, ease: 'Back.easeOut' });
    return { minigame: true };
  }

  serialize() {
    return { type: this.type, kind: this.kind, gx: this.gx, gy: this.gy };
  }

  destroy() {
    for (const o of [this.sprite, this.shadow, this.glow]) o.destroy();
  }
}
