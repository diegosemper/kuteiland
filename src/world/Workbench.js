// De werkbank: hier maak je gereedschap, blokken en bouwwerken.
import { CONFIG } from '../config.js';
import { WORKBENCH } from '../art/structures.js';
import { gridToScreen } from '../iso.js';

export class Workbench {
  constructor(scene, gx, gy) {
    this.scene = scene;
    this.type = 'workbench';
    this.label = 'MAAK';
    this.gx = gx;
    this.gy = gy;
    this.radius = CONFIG.workbench.radius;

    const s = gridToScreen(gx, gy);
    this.shadow = scene.add.image(s.x + 4, s.y + 6, 'shadow').setScale(1.15, 1).setDepth(-5000);
    this.sprite = scene.add.image(s.x, s.y, 'workbench')
      .setOrigin(WORKBENCH.ox / WORKBENCH.w, WORKBENCH.oy / WORKBENCH.h)
      .setDepth(s.y);
    this.topY = s.y - 46;
    this.hitY = s.y - 30;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 50, s.y - 55, 100, 75);
  }

  act() {
    return { openCraft: true };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy };
  }
}
