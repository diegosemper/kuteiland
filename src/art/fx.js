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
  canvasTexture(scene, 'stonechip', 6, 5, (ctx) => {
    ctx.fillStyle = '#7d766f'; ctx.fillRect(0, 0, 6, 5);
    ctx.fillStyle = '#a39b93'; ctx.fillRect(0, 0, 6, 1);
    ctx.fillStyle = '#3e3a37'; ctx.fillRect(0, 4, 6, 1);
  });
  canvasTexture(scene, 'puff', 24, 24, (ctx) => {
    ctx.fillStyle = radial(ctx, 12, 12, 12, [[0, 'rgba(150,135,125,0.8)'], [1, 'rgba(150,135,125,0)']]);
    ctx.fillRect(0, 0, 24, 24);
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

  // hartjes
  const heart = (ctx, fill, half) => {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(16, 28);
      ctx.bezierCurveTo(2, 18, 2, 6, 10, 5);
      ctx.bezierCurveTo(14, 4, 16, 8, 16, 10);
      ctx.bezierCurveTo(16, 8, 18, 4, 22, 5);
      ctx.bezierCurveTo(30, 6, 30, 18, 16, 28);
      ctx.closePath();
    };
    path();
    ctx.fillStyle = 'rgba(20,10,20,0.75)';
    ctx.fill();
    if (fill) {
      ctx.save();
      if (half) { ctx.beginPath(); ctx.rect(0, 0, 16, 32); ctx.clip(); }
      path();
      const g = ctx.createLinearGradient(0, 4, 0, 28);
      g.addColorStop(0, '#c0485a');
      g.addColorStop(1, '#6e1c2c');
      ctx.fillStyle = g;
      ctx.fill();
      ellipse(ctx, 10, 10, 3, 2, 'rgba(255,220,220,0.5)', -0.5);
      ctx.restore();
    }
    path();
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };
  canvasTexture(scene, 'heart_full', 32, 32, (ctx) => heart(ctx, true, false));
  canvasTexture(scene, 'heart_half', 32, 32, (ctx) => heart(ctx, true, true));
  canvasTexture(scene, 'heart_empty', 32, 32, (ctx) => heart(ctx, false, false));

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


