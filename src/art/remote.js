// Graphics voor de verre eilanden: grondstof-aders, briefjes, de Kern en zijn Hoeder.
import { canvasTexture, poly, ellipse, mulberry32 } from './util.js';
import { iso, box } from './structures.js';
import { rivet } from './props.js';

export const NODE = { w: 120, h: 110, ox: 60, oy: 84 };

// Een hoopje stenen als voet
function mound(ctx, P, cols, rnd) {
  for (let i = 0; i < 9; i++) {
    const u = (rnd() - 0.5) * 0.5, v = (rnd() - 0.5) * 0.5;
    const r = 0.06 + rnd() * 0.07;
    box(ctx, P, u - r, u + r, v - r, v + r, 0, 6 + rnd() * 10, cols);
  }
}

function crystalCluster(ctx, cx, cy, n, size, cols, rnd) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (rnd() - 0.5) * 1.6;
    const len = size * (0.6 + rnd() * 0.6);
    const w = size * 0.18;
    const bx = cx + (rnd() - 0.5) * size * 0.6, by = cy + rnd() * 4;
    const tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len;
    const nx = Math.cos(a + Math.PI / 2) * w, ny = Math.sin(a + Math.PI / 2) * w;
    poly(ctx, [{ x: bx + nx, y: by + ny }, { x: tx, y: ty }, { x: bx - nx, y: by - ny }]);
    ctx.fillStyle = cols[0];
    ctx.fill();
    poly(ctx, [{ x: bx + nx, y: by + ny }, { x: tx, y: ty }, { x: bx, y: by }]);
    ctx.fillStyle = cols[1];
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,30,0.7)';
    ctx.lineWidth = 0.8;
    poly(ctx, [{ x: bx + nx, y: by + ny }, { x: tx, y: ty }, { x: bx - nx, y: by - ny }]);
    ctx.stroke();
  }
}

function glowAt(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawNode(ctx, kind, part) {
  const P = iso(NODE.ox, NODE.oy);
  const rnd = mulberry32(kind.length * 97 + (part === 'top' ? 1 : 0));
  const c = P(0, 0, 14);
  if (kind === 'wrak') {
    if (part === 'base') {
      mound(ctx, P, { left: '#3a2a22', right: '#261a14', top: '#4a3a30' }, rnd);
      // verbogen pijpen
      ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(c.x - 30, c.y + 8); ctx.quadraticCurveTo(c.x - 20, c.y - 10, c.x - 4, c.y - 4); ctx.stroke();
      return;
    }
    // roestige platen en een tandwiel
    for (let i = 0; i < 3; i++) {
      const x = c.x - 18 + i * 14, y = c.y - 8 - i * 6;
      poly(ctx, [{ x: x - 14, y: y + 6 }, { x: x + 4, y: y - 10 }, { x: x + 16, y: y - 2 }, { x: x + 2, y: y + 12 }]);
      ctx.fillStyle = ['#8a4a2a', '#a0583a', '#6a3418'][i];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.stroke();
      rivet(ctx, { x: x + 2, y: y });
    }
    ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(c.x + 10, c.y - 26, 10, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;
      ctx.fillStyle = '#5a3a2a';
      ctx.fillRect(c.x + 10 + Math.cos(a) * 13 - 2, c.y - 26 + Math.sin(a) * 13 - 2, 4, 4);
    }
    return;
  }
  const crystal = kind === 'kristalader';
  if (part === 'base') {
    mound(ctx, P, crystal ? { left: '#2a2432', right: '#1a1620', top: '#3a3444' } : { left: '#6a6878', right: '#4a4858', top: '#8a8898' }, rnd);
    return;
  }
  glowAt(ctx, c.x, c.y - 16, 40, crystal ? '155,107,255' : '240,230,190', 0.45);
  crystalCluster(ctx, c.x, c.y, 6, 36, crystal ? ['#5a37a8', '#b48cff'] : ['#b8b090', '#fff8e0'], rnd);
  if (!crystal) {
    for (let i = 0; i < 5; i++) {
      const x = c.x + (rnd() - 0.5) * 50, y = c.y - 10 - rnd() * 40;
      ctx.fillStyle = 'rgba(255,250,220,0.9)';
      ctx.beginPath();
      ctx.moveTo(x, y - 4); ctx.lineTo(x + 1, y - 1); ctx.lineTo(x + 4, y); ctx.lineTo(x + 1, y + 1);
      ctx.lineTo(x, y + 4); ctx.lineTo(x - 1, y + 1); ctx.lineTo(x - 4, y); ctx.lineTo(x - 1, y - 1);
      ctx.fill();
    }
  }
}

export const NOTE = { w: 60, h: 80, ox: 30, oy: 70 };

function drawNote(ctx) {
  // stenen tablet met ingekraste tekens
  const P = iso(NOTE.ox, NOTE.oy);
  box(ctx, P, -0.12, 0.12, -0.04, 0.04, 0, 44, { left: '#6e6a62', right: '#4a4640', top: '#8a867c' });
  ctx.strokeStyle = 'rgba(20,16,12,0.8)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const a = P(-0.09, 0.04, 36 - i * 6), b = P(0.06 + (i % 2) * 0.03, 0.04, 36 - i * 6);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  glowAt(ctx, NOTE.ox, NOTE.oy - 30, 22, '230,220,180', 0.25);
}

export const KERN = { w: 220, h: 260, ox: 110, oy: 214 };

function drawKern(ctx) {
  const P = iso(KERN.ox, KERN.oy);
  const rnd = mulberry32(2024);
  // gebroken sokkel
  const stone = { left: '#5a5c68', right: '#3c3e48', top: '#70727e' };
  box(ctx, P, -0.42, 0.42, -0.42, 0.42, 0, 14, stone);
  box(ctx, P, -0.3, 0.3, -0.3, 0.3, 14, 26, stone);
  // afgebroken zuilen
  for (const [u, v, h] of [[-0.38, -0.38, 90], [0.3, -0.38, 60], [-0.38, 0.3, 46]]) {
    box(ctx, P, u, u + 0.1, v, v + 0.1, 14, h, stone);
  }
  // kettingen die het hart vasthielden, nu gebroken
  ctx.strokeStyle = '#2a2a30';
  ctx.lineWidth = 3;
  for (const [u, v] of [[-0.33, -0.33], [0.35, -0.33]]) {
    const a = P(u, v, 80), b = P(0, 0, 100);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + 20, b.x + (u < 0 ? -18 : 18), b.y + 10); ctx.stroke();
  }
  // het hart: een zwevend kristal met een donkere scheur
  const c = P(0, 0, 120);
  glowAt(ctx, c.x, c.y, 100, '155,107,255', 0.55);
  glowAt(ctx, c.x, c.y, 40, '240,230,255', 0.6);
  poly(ctx, [{ x: c.x, y: c.y - 62 }, { x: c.x + 30, y: c.y - 6 }, { x: c.x, y: c.y + 52 }, { x: c.x - 30, y: c.y - 6 }]);
  const g = ctx.createLinearGradient(c.x - 30, c.y - 60, c.x + 30, c.y + 50);
  g.addColorStop(0, '#f0e6ff');
  g.addColorStop(0.5, '#b48cff');
  g.addColorStop(1, '#4a2a8a');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,10,60,0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  poly(ctx, [{ x: c.x, y: c.y - 62 }, { x: c.x + 30, y: c.y - 6 }, { x: c.x, y: c.y - 2 }]);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();
  // de breuk
  ctx.strokeStyle = '#0a0410';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(c.x - 4, c.y - 50); ctx.lineTo(c.x + 6, c.y - 20); ctx.lineTo(c.x - 6, c.y + 4); ctx.lineTo(c.x + 4, c.y + 40);
  ctx.stroke();
  for (let i = 0; i < 20; i++) ellipse(ctx, c.x + (rnd() - 0.5) * 120, c.y + (rnd() - 0.5) * 120, 1.2, 1.2, 'rgba(230,215,255,0.7)');
}

export const BOSS = { w: 240, h: 240, footX: 120, footY: 222 };

function drawBoss(ctx, frame) {
  const rnd = mulberry32(3030 + frame);
  const fx = BOSS.footX, fy = BOSS.footY;
  const cy = fy - 110;
  const sway = Math.sin(frame * Math.PI / 2) * 5;
  // slierten die de grond raken
  for (let i = 0; i < 9; i++) {
    const x0 = fx - 70 + i * 17 + (rnd() - 0.5) * 6;
    ctx.strokeStyle = `rgba(20,10,30,${0.55 + rnd() * 0.3})`;
    ctx.lineWidth = 5 + rnd() * 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, cy + 30);
    ctx.quadraticCurveTo(x0 + (rnd() - 0.5) * 30 + sway, cy + 70, x0 + (rnd() - 0.5) * 40, fy - rnd() * 6);
    ctx.stroke();
  }
  // lijf
  const g = ctx.createRadialGradient(fx - 20, cy - 40, 5, fx, cy, 100);
  g.addColorStop(0, '#2e2040');
  g.addColorStop(0.6, '#120a1c');
  g.addColorStop(1, '#05030a');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    const j = 1 + (rnd() - 0.5) * 0.14;
    const x = fx + Math.cos(a) * 78 * j + sway * 0.4, y = cy + Math.sin(a) * 66 * j;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(155,107,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // kristalgroei op de rug
  crystalCluster(ctx, fx - 30, cy - 50, 4, 40, ['#5a37a8', '#b48cff'], rnd);
  crystalCluster(ctx, fx + 30, cy - 46, 3, 34, ['#5a37a8', '#b48cff'], rnd);
  // gloeiende kern in de borst, gebarsten zoals die van de Kern
  glowAt(ctx, fx, cy + 4, 34, '180,140,255', 0.8);
  poly(ctx, [{ x: fx, y: cy - 16 }, { x: fx + 12, y: cy + 4 }, { x: fx, y: cy + 24 }, { x: fx - 12, y: cy + 4 }]);
  ctx.fillStyle = '#e2d0ff';
  ctx.fill();
  ctx.strokeStyle = '#0a0410';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(fx - 2, cy - 12); ctx.lineTo(fx + 3, cy + 4); ctx.lineTo(fx - 3, cy + 20); ctx.stroke();
  // ogen, te veel
  for (const [x, y, r] of [[-34, -20, 4], [-18, -30, 3], [22, -28, 4], [38, -14, 3], [-44, -2, 2.5], [46, 4, 2.5], [0, -40, 3.5]]) {
    glowAt(ctx, fx + x, cy + y, r * 4, '210,180,255', 0.8);
    ellipse(ctx, fx + x, cy + y, r, r * 0.8, '#f6eeff');
  }
}

export function generateRemote(scene) {
  for (const kind of ['wrak', 'kristalader', 'sterrenader']) {
    canvasTexture(scene, `node_${kind}_base`, NODE.w, NODE.h, (ctx) => drawNode(ctx, kind, 'base'));
    canvasTexture(scene, `node_${kind}_top`, NODE.w, NODE.h, (ctx) => drawNode(ctx, kind, 'top'));
  }
  canvasTexture(scene, 'note', NOTE.w, NOTE.h, drawNote);
  canvasTexture(scene, 'kern', KERN.w, KERN.h, drawKern);
  for (let f = 0; f < 4; f++) canvasTexture(scene, `boss${f}`, BOSS.w, BOSS.h, (ctx) => drawBoss(ctx, f));
}
