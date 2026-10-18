// Rugzak: overzicht van wat je bij je hebt. Wordt bij elke keer openen opnieuw opgebouwd.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, makeButton } from './style.js';
import { createPanel, itemRow } from './Panel.js';

export class InventoryPanel {
  constructor(scene, inventory) {
    this.scene = scene;
    this.inventory = inventory;
    this.container = null;
  }

  get isOpen() {
    return !!this.container;
  }

  toggle() {
    if (this.isOpen) this.close(); else this.open();
  }

  open() {
    if (this.isOpen) return;
    const sc = this.scene;
    const S = sc.S;
    const owned = Object.keys(CONFIG.items).filter((k) => this.inventory.get(k) > 0);
    const rows = Math.max(1, owned.length);

    const panel = createPanel(sc, {
      title: TEXT.bagTitle,
      height: rows * 40 * S + 230 * S,
      onBackdrop: () => this.close(),
    });
    const { c, px, py, pw, ph, pad } = panel;
    let y = panel.y;

    if (!owned.length) {
      c.add(sc.add.text(px + pad, y + 8 * S, TEXT.bagEmpty, textStyle(S, 14, COLORS.dim, { wordWrap: { width: pw - pad * 2 } })));
      y += 40 * S;
    }
    for (const k of owned) y += itemRow(sc, panel, k, this.inventory.get(k), y);

    y += 14 * S;
    c.add(sc.add.text(px + pad, y, TEXT.bagCraftHint, textStyle(S, 13, COLORS.dim, { wordWrap: { width: pw - pad * 2 } })));

    const bw = (pw - pad * 3) / 2;
    const by = py + ph - pad - 22 * S;
    let confirmReset = false;
    c.add(makeButton(sc, px + pad + bw / 2, by, bw, 44 * S, TEXT.reset, (label) => {
      if (!confirmReset) {
        confirmReset = true;
        label.setText(TEXT.resetConfirm).setColor(COLORS.warn);
      } else {
        bus.emit('reset');
      }
    }, 11));
    c.add(makeButton(sc, px + pad * 2 + bw * 1.5, by, bw, 44 * S, TEXT.close, () => this.close()));

    this.container = c;
  }

  close() {
    if (!this.container) return;
    // pas een frame later weghalen, zodat de tik die sluit niet doorvalt naar de joystick
    const c = this.container;
    this.container = null;
    this.scene.time.delayedCall(0, () => c.destroy());
  }
}
