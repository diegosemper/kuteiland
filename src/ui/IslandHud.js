// Eilandniveau in beeld: een balkje rechtsboven (tik = overzicht), een feestje bij elk nieuw niveau,
// en een paneel met wat elk mijlpaal-niveau oplevert.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { COLORS, textStyle, makeButton, roundedBox, shade } from './style.js';
import { createPanel } from './Panel.js';
import { levelFromXp } from '../systems/IslandLevel.js';

export class IslandHud {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    const S = scene.S;
    this.w = 104 * S;
    this.label = shade(scene.add.text(0, 0, '', textStyle(S, 11, '#ffd98a', { fontStyle: '800', letterSpacing: 1 * S })).setOrigin(0.5, 0), S);
    this.track = scene.add.rectangle(0, 17 * S, this.w, 6 * S, 0xffffff, 0.12).setOrigin(0.5, 0);
    this.fill = scene.add.rectangle(-this.w / 2, 17 * S, 1, 6 * S, 0xffd98a, 0.95).setOrigin(0, 0);
    this.zone = scene.add.zone(0, 12 * S, this.w + 10 * S, 40 * S).setInteractive();
    this.zone.on('pointerup', () => scene.openPanel(scene.islandPanel));
    this.c = scene.add.container(0, 0, [this.label, this.track, this.fill, this.zone]).setDepth(10);
    this.refresh();
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.c.setPosition(w - safe.right - 16 * S - 52 * S, safe.top + 176 * S);
  }

  refresh() {
    const S = this.scene.S;
    const i = levelFromXp(this.game.stats.islandXp || 0);
    this.label.setText(`${TEXT.islandLabel} ${i.level}`);
    this.fill.width = Math.max(2 * S, this.w * (i.max ? 1 : i.cur / i.need));
  }

  // kleine '+12' bij het balkje
  gained(e) {
    const sc = this.scene;
    const S = sc.S;
    this.refresh();
    const t = shade(sc.add.text(this.c.x + this.w / 2 + 2 * S, this.c.y + 12 * S, `+${e.amount}`, textStyle(S, 11, '#ffd98a', { fontStyle: '800' })).setOrigin(1, 0), S).setDepth(11);
    sc.tweens.add({ targets: t, y: t.y + 16 * S, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
    sc.tweens.add({ targets: this.fill, alpha: { from: 0.4, to: 0.95 }, duration: 300 });
  }

  // feestje
  levelUp({ level, pack, milestone }) {
    const sc = this.scene;
    const S = sc.S;
    const { width: w, height: h } = sc.scale;
    this.refresh();
    const c = sc.add.container(0, 0).setDepth(250).setAlpha(0);
    c.add(sc.add.rectangle(0, 0, w, h, 0x07040c, 0.78).setOrigin(0).setInteractive());
    const confetti = sc.add.particles(w / 2, h * 0.32, 'mote', {
      speed: { min: 150 * S, max: 420 * S }, angle: { min: 200, max: 340 }, gravityY: 500 * S, lifespan: 1800,
      scale: { start: 2.6 * S, end: 0.6 * S }, tint: [0xffd98a, 0xff9ad0, 0x9b6bff, 0xa8f09a, 0x80d8ff], quantity: 6, frequency: 40,
    });
    sc.time.delayedCall(900, () => confetti.stop());
    c.add(confetti);
    const pw = Math.min(w - 40 * S, 360 * S);
    const lines = Object.entries(pack).map(([k, n]) => `+${n} ${CONFIG.items[k].name.toLowerCase()}`).join('   ');
    const ph = milestone ? 330 * S : 270 * S;
    c.add(roundedBox(sc, pw, ph, { fill: COLORS.panel, alpha: 0.97, edge: 0xffd98a, edgeAlpha: 0.7, radius: 18 }).setPosition(w / 2, h / 2));
    let y = h / 2 - ph / 2 + 24 * S;
    c.add(sc.add.text(w / 2, y, TEXT.islandLevelUp, textStyle(S, 13, COLORS.dim, { fontStyle: '800', letterSpacing: 2 * S })).setOrigin(0.5, 0));
    y += 20 * S;
    const big = shade(sc.add.text(w / 2, y, String(level), textStyle(S, 64, '#ffd98a', { fontStyle: '900' })).setOrigin(0.5, 0), S);
    c.add(big);
    big.setScale(0.2);
    sc.tweens.add({ targets: big, scale: 1, duration: 500, ease: 'Back.easeOut', delay: 150 });
    y += 84 * S;
    c.add(sc.add.text(w / 2, y, `${TEXT.islandPack}:`, textStyle(S, 12, COLORS.dim)).setOrigin(0.5, 0));
    y += 18 * S;
    c.add(sc.add.text(w / 2, y, lines, textStyle(S, 13, COLORS.text, { align: 'center', wordWrap: { width: pw - 30 * S } })).setOrigin(0.5, 0));
    y += 44 * S;
    if (milestone) {
      c.add(sc.add.text(w / 2, y, `${TEXT.islandUnlock}: ${milestone.text}`, textStyle(S, 14, '#a8f09a', { fontStyle: '700', align: 'center', wordWrap: { width: pw - 30 * S } })).setOrigin(0.5, 0));
    }
    const b = makeButton(sc, w / 2, h / 2 + ph / 2 - 36 * S, 160 * S, 44 * S, TEXT.islandOk, () => {
      sc.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() });
    }, 14);
    c.add(b);
    sc.tweens.add({ targets: c, alpha: 1, duration: 300 });
  }
}

export class IslandPanel {
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
    const i = levelFromXp(this.game.stats.islandXp || 0);
    const panel = createPanel(sc, { title: `${TEXT.islandTitle} ${i.level}`, subtitle: TEXT.islandSubtitle, height: 820 * S, onBackdrop: () => this.close() });
    const { c, px, py, pw, ph, pad } = panel;
    const list = panel.list;
    let y = panel.y;
    // voortgang
    const bw = pw - pad * 2;
    list.add(sc.add.rectangle(px + pad, y, bw, 10 * S, 0xffffff, 0.1).setOrigin(0));
    list.add(sc.add.rectangle(px + pad, y, Math.max(3 * S, bw * (i.max ? 1 : i.cur / i.need)), 10 * S, 0xffd98a, 0.95).setOrigin(0));
    list.add(sc.add.text(px + pw - pad, y + 14 * S, `${i.cur}/${i.need} xp`, textStyle(S, 11, COLORS.dim)).setOrigin(1, 0));
    y += 36 * S;
    list.add(sc.add.text(px + pad, y, TEXT.islandEvery, textStyle(S, 12, COLORS.text, { wordWrap: { width: bw } })));
    y += 40 * S;
    // mijlpalen
    for (const [lvl, m] of Object.entries(CONFIG.islandLevel.milestones)) {
      const done = i.level >= Number(lvl);
      const isNext = !done && Object.keys(CONFIG.islandLevel.milestones).find((l) => Number(l) > i.level) === lvl;
      list.add(sc.add.text(px + pad, y, `${lvl}`, textStyle(S, 18, done ? '#a8f09a' : isNext ? '#ffd98a' : COLORS.dim, { fontStyle: '900' })));
      list.add(sc.add.text(px + pad + 40 * S, y + 2 * S, m.text, textStyle(S, 13, done ? COLORS.text : isNext ? '#ffd98a' : COLORS.dim, { wordWrap: { width: bw - 44 * S - (done ? 74 * S : 0) } })));
      if (done) list.add(sc.add.text(px + pw - pad, y + 2 * S, `✓ ${TEXT.islandReached}`, textStyle(S, 11, '#a8f09a')).setOrigin(1, 0));
      y += 46 * S;
    }
    panel.setContentEnd(y);
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
