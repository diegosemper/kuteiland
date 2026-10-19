// Het leegtebeest: volgt je overal, groeit als je het voert en helpt in minigames en 's nachts.
import { CONFIG } from '../config.js';
import { gridToScreen } from '../iso.js';

const P = () => CONFIG.pet;

export function petLevel(xp) {
  const t = P().xpFor;
  let lvl = 1;
  for (let l = 2; l < t.length; l++) if (xp >= t[l]) lvl = l;
  return lvl;
}

// alle effecten tot en met dit niveau
export function petPerks(level) {
  const out = {};
  for (let l = 2; l <= level; l++) Object.assign(out, P().perks[l] || {});
  delete out.short;
  return out;
}

export class Pet {
  constructor(scene, data) {
    this.scene = scene;
    this.data = data;              // { name, xp, fav } (zit in game.flags.pet)
    this.gx = scene.player.gx - 0.6;
    this.gy = scene.player.gy + 0.6;
    this.radius = 0.2;
    this.type = 'pet';
    this.label = null;
    this.shadow = scene.add.image(0, 0, 'shadow').setScale(0.45).setDepth(-5000);
    this.sprite = scene.add.image(0, 0, this.textureKey).setOrigin(0.5, 1);
    this.bob = 0;
    this.nextBiteAt = 0;
    this.applyLook();
    this.sync();
  }

  get level() {
    return petLevel(this.data.xp || 0);
  }

  get textureKey() {
    const l = this.level;
    return l >= 8 ? 'pet_l' : l >= 4 ? 'pet_m' : 'pet_s';
  }

  get topY() {
    return this.sprite.y - this.sprite.displayHeight - 10;
  }

  get hitY() {
    return this.sprite.y - this.sprite.displayHeight / 2;
  }

  get hitArea() {
    const w = this.sprite.displayWidth + 30;
    const h = this.sprite.displayHeight + 30;
    return new Phaser.Geom.Rectangle(this.sprite.x - w / 2, this.sprite.y - h + 10, w, h);
  }

  // ander uiterlijk per groeistadium, maar altijd even groot
  applyLook() {
    this.sprite.setTexture(this.textureKey);
    this.sprite.setScale(CONFIG.pet.height / this.sprite.height);
  }

  sync() {
    const s = gridToScreen(this.gx, this.gy);
    this.sprite.setPosition(s.x, s.y + Math.sin(this.bob) * 3).setDepth(s.y);
    this.shadow.setPosition(s.x, s.y);
  }

  update(time, dt) {
    const p = this.scene.player;
    // blijft een stukje achter je hangen
    const tx = p.gx - 0.7, ty = p.gy + 0.5;
    const dx = tx - this.gx, dy = ty - this.gy;
    const d = Math.hypot(dx, dy);
    if (d > 0.15) {
      const speed = d > 3 ? d * 3 : 3.2;
      const step = Math.min(d, speed * dt / 1000);
      this.gx += dx / d * step;
      this.gy += dy / d * step;
      this.sprite.setFlipX(gridToScreen(dx, dy).x < 0);
    }
    this.bob += dt / (d > 0.15 ? 90 : 300);
    this.sync();
  }

  act() {
    return { openPet: true };
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
