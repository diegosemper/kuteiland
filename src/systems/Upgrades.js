// Kosten en effecten van verbeteren: machines (niveau 1-5) en uitrusting op het aambeeld (+1 tot +10).
import { CONFIG } from '../config.js';

// Kosten om een machine van niveau t naar t+1 te brengen
export function machineUpgradeCost(m) {
  const t = m.tier;
  const cost = { [m.def.item]: 15 * t * t, puin: 10 * t };
  if (t >= 2) cost.zwavel = 4 * (t - 1);
  if (t >= 4) cost.zielenkristal = 2 * (t - 3);
  // een machine die zelf puin maakt, vraagt roest in plaats van dubbel puin
  if (m.def.item === 'puin') { cost.puin = 15 * t * t + 10 * t; cost.roest = 6 * t; }
  return cost;
}

// Kosten om uitrusting naar +level te brengen
export function gearUpgradeCost(level) {
  const L = level;
  const cost = { roest: Math.round(4 * L ** 1.6), puin: 6 * L };
  if (L >= 3) cost.leegtekristal = Math.round(2 * (L - 2) ** 1.4);
  if (L >= 5) cost.zwavel = Math.round(3 * (L - 4) ** 1.5);
  if (L >= 7) cost.zielenkristal = (L - 6) * 2;
  if (L >= 9) cost.leegtehart = 1;
  return cost;
}

export const GEAR_SLOTS = ['axe', 'pickaxe', 'weapon', 'armor'];

// Korte uitleg van wat een +1 doet
export function gearEffectText(slot, level) {
  const p = CONFIG.upgrades.per[slot];
  const pct = Math.round(p * level * 100);
  switch (slot) {
    case 'axe': return `+${pct}% hakkracht`;
    case 'pickaxe': return `+${pct}% delfkracht`;
    case 'weapon': return `+${pct}% schade`;
    case 'armor': return `${pct}% minder schade extra`;
    default: return '';
  }
}

export function canPay(inventory, cost) {
  return Object.entries(cost).every(([k, n]) => inventory.has(k, n));
}

export function pay(inventory, cost) {
  if (!canPay(inventory, cost)) return false;
  for (const [k, n] of Object.entries(cost)) inventory.remove(k, n);
  return true;
}
