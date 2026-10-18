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

  canvasTexture(scene, 'chip', 7, 4, (ctx) => {
    ctx.fillStyle = '#6b5440'; ctx.fillRect(0, 0, 7, 4);
    ctx.fillStyle = '#9a7d5e'; ctx.fillRect(0, 0, 7, 1);
    ctx.fillStyle = '#3e2f22'; ctx.fillRect(0, 3, 7, 1);
  });
  canvasTexture(scene, 'leaf', 8, 5, (ctx) => ellipse(ctx, 4, 2.5, 3.6, 2, '#55602f', 0.3));
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

  // markering boven het doel
  canvasTexture(scene, 'marker', 26, 18, (ctx) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(13, 12); ctx.lineTo(21, 5); };
    path(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 6; ctx.stroke();
    path(); ctx.strokeStyle = '#ece3f7'; ctx.lineWidth = 3; ctx.stroke();
  });

  // graspol
  canvasTexture(scene, 'tuft', 30, 24, (ctx) => {
    const rnd = mulberry32(9);
    const cols = ['#3d4a2a', '#56623a', '#6b7448', '#2c3820', '#7a7350'];
    for (let i = 0; i < 14; i++) {
      const x = 15 + (rnd() - 0.5) * 10;
      const lean = (rnd() - 0.5) * 16;
      const len = 9 + rnd() * 13;
      ctx.strokeStyle = cols[Math.floor(rnd() * cols.length)];
      ctx.lineWidth = 1 + rnd() * 0.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, 24);
      ctx.quadraticCurveTo(x + lean * 0.2, 24 - len * 0.6, x + lean * 0.6, 24 - len);
      ctx.stroke();
    }
  });

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

  // ver eiland (silhouet)
  canvasTexture(scene, 'farisle', 180, 140, (ctx, w) => {
    const rnd = mulberry32(31);
    const top = 40, cx = w / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 70, top);
    for (let x = -70; x <= 70; x += 7) ctx.lineTo(cx + x, top - 3 - rnd() * 5 + Math.abs(x) * 0.06);
    for (let x = 70; x >= -70; x -= 7) {
      const depth = (1 - (x / 72) ** 2) * 80 + rnd() * 14;
      ctx.lineTo(cx + x, top + depth);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, top - 10, 0, top + 95);
    g.addColorStop(0, '#3a2f48');
    g.addColorStop(0.15, '#271f33');
    g.addColorStop(1, 'rgba(20,14,30,0)');
    ctx.fillStyle = g;
    ctx.fill();
    // dode boom
    ctx.strokeStyle = '#2a2236';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 15, top - 4); ctx.lineTo(cx + 17, top - 30);
    ctx.moveTo(cx + 17, top - 22); ctx.lineTo(cx + 26, top - 32);
    ctx.moveTo(cx + 16, top - 16); ctx.lineTo(cx + 8, top - 26);
    ctx.stroke();
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


