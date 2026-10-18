// Graphics voor het latere spel: altaar van een bewaker, de poort naar de Diepte, het aambeeld en machines.
import { CONFIG } from '../config.js';
import { canvasTexture } from './util.js';
import { iso, drawBoxes, boxAt, all, crisp, machineFace } from './blocks.js';

const { tileH: TH } = CONFIG.iso;

export const ALTAR = { w: 120, h: 130, ox: 60, oy: 100 };

function drawAltar(ctx) {
  const P = iso(ALTAR.ox, ALTAR.oy);
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.62, 10, all('bricks')),
    boxAt(0, 0, 10, 0.4, 24, all('obsidian')),
    boxAt(0, 0, 34, 0.5, 6, { top: 'bricks_glow', left: 'bricks', right: 'bricks' }),
    // het zegel: een zwevend blok dat de kleur van de bewaker krijgt (via tint)
    boxAt(0, 0, 52, 0.22, 0.22 * TH, all('quartz')),
  ]);
}

export const PORTAL = { w: 150, h: 190, ox: 75, oy: 150 };

function drawPortal(ctx) {
  const P = iso(PORTAL.ox, PORTAL.oy);
  const obs = all('obsidian');
  drawBoxes(ctx, P, [
    // lijst van obsidiaan, schuin in beeld
    { u0: -0.42, u1: -0.3, v0: -0.06, v1: 0.06, z0: 0, z1: 118, faces: obs },
    { u0: 0.3, u1: 0.42, v0: -0.06, v1: 0.06, z0: 0, z1: 118, faces: obs },
    { u0: -0.42, u1: 0.42, v0: -0.06, v1: 0.06, z0: 0, z1: 12, faces: obs },
    { u0: -0.42, u1: 0.42, v0: -0.06, v1: 0.06, z0: 106, z1: 118, faces: obs },
    // de leegte erin
    { u0: -0.3, u1: 0.3, v0: -0.02, v1: 0.02, z0: 12, z1: 106, faces: { left: 'void_liquid', right: 'void_liquid', top: 'void_liquid' } },
  ]);
}

export const ANVIL = { w: 100, h: 90, ox: 50, oy: 70 };

function drawAnvil(ctx) {
  const P = iso(ANVIL.ox, ANVIL.oy);
  const iron = all('anvil');
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.34, 8, iron),
    boxAt(0, 0, 8, 0.14, 14, iron),
    { u0: -0.26, u1: 0.26, v0: -0.12, v1: 0.12, z0: 22, z1: 34, faces: iron },
  ]);
}

export const MACHINE = { w: 100, h: 110, ox: 50, oy: 84 };

function drawMachine(ctx, type) {
  const P = iso(MACHINE.ox, MACHINE.oy);
  const def = CONFIG.machines.types[type];
  const front = machineFace(`machine_${type}`, def.glow);
  const top = { zaagmolen: 'log_top', steenmaler: 'cobble', roestvanger: 'rust', kristalpers: 'amethyst', zwavelpomp: 'sulfur', sterrenzeef: 'quartz' }[type];
  drawBoxes(ctx, P, [
    boxAt(0, 0, 0, 0.5, 0.5 * TH * 0.9, { top: 'iron', left: front, right: front }),
    boxAt(0, 0, 0.5 * TH * 0.9, 0.24, 10, all(top)),
  ]);
}

export function generateEndgame(scene) {
  canvasTexture(scene, 'altar', ALTAR.w, ALTAR.h, drawAltar);
  canvasTexture(scene, 'portal', PORTAL.w, PORTAL.h, drawPortal);
  canvasTexture(scene, 'anvil', ANVIL.w, ANVIL.h, drawAnvil);
  const keys = ['altar', 'portal', 'anvil'];
  for (const type of Object.keys(CONFIG.machines.types)) {
    canvasTexture(scene, `machine_${type}`, MACHINE.w, MACHINE.h, (ctx) => drawMachine(ctx, type));
    keys.push(`machine_${type}`);
  }
  for (const k of keys) crisp(scene, k);
}
