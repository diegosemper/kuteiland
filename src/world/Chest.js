// De kist: veilige opslag. Wat erin ligt, raak je nooit kwijt.
import { CONFIG } from '../config.js';
import { CHEST } from '../art/props.js';
import { gridToScreen } from '../iso.js';

const SCALE = 1.35;

export class Chest {
  constructor(scene, gx, gy) {
    this.scene = scene;
    this.type = 'chest';
    this.label = 'OPEN';
    this.gx = gx;
    this.gy = gy;
    this.radius = CONFIG.chest.radius;

    const s = gridToScreen(gx, gy);
    this.shadow = scene.add.image(s.x + 3, s.y + 5, 'shadow').setScale(1, 0.9).setDepth(-5000);
    this.sprite = scene.add.image(s.x, s.y, 'chest')
      .setOrigin(CHEST.ox / CHEST.w, CHEST.oy / CHEST.h)
      .setScale(SCALE)
      .setDepth(s.y);
    this.topY = s.y - 64;
    this.hitY = s.y - 30;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 45, s.y - 75, 90, 95);
  }

  act() {
    return { openChest: true };
  }

  setOpen(open) {
    this.sprite.setTexture(open ? 'chest_open' : 'chest');
    this.scene.tweens.add({ targets: this.sprite, scaleY: { from: SCALE * 0.94, to: SCALE }, duration: 140, ease: 'Back.easeOut' });
  }
}
