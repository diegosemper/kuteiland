// Anker: houdt alle tegels binnen zijn bereik vast. Te versterken voor meer bereik.
import { CONFIG } from '../config.js';
import { ANCHOR } from '../art/anchor.js';
import { gridToScreen } from '../iso.js';

export class Anchor {
  constructor(scene, gx, gy, data = {}) {
    this.scene = scene;
    this.type = 'anchor';
    this.label = 'ANKER';
    this.gx = gx;
    this.gy = gy;
    this.radius = CONFIG.anchor.radius;
    this.tier = Math.max(1, Math.min(3, data.tier || 1));

    const s = gridToScreen(gx, gy);
    this.shadow = scene.add.image(s.x + 3, s.y + 4, 'shadow').setScale(0.7).setDepth(-5000);
    this.sprite = scene.add.image(s.x, s.y, `anchor${this.tier}`)
      .setOrigin(ANCHOR.ox / ANCHOR.w, ANCHOR.oy / ANCHOR.h).setDepth(s.y);
    this.glow = scene.add.image(s.x, s.y - 40, 'glow').setTint(0x9b6bff).setAlpha(0.25).setScale(0.6).setDepth(s.y - 1);
    scene.tweens.add({ targets: this.glow, alpha: 0.1, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.topY = s.y - 100;
    this.hitY = s.y - 40;
    this.lightY = s.y - 40;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 35, s.y - 100, 70, 110);
  }

  // Bereik in tegels, met bonus van de skill Bouwen
  range(game) {
    return CONFIG.anchor.range[this.tier] * (1 + game.skills.level('bouwen') * CONFIG.anchor.buildBonus);
  }

  covers(game, gx, gy) {
    return Math.hypot(gx - this.gx, gy - this.gy) <= this.range(game) + 0.01;
  }

  upgrade() {
    if (this.tier >= 3) return;
    this.tier++;
    this.sprite.setTexture(`anchor${this.tier}`);
    this.glow.setAlpha(0.6);
    this.scene.tweens.add({ targets: this.sprite, scaleY: { from: 1.15, to: 1 }, duration: 300, ease: 'Back.easeOut' });
  }

  act() {
    return { openAnchor: this };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy, tier: this.tier };
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.glow);
    this.sprite.destroy();
    this.shadow.destroy();
    this.glow.destroy();
  }
}
