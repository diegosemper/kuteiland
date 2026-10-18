// Aambeeld: bijl, houweel, wapen en harnas versterken van +1 tot +10.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, makeButton } from './style.js';
import { createPanel } from './Panel.js';
import { GEAR_SLOTS, gearUpgradeCost, gearEffectText, canPay } from '../systems/Upgrades.js';

export class AnvilPanel {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.container = null;
  }

  get isOpen() {
    return !!this.container;
  }

  open() {
    if (this.isOpen) return;
    const sc = this.scene;
    const S = sc.S;
    const game = this.game;
    const inv = game.inventory;

    const panel = createPanel(sc, {
      title: TEXT.anvilTitle,
      subtitle: TEXT.anvilSubtitle,
      height: 820 * S,
      onBackdrop: () => this.close(),
    });
    const { c, px, py, pw, ph, pad } = panel;
    const list = panel.list;
    let y = panel.y;

    for (const slot of GEAR_SLOTS) {
      const tier = game.tools[slot] || 0;
      const lvl = game.upgrades[slot] || 0;
      const name = CONFIG.tools[slot][tier];
      const icon = tier ? `icon_${slot}${tier}` : null;
      if (icon) list.add(sc.add.image(px + pad + 14 * S, y + 12 * S, icon).setDisplaySize(30 * S, 30 * S));
      list.add(sc.add.text(px + pad + 38 * S, y, `${name}${lvl ? ` +${lvl}` : ''}`, textStyle(S, 15, tier ? COLORS.text : COLORS.dim, { fontStyle: '700' })));
      list.add(sc.add.text(px + pad + 38 * S, y + 20 * S, lvl ? gearEffectText(slot, lvl) : '—', textStyle(S, 12, COLORS.dim)));
      y += 44 * S;

      if (!tier) {
        list.add(sc.add.text(px + pad, y, TEXT.anvilNoGear, textStyle(S, 12, COLORS.dim)));
        y += 36 * S;
        continue;
      }
      if (lvl >= CONFIG.upgrades.max) {
        list.add(sc.add.text(px + pad, y, TEXT.anvilMax, textStyle(S, 12, '#d9c2ff')));
        y += 36 * S;
        continue;
      }
      // kosten voor de volgende +1
      const cost = gearUpgradeCost(lvl + 1);
      let x = px + pad;
      for (const [k, n] of Object.entries(cost)) {
        const enough = inv.has(k, n);
        list.add(sc.add.image(x + 9 * S, y + 8 * S, `icon_${k}`).setDisplaySize(18 * S, 18 * S));
        const t = sc.add.text(x + 21 * S, y + 8 * S, `${inv.get(k)}/${n}`, textStyle(S, 12, enough ? COLORS.text : COLORS.warn)).setOrigin(0, 0.5);
        list.add(t);
        x += 21 * S + t.width + 12 * S;
        if (x > px + pw - 120 * S) { x = px + pad; y += 22 * S; }
      }
      const b = makeButton(sc, px + pw - pad - 46 * S, y - 6 * S, 92 * S, 34 * S, `+${lvl + 1}`, (lbl, p) => {
        if (!panel.inView(p.y)) return;
        bus.emit('gear-upgrade', slot);
        this.rebuild();
      }, 13);
      b.setAlpha(canPay(inv, cost) ? 1 : 0.4);
      list.add(b);
      y += 46 * S;
    }

    panel.setContentEnd(y);
    c.add(makeButton(sc, px + pw / 2, py + ph - pad - 22 * S, pw - pad * 2, 44 * S, TEXT.close, () => this.close()));
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
