// De halfdode boom. Hout krijg je via de minigame Hakken.
import { CONFIG } from '../config.js';
import { TREE } from '../art/props.js';
import { gridToScreen } from '../iso.js';

export class Tree {
  constructor(scene, gx, gy, saved) {
    this.scene = scene;
    this.type = 'tree';
    this.label = 'HAK';
    this.gx = gx;
    this.gy = gy;
    this.radius = CONFIG.tree.radius;

    const s = gridToScreen(gx, gy);
    this.baseX = s.x;
    this.shadow = scene.add.image(s.x + 6, s.y + 2, 'shadow').setScale(2.4, 2).setAlpha(0.8).setDepth(-5000);
    this.sprite = scene.add.image(s.x, s.y, 'tree')
      .setOrigin(TREE.baseX / TREE.w, TREE.baseY / TREE.h)
      .setDepth(s.y);
    this.topY = s.y - 262;
    this.hitY = s.y - 80;
    // tikvlak: stam en onderkant van de kruin
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 70, s.y - 220, 140, 235);

    // heel zacht wiegen in een wind die er eigenlijk niet zou moeten zijn
    scene.tweens.add({
      targets: this.sprite, angle: { from: -0.6, to: 0.6 },
      duration: 3800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.chips = scene.add.particles(0, 0, 'chip', {
      emitting: false,
      speed: { min: 60, max: 150 },
      angle: { min: 200, max: 340 },
      gravityY: 420,
      rotate: { min: 0, max: 360 },
      lifespan: 700,
      scale: { min: 0.8, max: 1.6 },
      alpha: { start: 1, end: 0 },
    }).setDepth(s.y + 1);

    this.leaves = scene.add.particles(0, 0, 'leaf', {
      emitting: false,
      speedX: { min: -25, max: 25 },
      speedY: { min: 15, max: 35 },
      rotate: { min: 0, max: 360 },
      lifespan: 3000,
      scale: { min: 0.9, max: 1.4 },
      alpha: { start: 1, end: 0 },
    }).setDepth(s.y + 1);
  }

  // Tik op de boom: een tikje voor het gevoel, daarna begint de minigame.
  act() {
    this.scene.tweens.add({
      targets: this.sprite,
      x: { from: this.baseX + 3, to: this.baseX },
      duration: 160,
      ease: 'Bounce.easeOut',
    });
    this.chips.explode(6, this.baseX - 8, this.hitY + 60);
    return { minigame: true };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy };
  }
}
