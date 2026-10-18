// Textures voor de minigames: platte blokken (voor Delven), barsten, een haak en een kristalscherf.
import { canvasTexture } from './util.js';
import { face, crisp } from './blocks.js';
import { mulberry32 } from '../rng.js';

const FLAT = ['grass_top', 'dirt', 'stone', 'deepslate', 'cobble', 'rust_ore', 'deepslate_amethyst',
  'star_ore', 'soul_ore', 'sulfur_ore', 'ice_ore', 'obsidian'];

function flat(scene, name) {
  canvasTexture(scene, `flat_${name}`, 64, 64, (ctx) => {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(face(name), 0, 0, 64, 64);
    // randje, zodat losse blokken leesbaar blijven
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 60, 64, 4);
    ctx.fillRect(60, 0, 4, 64);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, 64, 4);
    ctx.fillRect(0, 0, 4, 64);
  });
  crisp(scene, `flat_${name}`);
}

// barsten: een paar kronkelende donkere lijnen in pixels
function crack(scene) {
  canvasTexture(scene, 'mg_crack', 64, 64, (ctx) => {
    const r = mulberry32(77);
    ctx.fillStyle = '#0a0604';
    for (let line = 0; line < 4; line++) {
      let x = 6 + Math.floor(r() * 4), y = 6 + Math.floor(r() * 4);
      const dx = line % 2 ? 1 : -1;
      if (dx < 0) x = 9 - x + 6;
      for (let k = 0; k < 12; k++) {
        ctx.fillRect(x * 4, y * 4, 4, 4);
        x += r() < 0.5 ? dx : 0;
        y += r() < 0.7 ? 1 : 0;
        x = Math.max(0, Math.min(15, x));
        y = Math.max(0, Math.min(15, y));
      }
    }
  });
  crisp(scene, 'mg_crack');
}

function hook(scene) {
  const P = [
    '.....##.....',
    '....#ww#....',
    '.....##.....',
    '.....##.....',
    '.....##.....',
    '.#...##...#.',
    '##...##...##',
    '#w#..##..#w#',
    '.##.####.##.',
    '..########..',
    '...######...',
  ];
  canvasTexture(scene, 'mg_hook', 48, 44, (ctx) => {
    P.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'w' ? '#e8e0d0' : '#8a8a96';
      ctx.fillRect(x * 4, y * 4, 4, 4);
    }));
  });
  crisp(scene, 'mg_hook');
}

function shard(scene) {
  const P = [
    '....#....',
    '...#w#...',
    '...#m#...',
    '..#wmm#..',
    '..#mmd#..',
    '.#wmmdd#.',
    '.#mmmdd#.',
    '..#mdd#..',
    '...#d#...',
    '....#....',
  ];
  const col = { '#': '#3a2266', w: '#f0e4ff', m: '#b48cff', d: '#7a4fcf' };
  canvasTexture(scene, 'mg_shard', 36, 40, (ctx) => {
    P.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = col[ch];
      ctx.fillRect(x * 4, y * 4, 4, 4);
    }));
  });
  crisp(scene, 'mg_shard');
}

export function generateMinigameArt(scene) {
  for (const n of FLAT) flat(scene, n);
  crack(scene);
  hook(scene);
  shard(scene);
}
