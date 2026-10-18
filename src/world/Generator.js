// De steengenerator: perst leegte tot steen. Delf de steen voor puin; er groeit vanzelf een nieuwe.
import { CONFIG } from '../config.js';
import { TEXT, pick } from '../texts.js';
import { GENERATOR, GEN_STONE } from '../art/structures.js';
import { gridToScreen } from '../iso.js';

export class Generator {
  constructor(scene, gx, gy) {
    this.scene = scene;
    this.type = 'generator';
    this.label = 'DELF';
    this.gx = gx;
    this.gy = gy;
    this.radius = CONFIG.generator.radius;
    this.hits = 0;
    this.ready = true;

    const s = gridToScreen(gx, gy);
    this.shadow = scene.add.image(s.x + 4, s.y + 6, 'shadow').setScale(1.3, 1.1).setDepth(-5000);
    this.sprite = scene.add.image(s.x, s.y, 'generator')
      .setOrigin(GENERATOR.ox / GENERATOR.w, GENERATOR.oy / GENERATOR.h)
      .setDepth(s.y);
    this.stoneY = s.y - 2;
    this.stone = scene.add.image(s.x, this.stoneY, 'gen_stone')
      .setOrigin(GEN_STONE.ox / GEN_STONE.w, GEN_STONE.oy / GEN_STONE.h)
      .setDepth(s.y + 0.5);
    this.glow = scene.add.image(s.x - 6, s.y - 14, 'glow').setTint(0x9b6bff).setAlpha(0.25).setScale(0.6, 0.35)
      .setDepth(s.y + 0.4);
    scene.tweens.add({ targets: this.glow, alpha: 0.12, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.topY = s.y - 46;
    this.hitY = s.y - 26;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 55, s.y - 55, 110, 80);

    this.chips = scene.add.particles(0, 0, 'stonechip', {
      emitting: false,
      speed: { min: 50, max: 130 },
      angle: { min: 200, max: 340 },
      gravityY: 400,
      rotate: { min: 0, max: 360 },
      lifespan: 650,
      scale: { min: 0.8, max: 1.5 },
      alpha: { start: 1, end: 0 },
    }).setDepth(s.y + 1);
  }

  act(game) {
    const tier = game.tools.pickaxe;
    if (tier === 0) return { message: pick(TEXT.noPickaxe) };
    if (!this.ready) return null;

    const { scene, stone } = this;
    scene.tweens.add({ targets: stone, x: { from: stone.x + 2, to: stone.x }, duration: 140, ease: 'Bounce.easeOut' });
    this.chips.explode(5, stone.x, this.stoneY - 14);

    this.hits++;
    if (this.hits < CONFIG.generator.hitsPerYield[tier]) return null;

    // steen breekt, nieuwe groeit
    this.hits = 0;
    this.ready = false;
    this.chips.explode(12, stone.x, this.stoneY - 12);
    stone.setVisible(false);
    scene.time.delayedCall(CONFIG.generator.regrowMs, () => {
      stone.setVisible(true).setScale(1, 0.1).setAlpha(0.3);
      scene.tweens.add({
        targets: stone, scaleY: 1, alpha: 1, duration: 350, ease: 'Back.easeOut',
        onComplete: () => { this.ready = true; },
      });
    });
    return { item: 'puin', amount: CONFIG.generator.puinPerYield[tier] };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy };
  }
}
