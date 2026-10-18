// Objecten van het latere spel: bewakersaltaar, de poort naar de Diepte, het aambeeld en machines.
import { CONFIG } from '../config.js';
import { ALTAR, PORTAL, ANVIL, MACHINE } from '../art/endgame.js';
import { gridToScreen } from '../iso.js';

function base(obj, scene, gx, gy, key, art, shadow = 1) {
  obj.scene = scene;
  obj.gx = gx;
  obj.gy = gy;
  const s = gridToScreen(gx, gy);
  obj.shadow = scene.add.image(s.x + 3, s.y + 4, 'shadow').setScale(shadow).setDepth(-5000);
  obj.sprite = scene.add.image(s.x, s.y, key).setOrigin(art.ox / art.w, art.oy / art.h).setDepth(s.y);
  return s;
}

// Altaar: roept de bewaker van dit eiland op
export class Altar {
  constructor(scene, gx, gy, data) {
    this.type = 'altar';
    this.boss = data.boss;
    this.def = CONFIG.bewakers[this.boss];
    this.radius = 0.32;
    const s = base(this, scene, gx, gy, 'altar', ALTAR, 1.1);
    this.sprite.setTint(0xffffff);
    this.glow = scene.add.image(s.x, s.y - 66, 'glow').setTint(this.def.tint).setAlpha(0.5).setScale(0.8).setDepth(s.y + 1);
    scene.tweens.add({ targets: this.glow, alpha: 0.2, duration: 1200, yoyo: true, repeat: -1 });
    this.topY = s.y - 100;
    this.hitY = s.y - 50;
    this.lightY = s.y - 60;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 45, s.y - 100, 90, 115);
  }

  get label() {
    return this.scene.boss?.alive ? null : 'ROEP';
  }

  act() {
    return { summon: this };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy, boss: this.boss };
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.glow);
    for (const o of [this.sprite, this.shadow, this.glow]) o.destroy();
  }
}

// Poort naar de Diepte, bij de Kern
export class Portal {
  constructor(scene, gx, gy) {
    this.type = 'portal';
    this.radius = 0.3;
    const s = base(this, scene, gx, gy, 'portal', PORTAL, 1.2);
    this.glow = scene.add.image(s.x, s.y - 60, 'glow').setTint(0x9b6bff).setAlpha(0.45).setScale(1.2, 1.6).setDepth(s.y - 1);
    scene.tweens.add({ targets: this.glow, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
    this.topY = s.y - 140;
    this.hitY = s.y - 60;
    this.lightY = s.y - 60;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 55, s.y - 140, 110, 155);
  }

  get label() {
    return this.scene.depth?.active ? 'STOP' : 'DIEPTE';
  }

  act() {
    return { portal: this };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy };
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.glow);
    for (const o of [this.sprite, this.shadow, this.glow]) o.destroy();
  }
}

// Aambeeld: gereedschap, wapen en harnas versterken
export class Anvil {
  constructor(scene, gx, gy) {
    this.type = 'anvil';
    this.label = 'SMEED';
    this.radius = 0.3;
    const s = base(this, scene, gx, gy, 'anvil', ANVIL, 0.9);
    this.topY = s.y - 50;
    this.hitY = s.y - 26;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 40, s.y - 50, 80, 65);
  }

  act() {
    return { openAnvil: true };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy };
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}

// Machine: maakt iets zolang het spel open is; tik om op te halen of te verbeteren
export class Machine {
  constructor(scene, gx, gy, data) {
    this.type = 'machine';
    this.machine = data.machine;
    this.def = CONFIG.machines.types[this.machine];
    this.tier = Math.max(1, Math.min(CONFIG.machines.maxTier, data.tier || 1));
    this.stored = Math.max(0, data.stored || 0);
    this.progress = 0;
    this.label = 'MACHINE';
    this.radius = 0.32;
    const s = base(this, scene, gx, gy, `machine_${this.machine}`, MACHINE, 1);
    this.topY = s.y - 70;
    this.hitY = s.y - 34;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 45, s.y - 75, 90, 90);
    this.bar = scene.add.graphics().setDepth(9e5);
    this.draw();
  }

  get capacity() {
    return Math.round(this.def.store * CONFIG.machines.storage[this.tier]);
  }

  get intervalMs() {
    return this.def.everyMs / CONFIG.machines.speed[this.tier];
  }

  // Elke frame: tijd optellen, iets maken als er plek is
  tick(dt) {
    if (this.stored >= this.capacity) return;
    this.progress += dt;
    while (this.progress >= this.intervalMs && this.stored < this.capacity) {
      this.progress -= this.intervalMs;
      this.stored++;
      this.scene.tweens.add({ targets: this.sprite, scaleY: { from: 0.94, to: 1 }, duration: 160 });
      this.draw();
    }
  }

  draw() {
    const b = this.bar;
    const w = 46, x = this.sprite.x - w / 2, y = this.topY - 6;
    b.clear();
    b.fillStyle(0x000000, 0.6);
    b.fillRect(x - 1, y - 1, w + 2, 6);
    const f = this.stored / this.capacity;
    b.fillStyle(f >= 1 ? 0xffd070 : 0x9be0a0, 1);
    b.fillRect(x, y, w * f, 4);
  }

  act() {
    return { openMachine: this };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy, machine: this.machine, tier: this.tier, stored: this.stored };
  }

  destroy() {
    for (const o of [this.sprite, this.shadow, this.bar]) o.destroy();
  }
}
