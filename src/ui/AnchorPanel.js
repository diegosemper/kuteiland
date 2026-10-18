// Anker: bereik zien en versterken.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, makeButton } from './style.js';
import { createPanel } from './Panel.js';

export class AnchorPanel {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.container = null;
    this.anchor = null;
  }

  get isOpen() {
    return !!this.container;
  }

  open(anchor) {
    if (anchor) this.anchor = anchor;
    if (this.isOpen || !this.anchor) return;
    const sc = this.scene;
    const S = sc.S;
    const a = this.anchor;
    const game = this.game;
    const covered = [...game.island.tiles.values()].filter((t) => a.covers(game, t.gx, t.gy)).length;
    const nextCost = CONFIG.anchor.upgradeCost[a.tier + 1];

    const panel = createPanel(sc, {
      title: TEXT.anchorTitle,
      subtitle: TEXT.anchorSubtitle,
      height: 300 * S,
      onBackdrop: () => this.close(),
      anchor: 'bottom',
    });
    const { c, px, py, pw, ph, pad } = panel;
    let y = panel.y;

    const line = (label, value) => {
      c.add(sc.add.text(px + pad, y, label, textStyle(S, 14, COLORS.dim)));
      c.add(sc.add.text(px + pw - pad, y, value, textStyle(S, 14, COLORS.text, { fontStyle: '700' })).setOrigin(1, 0));
      y += 26 * S;
    };
    line(TEXT.anchorLevel, `${a.tier} / 3`);
    line(TEXT.anchorRange, `${a.range(game).toFixed(1)} ${TEXT.anchorTiles}`);
    line(TEXT.anchorCovers, `${covered} / ${game.island.size}`);
    y += 6 * S;

    if (nextCost) {
      // kosten voor versterken
      let x = px + pad;
      c.add(sc.add.text(x, y, TEXT.anchorNext + ':', textStyle(S, 12, COLORS.dim)));
      y += 22 * S;
      let affordable = true;
      for (const [k, n] of Object.entries(nextCost)) {
        const enough = game.inventory.has(k, n);
        affordable = affordable && enough;
        c.add(sc.add.image(x + 9 * S, y + 8 * S, `icon_${k}`).setDisplaySize(18 * S, 18 * S));
        const t = sc.add.text(x + 21 * S, y + 8 * S, `${game.inventory.get(k)}/${n}`,
          textStyle(S, 13, enough ? COLORS.text : COLORS.warn)).setOrigin(0, 0.5);
        c.add(t);
        x += 21 * S + t.width + 16 * S;
      }
      const bw = (pw - pad * 3) / 2;
      const b = makeButton(sc, px + pad + bw / 2, py + ph - pad - 22 * S, bw, 44 * S, TEXT.anchorUpgrade, () => {
        if (!affordable) return;
        bus.emit('anchor-upgrade', a);
        this.rebuild();
      }, 12);
      b.setAlpha(affordable ? 1 : 0.4);
      c.add(b);
      c.add(makeButton(sc, px + pad * 2 + bw * 1.5, py + ph - pad - 22 * S, bw, 44 * S, TEXT.close, () => this.close()));
    } else {
      c.add(sc.add.text(px + pad, y, TEXT.anchorMax, textStyle(S, 13, COLORS.dim, { wordWrap: { width: pw - pad * 2 } })));
      c.add(makeButton(sc, px + pw / 2, py + ph - pad - 22 * S, pw - pad * 2, 44 * S, TEXT.close, () => this.close()));
    }
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
    bus.emit('anchor-closed');
  }
}
