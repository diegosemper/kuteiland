// De verre eilanden in blokken: ertsblokken, een bordje, de Kern en de Hoeder.
import { CONFIG } from '../config.js';
import { canvasTexture } from './util.js';
import { iso, drawBoxes, boxAt, all, crisp } from './blocks.js';

const { tileH: TH } = CONFIG.iso;

export const NODE = { w: 120, h: 110, ox: 60, oy: 84 };
const ORE = {
  wrak: 'rust_ore', kristalader: 'amethyst', sterrenader: 'star_ore',
  zwavelader: 'sulfur_ore', ijsader: 'ice_ore', zielenader: 'soul_ore',
};
const BASE = { wrak: 'basalt', zwavelader: 'sulfur_side', paddenstoel: 'mycelium_top', ijsader: 'packed_ice', zielenader: 'sculk_side' };

function drawNode(ctx, kind, part) {
  const P = iso(NODE.ox, NODE.oy);
  if (part === 'base') {
    drawBoxes(ctx, P, [boxAt(0, 0, 0, 0.56, 8, all(BASE[kind] || 'deepslate'))]);
    return;
  }
  if (kind === 'paddenstoel') {
    // reuzenpaddenstoel: witte steel, rode hoed met stippen
    drawBoxes(ctx, P, [
      boxAt(0, 0, 8, 0.16, 34, all('mushroom_stem')),
      boxAt(0, 0, 42, 0.62, 18, all('mushroom_cap')),
    ]);
    return;
  }
  drawBoxes(ctx, P, [boxAt(0, 0, 8, 0.42, 0.42 * TH, all(ORE[kind]))]);
}

export const NOTE = { w: 60, h: 80, ox: 30, oy: 70 };

function drawNote(ctx) {
  const P = iso(NOTE.ox, NOTE.oy);
  const wood = all('planks');
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.05, 32, wood),
    { u0: -0.17, u1: 0.17, v0: -0.03, v1: 0.03, z0: 30, z1: 54, faces: { top: 'planks', left: 'sign', right: 'planks' } },
  ]);
}

export const KERN = { w: 220, h: 220, ox: 110, oy: 176 };

function drawKern(ctx) {
  const P = iso(KERN.ox, KERN.oy);
  // zachte gloed achter het hart
  const c = P(0, 0, 112);
  const g = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 90);
  g.addColorStop(0, 'rgba(200,160,255,0.55)');
  g.addColorStop(1, 'rgba(155,107,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(c.x - 90, c.y - 90, 180, 180);
  const bricks = all('bricks');
  const obs = all('obsidian');
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.84, 14, bricks),
    boxAt(0, 0, 14, 0.5, 14, { top: 'bricks_glow', left: 'bricks', right: 'bricks' }),
    // gebroken zuilen
    boxAt(-0.34, -0.34, 14, 0.12, 70, obs),
    boxAt(0.34, -0.34, 14, 0.12, 44, obs),
    boxAt(-0.34, 0.34, 14, 0.12, 30, obs),
    // het hart: een zwevend kristalblok
    boxAt(0, 0, 90, 0.36, 0.36 * TH, all('kern')),
  ]);
}

export const BOSS = { w: 240, h: 240, footX: 120, footY: 222 };

function drawBoss(ctx, frame) {
  const P = iso(BOSS.footX, BOSS.footY);
  const sw = Math.sin((frame / 4) * Math.PI * 2);
  const obs = all('obsidian');
  const cry = all('amethyst');
  drawBoxes(ctx, P, [
    // vier dikke poten
    boxAt(-0.2 + sw * 0.04, -0.22, 0, 0.14, 44, obs),
    boxAt(-0.2 - sw * 0.04, 0.22, 0, 0.14, 44, obs),
    boxAt(0.2 - sw * 0.04, -0.22, 0, 0.14, 44, obs),
    boxAt(0.2 + sw * 0.04, 0.22, 0, 0.14, 44, obs),
    // lijf
    { u0: -0.32, u1: 0.32, v0: -0.36, v1: 0.36, z0: 40, z1: 118, faces: obs },
    // kristallen op de rug
    boxAt(-0.18, -0.2, 118, 0.14, 26, cry),
    boxAt(-0.06, 0.18, 118, 0.12, 20, cry),
    boxAt(-0.24, 0.06, 118, 0.1, 34, cry),
    // kop met te veel ogen, iets naar voren
    boxAt(0.3, 0, 96 + sw * 2, 0.3, 0.3 * TH, { top: 'obsidian', left: 'void_eyes', right: 'void_eyes' }),
    // het hart in de borst
    boxAt(0.33, 0, 62, 0.08, 18, all('kern')),
  ]);
}

export function generateRemote(scene) {
  for (const kind of ['wrak', 'kristalader', 'sterrenader', 'zwavelader', 'paddenstoel', 'ijsader', 'zielenader']) {
    canvasTexture(scene, `node_${kind}_base`, NODE.w, NODE.h, (ctx) => drawNode(ctx, kind, 'base'));
    canvasTexture(scene, `node_${kind}_top`, NODE.w, NODE.h, (ctx) => drawNode(ctx, kind, 'top'));
    crisp(scene, `node_${kind}_base`);
    crisp(scene, `node_${kind}_top`);
  }
  canvasTexture(scene, 'note', NOTE.w, NOTE.h, drawNote);
  canvasTexture(scene, 'kern', KERN.w, KERN.h, drawKern);
  crisp(scene, 'note');
  for (let f = 0; f < 4; f++) {
    canvasTexture(scene, `boss${f}`, BOSS.w, BOSS.h, (ctx) => drawBoss(ctx, f));
    crisp(scene, `boss${f}`);
  }
}
