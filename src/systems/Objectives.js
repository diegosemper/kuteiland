// Doelen: één opdracht tegelijk, leidt de speler door de eerste minuut en verder.
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';

// progress: [huidig, nodig]  of  done: true/false
const LIST = [
  { id: 'hout', progress: (g) => [g.stats.wood, 4] },
  { id: 'werkbank', done: (g) => (g.stats.crafted.werkbank || 0) >= 1 },
  { id: 'werkbank_zetten', done: (g) => g.countObjects('workbench') >= 1 },
  { id: 'houweel', done: (g) => g.tools.pickaxe >= 1 },
  { id: 'blok', done: (g) => (g.stats.tilesPlaced || 0) >= 1 },
  { id: 'generator', done: (g) => g.countObjects('generator') >= 1 },
  { id: 'puin', progress: (g) => [g.stats.puin || 0, 5] },
  { id: 'steen', done: (g) => g.tools.pickaxe >= 2 || g.tools.axe >= 2 },
  { id: 'groter', progress: (g) => [g.stats.tilesPlaced || 0, 8] },
];

export class Objectives {
  constructor(game, index = 0) {
    this.game = game;
    this.index = index;
  }

  get current() {
    return LIST[this.index] || null;
  }

  // Tekst en voortgang voor de HUD
  describe() {
    const o = this.current;
    if (!o) return { text: TEXT.objectivesDone, progress: null };
    const progress = o.progress ? o.progress(this.game) : null;
    return {
      text: TEXT.objectives[o.id],
      progress: progress ? `${Math.min(progress[0], progress[1])}/${progress[1]}` : null,
    };
  }

  isDone(o) {
    if (o.progress) {
      const [cur, need] = o.progress(this.game);
      return cur >= need;
    }
    return o.done(this.game);
  }

  // Controleer en schuif door; meldt elk behaald doel
  check() {
    let changed = false;
    while (this.current && this.isDone(this.current)) {
      bus.emit('message', TEXT.objectiveDone[this.current.id], true);
      this.index++;
      changed = true;
    }
    const desc = this.describe();
    const sig = desc.text + desc.progress;
    if (changed || sig !== this.lastSig) {
      this.lastSig = sig;
      bus.emit('objective', { ...desc, advanced: changed });
    }
  }
}
