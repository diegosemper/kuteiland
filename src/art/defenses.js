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

export const TRAP = { w: 110, h: 70, ox: 55, oy: 40 };

function drawSpikes(ctx) {
  const P = iso(TRAP.ox, TRAP.oy);
  const boxes = [{ u0: -0.34, u1: 0.34, v0: -0.34, v1: 0.34, z0: 0, z1: 4, faces: all('planks') }];
  for (const u of [-0.2, 0, 0.2]) for (const v of [-0.2, 0, 0.2]) {
    boxes.push({ u0: u - 0.03, u1: u + 0.03, v0: v - 0.03, v1: v + 0.03, z0: 4, z1: 16, faces: all('iron') });
  }
  drawBoxes(ctx, P, boxes);
}

function drawMine(ctx) {
  const P = iso(TRAP.ox, TRAP.oy);
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.16, 12, { top: 'sulfur', left: 'sulfur_side', right: 'sulfur_side' }),
    { u0: -0.04, u1: 0.04, v0: -0.04, v1: 0.04, z0: 12, z1: 20, faces: all('iron') },
  ]);
}

export function generateDefenses(scene) {
  canvasTexture(scene, 'trap_spikes', TRAP.w, TRAP.h, drawSpikes);
  canvasTexture(scene, 'trap_mine', TRAP.w, TRAP.h, drawMine);
  crisp(scene, 'trap_spikes');
  crisp(scene, 'trap_mine');
  canvasTexture(scene, 'wall', WALL.w, WALL.h, drawWall);
  canvasTexture(scene, 'lamp_off', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, 'lantern_off'));
  canvasTexture(scene, 'lamp_on', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, 'lantern'));
  canvasTexture(scene, 'crystallamp_off', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, 'crystal_lamp_off'));
  canvasTexture(scene, 'crystallamp_on', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, 'crystal_lamp'));
  canvasTexture(scene, 'tower', TOWER.w, TOWER.h, drawTower);
  canvasTexture(scene, 'grave', GRAVE.w, GRAVE.h, drawGrave);
  for (const k of ['wall', 'lamp_off', 'lamp_on', 'crystallamp_off', 'crystallamp_on', 'tower', 'grave']) crisp(scene, k);
}
