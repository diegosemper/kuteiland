// Iconen (64x64) in Minecraft-stijl: blokken als mini-kubus, spullen als pixel-sprite van 16x16.
import { canvasTexture } from './util.js';
import { iso, drawBoxes, boxAt, all, crisp } from './blocks.js';

const S = 64;

// ---------- mini-kubus ----------

function miniCube(faces, h = 1) {
  return (ctx) => {
    const P = iso(32, 46);
    drawBoxes(ctx, P, [boxAt(0, 0, 0, 0.42, 0.42 * 64 * h, faces)]);
  };
}

// ---------- pixel-sprites ----------

function sprite(draw) {
  return (ctx) => {
    const px = (x, y, c) => {
      if (x < 0 || y < 0 || x > 15 || y > 15) return;
      ctx.fillStyle = c;
      ctx.fillRect(x * 4, y * 4, 4, 4);
    };
    draw(px);
  };
}

const HANDLE = ['#6a4a2a', '#4a3218'];
const MATERIAL = {
  1: ['#b8935c', '#8a683b', '#d0aa70'],   // hout
  2: ['#9a9a9a', '#6e6e6e', '#c0c0c0'],   // steen
  3: ['#c06a36', '#7a3e22', '#e08a50'],   // roest
  4: ['#b48cff', '#6a45a8', '#e2d0ff'],   // leegtekristal
  5: ['#f8eeb0', '#c8b870', '#ffffff'],   // sterrenstof
};

// steel van linksonder naar rechtsboven
function handle(px, from = 2, to = 10) {
  for (let i = from; i <= to; i++) {
    px(i, 15 - i, HANDLE[0]);
    px(i + 1, 15 - i, HANDLE[1]);
  }
}

function pickaxe(tier) {
  const [m, d, l] = MATERIAL[tier];
  return sprite((px) => {
    handle(px, 2, 10);
    const head = [[3, 3], [4, 2], [5, 2], [6, 2], [7, 2], [8, 3], [9, 3], [10, 4], [11, 5], [12, 6], [12, 7], [13, 8], [13, 9], [13, 10]];
    head.forEach(([x, y], i) => { px(x, y, i % 3 ? m : l); px(x + (x > 9 ? -1 : 0), y + 1, d); });
  });
}

function axe(tier) {
  const [m, d, l] = MATERIAL[tier];
  return sprite((px) => {
    handle(px, 2, 11);
    for (let y = 2; y <= 7; y++) for (let x = 8; x <= 13; x++) {
      if (x - 8 + (7 - y) < 3 && y > 4) continue;
      px(x, y, y === 2 || x === 13 ? l : (x + y) % 4 ? m : d);
    }
  });
}

function sword(tier) {
  const [m, d, l] = MATERIAL[tier];
  return sprite((px) => {
    for (let i = 0; i < 9; i++) { px(5 + i, 10 - i, m); px(6 + i, 10 - i, l); px(5 + i, 11 - i, d); }
    px(3, 10, d); px(4, 11, d); px(5, 12, d); px(6, 13, d);          // pareerstang
    px(2, 13, HANDLE[0]); px(3, 12, HANDLE[0]); px(4, 12, HANDLE[1]); px(1, 14, HANDLE[1]);
  });
}

function club() {
  return sprite((px) => {
    handle(px, 2, 7);
    for (let i = 7; i <= 12; i++) for (let w = 0; w < 3; w++) px(i + w - 1, 15 - i - w + 1, w === 1 ? '#b8935c' : '#8a683b');
  });
}

function hammer() {
  const [m, d, l] = MATERIAL[2];
  return sprite((px) => {
    handle(px, 2, 9);
    for (let y = 2; y <= 6; y++) for (let x = 8; x <= 13; x++) px(x, y + (x - 8) * 0, y === 2 ? l : x === 13 ? d : m);
  });
}

function ingot() {
  return sprite((px) => {
    const rows = [[4, 11, 6], [3, 12, 7], [2, 13, 8], [2, 13, 9], [3, 12, 10]];
    rows.forEach(([a, b, y], i) => { for (let x = a; x <= b; x++) px(x, y, i === 0 ? '#e08a50' : i > 3 ? '#5a2e18' : '#a85a36'); });
  });
}

function shard() {
  return sprite((px) => {
    for (let y = 2; y <= 13; y++) {
      const w = y < 8 ? (y - 2) / 2 : (13 - y) / 1.5;
      for (let x = Math.round(8 - w); x <= Math.round(8 + w); x++) px(x, y, x < 8 ? '#e2d0ff' : x > 9 ? '#6a45a8' : '#9b6be0');
    }
  });
}

function dust() {
  return sprite((px) => {
    for (const [x, y, c] of [[4, 9, '#f8eeb0'], [6, 6, '#ffffff'], [8, 10, '#e8d890'], [10, 7, '#f8eeb0'], [11, 11, '#c8b870'],
      [5, 12, '#c8b870'], [9, 4, '#ffffff'], [12, 9, '#f8eeb0'], [7, 8, '#ffffff'], [3, 7, '#e8d890']]) px(x, y, c);
  });
}

export function generateIcons(scene) {
  const icons = {
    // grondstoffen
    icon_wrakhout: miniCube({ top: 'log_top', left: 'log_side', right: 'log_side' }),
    icon_puin: miniCube(all('cobble')),
    icon_roest: ingot(),
    icon_leegtekristal: shard(),
    icon_sterrenstof: dust(),
    // blokken en bouwwerken
    icon_vlonder: miniCube(all('planks')),
    icon_puinblok: miniCube(all('cobble')),
    icon_werkbank: miniCube({ top: 'craft_top', left: 'craft_side', right: 'craft_side' }),
    icon_steengenerator: miniCube({ top: 'void_liquid', left: 'cobble', right: 'cobble' }),
    icon_muur: miniCube(all('cobble'), 0.8),
    icon_lantaarn: miniCube(all('lantern'), 0.9),
    icon_kristallamp: miniCube(all('crystal_lamp'), 0.9),
    icon_wachttoren: miniCube({ top: 'cobble', left: 'cobble', right: 'dispenser' }),
    icon_anker: miniCube(all('iron'), 1),
    icon_brug: miniCube({ top: 'bridge', left: 'planks', right: 'planks' }, 0.3),
    icon_sterrenbrug: miniCube({ top: 'starbridge', left: 'quartz', right: 'quartz' }, 0.3),
    icon_houtblok: miniCube({ top: 'log_top', left: 'log_side', right: 'log_side' }),
    icon_bakstenen: miniCube(all('bricks')),
    icon_ijzerblok: miniCube(all('iron')),
    icon_amethistblok: miniCube(all('amethyst')),
    icon_kwartsblok: miniCube(all('quartz')),
    icon_obsidiaanblok: miniCube(all('obsidian')),
    icon_lichtblok: miniCube(all('lantern')),
    icon_wezens: miniCube({ top: 'obsidian', left: 'void_eyes', right: 'void_eyes' }),
    // wapens
    icon_weapon1: club(),
    icon_weapon2: hammer(),
    icon_weapon3: sword(3),
    icon_weapon4: sword(4),
    icon_weapon5: sword(5),
  };
  for (const tier of [1, 2, 3]) {
    icons[`icon_axe${tier}`] = axe(tier);
    icons[`icon_pickaxe${tier}`] = pickaxe(tier);
  }
  for (const [key, draw] of Object.entries(icons)) {
    canvasTexture(scene, key, S, S, draw);
    crisp(scene, key);
  }
}
