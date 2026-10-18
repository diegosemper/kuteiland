// Alle graphics van fase 1 worden hier pixel voor pixel getekend.
// Later kunnen deze textures vervangen worden door echte sprites met dezelfde namen.
import { CONFIG } from './config.js';
import { mulberry32 } from './rng.js';

const { tileW: TW, tileH: TH, blockDepth: BD } = CONFIG.iso;

export const ART = {
  treeBaseY: 55,   // pixelrij waar de stam de grond raakt
  treeH: 56,
};

function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  draw(makePainter(ctx), ctx);
  tex.refresh();
}

function makePainter(ctx) {
  return {
    px(x, y, c) {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    },
    line(x0, y0, x1, y1, c) {
      let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        this.px(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    },
    // Teken een sprite uit tekstregels; elk teken is een kleur uit het palet, '.' is leeg.
    map(rows, pal, ox = 0, oy = 0) {
      rows.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          if (pal[ch]) this.px(ox + x, oy + y, pal[ch]);
        });
      });
    },
  };
}

// ---------- blokken ----------

const PAL_DIRT = {
  top: '#4a4732', speckle: ['#545039', '#3f3c2a', '#5c573c', '#46432f'], speckleChance: 0.35,
  edge: '#615c42', lip: '#3e3b2a',
  left: '#3a2c21', right: '#2b2018', leftSpeck: '#33271d', rightSpeck: '#251b14', base: '#1e1612',
};

const PAL_ROCK = {
  top: '#3d3734', speckle: ['#45403c', '#332e2c'], speckleChance: 0.3,
  edge: '#4a4340', lip: '#3a2f27',
  left: '#3b322e', right: '#2a2321', leftSpeck: '#463c36', rightSpeck: '#211b1a', base: '#2a2220',
};

function drawBlock(p, pal, seed) {
  const rnd = mulberry32(seed);
  const bottom = new Array(TW).fill(-1);
  const ratio = TW / TH;

  for (let y = 0; y < TH; y++) {
    const k = y < TH / 2 ? y : TH - 1 - y;
    const hw = (k + 1) * ratio;
    const x0 = TW / 2 - hw, x1 = TW / 2 + hw - 1;
    for (let x = x0; x <= x1; x++) {
      let c = pal.top;
      if (rnd() < pal.speckleChance) c = pal.speckle[Math.floor(rnd() * pal.speckle.length)];
      p.px(x, y, c);
      bottom[x] = Math.max(bottom[x], y);
    }
    // lichte rand aan de bovenkant geeft het blok een randje
    if (y < TH / 2) {
      p.px(x0, y, pal.edge); p.px(x0 + 1, y, pal.edge);
      p.px(x1, y, pal.edge); p.px(x1 - 1, y, pal.edge);
    }
  }

  for (let x = 0; x < TW; x++) {
    const left = x < TW / 2;
    for (let i = 1; i <= BD; i++) {
      let c = left ? pal.left : pal.right;
      if (i === 1) c = pal.lip;
      else if (i === BD) c = pal.base;
      else if (rnd() < 0.15) c = left ? pal.leftSpeck : pal.rightSpeck;
      p.px(x, bottom[x] + i, c);
    }
  }
}

// ---------- boom ----------

function drawTree(p) {
  const bark = { l: '#5a4636', m: '#47372a', r: '#33271e' };
  const base = ART.treeBaseY;

  // wortels
  p.line(18, base, 14, base + 1, '#3a2c22');
  p.line(22, base, 27, base + 1, '#3a2c22');
  p.line(20, base, 21, base + 1, '#33271e');

  // stam, licht krom
  for (let y = base; y >= 18; y--) {
    const cx = 20 + Math.round(Math.sin((base - y) / 9));
    const thin = y < 28;
    p.px(cx - 1, y, bark.l);
    p.px(cx, y, bark.m);
    if (!thin) p.px(cx + 1, y, bark.r);
    if (y >= base - 4) { p.px(cx - 2, y, bark.l); p.px(cx + 2, y, bark.r); }
  }
  // een paar knoesten
  p.px(20, 44, '#2a201a'); p.px(21, 38, '#2a201a'); p.px(19, 31, '#2a201a');

  const br = '#3f3025';
  // kale takken
  p.line(19, 36, 11, 28, br); p.line(11, 28, 7, 27, br); p.line(11, 28, 10, 23, br);
  p.line(21, 32, 29, 25, br); p.line(29, 25, 33, 25, br); p.line(29, 25, 31, 20, br);
  p.line(20, 24, 16, 14, br); p.line(16, 14, 13, 11, br); p.line(16, 14, 17, 9, br);
  p.line(21, 22, 25, 12, br); p.line(25, 12, 27, 7, br); p.line(25, 12, 29, 11, br);
  p.line(20, 18, 21, 10, br);
  // afgebroken stomp
  p.line(21, 41, 24, 39, br); p.px(25, 39, '#5a4636');

  // het laatste beetje blad
  const leaf = ['#4b5232', '#3d4429', '#57603a', '#6b5233'];
  const spots = [[7, 26], [8, 27], [6, 27], [31, 19], [32, 20], [30, 19], [13, 10], [12, 11],
    [27, 6], [28, 7], [26, 6], [29, 10], [30, 11], [17, 8], [21, 9]];
  spots.forEach(([x, y], i) => p.px(x, y, leaf[i % leaf.length]));
}

// ---------- speler, kist, kleine dingen ----------

const PLAYER_MAP = [
  '....oooo....',
  '...ohhhho...',
  '..ohhhhhho..',
  '..ohhfffho..',
  '..ohhffefo..',
  '..ohhfffho..',
  '...ohhhho...',
  '..occcccco..',
  '.occcccccco.',
  '.ocdcccccco.',
  '.ocdccccdco.',
  '.ocdcccckko.',
  '.occccccdco.',
  '..occccdco..',
  '..occcccco..',
  '...olo.olo..',
  '...olo.olo..',
  '...obo.obo..',
];
const PLAYER_PAL = {
  o: '#120e16', h: '#3d3b4a', c: '#34323f', d: '#262431',
  f: '#b8a594', e: '#141018', k: '#a89482', l: '#22202b', b: '#16131a',
};

const CHEST_MAP = [
  '..oooooooooooo..',
  '.owwwwwwwwwwwwo.',
  '.owwwwwwwwwwwwo.',
  '.oWWWWWWWWWWWWo.',
  '.ommmmmyymmmmmo.',
  '.obbbbbyybbbbbo.',
  '.obmbbbbbbbbmbo.',
  '.obmbbbbbbbbmbo.',
  '.oBmBBBBBBBBmBo.',
  '.ommmmmmmmmmmmo.',
  '..oooooooooooo..',
];
const CHEST_PAL = {
  o: '#1a1210', w: '#5e4631', W: '#4a3727', m: '#2c2b30', y: '#8c7a52', b: '#4a3826', B: '#3a2b1e',
};

const MARKER_MAP = [
  'o.....o',
  'oo...oo',
  '.oo.oo.',
  '..ooo..',
];

export function generateTextures(scene) {
  for (let i = 0; i < 3; i++) canvasTexture(scene, `dirt${i}`, TW, TH + BD, (p) => drawBlock(p, PAL_DIRT, 101 + i));
  for (let i = 0; i < 2; i++) canvasTexture(scene, `rock${i}`, TW, TH + BD, (p) => drawBlock(p, PAL_ROCK, 201 + i));

  canvasTexture(scene, 'tree', 40, ART.treeH, drawTree);
  canvasTexture(scene, 'player', 12, PLAYER_MAP.length, (p) => p.map(PLAYER_MAP, PLAYER_PAL));
  canvasTexture(scene, 'chest', 16, CHEST_MAP.length, (p) => p.map(CHEST_MAP, CHEST_PAL));
  canvasTexture(scene, 'marker', 7, MARKER_MAP.length, (p) => p.map(MARKER_MAP, { o: '#d9cdea' }));

  canvasTexture(scene, 'shadow', 12, 5, (p) => {
    for (let y = 0; y < 5; y++) for (let x = 0; x < 12; x++) {
      if (((x - 5.5) / 6) ** 2 + ((y - 2) / 2.5) ** 2 <= 1) p.px(x, y, 'rgba(0,0,0,0.4)');
    }
  });

  canvasTexture(scene, 'chip', 2, 2, (p) => {
    p.px(0, 0, '#6b5440'); p.px(1, 0, '#5a4535'); p.px(0, 1, '#5a4535'); p.px(1, 1, '#4a3828');
  });
  canvasTexture(scene, 'leaf', 2, 2, (p) => { p.px(0, 0, '#4b5232'); p.px(1, 1, '#3d4429'); });
  canvasTexture(scene, 'dust', 1, 1, (p) => p.px(0, 0, '#3a2f2a'));
  canvasTexture(scene, 'mote', 2, 2, (p) => {
    p.px(0, 0, '#c9b6ee'); p.px(1, 0, '#c9b6ee'); p.px(0, 1, '#c9b6ee'); p.px(1, 1, '#c9b6ee');
  });

  // zachte gloed voor de Kern in de verte
  canvasTexture(scene, 'glow', 128, 128, (p, ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });

  // achtergrond van de leegte
  canvasTexture(scene, 'void', 2, 512, (p, ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#170c26');
    g.addColorStop(0.45, '#0e0718');
    g.addColorStop(1, '#040205');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 512);
  });
}
