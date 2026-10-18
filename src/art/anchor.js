// Ankers in drie niveaus (roest, ijzer, obsidiaan met kristal), barsten en het waarschuwingsteken.
import { canvasTexture } from './util.js';
import { iso, drawBoxes, boxAt, all, crisp, cube } from './blocks.js';
import { TILE_TEX } from './terrain.js';
import { CONFIG } from '../config.js';

const { blockDepth: BD } = CONFIG.iso;

export const ANCHOR = { w: 110, h: 150, ox: 55, oy: 120 };

function drawAnchor(ctx, tier) {
  const P = iso(ANCHOR.ox, ANCHOR.oy);
  const mat = tier === 1 ? 'rust' : tier === 2 ? 'iron' : 'obsidian';
  const m = all(mat);
  const boxes = [
    boxAt(0, 0, 0, 0.38, 8, all(tier === 3 ? 'obsidian' : 'cobble')),     // voetplaat
    boxAt(0, 0, 8, 0.1, 74, m),                                           // staak
    { u0: -0.2, u1: 0.2, v0: -0.04, v1: 0.04, z0: 60, z1: 68, faces: m },  // dwarsbalk
    boxAt(0, 0, 82, 0.14, 10, m),                                         // ring bovenop
  ];
  if (tier >= 2) {
    // kettingen naar de grond
    for (const [u, v] of [[-0.18, 0.18], [0.18, 0.12]]) boxes.push(boxAt(u, v, 0, 0.05, 30, all('iron')));
  }
  if (tier === 3) boxes.push(boxAt(0, 0, 96, 0.16, 0.16 * 64, all('kern')));
  drawBoxes(ctx, P, boxes);
}

// Barsten over de bovenkant en zijkanten van een tegel (zelfde maat als een tegel-texture)
function drawCracks(ctx) {
  const P = iso(TILE_TEX.cx, TILE_TEX.cy + BD);
  cube(ctx, P, -0.5, 0.5, -0.5, 0.5, 0, BD, all('crack'), { shadeL: 0, shadeR: 0 });
}

// Waarschuwingsdriehoek in pixels
const WARN = [
  '.......k.......',
  '......kyk......',
  '.....kyyyk.....',
  '.....kykyk.....',
  '....kyykyyk....',
  '....kyykyyk....',
  '...kyyykyyyk...',
  '...kyyyyyyyk...',
  '..kyyyykyyyyk..',
  '..kkkkkkkkkkk..',
];

export function generateAnchor(scene) {
  for (const tier of [1, 2, 3]) {
    canvasTexture(scene, `anchor${tier}`, ANCHOR.w, ANCHOR.h, (ctx) => drawAnchor(ctx, tier));
    crisp(scene, `anchor${tier}`);
  }
  canvasTexture(scene, 'cracks', TILE_TEX.w, TILE_TEX.h, drawCracks);
  crisp(scene, 'cracks');
  canvasTexture(scene, 'warn', 30, 20, (ctx) => {
    WARN.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'k' ? '#1a1208' : '#e8c070';
      ctx.fillRect(x * 2, y * 2, 2, 2);
    }));
  });
  crisp(scene, 'warn');
}
