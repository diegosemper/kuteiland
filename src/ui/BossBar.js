// Levensbalk van de Hoeder, onderin boven het XP-balkje.
import { TEXT } from '../texts.js';
import { textStyle, shade, roundedBox } from './style.js';

export class BossBar {
  constructor(scene) {
    this.scene = scene;
    const S = scene.S;
    this.w = 280 * S;
    this.bg = roundedBox(scene, this.w, 44 * S, { fill: 0x0c0812, alpha: 0.8, edgeAlpha: 0.3, radius: 12 });
    this.name = shade(scene.add.text(0, -9 * S, TEXT.bossName, textStyle(S, 11, '#e2d0ff', { fontStyle: '700', letterSpacing: 1.5 * S })).setOrigin(0.5), S);
    this.track = scene.add.rectangle(-this.w / 2 + 12 * S, 10 * S, this.w - 24 * S, 7 * S, 0xffffff, 0.1).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(-this.w / 2 + 12 * S, 10 * S, this.w - 24 * S, 7 * S, 0xb070ff, 1).setOrigin(0, 0.5);
    this.c = scene.add.container(0, 0, [this.bg, this.name, this.track, this.fill]).setDepth(35).setVisible(false);
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.c.setPosition(w / 2, h - safe.bottom - 290 * S);
  }

  show(name) {
    if (name) this.name.setText(name.toUpperCase());
    this.c.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.c, alpha: 1, duration: 600 });
  }

  set(hp, max) {
    const S = this.scene.S;
    this.fill.width = Math.max(0, (this.w - 24 * S) * hp / max);
    this.fill.fillColor = hp / max < 0.5 ? 0xff60a0 : 0xb070ff;
  }

  hide() {
    this.scene.tweens.add({ targets: this.c, alpha: 0, duration: 800, onComplete: () => this.c.setVisible(false) });
  }
}
