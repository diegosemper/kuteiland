// De speler: beweging, botsing en een simpele hak-animatie.
import { CONFIG } from '../config.js';
import { gridToScreen, screenVecToGrid } from '../iso.js';

export class Player {
  constructor(scene, gx, gy) {
    this.scene = scene;
    this.gx = gx;
    this.gy = gy;
    this.moving = false;
    this.walkTime = 0;

    this.shadow = scene.add.image(0, 0, 'shadow').setDepth(-5000);
    this.sprite = scene.add.image(0, 0, 'player').setOrigin(0.5, 1);
    this.sync();
  }

  // move: richting op het scherm. world: heeft tryMove(fromGx, fromGy, toGx, toGy).
  // Geeft true terug als de speler tegen de rand van het eiland liep.
  update(dt, move, world) {
    const mag = Math.min(1, Math.hypot(move.x, move.y));
    this.moving = mag > 0.15;
    let hitEdge = false;

    if (this.moving) {
      const g = screenVecToGrid(move.x, move.y);
      const len = Math.hypot(g.gx, g.gy) || 1;
      const step = CONFIG.player.speed * mag * dt / 1000;
      const dx = g.gx / len * step;
      const dy = g.gy / len * step;

      // Per as bewegen, zodat je langs randen en obstakels glijdt
      const rx = world.tryMove(this.gx, this.gy, this.gx + dx, this.gy);
      if (rx.ok) this.gx += dx; else if (rx.edge) hitEdge = true;
      const ry = world.tryMove(this.gx, this.gy, this.gx, this.gy + dy);
      if (ry.ok) this.gy += dy; else if (ry.edge) hitEdge = true;

      if (move.x < -0.1) this.sprite.flipX = true;
      else if (move.x > 0.1) this.sprite.flipX = false;
      this.walkTime += dt;
    }

    this.sync();
    return hitEdge;
  }

  sync() {
    const s = gridToScreen(this.gx, this.gy);
    const bob = this.moving ? -Math.round(Math.abs(Math.sin(this.walkTime * 0.012)) * 1.5) : 0;
    this.sprite.setPosition(s.x, s.y + bob).setDepth(s.y);
    this.shadow.setPosition(s.x, s.y);
  }

  get screen() {
    return gridToScreen(this.gx, this.gy);
  }

  faceTowards(screenX) {
    this.sprite.flipX = screenX < this.sprite.x;
  }

  swing() {
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.angle = 0;
    this.scene.tweens.add({
      targets: this.sprite,
      angle: this.sprite.flipX ? -18 : 18,
      duration: 70,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }
}
