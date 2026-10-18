// Dag en nacht. De klok loopt alleen als het spel open is.
import { CONFIG } from '../config.js';
import { bus } from '../bus.js';

const D = CONFIG.dayNight;
const CYCLE = D.dayMs + D.nightMs;

const smooth = (x) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

export class DayNight {
  constructor(saved = {}) {
    this.t = Math.max(0, Math.min(CYCLE - 1, Number(saved.t) || 0));
    this.day = Math.max(1, Number(saved.day) || 1);
    this.warned = this.t > D.dayMs - D.warnBeforeMs;
  }

  get isNight() {
    return this.t >= D.dayMs;
  }

  // nummer van de (komende) nacht = nummer van de dag
  get night() {
    return this.day;
  }

  // 0..1 voortgang van de huidige fase
  get phaseProgress() {
    return this.isNight ? (this.t - D.dayMs) / D.nightMs : this.t / D.dayMs;
  }

  get phaseLeftMs() {
    return this.isNight ? CYCLE - this.t : D.dayMs - this.t;
  }

  // hoe donker het is: 0 = volle dag, 1 = diepe nacht
  get darkness() {
    if (this.isNight) return 1;
    const toNight = D.dayMs - this.t;
    if (toNight < D.duskMs) return smooth(1 - toNight / D.duskMs);
    if (this.day > 1 && this.t < D.dawnMs) return smooth(1 - this.t / D.dawnMs);
    return 0;
  }

  update(dt) {
    const wasNight = this.isNight;
    this.t += dt;
    if (!this.warned && !this.isNight && this.t >= D.dayMs - D.warnBeforeMs) {
      this.warned = true;
      bus.emit('dusk', this.night);
    }
    if (this.t >= CYCLE) {
      this.t -= CYCLE;
      this.day++;
      this.warned = false;
      bus.emit('day-start', this.day);
    } else if (!wasNight && this.isNight) {
      bus.emit('night-start', this.night);
    }
  }

  toJSON() {
    return { t: Math.round(this.t), day: this.day };
  }
}
