// Bouwwerken die de speler zelf neerzet: werkbank en steengenerator.
import { CONFIG } from '../config.js';
import { canvasTexture, poly, ellipse, mulberry32 } from './util.js';
import { woodFace, band, rivet } from './props.js';

const { tileW: TW, tileH: TH } = CONFIG.iso;

// Isometrisch punt binnen een texture: u, v in tegels, h in pixels omhoog
export function iso(ox, oy) {
  return (u, v, h = 0) => ({ x: ox + (u - v) * TW / 2, y: oy + (u + v) * TH / 2 - h });
}

// Een blok (kist-vorm) met drie zichtbare vlakken
export function box(ctx, P, u0, u1, v0, v1, h0, h1, cols, texture) {
  const left = [P(u0, v1, h0), P(u1, v1, h0), P(u1, v1, h1), P(u0, v1, h1)];
  const right = [P(u1, v1, h0), P(u1, v0, h0), P(u1, v0, h1), P(u1, v1, h1)];
  const top = [P(u0, v0, h1), P(u1, v0, h1), P(u1, v1, h1), P(u0, v1, h1)];
  for (const [pts, c] of [[left, cols.left], [right, cols.right], [top, cols.top]]) {
    poly(ctx, pts);
    ctx.fillStyle = c;
    ctx.fill();
    if (texture) { ctx.save(); poly(ctx, pts); ctx.clip(); texture(pts); ctx.restore(); }
    poly(ctx, pts);
    ctx.strokeStyle = 'rgba(8,6,5,0.75)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  return { left, right, top };
}

// Spikkels voor steen
function speckle(ctx, pts, rnd, n, light) {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0);
    ellipse(ctx, x, y, 0.6 + rnd() * 1.4, 0.5 + rnd(), rnd() < 0.5 ? 'rgba(0,0,0,0.3)' : `rgba(255,255,255,${light})`);
  }
}

// ---------- werkbank ----------

export const WORKBENCH = { w: 120, h: 110, ox: 60, oy: 84 };

function drawWorkbench(ctx) {
  const P = iso(WORKBENCH.ox, WORKBENCH.oy);
  const rnd = mulberry32(501);
  const U = 0.27, V = 0.19, H = 30, T = 6;
  const legCols = { left: '#4a3422', right: '#33231a', top: '#5a4030' };
  // poten (achterste eerst)
  for (const [u, v] of [[-U + 0.02, -V + 0.02], [U - 0.07, -V + 0.02], [-U + 0.02, V - 0.07], [U - 0.07, V - 0.07]]) {
    box(ctx, P, u, u + 0.05, v, v + 0.05, 0, H - T, legCols);
  }
  // dwarsbalk
  box(ctx, P, -U + 0.04, U - 0.04, V - 0.06, V - 0.04, 8, 12, legCols);
  // blad
  const f = box(ctx, P, -U, U, -V, V, H - T, H, { left: '#6e4e33', right: '#4a3322', top: '#86643f' });
  woodFace(ctx, f.top, '#86643f', rnd, [
    [P(-U, -V + 0.127, H), P(U, -V + 0.127, H)],
    [P(-U, -V + 0.254, H), P(U, -V + 0.254, H)],
  ]);

  // zaag
  poly(ctx, [P(-0.2, -0.05, H + 0.5), P(0.08, -0.12, H + 0.5), P(0.1, -0.06, H + 0.5), P(-0.18, 0.02, H + 0.5)]);
  ctx.fillStyle = '#9a9aa2';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,20,24,0.8)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const a = P(-0.19 + i * 0.03, 0.015 - i * 0.008, H + 0.5);
    ctx.fillStyle = '#5c5c63';
    ctx.fillRect(a.x, a.y, 1, 1.5);
  }
  const hnd = P(0.12, -0.11, H + 1);
  ellipse(ctx, hnd.x, hnd.y, 5, 3, '#5a3a22', -0.4);

  // hamer
  const h0 = P(0.05, 0.1, H + 1), h1 = P(0.2, 0.02, H + 1);
  ctx.strokeStyle = '#6b4a2e';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(h0.x, h0.y); ctx.lineTo(h1.x, h1.y); ctx.stroke();
  const hh = P(0.2, 0.02, H + 3);
  ctx.fillStyle = '#3d3c42';
  ctx.fillRect(hh.x - 4, hh.y - 2, 8, 4);
  ctx.fillStyle = 'rgba(200,200,210,0.4)';
  ctx.fillRect(hh.x - 4, hh.y - 2, 8, 1);

  // krullen
  for (let i = 0; i < 7; i++) {
    const p = P(-0.2 + rnd() * 0.3, 0.05 + rnd() * 0.12, H + 0.5);
    ctx.strokeStyle = 'rgba(200,160,110,0.8)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5 + rnd() * 1.5, 0, Math.PI * 1.4);
    ctx.stroke();
  }
}

// ---------- steengenerator ----------

export const GENERATOR = { w: 140, h: 120, ox: 70, oy: 86 };
export const GEN_STONE = { w: 64, h: 70, ox: 32, oy: 50 };

function drawGenerator(ctx) {
  const P = iso(GENERATOR.ox, GENERATOR.oy);
  const rnd = mulberry32(611);
  const U = 0.32, V = 0.32, H = 16, W = 0.07;
  const stone = { left: '#5b5550', right: '#3e3a37', top: '#6e6862' };
  const tex = (pts) => speckle(ctx, pts, rnd, 40, 0.12);

  // achterwanden
  box(ctx, P, -U, U, -V, -V + W, 0, H, stone, tex);
  box(ctx, P, -U, -U + W, -V, V, 0, H, stone, tex);
  // bodem van de kuil
  poly(ctx, [P(-U + W, -V + W, 2), P(U - W, -V + W, 2), P(U - W, V - W, 2), P(-U + W, V - W, 2)]);
  ctx.fillStyle = '#1b1719';
  ctx.fill();

  // leegte-goot achterin: daar komt het vandaan
  const g0 = P(-U + W + 0.01, -V + W + 0.02, 3), g1 = P(U - W - 0.01, -V + W + 0.02, 3);
  const grad = ctx.createLinearGradient(g0.x, g0.y, g1.x, g1.y);
  grad.addColorStop(0, 'rgba(155,107,255,0.9)');
  grad.addColorStop(1, 'rgba(90,55,170,0.5)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(g0.x, g0.y); ctx.lineTo(g1.x, g1.y); ctx.stroke();
  ctx.strokeStyle = 'rgba(230,215,255,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(g0.x, g0.y - 0.5); ctx.lineTo(g1.x, g1.y - 0.5); ctx.stroke();

  // voorwanden
  box(ctx, P, U - W, U, -V, V, 0, H, stone, tex);
  box(ctx, P, -U, U, V - W, V, 0, H, stone, tex);

  // roestige banden en klinknagels
  for (const u of [-0.12, 0.12]) {
    band(ctx, [P(u, V, 0), P(u + 0.03, V, 0), P(u + 0.03, V, H), P(u, V, H)]);
    rivet(ctx, P(u + 0.015, V, H / 2));
  }
  band(ctx, [P(U, 0.05, 0), P(U, 0.02, 0), P(U, 0.02, H), P(U, 0.05, H)]);
}

function drawGenStone(ctx) {
  const P = iso(GEN_STONE.ox, GEN_STONE.oy);
  const rnd = mulberry32(733);
  const S = 0.16, H = 26;
  const f = box(ctx, P, -S, S, -S, S, 0, H, { left: '#77706a', right: '#504a46', top: '#8f8780' });
  for (const pts of [f.left, f.right, f.top]) {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    speckle(ctx, pts, rnd, 50, 0.18);
    // barsten
    ctx.strokeStyle = 'rgba(20,16,14,0.7)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 2; i++) {
      const a = pts[Math.floor(rnd() * 4)];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + (rnd() - 0.5) * 14, a.y + (rnd() - 0.3) * 12);
      ctx.lineTo(a.x + (rnd() - 0.5) * 20, a.y + (rnd() - 0.3) * 18);
      ctx.stroke();
    }
    ctx.restore();
  }
  // paarse adertjes: het is geen gewone steen
  ctx.strokeStyle = 'rgba(155,107,255,0.55)';
  ctx.lineWidth = 0.9;
  const a = P(-S, S, 6), b = P(0, S, 14), c = P(S * 0.6, S, 20);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.stroke();
}

export function generateStructures(scene) {
  canvasTexture(scene, 'workbench', WORKBENCH.w, WORKBENCH.h, drawWorkbench);
  canvasTexture(scene, 'generator', GENERATOR.w, GENERATOR.h, drawGenerator);
  canvasTexture(scene, 'gen_stone', GEN_STONE.w, GEN_STONE.h, drawGenStone);
}

