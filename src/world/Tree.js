// De halfdode boom. Elke paar slagen levert hij wrakhout op.
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
    this.hits = saved?.hits ?? 0;

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

  // Wordt aangeroepen bij een slag. Geeft eventueel een opbrengst terug.
  act(game) {
    const tier = game.tools.axe;
    const { scene, sprite } = this;
    scene.tweens.add({
      targets: sprite,
      x: { from: this.baseX + 3, to: this.baseX },
      duration: 160,
      ease: 'Bounce.easeOut',
    });

    this.chips.explode(6, this.baseX - 8, this.hitY + 60);
    if (Math.random() < 0.5) {
      this.leaves.explode(1 + Math.floor(Math.random() * 2),
        this.baseX + Phaser.Math.Between(-90, 10), this.topY + Phaser.Math.Between(30, 110));
    }

    // skill Hakken maakt elke slag sterker; overschot telt mee voor de volgende
    this.hits += game.skills.power('hakken');
    const need = CONFIG.tree.hitsPerYield[tier];
    const result = { skill: 'hakken' };
    if (this.hits >= need) {
      this.hits -= need;
      const double = Math.random() < game.skills.doubleChance('hakken');
      Object.assign(result, { item: 'wrakhout', amount: CONFIG.tree.woodPerYield[tier] * (double ? 2 : 1), double });
    }
    return result;
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy, hits: this.hits };
  }
}
