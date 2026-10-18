// Wat de speler bij zich draagt. Stuurt 'change' (key, nieuwAantal, verschil) bij elke wijziging.
import { CONFIG } from '../config.js';

export class Inventory extends Phaser.Events.EventEmitter {
  constructor(saved = {}) {
    super();
    this.items = {};
    for (const k of Object.keys(CONFIG.items)) {
      this.items[k] = Math.max(0, Math.floor(Number(saved?.[k]) || 0));
    }
  }

  get(k) {
    return this.items[k] || 0;
  }

  has(k, n = 1) {
    return this.get(k) >= n;
  }

  add(k, n = 1) {
    this.items[k] = this.get(k) + n;
    this.emit('change', k, this.items[k], n);
  }

  remove(k, n = 1) {
    if (!this.has(k, n)) return false;
    this.items[k] -= n;
    this.emit('change', k, this.items[k], -n);
    return true;
  }

  toJSON() {
    return { ...this.items };
  }
}
