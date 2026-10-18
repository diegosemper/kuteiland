// De halfdode eik en de kist, in blokken.
import { CONFIG } from '../config.js';
import { canvasTexture, mulberry32 } from './util.js';
import { iso, drawBoxes, boxAt, all, crisp } from './blocks.js';

const { tileH: TH } = CONFIG.iso;

// ---------- boom ----------

export const TREE = { w: 300, h: 300, baseX: 150, baseY: 278 };
const Q = 0.42;           // zijde van één boomblokje, in tegels
const H = Q * TH;         // hoogte van één blokje in pixels

function drawTree(ctx) {
  const P = iso(TREE.baseX, TREE.baseY);
  const rnd = mulberry32(4242);
  const log = { top: 'log_top', left: 'log_side', right: 'log_side' };
  const boxes = [];
  // stam
  for (let i = 0; i < 5; i++) boxes.push(boxAt(0, 0, i * H, Q, H, log));
  // kale tak naar rechts: dit deel is al dood
  boxes.push(boxAt(Q, -Q * 0.2, 3 * H, Q * 0.7, H * 0.7, log, Q * 0.7));
  boxes.push(boxAt(Q * 1.8, -Q * 0.4, 3.6 * H, Q * 0.6, H * 0.6, log, Q * 0.6));
  // kruin: vijf bij vijf, dan drie bij drie, dan een kruis; de rechterkant is grotendeels weg
  const layer = (z, r, skipCorners) => {
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) {
      if (skipCorners && Math.abs(a) === r && Math.abs(b) === r) continue;
      if (a === 0 && b === 0 && z < 5 * H) continue;          // daar zit de stam
      const dead = a - b > 1;                                  // rechts op het scherm: dood
      if (dead && rnd() < 0.75) continue;
      if (rnd() < 0.12) continue;
      const leaf = dead || rnd() < 0.35 ? 'leaves_dead' : 'leaves';
      boxes.push(boxAt(a * Q, b * Q, z, Q, H, all(leaf)));
    }
  };
  layer(3 * H, 2, true);
  layer(4 * H, 2, true);
  layer(5 * H, 1, false);
  for (const [a, b] of [[0, 0], [1, 0], [-1, 0], [0, -1]]) {
    if (rnd() < 0.85) boxes.push(boxAt(a * Q, b * Q, 6 * H, Q, H, all(rnd() < 0.4 ? 'leaves_dead' : 'leaves')));
  }
  drawBoxes(ctx, P, boxes);
}

// ---------- kist ----------

export const CHEST = { w: 80, h: 84, ox: 40, oy: 66 };
const C = 0.38;   // zijde van de kist in tegels

function drawChest(ctx, open) {
  const P = iso(CHEST.ox, CHEST.oy);
  const ch = C * TH;
  const sides = { top: 'chest_side', left: 'chest_front', right: 'chest_side' };
  if (!open) {
    drawBoxes(ctx, P, [boxAt(0, 0, 0, C, ch * 0.85, sides)]);
    return;
  }
  // open: deksel staat rechtop achteraan, binnenkant donker
  drawBoxes(ctx, P, [
    { u0: -C / 2, u1: C / 2, v0: -C / 2 - 0.05, v1: -C / 2, z0: ch * 0.6, z1: ch * 0.6 + C * TH * 0.9, faces: { top: 'chest_side', left: 'chest_inside', right: 'chest_side' } },
    boxAt(0, 0, 0, C, ch * 0.6, { top: 'chest_inside', left: 'chest_front', right: 'chest_side' }),
  ]);
}

export function generateProps(scene) {
  canvasTexture(scene, 'tree', TREE.w, TREE.h, drawTree);
  canvasTexture(scene, 'chest', CHEST.w, CHEST.h, (ctx) => drawChest(ctx, false));
  canvasTexture(scene, 'chest_open', CHEST.w, CHEST.h, (ctx) => drawChest(ctx, true));
  for (const k of ['tree', 'chest', 'chest_open']) crisp(scene, k);
}
