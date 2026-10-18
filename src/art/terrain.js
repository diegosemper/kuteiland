// Grond en rots. Alle patronen gebruiken wereldcoördinaten, zodat tegels naadloos op elkaar aansluiten.
import { CONFIG } from '../config.js';
import { gridToScreen } from '../iso.js';
import { canvasTexture, hex, mix, mul, smooth, css, putPx, ellipse, mulberry32 } from './util.js';

const { tileW: TW, tileH: TH, blockDepth: BD } = CONFIG.iso;
const SLOPE = TH / TW;
const PAD = 3;     // overlap tussen tegels, voorkomt naden
const EXTRA = 8;   // ruimte voor de rafelige onderrand van de zijkant

export const TILE_TEX = {
  w: TW + PAD * 2,
  h: TH + BD + EXTRA + PAD * 2,
  cx: TW / 2 + PAD,
  cy: TH / 2 + PAD,
};

const C = {
  grassDark: hex('#28331e'), grassLight: hex('#56623a'), grassDry: hex('#6e6743'),
  dirtDark: hex('#33271d'), dirtLight: hex('#665240'),
  soilDark: hex('#22180f'), soilLight: hex('#5a4330'),
  stone: hex('#77706a'), stoneDark: hex('#3a3633'),
  rockDark: hex('#1d1719'), rockLight: hex('#6e5f52'),
  voidTint: hex('#170d2b'), rim: hex('#6f4fb0'),
  root: '#22170f',
};

export function grassAmount(N, wx, wy) {
  return smooth(0.42, 0.58, N.fbm(wx * 0.011, wy * 0.022, 4));
}

function topColor(N, wx, wy) {
  const grass = grassAmount(N, wx, wy);
  const mid = N.fbm(wx * 0.05, wy * 0.1, 2);
  const fine = N.noise(wx * 0.5, wy * 1.0);
  const dirt = mix(C.dirtDark, C.dirtLight, 0.15 + 0.6 * mid + 0.25 * fine);
  let grassCol = mix(C.grassDark, C.grassLight, 0.1 + 0.55 * mid + 0.35 * fine);
  grassCol = mix(grassCol, C.grassDry, 0.55 * smooth(0.45, 0.75, N.noise(wx * 0.018 + 5, wy * 0.036)));
  const col = mix(dirt, grassCol, grass);
  // reliëf: licht valt van linksboven
  const b1 = N.fbm((wx - 1.5) * 0.07, (wy - 1.5) * 0.14, 2);
  const b2 = N.fbm((wx + 1.5) * 0.07, (wy + 1.5) * 0.14, 2);
  return mul(col, 0.95 + (b1 - b2) * 2.5 + (fine - 0.5) * 0.08);
}

function sideColor(N, wx, wy, depth, left) {
  const t = depth / BD;
  const strata = N.fbm(wx * 0.025, wy * 0.2, 3);
  const fine = N.noise(wx * 0.6, wy * 0.6);
  let col = mix(C.soilDark, C.soilLight, 0.15 + 0.65 * strata + 0.2 * fine);

  // stenen in de aarde
  const st = N.noise(wx * 0.11 + 31, wy * 0.22 + 7);
  if (st > 0.7) {
    const k = smooth(0.7, 0.75, st);
    const stoneCol = mix(C.stoneDark, C.stone, 0.3 + 0.5 * N.noise(wx * 0.4, wy * 0.4) + 0.3 * (st - 0.7));
    col = mix(col, stoneCol, k);
  }
  // wortels
  if (Math.abs(N.noise(wx * 0.07 + 13, wy * 0.025) - 0.5) < 0.018) col = mul(col, 0.5);

  // gras dat over de rand hangt
  const g = grassAmount(N, wx, wy - depth);
  const lip = g * (3 + N.noise(wx * 0.3, 1.7) * 8);
  if (depth < lip) {
    col = mul(mix(C.grassDark, C.grassLight, 0.2 + 0.4 * fine), depth < lip - 1.5 ? 0.85 : 0.6);
  }
  return mul(col, (left ? 1.0 : 0.62) * (1 - 0.35 * t));
}

function decorateTop(ctx, s, N, rnd) {
  const { cx, cy } = TILE_TEX;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - TH / 2 - 1);
  ctx.lineTo(cx + TW / 2 + 1, cy);
  ctx.lineTo(cx, cy + TH / 2 + 1);
  ctx.lineTo(cx - TW / 2 - 1, cy);
  ctx.closePath();
  ctx.clip();

  const greens = [hex('#3d4a2a'), hex('#56623a'), hex('#6b7448'), hex('#2c3820'), hex('#7a7350')];
  for (let i = 0; i < 140; i++) {
    const lx = (rnd() * 2 - 1) * TW / 2;
    const ly = (rnd() * 2 - 1) * TH / 2;
    if (Math.abs(lx) / (TW / 2) + Math.abs(ly) / (TH / 2) > 1) continue;
    const x = cx + lx, y = cy + ly;
    const g = grassAmount(N, s.x + lx, s.y + ly);
    if (rnd() < g) {
      const len = 3 + rnd() * 7;
      const lean = (rnd() - 0.5) * 5;
      const col = greens[Math.floor(rnd() * greens.length)];
      ctx.strokeStyle = css(col, 0.9);
      ctx.lineWidth = 0.8 + rnd() * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + lean * 0.2, y - len * 0.6, x + lean, y - len);
      ctx.stroke();
    } else if (rnd() < 0.12) {
      const r = 1 + rnd() * 2.2;
      ellipse(ctx, x + 0.8, y + 0.6, r, r * 0.6, 'rgba(10,8,6,0.55)');
      const sc = mix(hex('#4d4640'), hex('#857c72'), rnd());
      ellipse(ctx, x, y, r, r * 0.6, css(sc));
      ellipse(ctx, x - r * 0.3, y - r * 0.2, r * 0.45, r * 0.25, 'rgba(220,210,200,0.35)');
    }
  }
  ctx.restore();
}

// Eén grondblok op positie (gx, gy)
export function tileTexture(scene, key, gx, gy, N) {
  const s = gridToScreen(gx, gy);
  const { w, h, cx, cy } = TILE_TEX;
  canvasTexture(scene, key, w, h, (ctx) => {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const lx = px - cx + 0.5, ly = py - cy + 0.5;
        const wx = s.x + lx, wy = s.y + ly;
        let col = null;
        if (Math.abs(lx) / (TW / 2) + Math.abs(ly) / (TH / 2) <= 1 + 2.5 / (TH / 2)) {
          col = topColor(N, wx, wy);
        } else if (ly > 0 && Math.abs(lx) <= TW / 2 + 1) {
          const edge = lx < 0 ? (lx + TW / 2) * SLOPE : (TW / 2 - lx) * SLOPE;
          const depth = ly - edge;
          const jag = (N.noise(wx * 0.15, 3.7) - 0.5) * 8 + (N.noise(wx * 0.6, 9.1) - 0.5) * 3;
          if (depth > 0 && depth <= BD + jag) col = sideColor(N, wx, wy, depth, lx < 0);
        }
        if (col) putPx(d, (py * w + px) * 4, col);
      }
    }
    ctx.putImageData(img, 0, 0);
    decorateTop(ctx, s, N, mulberry32((gx * 73856093) ^ (gy * 19349663)));
  });
}

// De rotsklomp onder het hele eiland, als één texture op halve resolutie.
export function undersideTexture(scene, key, tiles, dist, N, rnd) {
  const R = 0.5;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, sumX = 0;
  const placed = tiles.map((t) => {
    const s = gridToScreen(t.gx, t.gy);
    minX = Math.min(minX, s.x - TW / 2);
    maxX = Math.max(maxX, s.x + TW / 2);
    minY = Math.min(minY, s.y);
    sumX += s.x;
    const d = dist.get(`${t.gx},${t.gy}`) || 1;
    return { s, depth: 20 + (d - 1) * 60 + rnd() * 35 };
  });
  const centerX = sumX / tiles.length;
  const halfW = (maxX - minX) / 2;

  const cols = Math.ceil((maxX - minX) * R) + 1;
  const top = new Float32Array(cols).fill(Infinity);
  const raw = new Float32Array(cols).fill(-Infinity);
  const bot = new Float32Array(cols).fill(-Infinity);

  for (let c = 0; c < cols; c++) {
    const wx = minX + c / R;
    for (const p of placed) {
      const dx = Math.abs(wx - p.s.x);
      if (dx > TW / 2) continue;
      const edgeY = p.s.y + TH / 2 - dx * SLOPE + BD - 6;
      raw[c] = Math.max(raw[c], edgeY);
      bot[c] = Math.max(bot[c], edgeY + p.depth * (1 - (dx / (TW / 2)) ** 2 * 0.6));
      top[c] = Math.min(top[c], p.s.y);
    }
  }
  // gladstrijken, dan rafelig maken
  for (let pass = 0; pass < 3; pass++) {
    const copy = bot.slice();
    for (let c = 0; c < cols; c++) {
      if (copy[c] === -Infinity) continue;
      let sum = 0, n = 0;
      for (let k = -8; k <= 8; k++) {
        const v = copy[c + k];
        if (v !== undefined && v !== -Infinity) { sum += v; n++; }
      }
      bot[c] = sum / n;
    }
  }
  let maxBot = 0;
  for (let c = 0; c < cols; c++) {
    if (bot[c] === -Infinity) continue;
    const wx = minX + c / R;
    let b = bot[c] + (N.fbm(wx * 0.02, 7.7, 3) - 0.5) * 40;
    const spike = N.noise(wx * 0.08, 3.3);
    if (spike > 0.66) b += (spike - 0.66) * 280;
    bot[c] = Math.max(b, raw[c] + 8);
    maxBot = Math.max(maxBot, bot[c]);
  }

  const W = cols, H = Math.ceil((maxBot - minY + 4) * R);
  canvasTexture(scene, key, W, H, (ctx) => {
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let c = 0; c < W; c++) {
      if (bot[c] === -Infinity) continue;
      const wx = minX + c / R;
      const xRel = (wx - centerX) / halfW;
      for (let r = 0; r < H; r++) {
        const wy = minY + r / R;
        if (wy < top[c] || wy > bot[c]) continue;
        const v = (wy - top[c]) / (bot[c] - top[c]);
        const toBottom = bot[c] - wy;

        let col = mix(C.rockDark, C.rockLight, N.fbm(wx * 0.025, wy * 0.05, 4));
        if (Math.abs(N.noise(wx * 0.05 + 11, wy * 0.02) - 0.5) < 0.025) col = mul(col, 0.55);
        col = mix(col, C.soilDark, (1 - smooth(0.0, 0.3, v)) * 0.6);
        const b1 = N.fbm(wx * 0.04 - 0.08, wy * 0.08 - 0.08, 2);
        const b2 = N.fbm(wx * 0.04 + 0.08, wy * 0.08 + 0.08, 2);
        let light = 1 + (b1 - b2) * 3;
        light *= 1.05 - 0.35 * smooth(-1, 1, xRel);
        light *= 1 - 0.5 * smooth(0.2, 1, v);
        col = mul(col, light);
        col = mix(col, C.voidTint, 0.35 * v);
        col = mix(col, C.rim, (1 - smooth(0, 14, toBottom)) * 0.4);
        putPx(d, (r * W + c) * 4, col, Math.round(255 * smooth(0, 3, toBottom)));
      }
    }
    ctx.putImageData(img, 0, 0);

    // hangende wortels
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const c = Math.floor(rnd() * W);
      if (bot[c] === -Infinity) continue;
      let x = c, y = (bot[c] - minY) * R - 3;
      const len = (20 + rnd() * 70) * R;
      const steps = 8;
      let w = 2.4 * R + rnd() * R;
      ctx.strokeStyle = C.root;
      for (let k = 0; k < steps; k++) {
        const nx = x + (rnd() - 0.5) * 3 * R;
        const ny = y + len / steps;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        x = nx; y = ny; w *= 0.82;
      }
    }
  });

  const bottoms = [];
  for (let c = 0; c < cols; c += 4) if (bot[c] !== -Infinity) bottoms.push({ x: minX + c / R, y: bot[c] });
  return { x: minX, y: minY, scale: 1 / R, bottoms, maxBottom: maxBot, centerX };
}
