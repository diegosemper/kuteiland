// Nachtwezens in blokken: een spinachtige kruiper en een lange schim, allebei met paarse ogen.
import { canvasTexture } from './util.js';
import { iso, drawBoxes, crisp } from './blocks.js';

export const CREATURES = {
  crawler: { w: 110, h: 80, footX: 55, footY: 66, frames: 4 },
  brute: { w: 100, h: 170, footX: 50, footY: 158, frames: 4 },
};

const DARK = { top: 'obsidian', left: 'obsidian', right: 'obsidian' };
const HEAD = { top: 'obsidian', left: 'obsidian', right: 'void_eyes' };

function drawCrawler(ctx, frame) {
  const { footX, footY } = CREATURES.crawler;
  const P = iso(footX, footY);
  const ph = (frame / 4) * Math.PI * 2;
  // poten: dunne zwarte balkjes, om en om omhoog
  ctx.strokeStyle = '#0a0610';
  ctx.lineWidth = 4;
  ctx.lineCap = 'square';
  for (let i = 0; i < 4; i++) {
    const off = Math.sin(ph + i * 1.6) * 0.04;
    const u = -0.12 + i * 0.09;
    for (const side of [-1, 1]) {
      const hip = P(u, side * 0.08, 14), knee = P(u + off, side * 0.22, 24), foot = P(u + off * 2, side * 0.3, Math.max(0, off * side * 60));
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(knee.x, knee.y); ctx.lineTo(foot.x, foot.y); ctx.stroke();
    }
  }
  drawBoxes(ctx, P, [
    { u0: -0.24, u1: 0.02, v0: -0.13, v1: 0.13, z0: 8, z1: 24, faces: DARK },      // achterlijf
    { u0: 0.02, u1: 0.16, v0: -0.09, v1: 0.09, z0: 10, z1: 22, faces: HEAD },        // kop met ogen
  ]);
}

function drawBrute(ctx, frame) {
  const { footX, footY } = CREATURES.brute;
  const P = iso(footX, footY);
  const sw = Math.sin((frame / 4) * Math.PI * 2);
  const leg = 62, body = 40;
  drawBoxes(ctx, P, [
    { u0: -0.03 + sw * 0.05, u1: 0.03 + sw * 0.05, v0: -0.07, v1: -0.01, z0: 0, z1: leg, faces: DARK },
    { u0: -0.03 - sw * 0.05, u1: 0.03 - sw * 0.05, v0: 0.01, v1: 0.07, z0: 0, z1: leg, faces: DARK },
    { u0: -0.06, u1: 0.06, v0: -0.11, v1: 0.11, z0: leg, z1: leg + body, faces: DARK },
    // lange armen tot op de knieën
    { u0: -0.03 - sw * 0.04, u1: 0.03 - sw * 0.04, v0: -0.17, v1: -0.11, z0: leg - 26, z1: leg + body, faces: DARK },
    { u0: -0.03 + sw * 0.04, u1: 0.03 + sw * 0.04, v0: 0.11, v1: 0.17, z0: leg - 26, z1: leg + body, faces: DARK },
    { u0: -0.11, u1: 0.11, v0: -0.11, v1: 0.11, z0: leg + body, z1: leg + body + 0.22 * 64, faces: HEAD },
  ]);
}

export function generateCreatures(scene) {
  for (let f = 0; f < 4; f++) {
    canvasTexture(scene, `crawler${f}`, CREATURES.crawler.w, CREATURES.crawler.h, (ctx) => drawCrawler(ctx, f));
    canvasTexture(scene, `brute${f}`, CREATURES.brute.w, CREATURES.brute.h, (ctx) => drawBrute(ctx, f));
    crisp(scene, `crawler${f}`);
    crisp(scene, `brute${f}`);
  }
}
