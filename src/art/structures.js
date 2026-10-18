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

// Zwavelketel: ijzeren pot op kasseien, vol borrelende zwavel
export const KETTLE = { w: 120, h: 120, ox: 60, oy: 92 };

function drawKettle(ctx) {
  const P = iso(KETTLE.ox, KETTLE.oy);
  const iron = all('iron');
  const A = 0.32, W = 0.07, h0 = 10, h1 = 46;
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.36, h0, all('cobble')),
    { u0: -A + W, u1: A - W, v0: -A + W, v1: A - W, z0: h0, z1: h1 - 6, faces: { top: 'sulfur', left: 'sulfur_side', right: 'sulfur_side' } },
    { u0: -A, u1: A, v0: -A, v1: -A + W, z0: h0, z1: h1, faces: iron },
    { u0: -A, u1: -A + W, v0: -A, v1: A, z0: h0, z1: h1, faces: iron },
    { u0: A - W, u1: A, v0: -A, v1: A, z0: h0, z1: h1, faces: iron },
    { u0: -A, u1: A, v0: A - W, v1: A, z0: h0, z1: h1, faces: iron },
  ]);
}

// Sterrenantenne: lange ijzeren paal met een kwarts schotel bovenop
export const ANTENNA = { w: 130, h: 210, ox: 65, oy: 180 };

function drawAntenna(ctx) {
  const P = iso(ANTENNA.ox, ANTENNA.oy);
  const H = 2.1 * TH;
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.3, 12, all('iron')),
    { u0: -0.05, u1: 0.05, v0: -0.05, v1: 0.05, z0: 12, z1: H, faces: all('iron') },
    { u0: -0.36, u1: 0.36, v0: -0.36, v1: 0.36, z0: H, z1: H + 6, faces: all('quartz') },
    { u0: -0.08, u1: 0.08, v0: -0.08, v1: 0.08, z0: H + 6, z1: H + 18, faces: all('star_ore') },
  ]);
}

// Zielenlantaarn: obsidiaan zuil met sculk en een zielenkristal in de top
export const SOULLAMP = { w: 110, h: 180, ox: 55, oy: 150 };

function drawSoulLamp(ctx) {
  const P = iso(SOULLAMP.ox, SOULLAMP.oy);
  const H = 1.5 * TH;
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.36, 14, all('obsidian')),
    { u0: -0.16, u1: 0.16, v0: -0.16, v1: 0.16, z0: 14, z1: H, faces: { top: 'sculk', left: 'sculk_side', right: 'sculk_side' } },
    { u0: -0.2, u1: 0.2, v0: -0.2, v1: 0.2, z0: H, z1: H + 26, faces: all('soul_crystal') },
    { u0: -0.24, u1: 0.24, v0: -0.24, v1: 0.24, z0: H + 26, z1: H + 32, faces: all('obsidian') },
  ]);
}

export function generateStructures(scene) {
  canvasTexture(scene, 'src_magneet', MAGNET.w, MAGNET.h, drawMagnet);
  canvasTexture(scene, 'src_boor', DRILL.w, DRILL.h, drawDrill);
  canvasTexture(scene, 'src_ketel', KETTLE.w, KETTLE.h, drawKettle);
  canvasTexture(scene, 'src_antenne', ANTENNA.w, ANTENNA.h, drawAntenna);
  canvasTexture(scene, 'src_lantaarn', SOULLAMP.w, SOULLAMP.h, drawSoulLamp);
  for (const k of ['src_magneet', 'src_boor', 'src_ketel', 'src_antenne', 'src_lantaarn']) crisp(scene, k);
  canvasTexture(scene, 'workbench', WORKBENCH.w, WORKBENCH.h, drawWorkbench);
  canvasTexture(scene, 'generator', GENERATOR.w, GENERATOR.h, drawGenerator);
  canvasTexture(scene, 'gen_stone', GEN_STONE.w, GEN_STONE.h, drawGenStone);
  for (const k of ['workbench', 'generator', 'gen_stone']) crisp(scene, k);
}
