// De halfdode boom. Elke paar slagen levert hij wrakhout op.
import { CONFIG } from '../config.js';
import { ART } from '../art.js';
import { gridToScreen } from '../iso.js';

export class Tree {
  constructor(scene, gx, gy, saved) {
    this.scene = scene;
    this.type = 'tree';
    this.label = 'HAK';
    this.gx = gx;
    this.gy = gy;
    this.radius = CONFIG.tree.radius;
    this.hits = saved?.hits ?? 0;

    const s = gridToScreen(gx, gy);
    this.baseX = s.x;
    this.sprite = scene.add.image(s.x, s.y, 'tree')
      .setOrigin(0.5, ART.treeBaseY / ART.treeH)
      .setDepth(s.y);
    this.topY = s.y - ART.treeBaseY - 2;

    this.chips = scene.add.particles(0, 0, 'chip', {
      emitting: false,
      speed: { min: 25, max: 60 },
      angle: { min: 200, max: 340 },
      gravityY: 180,
      lifespan: 600,
      alpha: { start: 1, end: 0 },
    }).setDepth(s.y + 1);

    this.leaves = scene.add.particles(0, 0, 'leaf', {
      emitting: false,
      speedX: { min: -12, max: 12 },
      speedY: { min: 6, max: 14 },
      lifespan: 2200,
      alpha: { start: 1, end: 0 },
    }).setDepth(s.y + 1);
  }

  // Wordt aangeroepen bij een slag. Geeft eventueel een opbrengst terug.
  act() {
    const { scene, sprite } = this;
    scene.tweens.killTweensOf(sprite);
    sprite.x = this.baseX;
    scene.tweens.add({
      targets: sprite,
      x: this.baseX + 1,
      duration: 40,
      yoyo: true,
      repeat: 2,
      onComplete: () => { sprite.x = this.baseX; },
    });

    this.chips.explode(4, this.baseX, sprite.y - 12);
    if (Math.random() < 0.35) {
      this.leaves.explode(1, this.baseX + Phaser.Math.Between(-12, 12), sprite.y - 42);
    }

    this.hits++;
    if (this.hits >= CONFIG.tree.hitsPerYield) {
      this.hits = 0;
      return { item: 'wrakhout', amount: CONFIG.tree.woodPerYield };
    }
    return null;
  }

  serialize() {
    return { hits: this.hits };
  }
}
