// Korte teksten die op meerdere plekken in de UI terugkomen.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// "Wrakhout II nodig" voor een recept op slot
export function lockedLabel(unlock) {
  const name = unlock.collection === 'wezens' ? TEXT.collectionKills : CONFIG.items[unlock.collection].name;
  return `${name} ${ROMAN[unlock.tier]}`;
}
