// Wat blijft over cycli heen: welke cyclus het is en welke blijvende bonussen je koos.
// Los van de gewone opslag, zodat een nieuwe cyclus het eiland wist maar dit niet.
import { CONFIG } from '../config.js';

const KEY = 'kuteiland.meta.v1';
let meta = null;

export function getMeta() {
  if (meta) return meta;
  meta = { cycle: 1, bonuses: {} };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.cycle) meta = { cycle: raw.cycle, bonuses: { ...raw.bonuses }, cycleMod: raw.cycleMod || null, bestDepth: raw.bestDepth || 0 };
  } catch {
    // privémodus: dan maar zonder
  }
  return meta;
}

function saveMeta() {
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // niks aan te doen
  }
}

// Totale bonus van een soort (aantal keer gekozen x waarde)
export function bonus(id) {
  const def = CONFIG.prestige.bonuses.find((b) => b.id === id);
  return def ? (getMeta().bonuses[id] || 0) * def.value : 0;
}

export function startNextCycle(bonusId) {
  const m = getMeta();
  m.cycle += 1;
  if (bonusId) m.bonuses[bonusId] = (m.bonuses[bonusId] || 0) + 1;
  // elke nieuwe cyclus een andere regel (niet dezelfde als vorige keer)
  const rules = CONFIG.cycleMods.filter((r) => r.id !== m.cycleMod);
  m.cycleMod = rules[Math.floor(Math.random() * rules.length)].id;
  saveMeta();
}

export function recordDepth(level) {
  const m = getMeta();
  if (level > (m.bestDepth || 0)) {
    m.bestDepth = level;
    saveMeta();
  }
}

// Willekeurige keuze uit de bonussen voor het prestige-scherm
export function bonusChoices() {
  const all = [...CONFIG.prestige.bonuses];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, CONFIG.prestige.choices);
}
