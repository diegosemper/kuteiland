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

// Klein isometrisch blokje voor bouwmateriaal
function isoCube(ctx, top, left, right, detail) {
  const c = { x: 32, y: 18 }, w = 22, h = 11, d = 20;
  const T = [{ x: c.x, y: c.y }, { x: c.x + w, y: c.y + h }, { x: c.x, y: c.y + 2 * h }, { x: c.x - w, y: c.y + h }];
  const L = [T[3], T[2], { x: T[2].x, y: T[2].y + d }, { x: T[3].x, y: T[3].y + d }];
  const R = [T[2], T[1], { x: T[1].x, y: T[1].y + d }, { x: T[2].x, y: T[2].y + d }];
  for (const [pts, col] of [[L, left], [R, right], [T, top]]) {
    poly(ctx, pts);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  detail?.(T, L, R);
}

function plankIcon(ctx) {
  isoCube(ctx, '#7a5a3c', '#5a4029', '#3e2b1c', (T, L, R) => {
    ctx.strokeStyle = 'rgba(20,12,6,0.7)';
    ctx.lineWidth = 1;
    for (const t of [0.25, 0.5, 0.75]) {
      ctx.beginPath();
      ctx.moveTo(T[0].x + (T[3].x - T[0].x) * t, T[0].y + (T[3].y - T[0].y) * t);
      ctx.lineTo(T[1].x + (T[2].x - T[1].x) * t, T[1].y + (T[2].y - T[1].y) * t);
      ctx.stroke();
    }
    for (const pts of [L, R]) {
      ctx.beginPath();
      ctx.moveTo((pts[0].x + pts[3].x) / 2, (pts[0].y + pts[3].y) / 2);
      ctx.lineTo((pts[1].x + pts[2].x) / 2, (pts[1].y + pts[2].y) / 2);
      ctx.stroke();
    }
  });
}

function stoneBlockIcon(ctx) {
  isoCube(ctx, '#827a72', '#5c5650', '#423d39', (T) => {
    ctx.strokeStyle = 'rgba(20,18,16,0.8)';
    ctx.lineWidth = 1;
    const m = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    for (const [a, b] of [[m(T[0], T[3], 0.5), m(T[1], T[2], 0.5)], [m(T[0], T[1], 0.5), m(T[3], T[2], 0.5)]]) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  });
}

function benchIcon(ctx) {
  ctx.fillStyle = '#3e2b1c';
  for (const x of [16, 44]) ctx.fillRect(x, 32, 5, 22);
  poly(ctx, [{ x: 8, y: 24 }, { x: 56, y: 24 }, { x: 56, y: 33 }, { x: 8, y: 33 }]);
  ctx.fillStyle = '#86643f';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#5a4029';
  ctx.fillRect(8, 30, 48, 3);
  // hamer erop
  ctx.strokeStyle = '#6b4a2e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(22, 21); ctx.lineTo(40, 12); ctx.stroke();
  ctx.fillStyle = '#4a4950';
  ctx.fillRect(36, 6, 10, 7);
}

function generatorIcon(ctx) {
  isoCube(ctx, '#1b1719', '#5b5550', '#3e3a37', (T) => {
    ctx.strokeStyle = 'rgba(155,107,255,0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(T[0].x - 8, T[0].y + 6); ctx.lineTo(T[0].x + 8, T[0].y + 6); ctx.stroke();
    poly(ctx, [{ x: 26, y: 26 }, { x: 38, y: 26 }, { x: 38, y: 34 }, { x: 26, y: 34 }]);
    ctx.fillStyle = '#8f8780';
    ctx.fill();
  });
}

function toolIcon(ctx, kind, tier) {
  // steel
  ctx.strokeStyle = '#3a2618';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(18, 54); ctx.lineTo(42, 16); ctx.stroke();
  ctx.strokeStyle = '#7a5434';
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(18, 54); ctx.lineTo(42, 16); ctx.stroke();
  const head = [null, ['#8a6a46', '#5a4029'], ['#8f8780', '#5c5650'], ['#b06a3e', '#5a2a14']][tier];
  ctx.fillStyle = head[0];
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 1.2;
  if (kind === 'axe') {
    poly(ctx, [{ x: 36, y: 12 }, { x: 52, y: 10 }, { x: 56, y: 26 }, { x: 44, y: 28 }, { x: 38, y: 22 }]);
  } else {
    ctx.beginPath();
    ctx.moveTo(22, 14);
    ctx.quadraticCurveTo(40, 4, 58, 20);
    ctx.lineTo(54, 22);
    ctx.quadraticCurveTo(40, 12, 26, 20);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = head[1];
  ctx.fillRect(38, 14, 6, 6);
}

function weaponIcon(ctx, tier) {
  ctx.lineCap = 'round';
  if (tier === 1) {
    // knuppel
    ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(16, 52); ctx.lineTo(44, 16); ctx.stroke();
    ctx.strokeStyle = '#7a5434'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(46, 14); ctx.stroke();
    ctx.strokeStyle = '#9a7450'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(30, 30); ctx.lineTo(44, 12); ctx.stroke();
    return;
  }
  if (tier === 2) {
    // puinhamer
    ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(18, 54); ctx.lineTo(40, 18); ctx.stroke();
    poly(ctx, [{ x: 26, y: 8 }, { x: 54, y: 22 }, { x: 48, y: 34 }, { x: 20, y: 20 }]);
    ctx.fillStyle = '#8a827a'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
    return;
  }
  // zwaarden
  const blade = tier === 3 ? ['#b06a3e', '#6a3418'] : tier === 5 ? ['#fff8e0', '#b8b090'] : ['#c9a6ff', '#5a37a8'];
  poly(ctx, [{ x: 48, y: 8 }, { x: 54, y: 10 }, { x: 26, y: 40 }, { x: 22, y: 36 }]);
  const g = ctx.createLinearGradient(22, 36, 54, 10);
  g.addColorStop(0, blade[1]); g.addColorStop(1, blade[0]);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(16, 34); ctx.lineTo(30, 46); ctx.stroke();
  ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(22, 42); ctx.lineTo(12, 54); ctx.stroke();
  if (tier >= 4) {
    const gl = ctx.createRadialGradient(38, 24, 1, 38, 24, 26);
    const rgb = tier === 5 ? '255,245,200' : '180,140,255';
    gl.addColorStop(0, `rgba(${rgb},0.45)`); gl.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gl; ctx.fillRect(0, 0, S, S);
  }
}

function wallIcon(ctx) {
  isoCube(ctx, '#7e766e', '#6a635c', '#48433f', (T, L, R) => {
    ctx.strokeStyle = 'rgba(15,12,10,0.7)';
    ctx.lineWidth = 1;
    for (const pts of [L, R]) {
      for (const t of [0.33, 0.66]) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x + (pts[3].x - pts[0].x) * t, pts[0].y + (pts[3].y - pts[0].y) * t);
        ctx.lineTo(pts[1].x + (pts[2].x - pts[1].x) * t, pts[1].y + (pts[2].y - pts[1].y) * t);
        ctx.stroke();
      }
    }
  });
}

function lampIcon(ctx, crystal) {
  const glow = ctx.createRadialGradient(36, 30, 2, 36, 30, 24);
  glow.addColorStop(0, crystal ? 'rgba(190,150,255,0.6)' : 'rgba(255,210,130,0.6)');
  glow.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = '#4a3422';
  ctx.fillRect(20, 10, 4, 48);
  ctx.fillRect(20, 10, 18, 3);
  if (crystal) {
    poly(ctx, [{ x: 36, y: 16 }, { x: 43, y: 28 }, { x: 36, y: 42 }, { x: 29, y: 28 }]);
    ctx.fillStyle = '#d9c2ff'; ctx.fill();
    ctx.strokeStyle = '#2a1d40'; ctx.lineWidth = 1.2; ctx.stroke();
  } else {
    ctx.fillStyle = '#ffd88a';
    ctx.fillRect(30, 18, 12, 18);
    ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 2;
    ctx.strokeRect(30, 18, 12, 18);
  }
}

function towerIcon(ctx) {
  ctx.fillStyle = '#5a4030';
  for (const x of [20, 40]) ctx.fillRect(x, 22, 4, 20);
  poly(ctx, [{ x: 14, y: 40 }, { x: 50, y: 40 }, { x: 46, y: 58 }, { x: 18, y: 58 }]);
  ctx.fillStyle = '#625b54'; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#86643f';
  ctx.fillRect(14, 18, 36, 5);
  ctx.strokeStyle = '#7a3f22'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(20, 14); ctx.quadraticCurveTo(32, 2, 44, 14); ctx.stroke();
  ellipse(ctx, 32, 10, 3, 3, '#c9a6ff');
}

function anchorIcon(ctx) {
  const glow = ctx.createRadialGradient(32, 34, 2, 32, 34, 22);
  glow.addColorStop(0, 'rgba(155,107,255,0.45)');
  glow.addColorStop(1, 'rgba(155,107,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#5a2e18';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(32, 12); ctx.lineTo(32, 54); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(18, 20); ctx.lineTo(46, 20); ctx.stroke();
  ctx.strokeStyle = '#a0583a';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(30, 14); ctx.lineTo(30, 52); ctx.stroke();
  ctx.strokeStyle = '#8a4a2a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(32, 9, 5, 5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#6e6862';
  ctx.fillRect(16, 52, 32, 6);
}

function bridgeIcon(ctx, star) {
  ctx.strokeStyle = star ? '#b48cff' : '#8a7a52';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(6, 24); ctx.quadraticCurveTo(32, 40, 58, 24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 40); ctx.quadraticCurveTo(32, 56, 58, 40); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const x = 10 + i * 9;
    const y = 30 + Math.sin((i / 5) * Math.PI) * 8;
    ctx.fillStyle = star ? '#e8e2ff' : ['#7a5a3c', '#5a4029'][i % 2];
    ctx.fillRect(x - 3, y, 7, 14);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
    ctx.strokeRect(x - 3, y, 7, 14);
  }
}

export function generateIcons(scene) {
  canvasTexture(scene, 'icon_brug', S, S, (ctx) => bridgeIcon(ctx, false));
  canvasTexture(scene, 'icon_sterrenbrug', S, S, (ctx) => bridgeIcon(ctx, true));
  canvasTexture(scene, 'icon_anker', S, S, anchorIcon);
  for (const tier of [1, 2, 3, 4, 5]) canvasTexture(scene, `icon_weapon${tier}`, S, S, (ctx) => weaponIcon(ctx, tier));
  canvasTexture(scene, 'icon_muur', S, S, wallIcon);
  canvasTexture(scene, 'icon_lantaarn', S, S, (ctx) => lampIcon(ctx, false));
  canvasTexture(scene, 'icon_kristallamp', S, S, (ctx) => lampIcon(ctx, true));
  canvasTexture(scene, 'icon_wachttoren', S, S, towerIcon);
  canvasTexture(scene, 'icon_vlonder', S, S, plankIcon);
  canvasTexture(scene, 'icon_puinblok', S, S, stoneBlockIcon);
  canvasTexture(scene, 'icon_werkbank', S, S, benchIcon);
  canvasTexture(scene, 'icon_steengenerator', S, S, generatorIcon);
  for (const kind of ['axe', 'pickaxe']) {
    for (const tier of [1, 2, 3]) canvasTexture(scene, `icon_${kind}${tier}`, S, S, (ctx) => toolIcon(ctx, kind, tier));
  }
  canvasTexture(scene, 'icon_wrakhout', S, S, wood);
  canvasTexture(scene, 'icon_puin', S, S, rubble);
  canvasTexture(scene, 'icon_roest', S, S, rust);
  canvasTexture(scene, 'icon_leegtekristal', S, S, crystal);
  canvasTexture(scene, 'icon_sterrenstof', S, S, stardust);
}
