// Kist: spullen opbergen en pakken. Alles in de kist is veilig, ook als je doodgaat.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, makeButton } from './style.js';
import { createPanel, itemRow } from './Panel.js';

export class ChestPanel {
  constructor(scene, inventory, chest) {
    this.scene = scene;
    this.inventory = inventory;
    this.chest = chest;
    this.container = null;
  }

  get isOpen() {
    return !!this.container;
  }

  move(from, to, key) {
    const n = from.get(key);
    if (n > 0 && from.remove(key, n)) to.add(key, n);
    this.rebuild();
  }

  storeAll() {
    for (const k of Object.keys(CONFIG.items)) {
      const n = this.inventory.get(k);
      if (n > 0 && this.inventory.remove(k, n)) this.chest.add(k, n);
    }
    this.rebuild();
  }

  rebuild() {
    const old = this.container;
    this.container = null;
    this.open();
    this.scene.time.delayedCall(0, () => old?.destroy());
  }

  open() {
    if (this.isOpen) return;
    const sc = this.scene;
    const S = sc.S;
    const keys = Object.keys(CONFIG.items);
    const carried = keys.filter((k) => this.inventory.get(k) > 0);
    const stored = keys.filter((k) => this.chest.get(k) > 0);
    const rowH = 40 * S;

    const panel = createPanel(sc, {
      title: TEXT.chestTitle,
      subtitle: TEXT.chestSubtitle,
      height: (Math.max(1, carried.length) + Math.max(1, stored.length)) * rowH + 250 * S,
      onBackdrop: () => this.close(),
      anchor: 'bottom',
    });
    const { c, px, py, pw, ph, pad } = panel;
    const list = panel.list;
    let y = panel.y;

    const section = (label, keys, source, target, btnLabel, emptyText) => {
      list.add(sc.add.text(px + pad, y, label, textStyle(S, 11, COLORS.dim, { fontStyle: '700', letterSpacing: 1.5 * S })));
      y += 20 * S;
      if (!keys.length) {
        list.add(sc.add.text(px + pad, y + 8 * S, emptyText, textStyle(S, 14, COLORS.dim)));
        y += rowH;
      }
      for (const k of keys) {
        y += itemRow(sc, panel, k, source.get(k), y,
          (bx, by) => makeButton(sc, bx, by, 84 * S, 32 * S, btnLabel, (lbl, p) => { if (panel.inView(p.y)) this.move(source, target, k); }, 11));
      }
      y += 10 * S;
    };

    section(TEXT.chestCarried, carried, this.inventory, this.chest, TEXT.chestStore, TEXT.chestNothingCarried);
    section(TEXT.chestStored, stored, this.chest, this.inventory, TEXT.chestTake, TEXT.chestEmpty);
    panel.setContentEnd(y);

    const bw = (pw - pad * 3) / 2;
    const by = py + ph - pad - 22 * S;
    c.add(makeButton(sc, px + pad + bw / 2, by, bw, 44 * S, TEXT.chestStoreAll, () => this.storeAll(), 12));
    c.add(makeButton(sc, px + pad * 2 + bw * 1.5, by, bw, 44 * S, TEXT.close, () => this.close()));

    this.container = c;
  }

  close() {
    if (!this.container) return;
    const c = this.container;
    this.container = null;
    this.scene.time.delayedCall(0, () => c.destroy());
    bus.emit('chest-closed');
  }
}
