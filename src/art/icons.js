// Iconen voor grondstoffen in de HUD en panelen (64x64).
import { canvasTexture, poly, ellipse } from './util.js';

const S = 64;

function wood(ctx) {
  ctx.save();
  ctx.translate(32, 34);
  ctx.rotate(-0.45);
  const g = ctx.createLinearGradient(0, -11, 0, 11);
  g.addColorStop(0, '#8a6a4c');
  g.addColorStop(0.5, '#5e4530');
  g.addColorStop(1, '#2f2217');
  ctx.fillStyle = g;
  ctx.fillRect(-22, -11, 40, 22);
  ctx.strokeStyle = 'rgba(20,12,6,0.6)';
  ctx.lineWidth = 1.2;
  for (const y of [-6, -1, 5]) {
    ctx.beginPath(); ctx.moveTo(-20, y); ctx.lineTo(14, y + 1); ctx.stroke();
  }
  ellipse(ctx, 18, 0, 6, 11, '#b08a62');
  ctx.strokeStyle = '#7a5a3c';
  ctx.lineWidth = 1;
  for (const r of [2, 4.5, 7.5]) {
    ctx.beginPath(); ctx.ellipse(18, 0, r * 0.55, r, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ellipse(ctx, -22, 0, 3, 11, '#2a1d12');
  ctx.restore();
}

function rubble(ctx) {
  const stones = [
    { pts: [[14, 44], [22, 30], [36, 32], [40, 46], [28, 52]], c: '#6e6862' },
    { pts: [[32, 40], [40, 24], [52, 28], [54, 44], [44, 50]], c: '#58524d' },
    { pts: [[22, 52], [28, 42], [40, 46], [36, 56], [26, 58]], c: '#7f7870' },
  ];
  for (const s of stones) {
    poly(ctx, s.pts.map(([x, y]) => ({ x, y })));
    ctx.fillStyle = s.c;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s.pts[0][0] + 2, s.pts[0][1] - 1);
    ctx.lineTo(s.pts[1][0] + 1, s.pts[1][1] + 2);
    ctx.strokeStyle = 'rgba(230,220,210,0.3)';
    ctx.stroke();
  }
}

function rust(ctx) {
  poly(ctx, [{ x: 12, y: 20 }, { x: 46, y: 14 }, { x: 54, y: 30 }, { x: 48, y: 50 }, { x: 20, y: 52 }, { x: 10, y: 38 }]);
  const g = ctx.createLinearGradient(10, 14, 54, 52);
  g.addColorStop(0, '#a5603a');
  g.addColorStop(0.5, '#7a3f22');
  g.addColorStop(1, '#4a2614');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  for (const [x, y, r] of [[24, 30, 4], [38, 40, 5], [42, 24, 3], [20, 44, 3]]) ellipse(ctx, x, y, r, r * 0.8, 'rgba(50,22,10,0.6)');
  for (const [x, y] of [[18, 24], [44, 20], [46, 44], [22, 46]]) {
    ellipse(ctx, x, y, 2.6, 2.6, '#3d342f');
    ellipse(ctx, x - 0.7, y - 0.7, 1, 1, '#9a8f86');
  }
}

function crystal(ctx) {
  const glow = ctx.createRadialGradient(32, 36, 2, 32, 36, 30);
  glow.addColorStop(0, 'rgba(160,110,255,0.55)');
  glow.addColorStop(1, 'rgba(160,110,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);
  const shard = (x, y, w, h, tilt) => {
    const tip = { x: x + tilt, y: y - h };
    const l = { x: x - w, y: y - h * 0.25 }, r = { x: x + w, y: y - h * 0.25 }, b = { x, y };
    poly(ctx, [tip, r, b]); ctx.fillStyle = '#5a37a8'; ctx.fill();
    poly(ctx, [tip, l, b]); ctx.fillStyle = '#9b6bff'; ctx.fill();
    poly(ctx, [tip, { x: x + tilt * 0.3, y: y - h * 0.3 }, l]); ctx.fillStyle = 'rgba(235,220,255,0.45)'; ctx.fill();
  };
  shard(22, 54, 7, 26, -5);
  shard(42, 54, 7, 28, 5);
  shard(32, 56, 9, 42, 0);
}

function stardust(ctx) {
  const star = (x, y, r, a) => {
    ctx.fillStyle = `rgba(240,228,180,${a})`;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  };
  const glow = ctx.createRadialGradient(32, 34, 1, 32, 34, 26);
  glow.addColorStop(0, 'rgba(240,228,180,0.45)');
  glow.addColorStop(1, 'rgba(240,228,180,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);
  star(32, 32, 16, 1);
  star(16, 20, 7, 0.8);
  star(48, 46, 8, 0.8);
  star(46, 18, 4, 0.6);
}

export function generateIcons(scene) {
  canvasTexture(scene, 'icon_wrakhout', S, S, wood);
  canvasTexture(scene, 'icon_puin', S, S, rubble);
  canvasTexture(scene, 'icon_roest', S, S, rust);
  canvasTexture(scene, 'icon_leegtekristal', S, S, crystal);
  canvasTexture(scene, 'icon_sterrenstof', S, S, stardust);
}
