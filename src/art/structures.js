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

// Roestmagneet: ijzeren voet met een grote roestige hoefijzermagneet erop
export const MAGNET = { w: 110, h: 140, ox: 55, oy: 112 };

function drawMagnet(ctx) {
  const P = iso(MAGNET.ox, MAGNET.oy);
  const iron = all('iron');
  const rust = all('rust');
  const h = 0.22 * TH;
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.36, h, iron),
    // twee poten van de magneet
    { u0: -0.28, u1: -0.12, v0: -0.1, v1: 0.1, z0: h, z1: h + 40, faces: rust },
    { u0: 0.12, u1: 0.28, v0: -0.1, v1: 0.1, z0: h, z1: h + 40, faces: rust },
    // boog bovenop
    { u0: -0.28, u1: 0.28, v0: -0.1, v1: 0.1, z0: h + 40, z1: h + 54, faces: rust },
    // blanke uiteinden
    { u0: -0.28, u1: -0.12, v0: -0.1, v1: 0.1, z0: h, z1: h + 8, faces: all('quartz') },
    { u0: 0.12, u1: 0.28, v0: -0.1, v1: 0.1, z0: h, z1: h + 8, faces: all('quartz') },
  ]);
}

// Kristalboor: houten bok met een ijzeren boor die in een gat vol leegte zakt
export const DRILL = { w: 130, h: 190, ox: 65, oy: 156 };

function drawDrill(ctx) {
  const P = iso(DRILL.ox, DRILL.oy);
  const log = { top: 'log_top', left: 'log_side', right: 'log_side' };
  const A = 0.36, L = 0.08, H = 1.6 * TH;
  drawBoxes(ctx, P, [
    { u0: -0.2, u1: 0.2, v0: -0.2, v1: 0.2, z0: 0, z1: 3, faces: { top: 'void_liquid' } },
    { u0: -A, u1: -A + L, v0: -A, v1: -A + L, z0: 0, z1: H, faces: log },
    { u0: A - L, u1: A, v0: -A, v1: -A + L, z0: 0, z1: H, faces: log },
    { u0: -A, u1: -A + L, v0: A - L, v1: A, z0: 0, z1: H, faces: log },
    { u0: -0.05, u1: 0.05, v0: -0.05, v1: 0.05, z0: 4, z1: H - 6, faces: all('iron') },
    { u0: -0.09, u1: 0.09, v0: -0.09, v1: 0.09, z0: 4, z1: 20, faces: all('amethyst') },
    { u0: A - L, u1: A, v0: A - L, v1: A, z0: 0, z1: H, faces: log },
    { u0: -A, u1: A, v0: -A, v1: A, z0: H, z1: H + 10, faces: all('planks') },
  ]);
}

export function generateStructures(scene) {
  canvasTexture(scene, 'src_magneet', MAGNET.w, MAGNET.h, drawMagnet);
  canvasTexture(scene, 'src_boor', DRILL.w, DRILL.h, drawDrill);
  crisp(scene, 'src_magneet');
  crisp(scene, 'src_boor');
  canvasTexture(scene, 'workbench', WORKBENCH.w, WORKBENCH.h, drawWorkbench);
  canvasTexture(scene, 'generator', GENERATOR.w, GENERATOR.h, drawGenerator);
  canvasTexture(scene, 'gen_stone', GEN_STONE.w, GEN_STONE.h, drawGenStone);
  for (const k of ['workbench', 'generator', 'gen_stone']) crisp(scene, k);
}
