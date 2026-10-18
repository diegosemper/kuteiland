// Voortgang: twee tabbladen. Skills (level, xp, bonus, volgende mijlpaal) en Collecties (niveau, volgende beloning).
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { COLORS, textStyle, makeButton, roundedBox } from './style.js';
import { createPanel } from './Panel.js';
import { SKILL_IDS } from '../systems/Skills.js';
import { COLLECTION_IDS, thresholdsFor } from '../systems/Mods.js';
import { recipeName } from '../systems/Crafting.js';

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export class SkillsPanel {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.container = null;
    this.tab = 'skills';
  }

  get isOpen() {
    return !!this.container;
  }

  toggle() {
    if (this.isOpen) this.close(); else this.open();
  }

  // Beschrijving van een beloning uit de collectie-tabel
  rewardText(reward) {
    if (reward.recipe) {
      const r = CONFIG.recipes.find((x) => x.id === reward.recipe);
      return `${TEXT.collectionRecipe}: ${r ? recipeName(r) : reward.recipe}`;
    }
    return reward.text;
  }

  bar(c, x, y, w, frac) {
    const S = this.scene.S;
    c.add(this.scene.add.rectangle(x, y, w, 7 * S, 0xffffff, 0.08).setOrigin(0));
    if (frac > 0) c.add(this.scene.add.rectangle(x, y, Math.max(2 * S, w * Math.min(1, frac)), 7 * S, 0xc9a6ff, 0.85).setOrigin(0));
  }

  open() {
    if (this.isOpen) return;
    const sc = this.scene;
    const S = sc.S;
    const game = this.game;
    const skills = game.skills;

    const panel = createPanel(sc, {
      title: TEXT.progressTitle,
      height: 900 * S,
      onBackdrop: () => this.close(),
      gap: 46,
    });
    const { c, px, py, pw, ph, pad } = panel;
    const list = panel.list;

    // tabbladen
    const tw = (pw - pad * 3) / 2;
    const tabY = panel.gapTop + 20 * S;
    for (const [i, id, label] of [[0, 'skills', TEXT.tabSkills], [1, 'collecties', TEXT.tabCollections]]) {
      const x = px + pad + tw / 2 + i * (tw + pad);
      const active = this.tab === id;
      const bg = roundedBox(sc, tw, 34 * S, { fill: active ? 0x2a1f3a : 0x1a1323, alpha: 0.95, edgeAlpha: active ? 0.8 : 0.2, radius: 10 });
      bg.setPosition(x, tabY);
      const t = sc.add.text(x, tabY, label, textStyle(S, 12, active ? COLORS.text : COLORS.dim, { fontStyle: '700', letterSpacing: 1 * S })).setOrigin(0.5);
      const z = sc.add.zone(x, tabY, tw, 34 * S).setInteractive();
      z.on('pointerup', () => { if (this.tab !== id) { this.tab = id; this.rebuild(); } });
      c.add([bg, t, z]);
    }

    let y = panel.y;
    const bw = pw - pad * 2;

    if (this.tab === 'skills') {
      for (const id of SKILL_IDS) {
        const p = skills.progress(id);
        list.add(sc.add.text(px + pad, y, CONFIG.skills[id].name, textStyle(S, 16, COLORS.text, { fontStyle: '700' })));
        list.add(sc.add.text(px + pw - pad, y, p.max ? TEXT.skillMax : `${TEXT.skillLevel} ${p.level}`,
          textStyle(S, 14, COLORS.text, { fontStyle: '700' })).setOrigin(1, 0));
        y += 26 * S;
        this.bar(list, px + pad, y, bw, p.max ? 1 : p.cur / p.need);
        if (!p.max) list.add(sc.add.text(px + pw - pad, y + 11 * S, `${p.cur}/${p.need} xp`, textStyle(S, 11, COLORS.dim)).setOrigin(1, 0));
        y += 12 * S;
        const now = p.level > 0 ? skills.bonusText(id, p.level) : '—';
        list.add(sc.add.text(px + pad, y, now, textStyle(S, 12, COLORS.text, { wordWrap: { width: bw - 80 * S } })));
        y += 18 * S;
        const ms = skills.nextMilestone(id);
        if (ms) {
          list.add(sc.add.text(px + pad, y, `${TEXT.milestoneAt} ${ms.level}: ${ms.text}`, textStyle(S, 11, '#d9c2ff', { wordWrap: { width: bw } })));
          y += 18 * S;
        }
        y += 16 * S;
      }
    } else {
      for (const id of COLLECTION_IDS) {
        const count = Math.floor(game.stats.collected[id] || 0);
        const tier = game.collectionTier(id);
        const th = thresholdsFor(id);
        const name = id === 'wezens' ? TEXT.collectionKills : CONFIG.items[id].name;
        list.add(sc.add.image(px + pad + 13 * S, y + 10 * S, `icon_${id}`).setDisplaySize(26 * S, 26 * S));
        list.add(sc.add.text(px + pad + 34 * S, y, name, textStyle(S, 16, COLORS.text, { fontStyle: '700' })));
        list.add(sc.add.text(px + pw - pad, y, tier ? ROMAN[tier] : '—', textStyle(S, 15, COLORS.text, { fontStyle: '700' })).setOrigin(1, 0));
        y += 28 * S;
        const prev = tier ? th[tier - 1] : 0;
        const next = th[tier];
        this.bar(list, px + pad, y, bw, next ? (count - prev) / (next - prev) : 1);
        list.add(sc.add.text(px + pw - pad, y + 11 * S, next ? `${count}/${next}` : `${count}`, textStyle(S, 11, COLORS.dim)).setOrigin(1, 0));
        y += 14 * S;
        const reward = CONFIG.collections.items[id][tier];
        list.add(sc.add.text(px + pad, y, reward ? `${TEXT.collectionNext}: ${this.rewardText(reward)}` : TEXT.collectionDone,
          textStyle(S, 12, reward ? '#d9c2ff' : COLORS.dim, { wordWrap: { width: bw - 70 * S } })));
        y += 34 * S;
      }
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
