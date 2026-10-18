// Verdediging tegen de nacht: muur, lamp (gewoon of kristal) en wachttoren.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { WALL, LAMP, TOWER, TRAP } from '../art/defenses.js';
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
  constructor(scene, gx, gy, data = {}) {
    this.type = 'wall';
    this.label = null;
    this.radius = CONFIG.defenses.wall.radius;
    const s = place(this, scene, gx, gy, 'wall', WALL, { shadow: 1.3 });
    this.topY = s.y - 60;
    this.hitY = s.y - 30;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 60, s.y - 70, 120, 100);
    addHealth(this, scene, CONFIG.defenses.wall.hp, s.y - 72);
    if (data.hp) this.setHp(data.hp);
  }

  act() {
    return { message: TEXT.wallTouch };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy, hp: this.hp < this.maxHp ? Math.ceil(this.hp) : undefined };
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
    if (data.hp) this.setHp(data.hp);
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
    return { type: this.type, gx: this.gx, gy: this.gy, crystal: this.crystal || undefined, hp: this.hp < this.maxHp ? Math.ceil(this.hp) : undefined };
  }

  destroy() {
    destroyAll(this);
  }
}

export class Tower {
  constructor(scene, gx, gy, data = {}) {
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
    if (data.hp) this.setHp(data.hp);
    this.nextShotAt = 0;
  }

  act() {
    return { message: TEXT.towerTouch };
  }

  serialize() {
    return { type: this.type, gx: this.gx, gy: this.gy, hp: this.hp < this.maxHp ? Math.ceil(this.hp) : undefined };
  }

  destroy() {
    destroyAll(this);
  }
}

// Val: plat op de grond, wezens lopen er gewoon overheen. Spijkers prikken (en slijten), een mijn ontploft.
export class Trap {
  constructor(scene, gx, gy, data = {}) {
    this.scene = scene;
    this.type = 'trap';
    this.kind = data.kind;
    this.def = CONFIG.defenses[this.kind];
    this.radius = 0.05;
    this.gx = gx;
    this.gy = gy;
    const s = gridToScreen(gx, gy);
    this.sprite = scene.add.image(s.x, s.y, `trap_${this.kind}`).setOrigin(TRAP.ox / TRAP.w, TRAP.oy / TRAP.h).setDepth(s.y - 40);
    this.topY = s.y - 30;
    this.hitY = s.y - 10;
    this.hitArea = new Phaser.Geom.Rectangle(s.x - 40, s.y - 30, 80, 50);
    this.charges = data.charges ?? this.def.charges ?? 1;
    this.nextAt = 0;
    this.draw();
  }

  get broken() {
    return this.kind === 'spikes' && this.charges <= 0;
  }

  get label() {
    return this.broken && !this.scene.dayNight?.isNight ? 'HERSTEL' : null;
  }

  draw() {
    this.sprite.setAlpha(this.broken ? 0.45 : 1);
  }

  act(game) {
    if (this.broken && !game.dayNight.isNight) return { repairDefense: this };
    return { message: TEXT.trapTouch };
  }

  // voor herstellen: hoe kapot is hij (0..1)
  get missing() {
    return this.kind === 'spikes' ? 1 - this.charges / this.def.charges : 0;
  }

  healFull() {
    this.charges = this.def.charges;
    this.draw();
  }

  serialize() {
    return { type: this.type, kind: this.kind, gx: this.gx, gy: this.gy, charges: this.charges };
  }

  destroy() {
    this.sprite.destroy();
  }
}
