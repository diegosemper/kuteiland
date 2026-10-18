// De Stem: luistert naar wat er gebeurt en zegt er af en toe iets van. Niet te vaak (globale en
// per-soort afkoeltijd, en een kans), en het verhaal komt één keer per stukje, op het goede moment.
import { CONFIG } from '../config.js';
import { VOICE } from '../voice.js';
import { bus } from '../bus.js';
import { getAudio } from './Audio.js';
import { getMeta } from './Meta.js';

const lastLine = new Map();

// Kies een regel, liefst niet dezelfde als de vorige keer
function pickLine(list, vars = {}) {
  if (!list?.length) return null;
  const prev = lastLine.get(list);
  let line = list[Math.floor(Math.random() * list.length)];
  if (list.length > 1 && line === prev) line = list[(list.indexOf(line) + 1) % list.length];
  lastLine.set(list, line);
  return line.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function voiceEnabled() {
  return getAudio().settings.voice !== false;
}

// Commentaar op het resultaatscherm van een minigame
export function minigameQuip(key, res, record) {
  if (!voiceEnabled()) return null;
  const M = VOICE.mg;
  const total = Object.values(res.items || {}).reduce((a, b) => a + b, 0);
  if (key === 'afdaling') return pickLine(res.lost ? M.afdalingLost : (total ? M.afdalingSafe : M.nothing));
  if (record) return pickLine(M.record);
  if (!total) return pickLine(M.nothing);
  if (Math.random() < 0.45 && M[key]) return pickLine(M[key]);
  return pickLine(res.good ? M.good : M.bad);
}

// Wanneer komt welk stukje verhaal (in deze volgorde gecontroleerd)
const STORY = [
  ['hallo', (g) => g.time.now > 25000],
  ['werkbank', (g) => g.countObjects('workbench') >= 1],
  ['eersteNacht', (g) => (g.stats.nightsWon || 0) >= 1],
  ['magneet', (g) => g.objects.some((o) => o.type === 'source' && o.kind === 'magneet')],
  ['boor', (g) => g.objects.some((o) => o.type === 'source' && o.kind === 'boor')],
  ['ontdekking', (g) => g.discoveryCount >= 1],
  ['ketel', (g) => g.objects.some((o) => o.type === 'source' && o.kind === 'ketel')],
  ['antenne', (g) => g.objects.some((o) => o.type === 'source' && o.kind === 'antenne')],
  ['altaar', (g) => g.countObjects('altar') >= 1],
  ['tiendeDag', (g) => g.dayNight.day >= 10],
  ['zegels', (g) => g.sealCount >= CONFIG.kernSeals],
  ['hoeder', (g) => !!g.flags.bossDefeated],
  ['cyclus', () => getMeta().cycle > 1],
];

export class Voice {
  constructor(game) {
    this.game = game;
    game.flags.voice = { ...game.flags.voice };
    this.lastAt = -1e9;
    this.catAt = {};
    this.nextStoryCheck = 0;
    this.lastActionAt = 0;
    this.idleSaid = false;

    const on = (ev, fn) => { bus.on(ev, fn); this.offs.push(() => bus.off(ev, fn)); };
    this.offs = [];
    on('player-died', () => {
      const d = game.stats.deaths || 0;
      this.react(d >= 3 && d % 2 ? 'diedMany' : 'died', { deaths: d }, { chance: 0.8, cooldown: 0 });
    });
    on('crafted', (r) => {
      if (r.gives.tool) this.react('craftTool', { name: CONFIG.tools[r.gives.tool][r.gives.tier] }, { chance: 0.5 });
    });
    on('placed', (info) => {
      if (['roestmagneet', 'kristalboor', 'zwavelketel', 'sterrenantenne', 'zielenlantaarn'].includes(info.item)) this.react('placeSource', {}, { chance: 0.6 });
    });
    on('discovery', (d) => this.react('discovery', { name: d.name }, { chance: 0.7 }));
    on('skill-up', () => this.react('skillUp', {}, { chance: 0.15, cooldown: 120000 }));
    on('siege', (st) => { if (st.state === 'prep') this.react('nightStart', { n: game.dayNight.night }, { chance: 0.35 }); });
    on('siege-won', (n) => this.react('siegeWon', { n }, { chance: 0.6 }));
    on('boss-start', () => this.react('bossStart', {}, { chance: 0.7, cooldown: 0 }));
    on('boss-end', () => this.react('bossDown', {}, { chance: 0.6, cooldown: 0 }));
    on('repaired', () => this.react('repaired', {}, { chance: 0.25, cooldown: 90000 }));
    on('collection-up', () => this.react('collection', {}, { chance: 0.25, cooldown: 120000 }));
    game.events.once('shutdown', () => this.offs.forEach((f) => f()));
  }

  // iets zeggen (door de UI getoond)
  say(text) {
    if (!text || !voiceEnabled()) return;
    this.lastAt = this.game.time.now;
    bus.emit('voice', text);
    bus.emit('sfx', 'voice');
  }

  react(cat, vars = {}, { chance = 0.5, cooldown = 45000 } = {}) {
    const now = this.game.time.now;
    if (this.game.minigame) return;
    if (now - this.lastAt < CONFIG.voice.globalCooldownMs) return;
    if (now - (this.catAt[cat] ?? -1e9) < cooldown) return;
    if (Math.random() > chance) return;
    this.catAt[cat] = now;
    this.say(pickLine(VOICE[cat], vars));
  }

  // speler deed iets (voor de niksdoen-opmerking)
  poke() {
    this.lastActionAt = this.game.time.now;
    this.idleSaid = false;
  }

  update(time) {
    const g = this.game;
    if (g.minigame || g.dead) return;
    if (time >= this.nextStoryCheck) {
      this.nextStoryCheck = time + 2000;
      for (const [id, when] of STORY) {
        if (g.flags.voice[id]) continue;
        if (!when(g)) continue;
        // verhaal gaat voor, maar niet midden in een andere zin
        if (time - this.lastAt < 6000) break;
        g.flags.voice[id] = true;
        this.say(VOICE.story[id]);
        break;
      }
    }
    if (!this.idleSaid && !g.dayNight.isNight && time - this.lastActionAt > CONFIG.voice.idleMs && time > 60000) {
      this.idleSaid = true;
      this.react('idle', {}, { chance: 0.7, cooldown: 0 });
    }
  }
}
