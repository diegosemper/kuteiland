// Het eiland als Minecraft-blokken. Eén texture per bloksoort, gedeeld door alle tegels.
import { CONFIG } from '../config.js';
import { canvasTexture } from './util.js';
import { iso, cube, crisp } from './blocks.js';

const { tileW: TW, tileH: TH, blockDepth: BD } = CONFIG.iso;
const PAD = 2;

export const TILE_TEX = {
  w: TW + PAD * 2,
  h: TH + BD + PAD * 2,
  cx: TW / 2 + PAD,
  cy: TH / 2 + PAD,
};

// Per soort: textuur boven, opzij, hoogte (1 = heel blok) en wat eronder hangt
export const KINDS = {
  dirt:       { top: 'grass_top', side: 'grass_side', h: 1, under: 'dirt', deep: 'stone' },
  plank:      { top: 'planks', side: 'planks', h: 1 },
  stone:      { top: 'cobble', side: 'cobble', h: 1 },
  ash:        { top: 'ash_top', side: 'basalt', h: 1, under: 'basalt', deep: 'basalt' },
  crystal:    { top: 'amethyst', side: 'deepslate_amethyst', h: 1, under: 'deepslate', deep: 'deepslate' },
  ruin:       { top: 'bricks_glow', side: 'bricks', h: 1, under: 'bricks', deep: 'stone' },
  bridge:     { top: 'bridge', side: 'planks', h: 0.25 },
  starbridge: { top: 'starbridge', side: 'quartz', h: 0.25 },
  sulfur:     { top: 'sulfur', side: 'sulfur_side', h: 1, under: 'sulfur_side', deep: 'stone' },
  mycelium:   { top: 'mycelium_top', side: 'mycelium_side', h: 1, under: 'dirt', deep: 'stone' },
  snow:       { top: 'snow_top', side: 'snow_side', h: 1, under: 'packed_ice', deep: 'stone' },
  sculk:      { top: 'sculk', side: 'sculk_side', h: 1, under: 'sculk_side', deep: 'deepslate' },
  // bouwblokken uit collecties
  logs:          { top: 'log_top', side: 'log_side', h: 1 },
  bricksblock:   { top: 'bricks', side: 'bricks', h: 1 },
  ironblock:     { top: 'iron', side: 'iron', h: 1 },
  amethystblock: { top: 'amethyst', side: 'amethyst', h: 1 },
  quartzblock:   { top: 'quartz', side: 'quartz', h: 1 },
  obsidianblock: { top: 'obsidian', side: 'obsidian', h: 1 },
  glow:          { top: 'lantern', side: 'lantern', h: 1 },
};

// Natuurlijke grond heeft blokken eronder; gebouwde blokken niet; bruggen zijn dunne platen
export const NATURAL = ['dirt', 'ash', 'crystal', 'ruin', 'sulfur', 'mycelium', 'snow', 'sculk'];
export const BRIDGES = ['bridge', 'starbridge'];

function drawBlock(ctx, top, side, h) {
  const height = BD * h;
  // de bovenkant ligt op het midden van de ruit; de zijkanten hangen eronder
  const P = iso(TILE_TEX.cx, TILE_TEX.cy + height);
  const e = 0.505;   // net iets groter: geen naadjes tussen tegels
  cube(ctx, P, -e, e, -e, e, 0, height, { top, left: side, right: side }, { rows: Math.max(4, Math.round(16 * h)) });
}

// Texture voor een tegel van deze soort (wordt één keer gemaakt)
export function blockKey(scene, kind) {
  const key = `block_${kind}`;
  if (!scene.textures.exists(key)) {
    const k = KINDS[kind] || KINDS.dirt;
    canvasTexture(scene, key, TILE_TEX.w, TILE_TEX.h, (ctx) => drawBlock(ctx, k.top, k.side, k.h));
    crisp(scene, key);
  }
  return key;
}

// Volle blokken die onder het eiland hangen
export function underKey(scene, faceName) {
  const key = `under_${faceName}`;
  if (!scene.textures.exists(key)) {
    canvasTexture(scene, key, TILE_TEX.w, TILE_TEX.h, (ctx) => drawBlock(ctx, faceName, faceName, 1));
    crisp(scene, key);
  }
  return key;
}

// Vast getal 0..1 per tegel
export function hash2(i, j) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
