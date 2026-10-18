// Verdediging tegen de nacht: muur, lamp (gewoon of kristal) en wachttoren.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { WALL, LAMP, TOWER } from '../art/defenses.js';
import { gridToScreen } from '../iso.js';
import { addHealth } from './Health.js';

function place(obj, scene, gx, gy, key, art, opts = {}) {
  obj.scene = scene;
  obj.gx = gx;
  obj.gy = gy;
  const s = gridToScreen(gx, gy);
  obj.shadow = scene.add.image(s.x + 4, s.y + 5, 'shadow').setScale(opts.shadow || 1).setDepth(-5000);
  obj.sprite = scene.add.image(s.x, s.y, key).setOrigin(art.ox / art.w, art.oy / art.h).setDepth(s.y);
  return s;
}

function destroyAll(obj) {
  for (const k of ['sprite', 'shadow', 'healthBar', 'glow']) obj[k]?.destroy();
}

export class Wall {
  constructor(scene, gx, gy) {
    this.type = 'wall';
    this.label = null;
    this.radius = CONFIG.defenses.wall.radius;
    const s = place(this, scene, gx, gy, 'wall', WALL, { shadow: 1.3 });
    this.topY = s.y - 60;
    this.hitY = s.y - 30;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 60, s.y - 70, 120, 100);
    addHealth(this, scene, CONFIG.defenses.wall.hp, s.y - 72);
  }

  act() {
    return { message: TEXT.wallTouch };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy };
  }

  destroy() {
    destroyAll(this);
  }
}

export class Lamp {
  constructor(scene, gx, gy, data = {}) {
    this.type = 'lamp';
    this.crystal = !!data.crystal;
    this.def = this.crystal ? CONFIG.defenses.crystallamp : CONFIG.defenses.lamp;
    this.label = null;
    this.radius = this.def.radius;
    this.key = this.crystal ? 'crystallamp' : 'lamp';
    const s = place(this, scene, gx, gy, `${this.key}_off`, LAMP, { shadow: 0.5 });
    this.topY = s.y - 100;
    this.hitY = s.y - 60;
    this.lightY = s.y - 62;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 25, s.y - 125, 50, 135);
    addHealth(this, scene, this.def.hp, s.y - 132);
    this.lit = false;
  }

  setLit(lit) {
    if (lit === this.lit) return;
    this.lit = lit;
    this.sprite.setTexture(`${this.key}_${lit ? 'on' : 'off'}`);
  }

  act() {
    return { message: this.lit ? TEXT.lampLit : TEXT.lampDay };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy, crystal: this.crystal || undefined };
  }

  destroy() {
    destroyAll(this);
  }
}

export class Tower {
  constructor(scene, gx, gy) {
    this.type = 'tower';
    this.label = null;
    this.radius = CONFIG.defenses.tower.radius;
    const s = place(this, scene, gx, gy, 'tower', TOWER, { shadow: 1.1 });
    this.topY = s.y - 125;
    this.hitY = s.y - 60;
    this.aimY = s.y - 90;
    this.lightY = s.y - 90;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 45, s.y - 150, 90, 170);
    addHealth(this, scene, CONFIG.defenses.tower.hp, s.y - 160);
    this.nextShotAt = 0;
  }

  act() {
    return { message: TEXT.towerTouch };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy };
  }

  destroy() {
    destroyAll(this);
  }
}
