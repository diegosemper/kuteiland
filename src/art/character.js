// De speler: een gehulde zwerver in een versleten mantel. Kijkt naar rechts; links = gespiegeld.
import { canvasTexture, ellipse } from './util.js';

export const PLAYER = { w: 64, h: 118, footX: 32, footY: 112, walkFrames: 6 };

function leg(ctx, x, footY, lift, dark) {
  const top = footY - 28;
  ctx.fillStyle = dark ? '#1b1820' : '#28242e';
  ctx.beginPath();
  ctx.moveTo(x - 3.6, top);
  ctx.lineTo(x + 3.6, top);
  ctx.lineTo(x + 3.2, footY - 8 - lift);
  ctx.lineTo(x - 3.2, footY - 8 - lift);
  ctx.closePath();
  ctx.fill();
  // laars
  const by = footY - lift;
  ctx.fillStyle = dark ? '#120e0c' : '#1d1612';
  ctx.beginPath();
  ctx.moveTo(x - 3.8, by - 10);
  ctx.lineTo(x + 3.8, by - 10);
  ctx.quadraticCurveTo(x + 4.2, by - 4, x + 7.5, by - 2.5);
  ctx.quadraticCurveTo(x + 8, by, x + 6, by);
  ctx.lineTo(x - 4, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,95,75,0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 3.6, by - 9.5);
  ctx.lineTo(x + 3.6, by - 9.5);
  ctx.stroke();
}

function drawFrame(ctx, phase, moving) {
  const sw = moving ? Math.sin(phase) : 0;
  const fx = PLAYER.footX, fy = PLAYER.footY;
  const hemY = fy - 20;

  // benen
  leg(ctx, fx - 4 - sw * 6, fy, moving ? Math.max(0, -Math.cos(phase)) * 3 : 0, true);
  leg(ctx, fx + 4 + sw * 6, fy, moving ? Math.max(0, Math.cos(phase)) * 3 : 0, false);

  // achterste arm
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#25222c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(fx - 8, fy - 64);
  ctx.quadraticCurveTo(fx - 13 - sw * 2, fy - 52, fx - 11 + sw * 4, fy - 42);
  ctx.stroke();

  // mantel
  const sway = -sw * 1.5;
  ctx.beginPath();
  ctx.moveTo(fx - 9, fy - 70);
  ctx.quadraticCurveTo(fx - 16, fy - 44, fx - 17 + sway, hemY);
  const hem = [-17, -13, -9, -5, -1, 3, 7, 11, 15];
  hem.forEach((x, i) => ctx.lineTo(fx + x + sway, hemY + (i % 2 ? 3.5 : 0) + (i === 4 ? 1 : 0)));
  ctx.lineTo(fx + 16 + sway, hemY - 1);
  ctx.quadraticCurveTo(fx + 15, fy - 44, fx + 9, fy - 70);
  ctx.closePath();
  const g = ctx.createLinearGradient(fx - 17, 0, fx + 17, 0);
  g.addColorStop(0, '#5f5a6a');
  g.addColorStop(0.45, '#3d3947');
  g.addColorStop(1, '#211e27');
  ctx.fillStyle = g;
  ctx.fill();

  // plooien
  const fold = (x0, y0, cx, cy, x1, y1, col, a, w) => {
    ctx.strokeStyle = col;
    ctx.globalAlpha = a;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  fold(fx - 3, fy - 60, fx - 6, fy - 40, fx - 7 + sway, hemY + 2, '#17141c', 0.7, 1.4);
  fold(fx + 5, fy - 58, fx + 7, fy - 38, fx + 9 + sway, hemY + 1, '#17141c', 0.6, 1.2);
  fold(fx - 10, fy - 54, fx - 12, fy - 38, fx - 13 + sway, hemY, '#7a7486', 0.35, 1);

  // riem en tasje
  ctx.fillStyle = '#2e2219';
  ctx.fillRect(fx - 13, fy - 49, 26, 3.5);
  ctx.fillStyle = '#9a8456';
  ctx.fillRect(fx + 2, fy - 49.5, 3.5, 4.5);
  ctx.fillStyle = '#4a3826';
  ctx.fillRect(fx - 17, fy - 46, 8, 9);
  ctx.fillStyle = '#382a1c';
  ctx.fillRect(fx - 17, fy - 46, 8, 3);

  // sjaal
  ellipse(ctx, fx + 1, fy - 70, 10.5, 4.2, '#5c3328');
  ctx.fillStyle = '#4a2a22';
  ctx.beginPath();
  ctx.moveTo(fx - 6, fy - 70);
  ctx.quadraticCurveTo(fx - 11, fy - 62, fx - 9, fy - 54);
  ctx.lineTo(fx - 5, fy - 55);
  ctx.quadraticCurveTo(fx - 6, fy - 62, fx - 2, fy - 68);
  ctx.closePath();
  ctx.fill();

  // kap
  ctx.beginPath();
  ctx.moveTo(fx - 11, fy - 68);
  ctx.quadraticCurveTo(fx - 14, fy - 88, fx - 7, fy - 100);
  ctx.quadraticCurveTo(fx + 6, fy - 99, fx + 11, fy - 88);
  ctx.quadraticCurveTo(fx + 14, fy - 76, fx + 11, fy - 68);
  ctx.closePath();
  const hg = ctx.createLinearGradient(fx - 14, fy - 100, fx + 14, fy - 70);
  hg.addColorStop(0, '#68627a');
  hg.addColorStop(0.5, '#403b4c');
  hg.addColorStop(1, '#1f1c26');
  ctx.fillStyle = hg;
  ctx.fill();

  // gezicht diep in de kap
  ellipse(ctx, fx + 5.5, fy - 80, 6, 8, '#0c090d');
  ellipse(ctx, fx + 7, fy - 77, 4, 5, '#8c7462');
  const sg = ctx.createLinearGradient(0, fy - 85, 0, fy - 74);
  sg.addColorStop(0, 'rgba(8,6,9,0.95)');
  sg.addColorStop(1, 'rgba(8,6,9,0)');
  ellipse(ctx, fx + 6.5, fy - 79, 5, 6.5, sg);
  ellipse(ctx, fx + 8.6, fy - 79.5, 0.9, 0.6, 'rgba(230,215,195,0.8)');

  // voorste arm met hand
  ctx.strokeStyle = '#3d3948';
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(fx + 8, fy - 65);
  ctx.quadraticCurveTo(fx + 14 - sw * 2, fy - 54, fx + 11 - sw * 5, fy - 43);
  ctx.stroke();
  ellipse(ctx, fx + 11 - sw * 5, fy - 41, 2.8, 2.6, '#9c8370');

  // zwak paars randlicht van de Kern
  ctx.strokeStyle = 'rgba(150,110,220,0.25)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(fx + 11, fy - 88);
  ctx.quadraticCurveTo(fx + 14, fy - 76, fx + 11, fy - 68);
  ctx.quadraticCurveTo(fx + 15, fy - 44, fx + 16 + sway, hemY - 1);
  ctx.stroke();
}

export function generateCharacter(scene) {
  canvasTexture(scene, 'player_idle', PLAYER.w, PLAYER.h, (ctx) => drawFrame(ctx, 0, false));
  for (let i = 0; i < PLAYER.walkFrames; i++) {
    const phase = (i / PLAYER.walkFrames) * Math.PI * 2;
    canvasTexture(scene, `player_walk${i}`, PLAYER.w, PLAYER.h, (ctx) => drawFrame(ctx, phase, true));
  }
}
