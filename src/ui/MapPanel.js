// Kaart van alle eilanden, bruggen en waar jij staat.
import { TEXT } from '../texts.js';
import { COLORS, textStyle, makeButton } from './style.js';
import { createPanel } from './Panel.js';

const KIND_COLORS = {
  dirt: 0x55603a, plank: 0x7a5a3c, stone: 0x7e766e, ash: 0x4a4542, crystal: 0x4a3a66,
  ruin: 0x8a8c98, bridge: 0x8a7a52, starbridge: 0xd8d0f0,
};

export class MapPanel {
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
    const { height: h } = sc.scale;
    const mapH = Math.min(h * 0.5, 420 * S);

    const panel = createPanel(sc, {
      title: TEXT.mapTitle, subtitle: TEXT.mapSubtitle,
      height: mapH + 200 * S, onBackdrop: () => this.close(),
    });
    const { c, px, py, pw, ph, pad } = panel;
    const top = panel.y;

    // grenzen van de wereld in schermrichting (isometrisch, zoals in het spel)
    const tiles = [...game.island.tiles.values()];
    const sx = (t) => t.gx - t.gy, sy = (t) => (t.gx + t.gy) / 2;
    const minX = Math.min(...tiles.map(sx)) - 1, maxX = Math.max(...tiles.map(sx)) + 1;
    const minY = Math.min(...tiles.map(sy)) - 1, maxY = Math.max(...tiles.map(sy)) + 1;
    const scale = Math.min((pw - pad * 2) / (maxX - minX), mapH / (maxY - minY));
    const ox = px + pw / 2 - ((minX + maxX) / 2) * scale;
    const oy = top + mapH / 2 - ((minY + maxY) / 2) * scale;
    const toMap = (gx, gy) => ({ x: ox + (gx - gy) * scale, y: oy + (gx + gy) / 2 * scale });

    const g = sc.add.graphics();
    c.add(g);
    for (const t of tiles) {
      const p = toMap(t.gx, t.gy);
      const hw = scale, hh = scale / 2;
      g.fillStyle(KIND_COLORS[t.kind] || 0x666666, 1);
      g.fillPoints([{ x: p.x, y: p.y - hh }, { x: p.x + hw, y: p.y }, { x: p.x, y: p.y + hh }, { x: p.x - hw, y: p.y }], true);
    }
    // bijzondere plekken
    for (const o of game.objects) {
      const p = toMap(o.gx, o.gy);
      const col = { kern: 0xd9c2ff, note: 0xf0e6c0, node: 0xb48cff, chest: 0xc08a50, anchor: 0x9b6bff }[o.type];
      if (!col) continue;
      g.fillStyle(col, 1);
      g.fillCircle(p.x, p.y, Math.max(2 * S, scale * (o.type === 'kern' ? 0.6 : 0.3)));
    }
    // jij
    const me = toMap(game.player.gx, game.player.gy);
    const dot = sc.add.circle(me.x, me.y, 5 * S, 0xffffff, 1).setStrokeStyle(2 * S, 0x000000, 0.8);
    c.add(dot);
    sc.tweens.add({ targets: dot, scale: 1.5, duration: 600, yoyo: true, repeat: -1 });
    c.add(sc.add.text(me.x + 8 * S, me.y - 8 * S, TEXT.mapYou, textStyle(S, 11, COLORS.text, { fontStyle: '700' })));

    // namen van de eilanden
    for (const isl of game.island.islands) {
      if (!isl.size) continue;
      const known = isl.id === 'home' || game.flags.discovered?.[isl.id];
      const xs = [...isl.tiles.values()];
      const cx = xs.reduce((a, t) => a + t.gx, 0) / xs.length, cy = xs.reduce((a, t) => a + t.gy, 0) / xs.length;
      const p = toMap(cx, cy);
      c.add(sc.add.text(p.x, p.y + scale * 3.2, known ? isl.name : TEXT.mapUnknown,
        textStyle(S, 11, known ? COLORS.text : COLORS.dim, { fontStyle: '700' })).setOrigin(0.5, 0));
    }

    c.add(sc.add.text(px + pad, top + mapH + 14 * S, TEXT.mapHint,
      textStyle(S, 12, COLORS.dim, { wordWrap: { width: pw - pad * 2 } })));
    c.add(makeButton(sc, px + pw / 2, py + ph - pad - 22 * S, pw - pad * 2, 44 * S, TEXT.close, () => this.close()));
    this.container = c;
  }

  close() {
    if (!this.container) return;
    const c = this.container;
    this.container = null;
    this.scene.time.delayedCall(0, () => c.destroy());
  }
}
