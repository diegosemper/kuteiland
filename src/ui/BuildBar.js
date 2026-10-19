// Balk onderin tijdens het bouwen: kies wat je plaatst (of WEGHALEN), of stop met bouwen.
// Past niet alles op het scherm, dan veeg je de strook naar links of rechts.
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, roundedBox, makeButton, shade } from './style.js';

export class BuildBar {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.state = { active: false, item: null, options: [] };
    this.scrollX = 0;
    this.drag = null;
    this.slots = [];

    // vegen en tikken op de strook
    const S = scene.S;
    scene.input.on('pointerdown', (p) => {
      if (!this.active || !this.strip || !this.inStrip(p)) return;
      this.drag = { x: p.x, start: this.scrollX, moved: false };
    });
    scene.input.on('pointermove', (p) => {
      if (!this.drag || !p.isDown) return;
      const dx = p.x - this.drag.x;
      if (Math.abs(dx) > 10 * S) this.drag.moved = true;
      if (this.drag.moved) this.setScroll(this.drag.start - dx);
    });
    scene.input.on('pointerup', (p) => {
      const d = this.drag;
      this.drag = null;
      if (!d || d.moved || !this.active) return;
      const x = p.x + this.scrollX;
      const hit = this.slots.find((s) => Math.abs(x - s.x) <= s.w / 2 && this.inStrip(p));
      if (hit) bus.emit('build-select', hit.key);
    });
  }

  get active() {
    return this.state.active;
  }

  inStrip(p) {
    const v = this.view;
    return v && p.x >= v.left && p.x <= v.right && Math.abs(p.y - v.y) <= v.h / 2;
  }

  setScroll(x) {
    const v = this.view;
    if (!v) return;
    this.scrollX = Math.max(0, Math.min(x, Math.max(0, v.content - (v.right - v.left))));
    this.strip.x = -this.scrollX;
    this.arrows?.left.setVisible(this.scrollX > 2);
    this.arrows?.right.setVisible(this.scrollX < v.content - (v.right - v.left) - 2);
  }

  update(state) {
    // nieuw bouwen = terug naar het begin van de strook
    if (state.active && !this.state.active) this.scrollX = 0;
    this.state = state;
    this.render();
  }

  render() {
    this.container?.destroy();
    this.container = null;
    this.strip = null;
    this.slots = [];
    if (!this.state.active) return;

    const sc = this.scene;
    const S = sc.S;
    const { width: w, height: h } = sc.scale;
    const safe = sc.safe;
    const c = sc.add.container(0, 0).setDepth(90);

    const barH = 92 * S;
    const y = h - safe.bottom - barH / 2 - 12 * S;
    const bg = roundedBox(sc, w - 24 * S, barH, { fill: COLORS.panel, alpha: 0.94, edgeAlpha: 0.22, radius: 18 });
    bg.setPosition(w / 2, y);
    const blocker = sc.add.zone(w / 2, y, w - 24 * S, barH).setInteractive();
    c.add([bg, blocker]);

    // uitleg erboven
    const removing = this.state.item === 'weg';
    const hint = removing ? TEXT.buildRemoveHint : this.state.item ? TEXT.buildHint : TEXT.buildNothing;
    c.add(shade(sc.add.text(w / 2, y - barH / 2 - 14 * S, hint,
      textStyle(S, 13, COLORS.text, { align: 'center', wordWrap: { width: w - 48 * S } })).setOrigin(0.5, 1), S));

    // klaar-knop rechts, vast
    const bw = 88 * S;
    const doneX = w - 24 * S - bw / 2 - 6 * S;
    c.add(makeButton(sc, doneX, y, bw, 48 * S, TEXT.buildDone, () => bus.emit('build-close'), 13));

    // de strook met keuzes; de eerste is altijd 'weghalen'
    const left = 24 * S;
    const right = doneX - bw / 2 - 10 * S;
    const slot = 64 * S;
    const strip = sc.add.container(0, 0);
    let x = left + slot / 2 + 6 * S;
    const keys = ['weg', ...this.state.options];
    for (const key of keys) {
      const selected = key === this.state.item;
      if (key === 'weg') {
        const box = roundedBox(sc, slot, slot, { fill: removing ? 0x3a1a1f : 0x1a1323, alpha: 0.95, edge: 0xe07a6a, edgeAlpha: removing ? 0.9 : 0.35, radius: 12 });
        box.setPosition(x, y);
        strip.add([box, sc.add.text(x, y, TEXT.buildRemove, textStyle(S, 11, '#ffb0a0', { fontStyle: '800', align: 'center' })).setOrigin(0.5)]);
      } else {
        const box = roundedBox(sc, slot, slot, {
          fill: selected ? 0x2a1f3a : 0x1a1323, alpha: 0.95, edgeAlpha: selected ? 0.9 : 0.25, radius: 12,
        });
        box.setPosition(x, y);
        const icon = sc.add.image(x, y - 6 * S, `icon_${key}`).setDisplaySize(40 * S, 40 * S);
        const count = shade(sc.add.text(x + slot / 2 - 6 * S, y + slot / 2 - 4 * S, String(sc.inventory.get(key)),
          textStyle(S, 13, COLORS.text, { fontStyle: '700' })).setOrigin(1, 1), S);
        strip.add([box, icon, count]);
      }
      this.slots.push({ key, x, w: slot });
      x += slot + 10 * S;
    }
    const content = x - left - 4 * S;
    // alleen zichtbaar binnen de strook
    const maskG = sc.make.graphics({ add: false });
    maskG.fillStyle(0xffffff).fillRect(left, y - barH / 2, right - left, barH);
    strip.setMask(maskG.createGeometryMask());
    c.add(strip);
    this.strip = strip;
    this.view = { left, right, y, h: barH, content };

    // pijltjes als er meer is dan je ziet
    const arrowStyle = textStyle(S, 16, COLORS.text, { fontStyle: '900' });
    this.arrows = {
      left: shade(sc.add.text(left + 2 * S, y, '◂', arrowStyle).setOrigin(0, 0.5), S),
      right: shade(sc.add.text(right - 2 * S, y, '▸', arrowStyle).setOrigin(1, 0.5), S),
    };
    c.add([this.arrows.left, this.arrows.right]);
    this.setScroll(this.scrollX);

    // zorg dat het gekozen item in beeld is
    const sel = this.slots.find((s) => s.key === this.state.item);
    if (sel && (sel.x - this.scrollX > right - slot / 2 || sel.x - this.scrollX < left + slot / 2)) {
      this.setScroll(sel.x - (left + right) / 2);
    }
    this.container = c;
  }
}
