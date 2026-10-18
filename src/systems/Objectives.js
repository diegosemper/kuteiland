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
  { id: 'vang', progress: (g) => [g.stats.caught || 0, 3] },
  { id: 'wapen', done: (g) => (g.tools.weapon || 0) >= 1 },
  { id: 'lamp', done: (g) => g.countObjects('lamp') >= 1 },
  { id: 'generator', done: (g) => g.countObjects('generator') >= 1 },
  { id: 'puin', progress: (g) => [g.stats.puin || 0, 5] },
  { id: 'overleef', done: (g) => (g.stats.nights || 0) >= 1 },
  { id: 'kristal', progress: (g) => [g.stats.crystals || 0, 3] },
  { id: 'steen', done: (g) => g.tools.pickaxe >= 2 || g.tools.axe >= 2 },
  { id: 'hakken3', progress: (g) => [g.skills.level('hakken'), 3] },
  { id: 'roest', progress: (g) => [g.stats.roest || 0, 6] },
  { id: 'roestgereedschap', done: (g) => g.tools.pickaxe >= 3 || g.tools.axe >= 3 },
  { id: 'toren', done: (g) => g.countObjects('tower') >= 1 },
  { id: 'groter', progress: (g) => [g.stats.tilesPlaced || 0, 8] },
  { id: 'nacht3', progress: (g) => [g.stats.nights || 0, 3] },
  { id: 'skill5', progress: (g) => [Math.max(...['hakken', 'delven', 'bouwen'].map((s) => g.skills.level(s))), 5] },
];

// Fase 2 sloeg een nummer op in plaats van een naam
const LEGACY = ['hout', 'werkbank', 'werkbank_zetten', 'houweel', 'blok', 'generator', 'puin', 'steen', 'groter'];

export class Objectives {
  constructor(game, saved) {
    this.game = game;
    const id = typeof saved === 'number' ? LEGACY[saved] : saved;
    const i = LIST.findIndex((o) => o.id === id);
    this.index = i >= 0 ? i : (typeof saved === 'number' && saved >= LEGACY.length ? LIST.length : 0);
  }

  get current() {
    return LIST[this.index] || null;
  }

  get id() {
    return this.current ? this.current.id : 'klaar';
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
