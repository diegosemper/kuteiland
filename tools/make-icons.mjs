// Maakt de app-iconen (PNG) voor de PWA. Draai opnieuw na aanpassingen: npm run icons
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../icons/', import.meta.url));

const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// Tekent het icoon op een klein pixelraster van L x L.
function draw(L) {
  const buf = new Uint8Array(L * L * 4);
  const set = (x, y, c, a = 1) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= L || y >= L) return;
    const i = (y * L + x) * 4;
    for (let k = 0; k < 3; k++) buf[i + k] = Math.round(buf[i + k] * (1 - a) + c[k] * a);
    buf[i + 3] = 255;
  };

  // leegte
  const top = rgb('#1a0e2a'), bottom = rgb('#050308');
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) set(x, y, mix(top, bottom, y / (L - 1)));

  // de Kern in de verte
  const kx = L / 2 + 20, ky = L / 2 - 20, glow = rgb('#9b6bff');
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const d = Math.hypot(x - kx, y - ky);
    if (d < 9) set(x, y, glow, (1 - d / 9) ** 2 * 0.8);
  }
  set(kx, ky, rgb('#efe6ff'));

  // eilandje: tegels van 16x8, blokdikte 4
  const cx = L / 2, cy = L / 2 - 2;
  const dirt = { top: rgb('#4a4732'), edge: rgb('#615c42'), left: rgb('#3a2c21'), right: rgb('#2b2018'), base: rgb('#1e1612') };
  const rock = { top: rgb('#34302f'), edge: rgb('#433d3b'), left: rgb('#2a2425'), right: rgb('#1f1b1c'), base: rgb('#141112') };

  function block(x0, y0, pal, shade) {
    const bottomRow = {};
    const tint = (c) => mix(c, [0, 0, 0], shade);
    for (let r = 0; r < 8; r++) {
      const k = r < 4 ? r : 7 - r;
      const hw = (k + 1) * 2;
      for (let x = -hw; x < hw; x++) {
        const edge = r < 4 && (x <= -hw + 1 || x >= hw - 2);
        set(x0 + x, y0 - 4 + r, tint(edge ? pal.edge : pal.top));
        bottomRow[x] = Math.max(bottomRow[x] ?? -99, r);
      }
    }
    for (let x = -8; x < 8; x++) {
      for (let i = 1; i <= 4; i++) {
        const c = i === 4 ? pal.base : x < 0 ? pal.left : pal.right;
        set(x0 + x, y0 - 4 + bottomRow[x] + i, tint(c));
      }
    }
  }

  const tiles = [[0, 0, 4], [1, 0, 2], [0, 1, 2], [-1, 0, 2], [0, -1, 2], [1, 1, 1], [-1, -1, 1], [1, -1, 1]];
  const sorted = [...tiles].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (let layer = 4; layer >= 1; layer--) {
    for (const [gx, gy, depth] of sorted) {
      if (depth >= layer) block(cx + (gx - gy) * 8, cy + (gx + gy) * 4 + layer * 4, rock, layer * 0.15);
    }
  }
  for (const [gx, gy] of sorted) block(cx + (gx - gy) * 8, cy + (gx + gy) * 4, dirt, 0);

  // de halfdode boom
  const bark = rgb('#47372a'), twig = rgb('#3f3025');
  for (let y = 0; y < 12; y++) set(cx - 1, cy - 1 - y, bark);
  for (let y = 0; y < 6; y++) set(cx, cy - 1 - y, bark);
  [[-2, -9], [-3, -10], [-4, -10], [0, -8], [1, -9], [2, -10], [3, -10], [-1, -13], [0, -14]]
    .forEach(([x, y]) => set(cx + x, cy + y, twig));
  set(cx - 4, cy - 11, rgb('#57603a'));
  set(cx + 3, cy - 11, rgb('#4b5232'));

  return buf;
}

function scaleUp(src, L, N) {
  const out = Buffer.alloc(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const si = (Math.floor(y * L / N) * L + Math.floor(x * L / N)) * 4;
    const di = (y * N + x) * 4;
    for (let k = 0; k < 4; k++) out[di + k] = src[si + k];
  }
  return out;
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(b) {
  let c = 0xffffffff;
  for (const v of b) c = CRC[(c ^ v) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(N, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((N * 4 + 1) * N);
  for (let y = 0; y < N; y++) rgba.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
const normal = draw(64);
writeFileSync(OUT + 'icon-192.png', png(192, scaleUp(normal, 64, 192)));
writeFileSync(OUT + 'icon-512.png', png(512, scaleUp(normal, 64, 512)));
// maskable: meer rand, zodat Android er een cirkel of druppel van kan maken
writeFileSync(OUT + 'icon-maskable-512.png', png(512, scaleUp(draw(96), 96, 512)));
console.log('Iconen gemaakt in icons/');
