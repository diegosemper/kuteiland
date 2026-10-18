// Korte meldingen bovenin het scherm, één tegelijk, in volgorde.
// Een dringende melding schuift alles opzij en verschijnt meteen.
import { CONFIG } from '../config.js';
import { storyStyle, shade } from './style.js';

export class Toast {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.busy = false;
    this.chain = null;
    this.text = shade(scene.add.text(0, 0, '', storyStyle(scene.S, 17, '#ece3f7', { align: 'center' })), scene.S)
      .setOrigin(0.5, 0).setAlpha(0).setDepth(50);
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.text.setPosition(w / 2, safe.top + 118 * S);
    this.text.setWordWrapWidth(w - 56 * S);
  }

  show(message, urgent = false) {
    if (urgent) {
      this.queue = [message];
      const old = this.chain;
      this.chain = null;
      old?.stop();
      this.next();
      return;
    }
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
    // bij een lange rij gaan meldingen sneller
    const hold = this.queue.length > 1 ? CONFIG.ui.messageMs * 0.7 : CONFIG.ui.messageMs;
    const chain = this.scene.tweens.chain({
      targets: this.text,
      tweens: [
        { alpha: 1, duration: 300 },
        { alpha: 1, duration: hold },
        { alpha: 0, duration: 500 },
      ],
      onComplete: () => { if (this.chain === chain) this.next(); },
    });
    this.chain = chain;
  }
}
