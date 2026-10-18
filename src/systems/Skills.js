// Skills: XP verzamelen door te doen, levels met kleine, zichtbare bonussen.
import { CONFIG } from '../config.js';
import { bus } from '../bus.js';
import { bonus } from './Meta.js';

export const SKILL_IDS = Object.keys(CONFIG.skills);

// XP nodig om van level L naar L+1 te gaan
export function xpNeeded(level) {
  const { base, exp } = CONFIG.skillCurve;
  return Math.round(base * (level + 1) ** exp);
}

export class Skills {
  constructor(saved = {}) {
    this.modsFn = () => 0;   // wordt door het spel gezet: blijvende bonussen
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
    return { level, cur: max ? 0 : Math.floor(rest), need: max ? 0 : xpNeeded(level), max };
  }

  level(id) {
    return this.progress(id).level;
  }

  gain(id, amount) {
    if (!amount) return;
    amount = Math.round(amount * (1 + this.modsFn(`xp.${id}`)) * 10) / 10;
    const before = this.level(id);
    this.xp[id] += amount;
    const p = this.progress(id);
    bus.emit('skill-xp', { id, amount, ...p });
    if (p.level > before) {
      bus.emit('skill-up', { id, level: p.level });
      const ms = CONFIG.skills[id].milestones?.[p.level];
      if (ms) bus.emit('milestone', { id, level: p.level, text: ms.text });
    }
  }

  // kracht per slag (1 = normaal)
  power(id) {
    return (1 + this.level(id) * (CONFIG.skills[id].power || 0)) * (1 + bonus(id));
  }

  // kans op dubbele opbrengst
  doubleChance(id) {
    return this.level(id) * (CONFIG.skills[id].double || 0) + this.modsFn(`double.${id}`);
  }

  freeBlockChance() {
    return this.level('bouwen') * CONFIG.skills.bouwen.free + this.modsFn('free');
  }

  // Eerstvolgende mijlpaal (of null)
  nextMilestone(id) {
    const level = this.level(id);
    const list = Object.entries(CONFIG.skills[id].milestones || {}).map(([l, m]) => ({ level: Number(l), ...m }));
    return list.find((m) => m.level > level) || null;
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
        return `+${pct(level * s.damage)} schade, +${Math.floor(level / s.heartEvery)} hartjes`;
      default:
        return '';
    }
  }

  toJSON() {
    return { ...this.xp };
  }
}
