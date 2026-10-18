// Omrekenen tussen tegel-coördinaten (gx, gy) en schermpixels in de wereld.
import { CONFIG } from './config.js';

const { tileW: TW, tileH: TH } = CONFIG.iso;

export function gridToScreen(gx, gy) {
  return { x: (gx - gy) * TW / 2, y: (gx + gy) * TH / 2 };
}

export function screenToGrid(x, y) {
  return { gx: x / TW + y / TH, gy: y / TH - x / TW };
}

// Een richting op het scherm (bv. van de joystick) omzetten naar een richting op het rooster.
export const screenVecToGrid = screenToGrid;
