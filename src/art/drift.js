// Drijvend wrak in blokken: een stuk stam, een roestblok met een plaat ijzer, en af en toe een kratje.
import { canvasTexture } from './util.js';
import { iso, drawBoxes, boxAt, all, crisp } from './blocks.js';

const log = { top: 'log_top', left: 'log_side', right: 'log_side' };

function drawBranch(ctx) {
  const P = iso(52, 46);
  drawBoxes(ctx, P, [
    boxAt(-0.17, 0, 0, 0.17, 11, log),
    boxAt(0, 0, 0, 0.17, 11, log),
    boxAt(0.17, 0, 0, 0.17, 11, log),
    boxAt(0.05, -0.12, 11, 0.12, 8, all('leaves_dead')),
  ]);
}

function drawScrap(ctx) {
  const P = iso(46, 50);
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.26, 17, all('rust')),
    { u0: 0.05, u1: 0.3, v0: -0.2, v1: 0.15, z0: 17, z1: 20, faces: all('iron') },
  ]);
}

function drawCrate(ctx) {
  const P = iso(40, 54);
  drawBoxes(ctx, P, [boxAt(0, 0, 0, 0.32, 20, { top: 'chest_side', left: 'chest_front', right: 'chest_side' })]);
}

export function generateDrift(scene) {
  canvasTexture(scene, 'drift_branch', 104, 64, drawBranch);
  canvasTexture(scene, 'drift_scrap', 92, 70, drawScrap);
  canvasTexture(scene, 'drift_crate', 80, 72, drawCrate);
  for (const k of ['drift_branch', 'drift_scrap', 'drift_crate']) crisp(scene, k);
}
