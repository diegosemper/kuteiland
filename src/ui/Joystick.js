// Joystick linksonder. Je mag overal in de linkeronderhelft beginnen te slepen;
// de joystick springt dan naar je duim en keert terug zodra je loslaat.
import { CONFIG } from '../config.js';
import { COLORS } from './style.js';

export class Joystick {
  constructor(scene) {
    this.scene = scene;
    const S = scene.S;
    this.R = CONFIG.ui.joystickRadius * S;
    this.base = scene.add.circle(0, 0, this.R, 0x000000, 0.25)
      .setStrokeStyle(2 * S, COLORS.accent, 0.3);
    this.thumb = scene.add.circle(0, 0, CONFIG.ui.joystickThumb * S, COLORS.accent, 0.3);

    this.pointerId = null;
    this.enabled = true;
    this.vector = { x: 0, y: 0 };
    this.center = { x: 0, y: 0 };
    this.home = { x: 0, y: 0 };

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.home = { x: safe.left + this.R + 28 * S, y: h - safe.bottom - this.R - 40 * S };
    if (this.pointerId === null) this.place(this.home.x, this.home.y);
  }

  place(x, y) {
    this.center = { x, y };
    this.base.setPosition(x, y);
    this.thumb.setPosition(x, y);
  }

  onDown(pointer, over) {
    if (!this.enabled || this.pointerId !== null || over.length) return;
    const { width: w, height: h } = this.scene.scale;
    if (pointer.x > w * 0.55 || pointer.y < h * 0.3) return;
    this.pointerId = pointer.id;
    this.place(pointer.x, pointer.y);
    this.setActive(true);
  }

  setActive(active) {
    this.base.setFillStyle(0x000000, active ? 0.4 : 0.25);
    this.thumb.setFillStyle(COLORS.accent, active ? 0.55 : 0.3);
  }

  onMove(pointer) {
    if (pointer.id !== this.pointerId) return;
    let dx = pointer.x - this.center.x;
    let dy = pointer.y - this.center.y;
    const len = Math.hypot(dx, dy);
    if (len > this.R) {
      dx = dx / len * this.R;
      dy = dy / len * this.R;
    }
    this.thumb.setPosition(this.center.x + dx, this.center.y + dy);
    this.vector = { x: dx / this.R, y: dy / this.R };
  }

  onUp(pointer) {
    if (pointer.id !== this.pointerId) return;
    this.release();
  }

  release() {
    this.pointerId = null;
    this.vector = { x: 0, y: 0 };
    this.setActive(false);
    this.place(this.home.x, this.home.y);
  }
}
