// Nieuwe cyclus: kies een blijvende bonus en begin opnieuw.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, storyStyle, makeButton, roundedBox } from './style.js';
import { createPanel } from './Panel.js';
import { getMeta, bonusChoices } from '../systems/Meta.js';

export class PrestigePanel {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.choices = null;
    this.picked = null;
  }

  get isOpen() {
    return !!this.container;
  }

  open() {
    if (this.isOpen) return;
    const sc = this.scene;
    const S = sc.S;
    const meta = getMeta();
    if (!this.choices) this.choices = bonusChoices();
    const owned = CONFIG.prestige.bonuses.filter((b) => meta.bonuses[b.id]);

    const panel = createPanel(sc, {
      title: `${TEXT.prestigeTitle} · ${TEXT.prestigeCycle} ${meta.cycle + 1}`,
      subtitle: TEXT.prestigeSubtitle,
      height: this.choices.length * 66 * S + (owned.length ? 60 * S : 0) + 230 * S,
      onBackdrop: () => this.close(),
    });
    const { c, px, py, pw, ph, pad } = panel;
    let y = panel.y + 12 * S;

    c.add(sc.add.text(px + pad, y, TEXT.prestigePick, textStyle(S, 12, COLORS.dim)));
    y += 22 * S;
    for (const b of this.choices) {
      const sel = this.picked === b.id;
      const box = roundedBox(sc, pw - pad * 2, 56 * S, { fill: sel ? 0x2a1f3a : 0x1a1323, alpha: 0.95, edgeAlpha: sel ? 0.9 : 0.25, radius: 12 });
      box.setPosition(px + pw / 2, y + 28 * S);
      c.add(box);
      c.add(sc.add.text(px + pad + 14 * S, y + 10 * S, b.name, storyStyle(S, 16, COLORS.text)));
      c.add(sc.add.text(px + pad + 14 * S, y + 32 * S, b.text, textStyle(S, 13, COLORS.dim)));
      const zone = sc.add.zone(px + pw / 2, y + 28 * S, pw - pad * 2, 56 * S).setInteractive();
      zone.on('pointerdown', () => { this.picked = b.id; this.rebuild(); });
      c.add(zone);
      y += 66 * S;
    }
    if (owned.length) {
      y += 6 * S;
      c.add(sc.add.text(px + pad, y, `${TEXT.prestigeHave} ${owned.map((b) => `${b.name} x${meta.bonuses[b.id]}`).join(', ')}`,
        textStyle(S, 12, COLORS.dim, { wordWrap: { width: pw - pad * 2 } })));
    }

    const bw = (pw - pad * 3) / 2;
    const by = py + ph - pad - 22 * S;
    const go = makeButton(sc, px + pad + bw / 2, by, bw, 44 * S, TEXT.prestigeGo, () => {
      if (this.picked) bus.emit('prestige', this.picked);
    }, 12);
    go.setAlpha(this.picked ? 1 : 0.4);
    c.add(go);
    c.add(makeButton(sc, px + pad * 2 + bw * 1.5, by, bw, 44 * S, TEXT.close, () => this.close()));
    this.container = c;
  }

  rebuild() {
    const old = this.container;
    this.container = null;
    this.open();
    this.scene.time.delayedCall(0, () => old?.destroy());
  }

  close() {
    if (!this.container) return;
    const c = this.container;
    this.container = null;
    this.scene.time.delayedCall(0, () => c.destroy());
  }
}
