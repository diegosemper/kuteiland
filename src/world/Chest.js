// De kist. In fase 1 alleen decor met commentaar; in fase 2 wordt hij opslag.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { gridToScreen } from '../iso.js';

export class Chest {
  constructor(scene, gx, gy) {
    this.scene = scene;
    this.type = 'chest';
    this.label = 'OPEN';
    this.gx = gx;
    this.gy = gy;
    this.radius = CONFIG.chest.radius;
    this.looks = 0;

    const s = gridToScreen(gx, gy);
    this.sprite = scene.add.image(s.x, s.y + 1, 'chest').setOrigin(0.5, 1).setDepth(s.y);
    this.topY = s.y - 12;
  }

  act() {
    const line = TEXT.chest[Math.min(this.looks, TEXT.chest.length - 1)];
    this.looks++;
    this.scene.tweens.add({ targets: this.sprite, scaleY: 0.9, duration: 60, yoyo: true });
    return { message: line };
  }
}
