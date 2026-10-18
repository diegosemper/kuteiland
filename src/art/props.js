// Boom en kist, getekend met paden en verlopen.
import { CONFIG } from '../config.js';
import { canvasTexture, poly, ellipse, mulberry32 } from './util.js';

const { tileW: TW, tileH: TH } = CONFIG.iso;

// ---------- boom ----------

export const TREE = { w: 440, h: 480, baseX: 220, baseY: 458 };

const BARK = { base: '#3b2d22', light: '#7d6752', dark: '#150f0b' };

// Een getaperde tak langs een kwadratische curve, met licht- en schaduwkant.
function limb(ctx, p0, c, p1, w0, w1) {
  const pts = [];
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    pts.push({
      x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
      y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
      w: w0 + (w1 - w0) * t,
    });
  }
  const L = [], R = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    let nx = -(b.y - a.y), ny = b.x - a.x;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    if (nx + ny > 0) { nx = -nx; ny = -ny; }   // n wijst naar het licht (linksboven)
    p.nx = nx; p.ny = ny;
    L.push({ x: p.x + nx * p.w / 2, y: p.y + ny * p.w / 2 });
    R.push({ x: p.x - nx * p.w / 2, y: p.y - ny * p.w / 2 });
  });
  poly(ctx, [...L, ...R.reverse()]);
  ctx.fillStyle = BARK.base;
  ctx.fill();

  ctx.lineCap = 'round';
  const edge = (side, color, alpha, widthF) => {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p.x + side * p.nx * p.w * 0.28, y = p.y + side * p.ny * p.w * 0.28;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(0.6, w0 * widthF);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  edge(1, BARK.light, 0.55, 0.22);
  edge(-1, BARK.dark, 0.6, 0.25);
}

function drawTree(ctx) {
  const rnd = mulberry32(4242);
  const { baseX: bx, baseY: by } = TREE;
  const leaves = [];

  function branch(x, y, ang, len, w, depth) {
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    const bend = (rnd() - 0.5) * len * 0.4;
    const c = { x: (x + ex) / 2 + Math.cos(ang + Math.PI / 2) * bend, y: (y + ey) / 2 + Math.sin(ang + Math.PI / 2) * bend };
    const wEnd = Math.max(0.7, w * 0.6);
    limb(ctx, { x, y }, c, { x: ex, y: ey }, w, wEnd);
    if (depth <= 0 || w < 1.2) {
      if (rnd() < 0.45 && ex < bx + 25) leaves.push({ x: ex, y: ey });
      return;
    }
    if (depth < 4 && rnd() < 0.14) return;   // afgebroken
    const n = rnd() < 0.3 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * (0.45 + rnd() * 0.35) + (rnd() - 0.5) * 0.25;
      // takken buigen een beetje terug omhoog
      const up = (-Math.PI / 2 - ang) * 0.12;
      branch(ex, ey, ang + spread + up, len * (0.66 + rnd() * 0.14), wEnd, depth - 1);
    }
  }

  // wortels over de grond
  [[Math.PI * 0.97, 46], [Math.PI * 0.05, 40], [Math.PI * 0.78, 30], [Math.PI * 0.28, 34], [Math.PI * 0.55, 18]]
    .forEach(([a, len]) => {
      const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len * 0.3 + 2;
      limb(ctx, { x: bx, y: by - 6 }, { x: (bx + ex) / 2, y: by - 3 }, { x: ex, y: ey }, 12, 1.5);
    });

  const topX = bx + 10, topY = by - 165;
  // takken eerst, stam eroverheen
  branch(topX, topY, -Math.PI / 2 - 0.55, 75, 10, 5);
  branch(topX, topY, -Math.PI / 2 + 0.15, 85, 10, 5);
  branch(topX, topY, -Math.PI / 2 + 0.85, 65, 8, 4);
  branch(bx + 2, by - 95, -Math.PI / 2 - 1.05, 60, 7, 3);
  branch(bx + 8, by - 125, -Math.PI / 2 + 1.1, 50, 6, 3);
  // een afgebroken stomp
  limb(ctx, { x: bx + 5, y: by - 60 }, { x: bx + 20, y: by - 66 }, { x: bx + 30, y: by - 64 }, 8, 6);
  ellipse(ctx, bx + 30, by - 64, 2.5, 3, '#6a5240');

  limb(ctx, { x: bx, y: by }, { x: bx - 10, y: by - 90 }, { x: topX, y: topY }, 26, 11);

  // schors-groeven en mos op de stam
  ctx.save();
  for (let i = 0; i < 26; i++) {
    const t = rnd();
    const y = by - 8 - t * 150;
    const x = bx - 6 + (rnd() - 0.5) * 14 * (1 - t * 0.5) + t * 6;
    ctx.strokeStyle = 'rgba(15,10,7,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (rnd() - 0.5) * 3, y - 6, x + (rnd() - 0.5) * 2, y - 10 - rnd() * 8);
    ctx.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const y = by - 4 - rnd() * 40;
    const x = bx - 12 + rnd() * 10;
    ellipse(ctx, x, y, 1 + rnd() * 1.6, 0.8 + rnd(), `rgba(${70 + rnd() * 20},${85 + rnd() * 20},${45},0.7)`);
  }
  ctx.restore();

  // het laatste beetje blad, alleen aan de linkerkant
  const leafCols = ['#3a4527', '#4b5631', '#5c6539', '#6c5d34', '#7a6a3a'];
  for (const p of leaves) {
    const n = 8 + Math.floor(rnd() * 10);
    for (let i = 0; i < n; i++) {
      const x = p.x + (rnd() - 0.5) * 20, y = p.y + (rnd() - 0.6) * 14;
      const rot = rnd() * Math.PI;
      ellipse(ctx, x + 0.8, y + 0.8, 3 + rnd() * 1.5, 1.6, 'rgba(10,12,6,0.5)', rot);
      ellipse(ctx, x, y, 2.5 + rnd() * 1.5, 1.4 + rnd() * 0.8, leafCols[Math.floor(rnd() * leafCols.length)], rot);
    }
  }

  // volume: rechts donkerder
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(bx - 110, 0, bx + 120, 0);
  g.addColorStop(0, 'rgba(255,235,210,0.07)');
  g.addColorStop(0.5, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TREE.w, TREE.h);
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- kist ----------

export const CHEST = { w: 76, h: 96, ox: 38, oy: 76 };
const CU = 0.2, CV = 0.13, CH = 24, LID = 9;

function P(u, v, h) {
  return { x: CHEST.ox + (u - v) * TW / 2, y: CHEST.oy + (u + v) * TH / 2 - h };
}

export function woodFace(ctx, pts, base, grainRnd, planks) {
  poly(ctx, pts);
  ctx.fillStyle = base;
  ctx.fill();
  ctx.save();
  poly(ctx, pts);
  ctx.clip();
  // houtnerf
  for (let i = 0; i < 26; i++) {
    const a = pts[0], b = pts[1], d = pts[3];
    const t = grainRnd(), s = grainRnd();
    const x = a.x + (d.x - a.x) * t + (b.x - a.x) * s;
    const y = a.y + (d.y - a.y) * t + (b.y - a.y) * s;
    const len = 4 + grainRnd() * 10;
    const dx = (b.x - a.x), dy = (b.y - a.y), L = Math.hypot(dx, dy) || 1;
    ctx.strokeStyle = grainRnd() < 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(255,220,180,0.08)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx / L * len, y + dy / L * len);
    ctx.stroke();
  }
  // plankranden
  ctx.strokeStyle = 'rgba(15,9,5,0.7)';
  ctx.lineWidth = 1;
  for (const [p, q] of planks) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
  ctx.restore();
  poly(ctx, pts);
  ctx.strokeStyle = 'rgba(12,7,4,0.85)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function band(ctx, pts) {
  poly(ctx, pts);
  ctx.fillStyle = '#2b2a2f';
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,155,170,0.25)';
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

export function rivet(ctx, p) {
  ellipse(ctx, p.x, p.y, 1.3, 1.3, '#5d5a63');
  ellipse(ctx, p.x - 0.4, p.y - 0.4, 0.5, 0.5, '#a9a4b0');
}

function drawChest(ctx, open) {
  const rnd = mulberry32(open ? 77 : 76);
  const left = '#6a4a30', right = '#45301e', top = '#7d5a3a';

  if (open) {
    // deksel staat rechtop tegen de achterkant
    const e = 0.012;
    const lid = [P(-CU - e, -CV, CH), P(CU + e, -CV, CH), P(CU + e, -CV - 0.03, CH + 30), P(-CU - e, -CV - 0.03, CH + 30)];
    woodFace(ctx, lid, '#3e2a1a', rnd, [[P(-CU, -CV, CH + 10), P(CU, -CV, CH + 10)], [P(-CU, -CV - 0.01, CH + 20), P(CU, -CV - 0.01, CH + 20)]]);
    band(ctx, [P(-CU + 0.03, -CV, CH), P(-CU + 0.055, -CV, CH), P(-CU + 0.055, -CV - 0.03, CH + 30), P(-CU + 0.03, -CV - 0.03, CH + 30)]);
    band(ctx, [P(CU - 0.055, -CV, CH), P(CU - 0.03, -CV, CH), P(CU - 0.03, -CV - 0.03, CH + 30), P(CU - 0.055, -CV - 0.03, CH + 30)]);
  }

  // zijkanten
  const lf = [P(-CU, CV, 0), P(CU, CV, 0), P(CU, CV, CH), P(-CU, CV, CH)];
  const rf = [P(CU, CV, 0), P(CU, -CV, 0), P(CU, -CV, CH), P(CU, CV, CH)];
  woodFace(ctx, lf, left, rnd, [[P(-CU, CV, 8), P(CU, CV, 8)], [P(-CU, CV, 16), P(CU, CV, 16)]]);
  woodFace(ctx, rf, right, rnd, [[P(CU, CV, 8), P(CU, -CV, 8)], [P(CU, CV, 16), P(CU, -CV, 16)]]);

  const topH = open ? CH : CH + LID;
  if (!open) {
    // dicht deksel
    const e = 0.012;
    const lidL = [P(-CU - e, CV + e, CH - 1), P(CU + e, CV + e, CH - 1), P(CU + e, CV + e, topH), P(-CU - e, CV + e, topH)];
    const lidR = [P(CU + e, CV + e, CH - 1), P(CU + e, -CV - e, CH - 1), P(CU + e, -CV - e, topH), P(CU + e, CV + e, topH)];
    const lidT = [P(-CU - e, -CV - e, topH), P(CU + e, -CV - e, topH), P(CU + e, CV + e, topH), P(-CU - e, CV + e, topH)];
    woodFace(ctx, lidL, '#73523a', rnd, []);
    woodFace(ctx, lidR, '#4c3522', rnd, []);
    woodFace(ctx, lidT, top, rnd, [[P(-CU, -CV + 0.087, topH), P(CU, -CV + 0.087, topH)], [P(-CU, -CV + 0.174, topH), P(CU, -CV + 0.174, topH)]]);
  } else {
    // open: donker binnenwerk
    const opening = [P(-CU, -CV, CH), P(CU, -CV, CH), P(CU, CV, CH), P(-CU, CV, CH)];
    poly(ctx, opening);
    ctx.fillStyle = '#0f0a07';
    ctx.fill();
    ctx.save();
    poly(ctx, opening);
    ctx.clip();
    poly(ctx, [P(-CU, -CV, CH), P(CU, -CV, CH), P(CU, -CV, CH - 14), P(-CU, -CV, CH - 14)]);
    ctx.fillStyle = '#2a1c12';
    ctx.fill();
    poly(ctx, [P(-CU, -CV, CH), P(-CU, CV, CH), P(-CU, CV, CH - 14), P(-CU, -CV, CH - 14)]);
    ctx.fillStyle = '#382517';
    ctx.fill();
    ctx.restore();
    poly(ctx, opening);
    ctx.strokeStyle = '#8a6a4a';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // ijzerbeslag
  for (const u of [-CU + 0.03, CU - 0.055]) {
    band(ctx, [P(u, CV, 0), P(u + 0.025, CV, 0), P(u + 0.025, CV, topH), P(u, CV, topH)]);
    rivet(ctx, P(u + 0.0125, CV, 4));
    rivet(ctx, P(u + 0.0125, CV, CH - 4));
  }
  for (const v of [CV - 0.03, -CV + 0.055]) {
    band(ctx, [P(CU, v, 0), P(CU, v - 0.025, 0), P(CU, v - 0.025, topH), P(CU, v, topH)]);
    rivet(ctx, P(CU, v - 0.0125, 4));
  }
  // slot
  const lk = [P(-0.025, CV + 0.002, CH - 9), P(0.025, CV + 0.002, CH - 9), P(0.025, CV + 0.002, CH + 3), P(-0.025, CV + 0.002, CH + 3)];
  poly(ctx, lk);
  ctx.fillStyle = '#8c7443';
  ctx.fill();
  ctx.strokeStyle = '#3a2d14';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  const kh = P(0, CV + 0.002, CH - 4);
  ellipse(ctx, kh.x, kh.y, 0.9, 1.2, '#140d05');
}

export function generateProps(scene) {
  canvasTexture(scene, 'tree', TREE.w, TREE.h, drawTree);
  canvasTexture(scene, 'chest', CHEST.w, CHEST.h, (ctx) => drawChest(ctx, false));
  canvasTexture(scene, 'chest_open', CHEST.w, CHEST.h, (ctx) => drawChest(ctx, true));
}
