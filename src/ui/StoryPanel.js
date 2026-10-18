// Een stukje verhaal: briefje, inscriptie of wat de Kern je laat zien.
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, storyStyle, makeButton } from './style.js';
import { createPanel } from './Panel.js';

export class StoryPanel {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
  }

  get isOpen() {
    return !!this.container;
  }

  open({ title, text, after }) {
    if (this.isOpen) this.close(true);
    const sc = this.scene;
    const S = sc.S;
    const { width: w } = sc.scale;
    const pw = Math.min(w - 28 * S, 380 * S);
    // hoogte meten met een tijdelijke tekst
    const probe = sc.add.text(0, 0, text, storyStyle(S, 16, COLORS.text, { wordWrap: { width: pw - 40 * S }, lineSpacing: 6 * S, fontStyle: 'normal' }));
    const textH = probe.height;
    probe.destroy();

    const panel = createPanel(sc, { title: title.toUpperCase(), height: textH + 150 * S, onBackdrop: () => this.close() });
    const { c, px, py, ph, pad } = panel;
    c.add(sc.add.text(px + pad, panel.y, text,
      storyStyle(S, 16, COLORS.text, { wordWrap: { width: pw - pad * 2 }, lineSpacing: 6 * S, fontStyle: 'normal' })));
    c.add(makeButton(sc, px + pw / 2, py + ph - pad - 22 * S, pw - pad * 2, 44 * S, TEXT.storyClose, () => this.close()));
    c.setAlpha(0);
    sc.tweens.add({ targets: c, alpha: 1, duration: 400 });
    this.after = after;
    this.container = c;
  }

  close(silent = false) {
    if (!this.container) return;
    const c = this.container;
    this.container = null;
    this.scene.time.delayedCall(0, () => c.destroy());
    if (!silent && this.after === 'prestige') bus.emit('open-prestige');
  }
}
