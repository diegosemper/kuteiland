// Drijvend wrak: takken, roestige wrakstukken en af en toe een kratje.
import { canvasTexture, poly, ellipse, mulberry32 } from './util.js';
import { limb, woodFace, rivet } from './props.js';
import { iso, box } from './structures.js';

function drawBranch(ctx) {
  const rnd = mulberry32(808);
  // hoofdtak, schuin
  limb(ctx, { x: 10, y: 34 }, { x: 50, y: 22 }, { x: 98, y: 18 }, 9, 3);
  limb(ctx, { x: 46, y: 25 }, { x: 58, y: 10 }, { x: 66, y: 4 }, 4, 1);
  limb(ctx, { x: 70, y: 21 }, { x: 82, y: 30 }, { x: 92, y: 36 }, 3.5, 1);
  limb(ctx, { x: 28, y: 30 }, { x: 30, y: 40 }, { x: 24, y: 46 }, 3.5, 1);
  // gebroken eind: licht hout
  ellipse(ctx, 10, 34, 3, 4.5, '#b08a62');
  ellipse(ctx, 10, 34, 1.3, 2, '#7a5a3c');
  // een paar dode blaadjes
  for (const [x, y] of [[66, 5], [92, 36], [24, 46], [98, 18]]) {
    ellipse(ctx, x + (rnd() - 0.5) * 4, y + (rnd() - 0.5) * 4, 3, 1.8, '#6c5d34', rnd() * 3);
  }
}

function drawScrap(ctx) {
  // gebogen roestige plaat
  poly(ctx, [{ x: 8, y: 22 }, { x: 44, y: 10 }, { x: 70, y: 18 }, { x: 74, y: 38 }, { x: 40, y: 52 }, { x: 12, y: 44 }]);
  const g = ctx.createLinearGradient(8, 10, 74, 52);
  g.addColorStop(0, '#a6623a');
  g.addColorStop(0.4, '#7a3f22');
  g.addColorStop(1, '#3c1f10');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // vouw
  ctx.strokeStyle = 'rgba(255,190,140,0.25)';
  ctx.beginPath(); ctx.moveTo(44, 10); ctx.lineTo(40, 52); ctx.stroke();
  // roestvlekken en gaten
  const rnd = mulberry32(919);
  for (let i = 0; i < 9; i++) ellipse(ctx, 18 + rnd() * 48, 20 + rnd() * 24, 1.5 + rnd() * 3, 1 + rnd() * 2, 'rgba(40,18,8,0.55)');
  ellipse(ctx, 58, 28, 3.2, 2.6, '#120a06');
  ellipse(ctx, 24, 34, 2.4, 2, '#120a06');
  for (const [x, y] of [[14, 26], [66, 22], [68, 36], [16, 40]]) rivet(ctx, { x, y });
  // stuk pijp
  ctx.strokeStyle = '#4a4a50';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(52, 46); ctx.lineTo(86, 54); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,160,170,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(52, 44); ctx.lineTo(86, 52); ctx.stroke();
  ellipse(ctx, 86, 54, 3, 3.4, '#1a1a1e');
}

function drawCrate(ctx) {
  const P = iso(40, 58);
  const rnd = mulberry32(1001);
  const f = box(ctx, P, -0.18, 0.18, -0.18, 0.18, 0, 30, { left: '#6a4a30', right: '#45301e', top: '#7d5a3a' });
  woodFace(ctx, f.left, '#6a4a30', rnd, [[P(-0.18, 0.18, 10), P(0.18, 0.18, 10)], [P(-0.18, 0.18, 20), P(0.18, 0.18, 20)]]);
  woodFace(ctx, f.right, '#45301e', rnd, [[P(0.18, 0.18, 10), P(0.18, -0.18, 10)], [P(0.18, 0.18, 20), P(0.18, -0.18, 20)]]);
  woodFace(ctx, f.top, '#7d5a3a', rnd, [[P(-0.18, -0.06, 30), P(0.18, -0.06, 30)], [P(-0.18, 0.06, 30), P(0.18, 0.06, 30)]]);
  // touw om de krat
  ctx.strokeStyle = '#8a7a52';
  ctx.lineWidth = 1.6;
  const a = P(0, 0.18, 0), b = P(0, 0.18, 30), c = P(0, -0.18, 30);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.stroke();
}

export function generateDrift(scene) {
  canvasTexture(scene, 'drift_branch', 104, 52, drawBranch);
  canvasTexture(scene, 'drift_scrap', 92, 62, drawScrap);
  canvasTexture(scene, 'drift_crate', 80, 72, drawCrate);
}
