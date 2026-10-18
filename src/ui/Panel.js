// Basis voor schermvullende panelen (rugzak, kist): verduistering, kader, titel en rijen.
import { CONFIG } from '../config.js';
import { COLORS, textStyle, storyStyle, roundedBox } from './style.js';

// anchor 'bottom': paneel onderin, zodat de wereld erboven zichtbaar blijft
// footer: ruimte onderin voor knoppen; alles daarboven scrollt als het niet past
export function createPanel(scene, { title, subtitle, height, onBackdrop, anchor = 'center', footer = 70 }) {
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
    const st = scene.add.text(px + pad, y, subtitle, storyStyle(S, 14, COLORS.text, { wordWrap: { width: pw - pad * 2 } }));
    c.add(st);
    y += st.height + 10 * S;
  }
  const line = scene.add.rectangle(px + pad, y, pw - pad * 2, Math.max(1, S), COLORS.panelEdge, 0.18).setOrigin(0, 0.5);
  c.add(line);
  y += 14 * S;

  const panel = { c, px, py, pw, ph, pad, y };
  addScroll(scene, panel, y - 6 * S, py + ph - footer * S);
  return panel;
}

// Scrollbare lijst: rijen gaan in panel.list; slepen of het muiswiel schuift hem.
function addScroll(scene, panel, top, bottom) {
  const S = scene.S;
  const { c, px, pw } = panel;
  const list = scene.add.container(0, 0);
  c.add(list);
  const shape = scene.make.graphics({ add: false });
  shape.fillStyle(0xffffff);
  shape.fillRect(px, top, pw, bottom - top);
  list.setMask(shape.createGeometryMask());

  let minY = 0;
  let drag = null;
  const clamp = (v) => Math.max(minY, Math.min(0, v));
  let hint = null;
  const updateHint = () => hint?.setVisible(minY < 0 && list.y > minY + 2);
  const onDown = (p) => {
    if (p.x >= px && p.x <= px + pw && p.y >= top && p.y <= bottom) drag = { y: p.y, start: list.y };
  };
  const onMove = (p) => {
    if (!drag || !p.isDown) return;
    list.y = clamp(drag.start + (p.y - drag.y));
    updateHint();
  };
  const onUp = () => { drag = null; };
  const onWheel = (p, over, dx, dy) => { list.y = clamp(list.y - dy); updateHint(); };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  scene.input.on('wheel', onWheel);
  c.once('destroy', () => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    scene.input.off('wheel', onWheel);
    shape.destroy();
  });

  // pijltje als er meer onder zit
  hint = scene.add.text(px + pw / 2, bottom - 2 * S, '▾', textStyle(S, 16, COLORS.dim)).setOrigin(0.5, 1).setVisible(false);
  c.add(hint);
  scene.tweens.add({ targets: hint, y: hint.y + 4 * S, duration: 600, yoyo: true, repeat: -1 });

  panel.list = list;
  // na het vullen: hoe hoog is de inhoud (eindpunt y in schermcoördinaten)
  panel.setContentEnd = (endY) => {
    minY = Math.min(0, bottom - endY - 10 * S);
    list.y = clamp(list.y);
    updateHint();
  };
  // is een punt op het scherm zichtbaar in de lijst? (knoppen buiten beeld doen niks)
  panel.inView = (y) => y >= top && y <= bottom;
}

// Een recept: icoon, naam, kosten (rood als je te weinig hebt) en een MAAK-knop. Geeft de hoogte terug.
export function recipeRow(scene, panel, y, { icon, name, cost, inventory, state, onMake, makeButton, labels }) {
  const S = scene.S;
  const { px, pw, pad } = panel;
  const c = panel.list || panel.c;
  const cy = y + 22 * S;
  const dim = state.owned ? 0.45 : 1;
  c.add(scene.add.image(px + pad + 15 * S, cy, icon).setDisplaySize(32 * S, 32 * S).setAlpha(dim));
  c.add(scene.add.text(px + pad + 40 * S, cy - 9 * S, name, textStyle(S, 15)).setOrigin(0, 0.5).setAlpha(dim));

  // kosten als kleine iconen met aantallen
  let x = px + pad + 40 * S;
  for (const [k, n] of Object.entries(cost)) {
    const enough = inventory.has(k, n);
    c.add(scene.add.image(x + 8 * S, cy + 11 * S, `icon_${k}`).setDisplaySize(16 * S, 16 * S).setAlpha(dim));
    const t = scene.add.text(x + 18 * S, cy + 11 * S, `${inventory.get(k)}/${n}`,
      textStyle(S, 12, enough ? COLORS.dim : COLORS.warn)).setOrigin(0, 0.5).setAlpha(dim);
    c.add(t);
    x += 18 * S + t.width + 12 * S;
  }

  const bx = px + pw - pad - 42 * S;
  if (state.owned) {
    c.add(scene.add.text(bx, cy, labels.owned, textStyle(S, 11, COLORS.dim, { fontStyle: '700' })).setOrigin(0.5));
  } else {
    const b = makeButton(scene, bx, cy, 84 * S, 34 * S, labels.make, (lbl, p) => {
      if (state.canCraft && (!panel.inView || panel.inView(p.y))) onMake();
    }, 12);
    b.setAlpha(state.canCraft ? 1 : 0.4);
    c.add(b);
  }
  return 50 * S;
}

// Eén rij met icoon, naam en aantal. Geeft de hoogte terug.
export function itemRow(scene, panel, key, count, y, button) {
  const S = scene.S;
  const def = CONFIG.items[key];
  const { px, pw, pad } = panel;
  const c = panel.list || panel.c;
  const cy = y + 16 * S;
  c.add(scene.add.image(px + pad + 13 * S, cy, `icon_${key}`).setDisplaySize(28 * S, 28 * S));
  c.add(scene.add.text(px + pad + 36 * S, cy, def.name, textStyle(S, 15)).setOrigin(0, 0.5));
  const right = button ? px + pw - pad - 96 * S : px + pw - pad;
  c.add(scene.add.text(right, cy, String(count), textStyle(S, 15, COLORS.text, { fontStyle: '700' })).setOrigin(1, 0.5));
  if (button) c.add(button(px + pw - pad - 42 * S, cy));
  return 40 * S;
}
