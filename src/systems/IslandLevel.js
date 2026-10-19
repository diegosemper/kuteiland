// Eilandniveau: één balk voor alles wat je doet. Elk niveau geeft een beloning; sommige niveaus
// ontgrendelen iets blijvends (speciale rondes, meer buit, extra levens in minigames).
import { CONFIG } from '../config.js';
import { bus } from '../bus.js';

const L = () => CONFIG.islandLevel;

// xp nodig om van niveau n naar n+1 te gaan
export function xpToNext(n) {
  return Math.round(L().base + L().grow * Math.pow(n - 1, L().exp));
}

// niveau en voortgang uit totale xp
export function levelFromXp(total) {
  let n = 1;
  let rest = total;
  while (n < L().max && rest >= xpToNext(n)) {
    rest -= xpToNext(n);
    n++;
  }
  return { level: n, cur: rest, need: xpToNext(n), max: n >= L().max };
}

// grondstoffenpakket bij elk niveau (groeit mee)
export function levelPack(n) {
  const items = { wrakhout: 10 + n * 4, puin: 6 + n * 3 };
  if (n >= 4) items.roest = 2 + n * 2;
  if (n >= 7) items.leegtekristal = 1 + Math.floor(n * 0.8);
  if (n >= 10) items.zwavel = Math.floor(n * 0.7);
  if (n >= 14) items.sterrenstof = Math.floor(n * 0.5);
  if (n >= 20) items.zielenkristal = Math.floor(n * 0.3);
  return items;
}

export class IslandLevel {
  constructor(game) {
    this.game = game;
    game.stats.islandXp = game.stats.islandXp || 0;
  }

  get info() {
    return levelFromXp(this.game.stats.islandXp);
  }

  get level() {
    return this.info.level;
  }

  // alle blijvende voordelen tot en met het huidige niveau
  get perks() {
    const out = { specialChance: 0, specialMult: 2, yield: 0, lives: 0 };
    for (const [lvl, r] of Object.entries(L().milestones)) {
      if (Number(lvl) > this.level) continue;
      if (r.specialChance) out.specialChance = r.specialChance;
      if (r.specialMult) out.specialMult = r.specialMult;
      if (r.yield) out.yield += r.yield;
      if (r.lives) out.lives += r.lives;
    }
    return out;
  }

  gain(amount, why) {
    if (!amount) return;
    const g = this.game;
    const before = this.level;
    g.stats.islandXp += Math.round(amount);
    bus.emit('island-xp', { amount: Math.round(amount), why, ...this.info });
    const after = this.level;
    for (let n = before + 1; n <= after; n++) this.levelUp(n);
  }

  levelUp(n) {
    const g = this.game;
    const pack = levelPack(n);
    for (const [k, v] of Object.entries(pack)) g.gainItem(k, v);
    const milestone = L().milestones[n] || null;
    bus.emit('sfx', 'levelUp');
    bus.emit('island-level', { level: n, pack, milestone });
    g.objectives.check();
    g.saveNow();
  }
}
