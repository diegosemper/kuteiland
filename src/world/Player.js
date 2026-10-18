// De speler: beweging, botsing, loopanimatie en een hak-beweging.
import { CONFIG } from '../config.js';
import { gridToScreen, screenVecToGrid } from '../iso.js';
import { PLAYER } from '../art/character.js';

const FRAME_MS = 105;

export class Player {
  constructor(scene, gx, gy) {
    this.scene = scene;
    this.gx = gx;
    this.gy = gy;
    this.moving = false;
    this.walkTime = 0;

    this.shadow = scene.add.image(0, 0, 'shadow').setScale(0.55).setDepth(-5000);
    this.sprite = scene.add.image(0, 0, 'player_idle').setOrigin(PLAYER.footX / PLAYER.w, PLAYER.footY / PLAYER.h);
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
      this.walkTime += dt * (0.6 + 0.4 * mag);
      this.sprite.setTexture(`player_walk${Math.floor(this.walkTime / FRAME_MS) % PLAYER.walkFrames}`);
    } else {
      this.sprite.setTexture('player_idle');
    }

    this.sync();
    return hitEdge;
  }

  sync() {
    const s = gridToScreen(this.gx, this.gy);
    const bob = this.moving ? -Math.abs(Math.sin(this.walkTime / FRAME_MS / PLAYER.walkFrames * Math.PI * 2)) * 2 : 0;
    this.sprite.setPosition(s.x, s.y + bob).setDepth(s.y);
    this.shadow.setPosition(s.x, s.y);
  }

  faceTowards(screenX) {
    this.sprite.flipX = screenX < this.sprite.x;
  }

  swing() {
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.angle = 0;
    this.scene.tweens.add({
      targets: this.sprite,
      angle: this.sprite.flipX ? -12 : 12,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }
}
