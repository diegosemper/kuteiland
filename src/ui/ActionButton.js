// Actieknop rechtsonder. Het label past zich aan aan wat er voor de speler staat.
import { CONFIG } from '../config.js';
import { COLORS, textStyle, shade } from './style.js';

export class ActionButton {
  constructor(scene) {
    this.scene = scene;
    const S = scene.S;
    this.R = CONFIG.ui.actionRadius * S;
    this.held = false;
    this.pointerId = null;
    this.onPress = null;

    this.circle = scene.add.circle(0, 0, this.R, COLORS.button, 0.7);
    this.ring = scene.add.circle(0, 0, this.R - 5 * S, 0x000000, 0);
    this.text = shade(scene.add.text(0, 0, '', textStyle(S, 15, COLORS.text, { fontStyle: '700' })).setOrigin(0.5), S);
    // ruimer raakvlak dan de cirkel, duimen zijn niet precies
    this.zone = scene.add.zone(0, 0, this.R * 2.6, this.R * 2.6).setInteractive();

    this.zone.on('pointerdown', (pointer) => {
      this.held = true;
      this.pointerId = pointer.id;
      this.circle.setScale(0.92);
      this.ring.setScale(0.92);
      this.onPress?.();
    });
    const up = (pointer) => {
      if (pointer.id !== this.pointerId) return;
      this.release();
    };
    scene.input.on('pointerup', up);
    scene.input.on('pointerupoutside', up);

    this.setLabel(null);
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    const x = w - safe.right - this.R - 32 * S;
    const y = h - safe.bottom - this.R - 50 * S;
    for (const o of [this.circle, this.ring, this.text, this.zone]) o.setPosition(x, y);
  }

  setLabel(label) {
    const S = this.scene.S;
    const active = !!label;
    this.text.setText(label || '').setAlpha(active ? 1 : 0.5);
    this.circle.setStrokeStyle(2 * S, COLORS.accent, active ? 0.7 : 0.25);
    this.ring.setStrokeStyle(1 * S, COLORS.accent, active ? 0.25 : 0.08);
  }

  release() {
    this.held = false;
    this.pointerId = null;
    this.circle.setScale(1);
    this.ring.setScale(1);
  }
}
