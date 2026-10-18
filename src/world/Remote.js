// Objecten op de verre eilanden: grondstof-aders, briefjes en de Kern zelf.
import { CONFIG } from '../config.js';
import { TEXT } from "../texts.js";
import { NODE, NOTE, KERN } from '../art/remote.js';
import { gridToScreen } from '../iso.js';

// Ader of hoop: delven met een houweel, groeit vanzelf terug
export class ResourceNode {
  constructor(scene, gx, gy, data) {
    this.scene = scene;
    this.type = 'node';
    this.node = data.node;
    this.def = CONFIG.nodes[this.node];
    this.label = 'DELF';
    this.gx = gx;
    this.gy = gy;
    this.radius = 0.36;
    this.hits = 0;
    this.ready = true;
    const s = gridToScreen(gx, gy);
    const origin = [NODE.ox / NODE.w, NODE.oy / NODE.h];
    this.shadow = scene.add.image(s.x + 4, s.y + 6, 'shadow').setScale(1.2, 1).setDepth(-5000);
    this.sprite = scene.add.image(s.x, s.y, `node_${this.node}_base`).setOrigin(...origin).setDepth(s.y);
    this.top = scene.add.image(s.x, s.y, `node_${this.node}_top`).setOrigin(...origin).setDepth(s.y + 0.5);
    this.topY = s.y - 70;
    this.hitY = s.y - 26;
    this.lightY = s.y - 30;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 50, s.y - 70, 100, 90);
    this.chips = scene.add.particles(0, 0, this.node === 'wrak' ? 'chip' : 'mote', {
      emitting: false,
      speed: { min: 50, max: 130 }, angle: { min: 200, max: 340 }, gravityY: 380,
      lifespan: 650, scale: { min: 0.5, max: 1.1 }, alpha: { start: 1, end: 0 },
      tint: this.node === 'wrak' ? 0xc07040 : this.node === 'kristalader' ? 0xb48cff : 0xfff0c0,
    }).setDepth(s.y + 1);
  }

  act(game) {
    const tier = game.tools.pickaxe;
    const need = this.def.hits[tier];
    if (!need) return { message: `${this.def.name}: ${TEXT.nodeNeedsTool[this.node]}` };
    if (!this.ready) return null;
    this.scene.tweens.add({ targets: this.top, x: { from: this.top.x + 2, to: this.top.x }, duration: 140, ease: 'Bounce.easeOut' });
    this.chips.explode(5, this.top.x, this.hitY - 10);
    this.hits += game.skills.power('delven') * game.upgradeMult('pickaxe');
    if (this.hits < need) return { skill: 'delven' };
    this.hits = 0;
    this.ready = false;
    this.chips.explode(14, this.top.x, this.hitY - 10);
    this.top.setVisible(false);
    this.scene.time.delayedCall(this.def.regrowMs, () => {
      this.top.setVisible(true).setScale(1, 0.1).setAlpha(0.3);
      this.scene.tweens.add({ targets: this.top, scaleY: 1, alpha: 1, duration: 400, ease: 'Back.easeOut', onComplete: () => { this.ready = true; } });
    });
    const [min, max] = this.def.amount;
    const double = Math.random() < game.skills.doubleChance('delven');
    const n = (min + Math.floor(Math.random() * (max - min + 1))) * (double ? 2 : 1) + game.mods.extra(`yield.${this.def.item}`);
    return { skill: 'delven', item: this.def.item, amount: n, double };
  }

  serialize() {
    return { type: this.type, node: this.node, gx: this.gx, gy: this.gy };
  }

  destroy() {
    for (const o of [this.sprite, this.top, this.shadow, this.chips]) o.destroy();
  }
}

// Een stenen tablet met een stukje verhaal
export class Note {
  constructor(scene, gx, gy, data) {
    this.scene = scene;
    this.type = 'note';
    this.note = data.note;
    this.label = 'LEES';
    this.gx = gx;
    this.gy = gy;
    this.radius = 0.15;
    const s = gridToScreen(gx, gy);
    this.sprite = scene.add.image(s.x, s.y, 'note').setOrigin(NOTE.ox / NOTE.w, NOTE.oy / NOTE.h).setDepth(s.y);
    this.glow = scene.add.image(s.x, s.y - 30, 'glow').setTint(0xe8e0c0).setAlpha(0.3).setScale(0.6).setDepth(s.y - 1);
    scene.tweens.add({ targets: this.glow, alpha: 0.1, duration: 1300, yoyo: true, repeat: -1 });
    this.topY = s.y - 64;
    this.hitY = s.y - 30;
    this.lightY = s.y - 30;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 28, s.y - 70, 56, 80);
  }

  act() {
    return { readNote: this.note };
  }

  serialize() {
    return { type: this.type, note: this.note, gx: this.gx, gy: this.gy };
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.glow);
    this.sprite.destroy();
    this.glow.destroy();
  }
}

// Het hart van de oude wereld
export class KernCore {
  constructor(scene, gx, gy) {
    this.scene = scene;
    this.type = 'kern';
    this.gx = gx;
    this.gy = gy;
    this.radius = 0.45;
    const s = gridToScreen(gx, gy);
    this.shadow = scene.add.image(s.x, s.y + 6, 'shadow').setScale(2.2, 1.8).setDepth(-5000);
    this.sprite = scene.add.image(s.x, s.y, 'kern').setOrigin(KERN.ox / KERN.w, KERN.oy / KERN.h).setDepth(s.y);
    this.glow = scene.add.image(s.x, s.y - 110, 'glow').setTint(0x9b6bff).setAlpha(0.5).setScale(2.4).setDepth(s.y - 1);
    scene.tweens.add({ targets: this.glow, alpha: 0.25, scale: 2.1, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.topY = s.y - 160;
    this.hitY = s.y - 110;
    this.lightY = s.y - 110;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 70, s.y - 150, 140, 170);
  }

  get label() {
    const g = this.scene;
    if (g.boss?.alive) return null;
    return g.flags?.bossDefeated ? 'KERN' : 'WEK';
  }

  act() {
    return { kern: this };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy };
  }

  destroy() {
    this.sprite.destroy();
    this.glow.destroy();
    this.shadow.destroy();
  }
}

