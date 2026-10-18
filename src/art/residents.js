// Bewoners en het leegtebeest: bed, drenkeling (voor de grijphaak) en drie groeistadia van het beest.
import { CONFIG } from '../config.js';
import { canvasTexture } from './util.js';
import { iso, drawBoxes, boxAt, all, crisp } from './blocks.js';

const { tileH: TH } = CONFIG.iso;

export const BED = { w: 120, h: 90, ox: 60, oy: 62 };

function drawBed(ctx) {
  const P = iso(BED.ox, BED.oy);
  const wood = { top: 'planks', left: 'chest_side', right: 'chest_side' };
  drawBoxes(ctx, P, [
    { u0: -0.34, u1: 0.34, v0: -0.2, v1: 0.2, z0: 0, z1: 0.16 * TH, faces: wood },
    { u0: -0.32, u1: 0.18, v0: -0.18, v1: 0.18, z0: 0.16 * TH, z1: 0.22 * TH, faces: { top: 'mushroom_cap', left: 'mushroom_cap', right: 'mushroom_cap' } },
    { u0: 0.18, u1: 0.32, v0: -0.18, v1: 0.18, z0: 0.16 * TH, z1: 0.24 * TH, faces: all('sack') },
    { u0: 0.32, u1: 0.38, v0: -0.2, v1: 0.2, z0: 0, z1: 0.36 * TH, faces: wood },
  ]);
}

// pixels tekenen uit een patroon
function pixels(scene, key, rows, colors, px = 4) {
  const w = Math.max(...rows.map((r) => r.length)) * px;
  canvasTexture(scene, key, w, rows.length * px, (ctx) => {
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.' || !colors[ch]) return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(x * px, y * px, px, px);
    }));
  });
  crisp(scene, key);
}

const PET_COLORS = { k: '#160a24', p: '#7a4fcf', P: '#9b6bff', l: '#c9a6ff', w: '#f0e4ff', e: '#08040c', h: '#40ffd0', t: '#e07ab0' };

export function generateResidents(scene) {
  canvasTexture(scene, 'bed', BED.w, BED.h, drawBed);
  crisp(scene, 'bed');

  // drenkeling: iemand die zich aan een plank vastklampt
  pixels(scene, 'mg_castaway', [
    '......kkk......',
    '.....kssskk....',
    '.....ksesk.....',
    '......sss......',
    '...h.ccccc.h...',
    '...hcccccccch..',
    '.....ccccc.....',
    'bbbbbbbbbbbbbbb',
    'BBBBBBBBBBBBBBB',
  ], { k: '#3a2a20', s: '#d8b090', e: '#201010', c: '#4a6a9a', h: '#d8b090', b: '#a07c4c', B: '#6a4a2a' });

  // klein: een kluitje met grote ogen
  pixels(scene, 'pet_s', [
    '....kkkk....',
    '..kkPPPPkk..',
    '.kPPPPPPPPk.',
    '.kPwwPPwwPk.',
    'kPPwePPwePPk',
    'kPPPPPPPPPPk',
    'kpPPPttPPPpk',
    '.kppPPPPppk.',
    '..kkpkkpkk..',
  ], PET_COLORS);
  // middel: hoorntjes en een staart
  pixels(scene, 'pet_m', [
    '.l..........l.',
    '.lk..kkkk..kl.',
    '..kkPPPPPPkk..',
    '.kPPPPPPPPPPk.',
    'kPPwwPPPPwwPPk',
    'kPPweePPweePPk',
    'kPPPPPPPPPPPPk',
    'kpPPPPttttPPpk',
    'kppPPPPPPPPppk.k',
    '.kpppPPPPpppkkPk',
    '..kkpk..kpkk..k.',
  ], PET_COLORS);
  // groot: gloeiende vlekken en een gemene grijns
  pixels(scene, 'pet_l', [
    '.ll............ll.',
    '..lk..kkkkkk..kl..',
    '..kkkPPPPPPPPkkk..',
    '.kPPPPPhPPPPPPPPk.',
    'kPPPwwwPPPPwwwPPPk',
    'kPPPweePPPPweePPPk',
    'kPPPPPPPPPPPPPPhPk',
    'kpPPwPwPwPwPwPPPpk',
    'kppPPPPPPPPPPPPppk..k',
    'kpppPPhPPPPPPPpppkkPk',
    '.kpppPPPPPPPPpppkPPk.',
    '..kkppk...kppkkkkk..',
  ], PET_COLORS);
}
