// Alle blijvende bonussen bij elkaar: collectie-niveaus, skill-mijlpalen en prestige.
// Sleutels: 'yield.<item>', 'double.<skill>', 'xp.<skill>', 'drift.rate', 'drift.loot',
//           'hp', 'damage', 'anchor', 'free'
import { CONFIG } from '../config.js';
import { bus } from '../bus.js';
import { bonus } from './Meta.js';

export const COLLECTION_IDS = Object.keys(CONFIG.collections.items);

export function thresholdsFor(id) {
  return id === 'wezens' ? CONFIG.collections.thresholdsWezens : CONFIG.collections.thresholds;
}

// Hoeveel niveaus van deze collectie heb je bij dit aantal?
export function tierFor(id, count) {
  return thresholdsFor(id).filter((t) => count >= t).length;
}

export class Mods {
  constructor(game) {
    this.game = game;
    this.cache = null;
    const reset = () => { this.cache = null; };
    bus.on('skill-up', reset);
    game.events.once('shutdown', () => bus.off('skill-up', reset));
  }

  invalidate() {
    this.cache = null;
  }

  compute() {
    const sum = {};
    const add = (mod) => { for (const [k, v] of Object.entries(mod || {})) sum[k] = (sum[k] || 0) + v; };
    const g = this.game;
    // collecties
    for (const id of COLLECTION_IDS) {
      const tier = tierFor(id, g.stats.collected?.[id] || 0);
      CONFIG.collections.items[id].slice(0, tier).forEach((r) => add(r.mod));
    }
    // mijlpalen van skills
    for (const [id, def] of Object.entries(CONFIG.skills)) {
      const level = g.skills.level(id);
      for (const [at, m] of Object.entries(def.milestones || {})) if (level >= Number(at)) add(m.mod);
    }
    // prestige
    add({ damage: bonus('schade'), hp: bonus('hart'), anchor: bonus('anker'), 'drift.loot': bonus('buit') });
    return sum;
  }

  get(key) {
    if (!this.cache) this.cache = this.compute();
    return this.cache[key] || 0;
  }

  // Extra stuks bij een opbrengst: het hele deel zeker, de rest als kans (0,25 = 25% kans op 1 extra)
  extra(key) {
    const v = this.get(key);
    return Math.floor(v) + (Math.random() < v - Math.floor(v) ? 1 : 0);
  }
}
