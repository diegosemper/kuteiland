// Wat je achterliet toen je viel. Ophalen kan zodra het weer dag is.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { GRAVE } from '../art/defenses.js';
import { gridToScreen } from '../iso.js';

export class Grave {
  constructor(scene, gx, gy, data = {}) {
    this.scene = scene;
    this.type = 'grave';
    this.label = 'PAK';
    this.gx = gx;
    this.gy = gy;
    this.radius = 0.12;
    this.items = { ...data.items };

    const s = gridToScreen(gx, gy);
    this.sprite = scene.add.image(s.x, s.y, 'grave').setOrigin(GRAVE.ox / GRAVE.w, GRAVE.oy / GRAVE.h).setDepth(s.y);
    this.glow = scene.add.image(s.x, s.y - 12, 'glow').setTint(0x9b6bff).setAlpha(0.3).setScale(0.7).setDepth(s.y - 1);
    scene.tweens.add({ targets: this.glow, alpha: 0.12, duration: 1100, yoyo: true, repeat: -1 });
    this.topY = s.y - 34;
    this.hitY = s.y - 14;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 30, s.y - 40, 60, 50);
  }

  act(game) {
    if (game.dayNight.isNight) return { message: TEXT.graveNight };
    return { reclaim: true };
  }

  summary() {
    return Object.entries(this.items).filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${CONFIG.items[k].name.toLowerCase()}`).join(', ');
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy, items: this.items };
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.glow);
    this.sprite.destroy();
    this.glow.destroy();
  }
}
