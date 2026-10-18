// Wat je gereedschap doet in de minigames. Niveaus stapelen: een hoger niveau houdt alles van eronder.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';

export function toolPerks(tool, tier) {
  const list = CONFIG.minigames.perks[tool] || [];
  const out = {};
  for (let t = 0; t <= Math.min(tier, list.length - 1); t++) Object.assign(out, list[t]);
  delete out.short;
  return out;
}

// Korte uitleg van het nieuwe effect van precies dit niveau (voor de werkbank)
export function perkText(tool, tier) {
  return CONFIG.minigames.perks[tool]?.[tier]?.short || '';
}

// Alle effecten tot en met dit niveau, als één regel (voor het startscherm van een minigame)
export function perkSummary(tool, tier) {
  const p = toolPerks(tool, tier);
  const L = TEXT.perkLabels;
  const parts = [];
  if (p.damage) parts.push(`${L.damage} ${p.damage}`);
  if (p.lives) parts.push(`${p.lives} ${L.lives}`);
  if (p.shots) parts.push(`${p.shots} ${L.shots}`);
  for (const k of ['zoneMult', 'slowInZone', 'perfectMult', 'forgive', 'seeCracks', 'pierce', 'shield', 'catchMult', 'speedMult']) {
    if (p[k] && L[k]) parts.push(typeof L[k] === 'object' ? L[k][tool] : L[k]);
  }
  return parts.join(' · ');
}

// In welke minigame werkt dit gereedschap?
export function minigameForTool(tool) {
  const entry = Object.entries(CONFIG.minigames.tool).find(([, t]) => t === tool);
  return entry ? CONFIG.minigames.name[entry[0]] : null;
}
