// Klein XP-balkje dat even verschijnt als je XP krijgt, zoals in Skyblock.
import { CONFIG } from '../config.js';
import { COLORS, textStyle, shade, roundedBox } from './style.js';

export class SkillXpBar {
  constructor(scene) {
    this.scene = scene;
    const S = scene.S;
    this.w = 190 * S;
    this.bg = roundedBox(scene, this.w, 40 * S, { fill: 0x0c0812, alpha: 0.7, edgeAlpha: 0.15, radius: 12 });
    this.label = shade(scene.add.text(-this.w / 2 + 12 * S, -8 * S, '', textStyle(S, 12, COLORS.text, { fontStyle: '700' })).setOrigin(0, 0.5), S);
    this.gain = shade(scene.add.text(this.w / 2 - 12 * S, -8 * S, '', textStyle(S, 11, '#c9a6ff', { fontStyle: '700' })).setOrigin(1, 0.5), S);
    this.track = scene.add.rectangle(-this.w / 2 + 12 * S, 9 * S, this.w - 24 * S, 5 * S, 0xffffff, 0.1).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(-this.w / 2 + 12 * S, 9 * S, 1, 5 * S, 0xc9a6ff, 0.9).setOrigin(0, 0.5);
    this.c = scene.add.container(0, 0, [this.bg, this.label, this.gain, this.track, this.fill]).setDepth(30).setAlpha(0);
    this.sum = 0;
    this.lastId = null;
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.c.setPosition(w / 2, h - safe.bottom - 236 * S);
  }

  show({ id, amount, level, cur, need, max }) {
    const S = this.scene.S;
    this.sum = id === this.lastId ? this.sum + amount : amount;
    this.lastId = id;
    this.label.setText(`${CONFIG.skills[id].name}  ${level}`);
    this.gain.setText(`+${this.sum} xp`);
    const full = this.w - 24 * S;
    this.scene.tweens.killTweensOf(this.fill);
    this.scene.tweens.add({ targets: this.fill, width: max ? full : Math.max(1, full * cur / need), duration: 200 });

    this.scene.tweens.killTweensOf(this.c);
    this.c.setAlpha(1);
    this.scene.tweens.add({
      targets: this.c, alpha: 0, delay: 1600, duration: 500,
      onComplete: () => { this.sum = 0; this.lastId = null; },
    });
  }
}
