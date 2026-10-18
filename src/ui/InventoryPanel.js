// Rugzak: overzicht van wat je bij je hebt. Wordt bij elke keer openen opnieuw opgebouwd.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, makeButton } from './style.js';

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
    const { width: w, height: h } = sc.scale;
    const safe = sc.safe;

    const c = sc.add.container(0, 0).setDepth(100);
    const dim = sc.add.rectangle(0, 0, w, h, 0x000000, 0.6).setOrigin(0).setInteractive();
    dim.on('pointerdown', () => this.close());
    c.add(dim);

    const owned = Object.entries(CONFIG.items).filter(([k]) => this.inventory.get(k) > 0);
    const rowH = 30 * S;
    const pw = Math.min(w - 32 * S, 360 * S);
    const ph = (owned.length ? owned.length * rowH : rowH) + 170 * S;
    const px = (w - pw) / 2;
    const py = safe.top + 70 * S;

    const panel = sc.add.rectangle(px, py, pw, ph, COLORS.panel, 0.97)
      .setOrigin(0)
      .setStrokeStyle(2 * S, COLORS.panelEdge)
      .setInteractive();   // vangt tikken op zodat het paneel niet sluit
    c.add(panel);

    const pad = 18 * S;
    c.add(sc.add.text(px + pad, py + pad, TEXT.bagTitle, textStyle(S, 16, COLORS.text, { fontStyle: 'bold' })));

    let y = py + pad + 40 * S;
    if (!owned.length) {
      c.add(sc.add.text(px + pad, y, TEXT.bagEmpty, textStyle(S, 13, COLORS.dim, { wordWrap: { width: pw - pad * 2 } })));
      y += rowH;
    }
    for (const [k, def] of owned) {
      c.add(sc.add.rectangle(px + pad, y + 8 * S, 14 * S, 14 * S, Phaser.Display.Color.HexStringToColor(def.color).color)
        .setOrigin(0, 0.5).setStrokeStyle(S, 0x000000, 0.6));
      c.add(sc.add.text(px + pad + 24 * S, y + 8 * S, def.name, textStyle(S, 14)).setOrigin(0, 0.5));
      c.add(sc.add.text(px + pw - pad, y + 8 * S, String(this.inventory.get(k)), textStyle(S, 14)).setOrigin(1, 0.5));
      y += rowH;
    }

    y += 12 * S;
    c.add(sc.add.text(px + pad, y, TEXT.bagCraftHint, textStyle(S, 12, COLORS.dim, { wordWrap: { width: pw - pad * 2 } })));

    const bw = (pw - pad * 3) / 2;
    const by = py + ph - pad - 20 * S;
    let confirmReset = false;
    c.add(makeButton(sc, px + pad + bw / 2, by, bw, 40 * S, TEXT.reset, (label) => {
      if (!confirmReset) {
        confirmReset = true;
        label.setText(TEXT.resetConfirm).setColor('#e0a090');
      } else {
        bus.emit('reset');
      }
    }, 10));
    c.add(makeButton(sc, px + pad * 2 + bw * 1.5, by, bw, 40 * S, TEXT.close, () => this.close()));

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
