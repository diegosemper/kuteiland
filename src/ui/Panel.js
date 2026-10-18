// Basis voor schermvullende panelen (rugzak, kist): verduistering, kader, titel en rijen.
import { CONFIG } from '../config.js';
import { COLORS, textStyle, storyStyle, roundedBox } from './style.js';

// anchor 'bottom': paneel onderin, zodat de wereld erboven zichtbaar blijft
export function createPanel(scene, { title, subtitle, height, onBackdrop, anchor = 'center' }) {
  const S = scene.S;
  const { width: w, height: h } = scene.scale;
  const safe = scene.safe;

  const c = scene.add.container(0, 0).setDepth(100);
  const dim = scene.add.rectangle(0, 0, w, h, 0x05030a, anchor === 'bottom' ? 0.35 : 0.7).setOrigin(0).setInteractive();
  dim.on('pointerdown', () => onBackdrop?.());
  c.add(dim);

  const pw = Math.min(w - 28 * S, 380 * S);
  const ph = Math.min(height, h - safe.top - safe.bottom - 40 * S);
  const px = (w - pw) / 2;
  const py = anchor === 'bottom'
    ? h - safe.bottom - ph - 18 * S
    : Math.max(safe.top + 64 * S, (h - ph) / 2 - 40 * S);

  const box = roundedBox(scene, pw, ph, { fill: COLORS.panel, alpha: 0.96, edgeAlpha: 0.22, radius: 16 });
  box.setPosition(px + pw / 2, py + ph / 2);
  const blocker = scene.add.zone(px + pw / 2, py + ph / 2, pw, ph).setInteractive();  // tikken op het paneel sluit niet
  c.add([box, blocker]);

  const pad = 20 * S;
  c.add(scene.add.text(px + pad, py + pad, title, textStyle(S, 13, COLORS.dim, { fontStyle: '700', letterSpacing: 2 * S })));
  let y = py + pad + 22 * S;
  if (subtitle) {
    c.add(scene.add.text(px + pad, y, subtitle, storyStyle(S, 14, COLORS.text, { wordWrap: { width: pw - pad * 2 } })));
    y += 30 * S;
  }
  const line = scene.add.rectangle(px + pad, y, pw - pad * 2, Math.max(1, S), COLORS.panelEdge, 0.18).setOrigin(0, 0.5);
  c.add(line);
  y += 14 * S;

  return { c, px, py, pw, ph, pad, y };
}

// Eén rij met icoon, naam en aantal. Geeft de hoogte terug.
export function itemRow(scene, panel, key, count, y, button) {
  const S = scene.S;
  const def = CONFIG.items[key];
  const { c, px, pw, pad } = panel;
  const cy = y + 16 * S;
  c.add(scene.add.image(px + pad + 13 * S, cy, `icon_${key}`).setDisplaySize(28 * S, 28 * S));
  c.add(scene.add.text(px + pad + 36 * S, cy, def.name, textStyle(S, 15)).setOrigin(0, 0.5));
  const right = button ? px + pw - pad - 96 * S : px + pw - pad;
  c.add(scene.add.text(right, cy, String(count), textStyle(S, 15, COLORS.text, { fontStyle: '700' })).setOrigin(1, 0.5));
  if (button) c.add(button(px + pw - pad - 42 * S, cy));
  return 40 * S;
}
