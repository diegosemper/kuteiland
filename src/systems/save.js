// Opslaan in localStorage. Faalt stil (bijv. in privémodus); het spel draait dan gewoon door.
import { CONFIG } from '../config.js';

const VERSION = 1;

export function loadGame() {
  try {
    const raw = localStorage.getItem(CONFIG.save.key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.v === VERSION ? data : null;
  } catch {
    return null;
  }
}

export function saveGame(state) {
  try {
    localStorage.setItem(CONFIG.save.key, JSON.stringify({ v: VERSION, savedAt: Date.now(), ...state }));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(CONFIG.save.key);
  } catch {
    // niks aan te doen
  }
}
