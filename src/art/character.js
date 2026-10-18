// De speler als blokkig poppetje met kap. Kijkt naar rechts; links = gespiegeld.
import { canvasTexture } from './util.js';
import { iso, drawBoxes, crisp } from './blocks.js';

export const PLAYER = { w: 70, h: 124, footX: 35, footY: 112, walkFrames: 6 };


function drawFrame(ctx, phase, moving) {
  const P = iso(PLAYER.footX, PLAYER.footY);
  const sw = moving ? Math.sin(phase) : 0;
  const leg = 32, body = 34, head = 0.22;
  const lift = (s) => Math.max(0, s) * 3;
  const pants = { top: 'pants', left: 'pants', right: 'pants' };
  const cloak = { top: 'hood', left: 'cloak', right: 'cloak' };
  const arm = { top: 'hood', left: 'hood', right: 'hood' };
  const step = 0.07 * sw;

  drawBoxes(ctx, P, [
    // benen: het ene naar voren (u+), het andere naar achteren
    { u0: -0.05 + step, u1: 0.05 + step, v0: -0.1, v1: 0, z0: lift(sw), z1: leg, faces: pants },
    { u0: -0.05 - step, u1: 0.05 - step, v0: 0, v1: 0.1, z0: lift(-sw), z1: leg, faces: pants },
    // lijf
    { u0: -0.06, u1: 0.06, v0: -0.11, v1: 0.11, z0: leg, z1: leg + body, faces: cloak },
    // armen zwaaien tegengesteld aan de benen
    { u0: -0.045 - step, u1: 0.045 - step, v0: -0.19, v1: -0.11, z0: leg + 4, z1: leg + body, faces: arm },
    { u0: -0.045 + step, u1: 0.045 + step, v0: 0.11, v1: 0.19, z0: leg + 4, z1: leg + body, faces: arm },
    // handen
    { u0: -0.045 - step, u1: 0.045 - step, v0: -0.19, v1: -0.11, z0: leg, z1: leg + 5, faces: { top: 'skin', left: 'skin', right: 'skin' } },
    { u0: -0.045 + step, u1: 0.045 + step, v0: 0.11, v1: 0.19, z0: leg, z1: leg + 5, faces: { top: 'skin', left: 'skin', right: 'skin' } },
    // hoofd met kap; het gezicht zit aan de voorkant (rechts)
    { u0: -head / 2, u1: head / 2, v0: -head / 2, v1: head / 2, z0: leg + body, z1: leg + body + head * 64, faces: { top: 'hood', left: 'hood', right: 'face' } },
  ]);
}

export function generateCharacter(scene) {
  canvasTexture(scene, 'player_idle', PLAYER.w, PLAYER.h, (ctx) => drawFrame(ctx, 0, false));
  crisp(scene, 'player_idle');
  for (let i = 0; i < PLAYER.walkFrames; i++) {
    const phase = (i / PLAYER.walkFrames) * Math.PI * 2;
    canvasTexture(scene, `player_walk${i}`, PLAYER.w, PLAYER.h, (ctx) => drawFrame(ctx, phase, true));
    crisp(scene, `player_walk${i}`);
  }
}
