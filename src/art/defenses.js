// Verdediging in blokken: kasseienmuur, lantaarn op een paal, kristallamp, wachttoren. Plus je achtergelaten zak.
import { CONFIG } from '../config.js';
import { canvasTexture } from './util.js';
import { iso, drawBoxes, boxAt, all, crisp } from './blocks.js';

const { tileH: TH } = CONFIG.iso;

export const WALL = { w: 116, h: 110, ox: 58, oy: 78 };

function drawWall(ctx) {
  const P = iso(WALL.ox, WALL.oy);
  drawBoxes(ctx, P, [boxAt(0, 0, 0, 0.84, 46, all('cobble'))]);
}

export const LAMP = { w: 64, h: 114, ox: 30, oy: 104 };

function drawLamp(ctx, glass) {
  const P = iso(LAMP.ox, LAMP.oy);
  const wood = all('planks');
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.08, 82, wood),                                                    // paal
    { u0: 0.04, u1: 0.17, v0: -0.02, v1: 0.02, z0: 78, z1: 82, faces: wood },          // arm
    boxAt(0.13, 0, 52, 0.14, 0.14 * TH * 1.3, all(glass)),                              // lantaarn
  ]);
  // kettinkje
  const a = P(0.13, 0, 78), b = P(0.13, 0, 64);
  ctx.fillStyle = '#3a3a40';
  ctx.fillRect(Math.round(a.x) - 1, Math.round(a.y), 2, Math.round(b.y - a.y));
}

export const TOWER = { w: 130, h: 150, ox: 65, oy: 124 };

function drawTower(ctx) {
  const P = iso(TOWER.ox, TOWER.oy);
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.48, 70, all('cobble')),
    boxAt(0, 0, 70, 0.6, 8, all('planks')),
    boxAt(0, 0, 78, 0.3, 0.3 * TH, { top: 'cobble', left: 'cobble', right: 'dispenser' }),
  ]);
}

export const GRAVE = { w: 60, h: 50, ox: 30, oy: 40 };

function drawGrave(ctx) {
  const P = iso(GRAVE.ox, GRAVE.oy);
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.24, 14, all('sack')),
    boxAt(0, 0, 14, 0.08, 6, all('sack')),
  ]);
}

export function generateDefenses(scene) {
  canvasTexture(scene, 'wall', WALL.w, WALL.h, drawWall);
  canvasTexture(scene, 'lamp_off', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, 'lantern_off'));
  canvasTexture(scene, 'lamp_on', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, 'lantern'));
  canvasTexture(scene, 'crystallamp_off', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, 'crystal_lamp_off'));
  canvasTexture(scene, 'crystallamp_on', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, 'crystal_lamp'));
  canvasTexture(scene, 'tower', TOWER.w, TOWER.h, drawTower);
  canvasTexture(scene, 'grave', GRAVE.w, GRAVE.h, drawGrave);
  for (const k of ['wall', 'lamp_off', 'lamp_on', 'crystallamp_off', 'crystallamp_on', 'tower', 'grave']) crisp(scene, k);
}
