// Skills: XP verzamelen door te doen, levels met kleine, zichtbare bonussen.
import { CONFIG } from '../config.js';
import { bus } from '../bus.js';

export const SKILL_IDS = Object.keys(CONFIG.skills);

// XP nodig om van level L naar L+1 te gaan
export function xpNeeded(level) {
  const { base, growth } = CONFIG.skillCurve;
  return Math.round(base * growth ** level);
}

export class Skills {
  constructor(saved = {}) {
    this.xp = {};
    for (const id of SKILL_IDS) this.xp[id] = Math.max(0, Number(saved[id]) || 0);
  }

  // level, xp binnen dit level, xp nodig voor het volgende
  progress(id) {
    let rest = this.xp[id];
    let level = 0;
    while (level < CONFIG.skillCurve.max && rest >= xpNeeded(level)) {
      rest -= xpNeeded(level);
      level++;
    }
    const max = level >= CONFIG.skillCurve.max;
    return { level, cur: max ? 0 : rest, need: max ? 0 : xpNeeded(level), max };
  }

  level(id) {
    return this.progress(id).level;
  }

  gain(id, amount) {
    if (!amount) return;
    const before = this.level(id);
    this.xp[id] += amount;
    const p = this.progress(id);
    bus.emit('skill-xp', { id, amount, ...p });
    if (p.level > before) bus.emit('skill-up', { id, level: p.level });
  }

  // kracht per slag (1 = normaal)
  power(id) {
    return 1 + this.level(id) * (CONFIG.skills[id].power || 0);
  }

  // kans op dubbele opbrengst
  doubleChance(id) {
    return this.level(id) * (CONFIG.skills[id].double || 0);
  }

  freeBlockChance() {
    return this.level('bouwen') * CONFIG.skills.bouwen.free;
  }

  // Bonus bij een bepaald level, als korte tekst
  bonusText(id, level) {
    const s = CONFIG.skills[id];
    const pct = (x) => `${Math.round(x * 100)}%`;
    switch (id) {
      case 'hakken':
      case 'delven':
        return `+${pct(level * s.power)} kracht, ${pct(level * s.double)} kans op dubbel`;
      case 'bouwen':
        return `${pct(level * s.free)} kans op gratis extra blok`;
      case 'vechten':
        return `+${pct(level * s.damage)} schade, +${Math.floor(level / s.heartEvery)} levens`;
      default:
        return '';
    }
  }

  toJSON() {
    return { ...this.xp };
  }
}
