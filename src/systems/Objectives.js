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
  { id: 'anker', done: (g) => g.countObjects('anchor') >= 1 },
  { id: 'herstel', done: (g) => (g.stats.repairs || 0) >= 1 || g.countObjects('anchor') >= 2 },
  { id: 'kristal', progress: (g) => [g.stats.crystals || 0, 3] },
  { id: 'steen', done: (g) => g.tools.pickaxe >= 2 || g.tools.axe >= 2 },
  { id: 'hakken3', progress: (g) => [g.skills.level('hakken'), 3] },
  { id: 'collectie', progress: (g) => [Math.floor(g.stats.collected.wrakhout || 0), 100] },
  { id: 'grijphaak', done: (g) => (g.tools.hook || 0) >= 1 },
  { id: 'magneet', done: (g) => g.objects.some((o) => o.type === 'source' && o.kind === 'magneet') },
  { id: 'roest', progress: (g) => [g.stats.roest || 0, 10] },
  { id: 'roestgereedschap', done: (g) => g.tools.pickaxe >= 3 || g.tools.axe >= 3 },
  { id: 'toren', done: (g) => g.countObjects('tower') >= 1 },
  { id: 'groter', progress: (g) => [g.stats.tilesPlaced || 0, 12] },
  { id: 'boor', done: (g) => g.objects.some((o) => o.type === 'source' && o.kind === 'boor') },
  { id: 'afdaling', progress: (g) => [g.stats.highscores?.afdaling || 0, 100] },
  { id: 'ontdekking', progress: (g) => [g.discoveryCount, 1] },
  { id: 'anker2', done: (g) => g.objects.some((o) => o.type === 'anchor' && o.tier >= 2) },
  { id: 'harnas', done: (g) => (g.tools.armor || 0) >= 1 },
  { id: 'bewoner', done: (g) => g.countObjects('castaway') >= 1 },
  { id: 'voeren', done: (g) => (g.flags.pet?.level || 0) >= 2 },
  { id: 'nacht3', progress: (g) => [g.stats.nights || 0, 3] },
  { id: 'ontdekking3', progress: (g) => [g.discoveryCount, 3] },
  { id: 'skill5', progress: (g) => [Math.max(...['hakken', 'delven', 'bouwen'].map((s) => g.skills.level(s))), 5] },
  { id: 'ketel', done: (g) => g.objects.some((o) => o.type === 'source' && o.kind === 'ketel') },
  { id: 'zwavel', progress: (g) => [Math.floor(g.stats.collected.zwavel || 0), 15] },
  { id: 'antenne', done: (g) => g.objects.some((o) => o.type === 'source' && o.kind === 'antenne') },
  { id: 'sterrenstof', progress: (g) => [g.stats.sterrenstof || 0, 4] },
  { id: 'altaar', done: (g) => g.countObjects('altar') >= 1 },
  { id: 'bewaker', done: (g) => (g.stats.guardianKills || 0) >= 1 },
  { id: 'aambeeld', done: (g) => Object.values(g.upgrades || {}).some((v) => v >= 1) },
  { id: 'machine', done: (g) => g.countObjects('machine') >= 1 },
  { id: 'zielenlantaarn', done: (g) => g.objects.some((o) => o.type === 'source' && o.kind === 'lantaarn') },
  { id: 'zegels', progress: (g) => [g.sealCount, 4] },
  { id: 'hartkern', done: (g) => g.countObjects('kern') >= 1 || !!g.flags.bossDefeated },
  { id: 'hoeder', done: (g) => !!g.flags.bossDefeated },
  { id: 'poort', done: (g) => g.countObjects('portal') >= 1 },
  { id: 'diepte5', progress: (g) => [g.stats.bestDepth || 0, 5] },
  { id: 'diepte20', progress: (g) => [g.stats.bestDepth || 0, 20] },
  { id: 'cyclus', done: () => false },
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
