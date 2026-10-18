// Werkbank en steengenerator, in blokken.
import { CONFIG } from '../config.js';
import { canvasTexture } from './util.js';
import { iso, drawBoxes, boxAt, all, crisp } from './blocks.js';

const { tileH: TH } = CONFIG.iso;

export const WORKBENCH = { w: 100, h: 104, ox: 50, oy: 80 };

function drawWorkbench(ctx) {
  const P = iso(WORKBENCH.ox, WORKBENCH.oy);
  const s = 0.5;
  drawBoxes(ctx, P, [boxAt(0, 0, 0, s, s * TH, { top: 'craft_top', left: 'craft_side', right: 'craft_side' })]);
}

export const GENERATOR = { w: 140, h: 120, ox: 70, oy: 90 };
export const GEN_STONE = { w: 70, h: 80, ox: 35, oy: 60 };

function drawGenerator(ctx) {
  const P = iso(GENERATOR.ox, GENERATOR.oy);
  const A = 0.34, W = 0.1, h = 0.3 * TH;
  const cob = all('cobble');
  drawBoxes(ctx, P, [
    // paarse leegte op de bodem
    { u0: -A + W, u1: A - W, v0: -A + W, v1: A - W, z0: 0, z1: h * 0.35, faces: { top: 'void_liquid' } },
    // vier muurtjes
    { u0: -A, u1: A, v0: -A, v1: -A + W, z0: 0, z1: h, faces: cob },
    { u0: -A, u1: -A + W, v0: -A, v1: A, z0: 0, z1: h, faces: cob },
    { u0: A - W, u1: A, v0: -A, v1: A, z0: 0, z1: h, faces: cob },
    { u0: -A, u1: A, v0: A - W, v1: A, z0: 0, z1: h, faces: cob },
  ]);
}

function drawGenStone(ctx) {
  const P = iso(GEN_STONE.ox, GEN_STONE.oy);
  drawBoxes(ctx, P, [boxAt(0, 0, 0, 0.3, 0.3 * TH, all('stone'))]);
}

export function generateStructures(scene) {
  canvasTexture(scene, 'workbench', WORKBENCH.w, WORKBENCH.h, drawWorkbench);
  canvasTexture(scene, 'generator', GENERATOR.w, GENERATOR.h, drawGenerator);
  canvasTexture(scene, 'gen_stone', GEN_STONE.w, GEN_STONE.h, drawGenStone);
  for (const k of ['workbench', 'generator', 'gen_stone']) crisp(scene, k);
}
