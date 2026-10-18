// Effecten en sfeer: schaduw, deeltjes, mist, gloed, verre eilanden, vignet.
import { canvasTexture, smooth, putPx, ellipse, mulberry32 } from "./util.js";

function radial(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

export function generateFx(scene, N) {
  // zachte schaduw (ellips)
  canvasTexture(scene, 'shadow', 96, 40, (ctx) => {
    ctx.translate(48, 20);
    ctx.scale(1, 0.4);
    ctx.fillStyle = radial(ctx, 0, 0, 48, [[0, 'rgba(0,0,0,0.55)'], [0.6, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(-48, -50, 96, 100);
  });

  canvasTexture(scene, 'puff', 24, 24, (ctx) => {
    ctx.fillStyle = radial(ctx, 12, 12, 12, [[0, 'rgba(150,135,125,0.8)'], [1, 'rgba(150,135,125,0)']]);
    ctx.fillRect(0, 0, 24, 24);
  });
  canvasTexture(scene, 'dust', 8, 8, (ctx) => {
    ctx.fillStyle = radial(ctx, 4, 4, 4, [[0, 'rgba(70,58,52,1)'], [1, 'rgba(70,58,52,0)']]);
    ctx.fillRect(0, 0, 8, 8);
  });
  canvasTexture(scene, 'mote', 16, 16, (ctx) => {
    ctx.fillStyle = radial(ctx, 8, 8, 8, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, 16, 16);
  });
  canvasTexture(scene, 'glow', 128, 128, (ctx) => {
    ctx.fillStyle = radial(ctx, 64, 64, 64, [[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,255,255,0.5)'], [0.5, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, 128, 128);
  });

  // licht: wit in het midden, zacht naar de rand (gebruikt om de nacht weg te gummen)
  canvasTexture(scene, 'light', 256, 256, (ctx) => {
    ctx.fillStyle = radial(ctx, 128, 128, 128, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.75)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, 256, 256);
  });

  // slag-boog
  canvasTexture(scene, 'slash', 80, 80, (ctx) => {
    ctx.lineCap = 'round';
    for (const [w, a] of [[9, 0.15], [5, 0.35], [2, 0.9]]) {
      ctx.strokeStyle = `rgba(235,225,255,${a})`;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(40, 40, 30, -Math.PI * 0.75, Math.PI * 0.15);
      ctx.stroke();
    }
  });

  // schot van de wachttoren
  canvasTexture(scene, 'bolt', 28, 10, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 28, 0);
    g.addColorStop(0, 'rgba(200,160,255,0)');
    g.addColorStop(1, 'rgba(240,225,255,1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(16, 5, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // pixel-art uit tekstregels, elke pixel wordt een vierkantje van 'size'
  const pixels = (key, rows, pal, size) => {
    canvasTexture(scene, key, rows[0].length * size, rows.length * size, (ctx) => {
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (!pal[ch]) return;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(x * size, y * size, size, size);
      }));
    });
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  };

  // hartjes zoals in Minecraft
  const HEART = [
    '.kk.kk.',
    'krrkrrk',
    'krwrrrk',
    'krrrrrk',
    '.krrrk.',
    '..krk..',
    '...k...',
  ];
  const HALF = HEART.map((row) => [...row].map((ch, x) => (x > 3 && ch !== '.' && ch !== 'k' ? 'e' : ch)).join(''));
  const EMPTY = HEART.map((row) => row.replace(/[rw]/g, 'e'));
  const heartPal = { k: '#1a0a0e', r: '#c8323c', w: '#ffb0b0', e: '#3a2228' };
  pixels('heart_full', HEART, heartPal, 4);
  pixels('heart_half', HALF, heartPal, 4);
  pixels('heart_empty', EMPTY, heartPal, 4);

  // markering boven het doel: een pixel-pijltje
  pixels('marker', [
    'kkkkkkk',
    'kwwwwwk',
    '.kwwwk.',
    '..kwk..',
    '...k...',
  ], { k: '#1a1220', w: '#ece3f7' }, 3);

  // grasplantje zoals in Minecraft
  pixels('tuft', [
    '.......g........',
    '..g....g...g....',
    '..g...gG...g..g.',
    '...g..gG..gG..g.',
    '...gG.gG..gG.gG.',
    '.g.gG.gG.gG..gG.',
    '.gG.gGgG.gG.gG..',
    '..gG.gGgGgGgG...',
  ], { g: '#5d8c3b', G: '#41702a' }, 2);

  // houtsplinters en steengruis: vierkante pixels
  canvasTexture(scene, 'chip', 4, 4, (ctx) => { ctx.fillStyle = '#8a6a40'; ctx.fillRect(0, 0, 4, 4); ctx.fillStyle = '#b8935c'; ctx.fillRect(0, 0, 2, 2); });
  canvasTexture(scene, 'stonechip', 4, 4, (ctx) => { ctx.fillStyle = '#6e6e6e'; ctx.fillRect(0, 0, 4, 4); ctx.fillStyle = '#9a9a9a'; ctx.fillRect(0, 0, 2, 2); });
  canvasTexture(scene, 'leaf', 4, 4, (ctx) => { ctx.fillStyle = '#4a7a2f'; ctx.fillRect(0, 0, 4, 4); ctx.fillStyle = '#6a5a2a'; ctx.fillRect(2, 2, 2, 2); });

  // mist
  canvasTexture(scene, 'mist', 256, 128, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x - w / 2) / (w / 2), dy = (y - h / 2) / (h / 2);
      const fall = Math.max(0, 1 - (dx * dx + dy * dy));
      const n = N.fbm(x * 0.02 + 40, y * 0.04 + 40, 4);
      const a = smooth(0.35, 0.7, n) * fall;
      putPx(img.data, (y * w + x) * 4, [255, 255, 255], Math.round(a * 255));
    }
    ctx.putImageData(img, 0, 0);
  });

  // ver eiland: blokkig silhouet, trapsgewijs smaller naar onder
  canvasTexture(scene, 'farisle', 180, 140, (ctx) => {
    const rnd = mulberry32(31);
    const cell = 12;
    let half = 6;
    for (let row = 0; row < 9; row++) {
      const y = 30 + row * cell;
      const w = Math.max(1, half - Math.floor(row * 0.8 + rnd() * 1.5));
      const shade = row === 0 ? '#3a2f48' : `rgba(30,22,42,${1 - row * 0.09})`;
      ctx.fillStyle = shade;
      for (let k = -w; k < w; k++) if (row === 0 || rnd() > 0.08) ctx.fillRect(90 + k * cell, y, cell, cell);
      if (row === 0) half = 6;
    }
    // een dood boompje van blokjes
    ctx.fillStyle = '#2a2236';
    ctx.fillRect(110, 6, 6, 24);
    ctx.fillRect(116, 10, 10, 6);
    ctx.fillRect(100, 14, 10, 6);
  });

  // vignet
  canvasTexture(scene, 'vignette', 256, 256, (ctx) => {
    ctx.fillStyle = radial(ctx, 128, 128, 182, [[0, 'rgba(0,0,0,0)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.85)']]);
    ctx.fillRect(0, 0, 256, 256);
  });

  // achtergrond van de leegte
  canvasTexture(scene, 'void', 4, 512, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1d1030');
    g.addColorStop(0.4, '#0f0819');
    g.addColorStop(1, '#030204');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 512);
  });
}


