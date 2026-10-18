// Ankers (drie niveaus) en de barsten in een afbrokkelende tegel.
import { CONFIG } from '../config.js';
import { canvasTexture, poly, ellipse, mulberry32 } from './util.js';
import { iso, box } from './structures.js';
import { rivet } from './props.js';
import { TILE_TEX } from './terrain.js';

const { tileW: TW, tileH: TH, blockDepth: BD } = CONFIG.iso;

export const ANCHOR = { w: 110, h: 150, ox: 55, oy: 120 };

function drawAnchor(ctx, tier) {
  const P = iso(ANCHOR.ox, ANCHOR.oy);
  const rnd = mulberry32(1400 + tier);

  // voet: plaat die in de grond is geslagen
  const plate = tier >= 2 ? { left: '#5c5650', right: '#423d39', top: '#6e6862' } : { left: '#6a3a20', right: '#4a2614', top: '#7e4626' };
  box(ctx, P, -0.2, 0.2, -0.2, 0.2, 0, 6, plate);
  for (const [u, v] of [[-0.15, 0.2], [0.15, 0.2], [0.2, -0.15], [0.2, 0.15]]) rivet(ctx, P(u, v, 3));

  // kettingen die de grond in gaan
  if (tier >= 2) {
    ctx.strokeStyle = '#3a3a40';
    ctx.lineWidth = 2;
    for (const [u, v] of [[-0.3, 0.1], [0.1, 0.32], [0.3, -0.2]]) {
      const a = P(0, 0, 40), b = P(u, v, 0);
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        ctx.beginPath();
        ctx.ellipse(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * 6, 2.4, 1.5, i % 2 ? 0 : 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // de staak
  const rust = tier === 3 ? ['#5a4a6e', '#3a2d4a', '#6e5a86'] : ['#8a4a2a', '#5a2e18', '#a0583a'];
  box(ctx, P, -0.05, 0.05, -0.05, 0.05, 6, 78, { left: rust[0], right: rust[1], top: rust[2] });
  // roestvlekken
  for (let i = 0; i < 14; i++) {
    const p = P(-0.05 + rnd() * 0.1, 0.05, 10 + rnd() * 60);
    ellipse(ctx, p.x, p.y, 1 + rnd() * 1.5, 1 + rnd(), 'rgba(30,12,4,0.5)');
  }
  // dwarsstuk bovenaan, als een echt anker omgekeerd in de grond
  const t1 = P(-0.18, 0.05, 70), t2 = P(0.18, -0.05, 70);
  ctx.strokeStyle = rust[1];
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
  ctx.strokeStyle = rust[2];
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(t1.x, t1.y - 2); ctx.lineTo(t2.x, t2.y - 2); ctx.stroke();
  // ring bovenop
  const top = P(0, 0, 86);
  ctx.strokeStyle = rust[0];
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.ellipse(top.x, top.y, 7, 9, 0, 0, Math.PI * 2); ctx.stroke();

  // runen / kristal
  const glowCol = tier === 3 ? 'rgba(190,150,255,' : 'rgba(155,107,255,';
  const mid = P(0, 0.05, 40);
  const g = ctx.createRadialGradient(mid.x, mid.y, 1, mid.x, mid.y, tier === 3 ? 26 : 14);
  g.addColorStop(0, glowCol + (tier === 3 ? '0.8)' : '0.45)'));
  g.addColorStop(1, glowCol + '0)');
  ctx.fillStyle = g;
  ctx.fillRect(mid.x - 30, mid.y - 30, 60, 60);
  ctx.strokeStyle = glowCol + '0.9)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3 + tier; i++) {
    const p = P(0, 0.05, 18 + i * 12);
    ctx.beginPath(); ctx.moveTo(p.x - 3, p.y); ctx.lineTo(p.x + 3, p.y - 3); ctx.lineTo(p.x - 1, p.y - 6); ctx.stroke();
  }
  if (tier === 3) {
    poly(ctx, [{ x: mid.x, y: mid.y - 10 }, { x: mid.x + 6, y: mid.y }, { x: mid.x, y: mid.y + 10 }, { x: mid.x - 6, y: mid.y }]);
    ctx.fillStyle = '#e2d0ff';
    ctx.fill();
  }
}

// Barsten over de bovenkant en zijkant van een tegel (zelfde maat als een tegel-texture)
function drawCracks(ctx) {
  const { cx, cy } = TILE_TEX;
  const crack = (rnd, x, y, ang, len, w, depth) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let px = x, py = y;
    for (let i = 0; i < 5; i++) {
      ang += (rnd() - 0.5) * 0.9;
      px += Math.cos(ang) * len / 5;
      py += Math.sin(ang) * len / 5 * 0.5;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    if (depth > 0) crack(rnd, px, py, ang + (rnd() < 0.5 ? 0.8 : -0.8), len * 0.55, w * 0.7, depth - 1);
  };
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // de tegel zelf wordt donkerder en vochtig
  ctx.beginPath();
  ctx.moveTo(cx, cy - TH / 2);
  ctx.lineTo(cx + TW / 2, cy);
  ctx.lineTo(cx, cy + TH / 2);
  ctx.lineTo(cx - TW / 2, cy);
  ctx.closePath();
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, TW / 2);
  g.addColorStop(0, 'rgba(10,5,15,0.35)');
  g.addColorStop(1, 'rgba(10,5,15,0.12)');
  ctx.fillStyle = g;
  ctx.fill();
  // twee keer dezelfde barsten: lichte rand eronder, donkere spleet erop
  for (const [color, w, off] of [['rgba(190,160,130,0.45)', 5, 1], ['rgba(8,4,3,1)', 3.4, 0]]) {
    ctx.strokeStyle = color;
    const rnd = mulberry32(1500);
    for (let i = 0; i < 4; i++) {
      const a = rnd() * Math.PI * 2;
      crack(rnd, cx + Math.cos(a) * TW * 0.12 + off, cy + Math.sin(a) * TH * 0.12 + off, a, TW * 0.36, w, 2);
    }
  }
  // barsten die over de zijkant naar beneden lopen
  const rnd = mulberry32(1501);
  ctx.strokeStyle = 'rgba(8,5,3,0.95)';
  ctx.lineWidth = 2.6;
  for (const x of [cx - TW * 0.3, cx - TW * 0.08, cx + TW * 0.2, cx + TW * 0.38]) {
    const edgeY = cy + TH / 2 - Math.abs(x - cx) * (TH / TW);
    ctx.beginPath();
    ctx.moveTo(x, edgeY);
    ctx.lineTo(x + (rnd() - 0.5) * 6, edgeY + BD * 0.5);
    ctx.lineTo(x + (rnd() - 0.5) * 8, edgeY + BD);
    ctx.stroke();
  }
}

export function generateAnchor(scene) {
  for (const tier of [1, 2, 3]) canvasTexture(scene, `anchor${tier}`, ANCHOR.w, ANCHOR.h, (ctx) => drawAnchor(ctx, tier));
  canvasTexture(scene, 'cracks', TILE_TEX.w, TILE_TEX.h, drawCracks);
  // waarschuwing boven een barst
  canvasTexture(scene, 'warn', 30, 34, (ctx) => {
    poly(ctx, [{ x: 15, y: 2 }, { x: 28, y: 28 }, { x: 2, y: 28 }]);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
    poly(ctx, [{ x: 15, y: 4 }, { x: 26, y: 26 }, { x: 4, y: 26 }]);
    ctx.fillStyle = '#e8c070';
    ctx.fill();
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(13.5, 10, 3, 9);
    ctx.fillRect(13.5, 21, 3, 3);
  });
}
