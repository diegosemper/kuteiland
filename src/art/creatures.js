// Nachtwezens: schimmige kruipers uit de leegte, met gloeiende ogen. Elk heeft een paar kruipframes.
import { canvasTexture, ellipse, mulberry32 } from './util.js';

export const CREATURES = {
  crawler: { w: 90, h: 70, footX: 45, footY: 62, frames: 4 },
  brute: { w: 130, h: 116, footX: 65, footY: 106, frames: 4 },
};

function leg(ctx, x0, y0, kx, ky, x1, y1, w) {
  ctx.strokeStyle = '#0a0610';
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(kx, ky);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function eyes(ctx, pts, r) {
  for (const [x, y] of pts) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
    g.addColorStop(0, 'rgba(200,160,255,0.9)');
    g.addColorStop(1, 'rgba(150,90,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    ellipse(ctx, x, y, r, r * 0.8, '#f2e8ff');
  }
}

function body(ctx, cx, cy, rx, ry, rnd) {
  // donker lijf met paarse randglans
  const g = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.5, 2, cx, cy, rx * 1.2);
  g.addColorStop(0, '#2a1d3a');
  g.addColorStop(0.6, '#120b1a');
  g.addColorStop(1, '#07040a');
  ctx.fillStyle = g;
  ctx.beginPath();
  // rafelige rand
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const j = 1 + (rnd() - 0.5) * 0.18;
    const x = cx + Math.cos(a) * rx * j, y = cy + Math.sin(a) * ry * j;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(155,107,255,0.45)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

// Rook/slierten die omhoog kringelen
function wisps(ctx, cx, cy, n, h, rnd) {
  for (let i = 0; i < n; i++) {
    const x = cx + (rnd() - 0.5) * 30;
    ctx.strokeStyle = `rgba(40,25,60,${0.35 + rnd() * 0.3})`;
    ctx.lineWidth = 2 + rnd() * 2;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.quadraticCurveTo(x + (rnd() - 0.5) * 16, cy - h * 0.5, x + (rnd() - 0.5) * 20, cy - h);
    ctx.stroke();
  }
}

function drawCrawler(ctx, frame) {
  const rnd = mulberry32(300 + frame);
  const { footX: fx, footY: fy } = CREATURES.crawler;
  const ph = (frame / 4) * Math.PI * 2;
  const cy = fy - 20;
  wisps(ctx, fx - 4, cy - 6, 3, 18, rnd);
  // zes poten, afwisselend
  for (let i = 0; i < 3; i++) {
    const off = Math.sin(ph + i * 2.1) * 5;
    const dx = 10 + i * 9;
    leg(ctx, fx - 6, cy, fx - dx - 4, cy - 12 + off * 0.3, fx - dx - 10 + off, fy - Math.max(0, off) * 0.5, 2.6);
    leg(ctx, fx + 6, cy, fx + dx + 4, cy - 12 - off * 0.3, fx + dx + 10 - off, fy - Math.max(0, -off) * 0.5, 2.6);
  }
  body(ctx, fx, cy, 20, 13, rnd);
  // gebogen rug
  ctx.strokeStyle = 'rgba(80,55,110,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(fx - 2, cy + 4, 14, Math.PI * 1.15, Math.PI * 1.8);
  ctx.stroke();
  eyes(ctx, [[fx + 9, cy - 3], [fx + 15, cy - 1]], 1.8);
}

function drawBrute(ctx, frame) {
  const rnd = mulberry32(500 + frame);
  const { footX: fx, footY: fy } = CREATURES.brute;
  const ph = (frame / 4) * Math.PI * 2;
  const cy = fy - 42;
  wisps(ctx, fx, cy - 26, 5, 30, rnd);
  // poten
  for (const [side, o] of [[-1, 0], [1, Math.PI]]) {
    const off = Math.sin(ph + o) * 6;
    leg(ctx, fx + side * 14, cy + 16, fx + side * 26, cy + 30, fx + side * 22 + off, fy - Math.max(0, off * side) * 0.4, 7);
  }
  // armen, lang en hangend
  for (const side of [-1, 1]) {
    const off = Math.sin(ph + (side > 0 ? 0 : Math.PI)) * 5;
    leg(ctx, fx + side * 24, cy - 10, fx + side * 42, cy + 8, fx + side * 38 + off, fy - 6, 6);
    // klauwen
    for (let k = -1; k <= 1; k++) leg(ctx, fx + side * 38 + off, fy - 6, fx + side * (40 + k * 3) + off, fy - 2, fx + side * (42 + k * 4) + off, fy, 1.5);
  }
  body(ctx, fx, cy, 34, 30, rnd);
  // hoorns
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#1a1024';
    ctx.beginPath();
    ctx.moveTo(fx + side * 10, cy - 24);
    ctx.quadraticCurveTo(fx + side * 26, cy - 44, fx + side * 18, cy - 54);
    ctx.quadraticCurveTo(fx + side * 18, cy - 38, fx + side * 4, cy - 26);
    ctx.closePath();
    ctx.fill();
  }
  // gloeiende scheur in de borst
  ctx.strokeStyle = 'rgba(170,120,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fx - 4, cy - 4); ctx.lineTo(fx + 2, cy + 6); ctx.lineTo(fx - 2, cy + 14);
  ctx.stroke();
  eyes(ctx, [[fx + 8, cy - 14], [fx + 18, cy - 12], [fx + 13, cy - 20]], 2.4);
}

export function generateCreatures(scene) {
  for (let f = 0; f < 4; f++) {
    canvasTexture(scene, `crawler${f}`, CREATURES.crawler.w, CREATURES.crawler.h, (ctx) => drawCrawler(ctx, f));
    canvasTexture(scene, `brute${f}`, CREATURES.brute.w, CREATURES.brute.h, (ctx) => drawBrute(ctx, f));
  }
}
