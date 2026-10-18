// Machine: zien wat hij gemaakt heeft, ophalen, en verbeteren.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, makeButton } from './style.js';
import { createPanel } from './Panel.js';
import { machineUpgradeCost, canPay } from '../systems/Upgrades.js';

export class MachinePanel {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.container = null;
    this.machine = null;
  }

  get isOpen() {
    return !!this.container;
  }

  open(machine) {
    if (machine) this.machine = machine;
    if (this.isOpen || !this.machine) return;
    const sc = this.scene;
    const S = sc.S;
    const m = this.machine;
    const inv = this.game.inventory;
    const item = CONFIG.items[m.def.item];
    const perMin = (60000 / m.intervalMs).toFixed(1);

    const panel = createPanel(sc, {
      title: `${m.def.name.toUpperCase()} · ${TEXT.machineLevel} ${m.tier}`,
      subtitle: TEXT.machineSubtitle,
      height: 330 * S,
      onBackdrop: () => this.close(),
      anchor: 'bottom',
      footer: 120,
    });
    const { c, px, py, pw, ph, pad } = panel;
    let y = panel.y;
    const line = (label, value) => {
      c.add(sc.add.text(px + pad, y, label, textStyle(S, 14, COLORS.dim)));
      c.add(sc.add.text(px + pw - pad, y, value, textStyle(S, 14, COLORS.text, { fontStyle: '700' })).setOrigin(1, 0));
      y += 26 * S;
    };
    c.add(sc.add.image(px + pw - pad - 14 * S, panel.y - 40 * S, `icon_${m.def.item}`).setDisplaySize(28 * S, 28 * S));
    line(TEXT.machineMakes, item.name);
    line(TEXT.machineRate, `${perMin} ${TEXT.perMinute}`);
    line(TEXT.machineStored, `${m.stored} / ${m.capacity}`);

    // kosten voor verbeteren
    const maxed = m.tier >= CONFIG.machines.maxTier;
    if (!maxed) {
      const cost = machineUpgradeCost(m);
      c.add(sc.add.text(px + pad, y + 4 * S, `${TEXT.machineUpgradeCost}:`, textStyle(S, 12, COLORS.dim)));
      y += 24 * S;
      let x = px + pad;
      for (const [k, n] of Object.entries(cost)) {
        const enough = inv.has(k, n);
        c.add(sc.add.image(x + 9 * S, y + 8 * S, `icon_${k}`).setDisplaySize(18 * S, 18 * S));
        const t = sc.add.text(x + 21 * S, y + 8 * S, `${inv.get(k)}/${n}`, textStyle(S, 13, enough ? COLORS.text : COLORS.warn)).setOrigin(0, 0.5);
        c.add(t);
        x += 21 * S + t.width + 14 * S;
        if (x > px + pw - 90 * S) { x = px + pad; y += 24 * S; }
      }
    } else {
      c.add(sc.add.text(px + pad, y + 4 * S, TEXT.machineMax, textStyle(S, 12, COLORS.dim)));
    }

    const bw = (pw - pad * 3) / 2;
    const by = py + ph - pad - 22 * S;
    const take = makeButton(sc, px + pad + bw / 2, by - 54 * S, bw, 44 * S, TEXT.machineCollect, () => {
      bus.emit('machine-collect', m);
      this.rebuild();
    }, 12);
    take.setAlpha(m.stored ? 1 : 0.4);
    c.add(take);
    if (!maxed) {
      const up = makeButton(sc, px + pad * 2 + bw * 1.5, by - 54 * S, bw, 44 * S, TEXT.machineUpgrade, () => {
        bus.emit('machine-upgrade', m);
        this.rebuild();
      }, 12);
      up.setAlpha(canPay(inv, machineUpgradeCost(m)) ? 1 : 0.4);
      c.add(up);
    }
    c.add(makeButton(sc, px + pw / 2, by, pw - pad * 2, 44 * S, TEXT.close, () => this.close()));
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
