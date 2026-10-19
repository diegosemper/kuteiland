// Balk onderin tijdens het bouwen: kies wat je plaatst, of stop met bouwen.
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, roundedBox, makeButton, shade } from './style.js';

export class BuildBar {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.state = { active: false, item: null, options: [] };
  }

  get active() {
    return this.state.active;
  }

  update(state) {
    this.state = state;
    this.render();
  }

  render() {
    this.container?.destroy();
    this.container = null;
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

    // keuzes; de eerste is altijd 'weghalen'
    const slot = 64 * S;
    let x = 24 * S + slot / 2 + 6 * S;
    {
      const box = roundedBox(sc, slot, slot, { fill: removing ? 0x3a1a1f : 0x1a1323, alpha: 0.95, edge: 0xe07a6a, edgeAlpha: removing ? 0.9 : 0.35, radius: 12 });
      box.setPosition(x, y);
      const label = sc.add.text(x, y, TEXT.buildRemove, textStyle(S, 11, '#ffb0a0', { fontStyle: '800', align: 'center' })).setOrigin(0.5);
      const zone = sc.add.zone(x, y, slot, slot).setInteractive();
      zone.on('pointerdown', () => bus.emit('build-select', 'weg'));
      c.add([box, label, zone]);
      x += slot + 10 * S;
    }
    for (const key of this.state.options) {
      const selected = key === this.state.item;
      const box = roundedBox(sc, slot, slot, {
        fill: selected ? 0x2a1f3a : 0x1a1323, alpha: 0.95,
        edgeAlpha: selected ? 0.9 : 0.25, radius: 12,
      });
      box.setPosition(x, y);
      const icon = sc.add.image(x, y - 6 * S, `icon_${key}`).setDisplaySize(40 * S, 40 * S);
      const count = shade(sc.add.text(x + slot / 2 - 6 * S, y + slot / 2 - 4 * S, String(sc.inventory.get(key)),
        textStyle(S, 13, COLORS.text, { fontStyle: '700' })).setOrigin(1, 1), S);
      const zone = sc.add.zone(x, y, slot, slot).setInteractive();
      zone.on('pointerdown', () => bus.emit('build-select', key));
      c.add([box, icon, count, zone]);
      x += slot + 10 * S;
    }

    // klaar
    const bw = 88 * S;
    c.add(makeButton(sc, w - 24 * S - bw / 2 - 6 * S, y, bw, 48 * S, TEXT.buildDone, () => bus.emit('build-close'), 13));
    this.container = c;
  }
}
