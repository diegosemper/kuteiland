// Korte meldingen bovenin het scherm, één tegelijk, in volgorde.
import { CONFIG } from '../config.js';
import { textStyle } from './style.js';

export class Toast {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.busy = false;
    this.text = scene.add.text(0, 0, '', textStyle(scene.S, 15, '#d9cdea', {
      align: 'center',
      stroke: '#0b0612',
      strokeThickness: Math.round(4 * scene.S),
    })).setOrigin(0.5, 0).setAlpha(0).setDepth(50);
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.text.setPosition(w / 2, safe.top + 64 * S);
    this.text.setWordWrapWidth(w - 48 * S);
  }

  show(message) {
    // dezelfde melding niet twee keer achter elkaar opstapelen
    if (this.queue[this.queue.length - 1] === message) return;
    this.queue.push(message);
    if (!this.busy) this.next();
  }

  next() {
    const message = this.queue.shift();
    if (message === undefined) {
      this.busy = false;
      return;
    }
    this.busy = true;
    this.text.setText(message).setAlpha(0);
    const scene = this.scene;
    scene.tweens.chain({
      targets: this.text,
      tweens: [
        { alpha: 1, duration: 250 },
        { alpha: 1, duration: CONFIG.ui.messageMs },
        { alpha: 0, duration: 400 },
      ],
      onComplete: () => this.next(),
    });
  }
}
