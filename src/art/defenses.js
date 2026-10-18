// Verdediging: puinmuur, lantaarn, kristallamp, wachttoren. Plus het zakje dat je achterlaat als je doodgaat.
import { canvasTexture, poly, ellipse, mulberry32 } from './util.js';
import { iso, box } from './structures.js';
import { band, rivet } from './props.js';

function speckle(ctx, pts, rnd, n) {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let i = 0; i < n; i++) {
    ellipse(ctx, x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), 0.6 + rnd() * 1.6, 0.5 + rnd(),
      rnd() < 0.55 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.12)');
  }
}

// Steenlagen op een zijvlak (rijen met verspringende voegen)
function courses(ctx, P, side, a0, a1, h0, h1, rows, rnd) {
  ctx.strokeStyle = 'rgba(15,12,10,0.7)';
  ctx.lineWidth = 0.9;
  const rh = (h1 - h0) / rows;
  for (let r = 1; r < rows; r++) {
    const h = h0 + r * rh;
    const p = side === 'left' ? [P(a0, a1, h), P(-a0, a1, h)] : [P(a1, a0, h), P(a1, -a0, h)];
    ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y); ctx.stroke();
  }
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < 4; k++) {
      const t = -0.38 + ((k + (r % 2) * 0.5) / 4) * 0.76 + rnd() * 0.04;
      const hA = h0 + r * rh, hB = hA + rh;
      const [p, q] = side === 'left' ? [P(t, a1, hA), P(t, a1, hB)] : [P(a1, t, hA), P(a1, t, hB)];
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    }
  }
}

export const WALL = { w: 140, h: 130, ox: 70, oy: 92 };

function drawWall(ctx) {
  const P = iso(WALL.ox, WALL.oy);
  const rnd = mulberry32(1201);
  const A = 0.42, H = 40;
  const cols = { left: '#6a635c', right: '#48433f', top: '#7e766e' };
  const f = box(ctx, P, -A, A, -A, A, 0, H, cols, (pts) => speckle(ctx, pts, rnd, 60));
  courses(ctx, P, 'left', -0.42, A, 0, H, 4, rnd);
  courses(ctx, P, 'right', -0.42, A, 0, H, 4, rnd);
  // kantelen
  for (const [u, v] of [[-0.3, -0.3], [0.1, -0.3], [-0.3, 0.1], [0.1, 0.1], [0.28, -0.1], [-0.1, 0.28]]) {
    box(ctx, P, u, u + 0.16, v, v + 0.16, H, H + 9, cols, (pts) => speckle(ctx, pts, rnd, 6));
  }
  return f;
}

export const LAMP = { w: 70, h: 140, ox: 35, oy: 128 };

function drawLamp(ctx, lit, crystal) {
  const P = iso(LAMP.ox, LAMP.oy);
  // voetstuk
  box(ctx, P, -0.08, 0.08, -0.08, 0.08, 0, 8, { left: '#56504a', right: '#3c3834', top: '#6a635c' });
  // paal
  box(ctx, P, -0.025, 0.025, -0.025, 0.025, 8, 92, { left: '#5a4030', right: '#3c2a1e', top: '#6e4e3a' });
  // arm
  const a = P(0, 0, 88), b = P(0.12, -0.04, 88);
  ctx.strokeStyle = '#3c2a1e';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x + 6, b.y); ctx.stroke();
  // lantaarn hangt aan de arm
  const lx = b.x + 6, ly = b.y + 4;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(lx, b.y); ctx.lineTo(lx, ly); ctx.stroke();
  const glass = crystal ? (lit ? '#d9c2ff' : '#5a4380') : (lit ? '#ffd88a' : '#5b5040');
  if (lit) {
    const g = ctx.createRadialGradient(lx, ly + 10, 1, lx, ly + 10, 22);
    g.addColorStop(0, crystal ? 'rgba(190,150,255,0.85)' : 'rgba(255,210,130,0.85)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 24, ly - 12, 48, 46);
  }
  if (crystal) {
    poly(ctx, [{ x: lx, y: ly + 1 }, { x: lx + 6, y: ly + 10 }, { x: lx, y: ly + 21 }, { x: lx - 6, y: ly + 10 }]);
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,50,0.9)';
    ctx.stroke();
  } else {
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(lx - 6, ly, 12, 3);
    ctx.fillRect(lx - 6, ly + 17, 12, 3);
    ctx.fillStyle = glass;
    ctx.fillRect(lx - 5, ly + 3, 10, 14);
    ctx.strokeStyle = '#2a2a2e';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(lx - 5, ly + 3, 10, 14);
    ctx.beginPath(); ctx.moveTo(lx, ly + 3); ctx.lineTo(lx, ly + 17); ctx.stroke();
  }
}

export const TOWER = { w: 130, h: 200, ox: 65, oy: 164 };

function drawTower(ctx) {
  const P = iso(TOWER.ox, TOWER.oy);
  const rnd = mulberry32(1301);
  const stone = { left: '#625b54', right: '#433e3a', top: '#756d65' };
  // stenen voet
  box(ctx, P, -0.26, 0.26, -0.26, 0.26, 0, 46, stone, (pts) => speckle(ctx, pts, rnd, 50));
  courses(ctx, P, 'left', -0.26, 0.26, 0, 46, 4, rnd);
  courses(ctx, P, 'right', -0.26, 0.26, 0, 46, 4, rnd);
  // houten palen
  const wood = { left: '#5a4030', right: '#3c2a1e', top: '#6e4e3a' };
  for (const [u, v] of [[-0.22, -0.22], [0.16, -0.22], [-0.22, 0.16], [0.16, 0.16]]) {
    box(ctx, P, u, u + 0.06, v, v + 0.06, 46, 96, wood);
  }
  // platform
  box(ctx, P, -0.3, 0.3, -0.3, 0.3, 96, 104, { left: '#6e4e33', right: '#4a3322', top: '#86643f' });
  // kruisboog van roest
  const c = P(0, 0, 112);
  ctx.strokeStyle = '#7a3f22';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(c.x - 18, c.y + 4);
  ctx.quadraticCurveTo(c.x, c.y - 10, c.x + 18, c.y + 4);
  ctx.stroke();
  ctx.strokeStyle = '#4a4a50';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(c.x - 4, c.y + 10); ctx.lineTo(c.x + 14, c.y - 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(220,220,230,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(c.x - 18, c.y + 4); ctx.lineTo(c.x - 2, c.y + 8); ctx.lineTo(c.x + 18, c.y + 4); ctx.stroke();
  // kristal-oog dat richt
  ellipse(ctx, c.x + 14, c.y - 6, 3, 3, '#c9a6ff');
  band(ctx, [P(-0.26, 0.26, 20), P(0.26, 0.26, 20), P(0.26, 0.26, 26), P(-0.26, 0.26, 26)]);
  rivet(ctx, P(-0.15, 0.26, 23));
  rivet(ctx, P(0.15, 0.26, 23));
}

export const GRAVE = { w: 60, h: 50, ox: 30, oy: 40 };

function drawGrave(ctx) {
  // een knapzak met wat er nog over is
  const cx = 30, cy = 34;
  ellipse(ctx, cx, cy + 3, 18, 6, 'rgba(0,0,0,0.35)');
  const g = ctx.createRadialGradient(cx - 6, cy - 10, 2, cx, cy - 4, 22);
  g.addColorStop(0, '#7a6450');
  g.addColorStop(1, '#3a2c20');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 2);
  ctx.quadraticCurveTo(cx - 20, cy - 16, cx - 4, cy - 20);
  ctx.lineTo(cx + 4, cy - 20);
  ctx.quadraticCurveTo(cx + 20, cy - 16, cx + 16, cy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,12,6,0.8)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // touw
  ctx.strokeStyle = '#a08a5a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 6, cy - 19); ctx.lineTo(cx + 6, cy - 19); ctx.stroke();
  ellipse(ctx, cx, cy - 23, 5, 3, '#5a4632');
  // paarse gloed: de leegte heeft er een hand op
  ctx.strokeStyle = 'rgba(155,107,255,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy - 6, 15, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
}

export function generateDefenses(scene) {
  canvasTexture(scene, 'wall', WALL.w, WALL.h, drawWall);
  canvasTexture(scene, 'lamp_off', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, false, false));
  canvasTexture(scene, 'lamp_on', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, true, false));
  canvasTexture(scene, 'crystallamp_off', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, false, true));
  canvasTexture(scene, 'crystallamp_on', LAMP.w, LAMP.h, (ctx) => drawLamp(ctx, true, true));
  canvasTexture(scene, 'tower', TOWER.w, TOWER.h, drawTower);
  canvasTexture(scene, 'grave', GRAVE.w, GRAVE.h, drawGrave);
}
