// Overzicht van de vier skills: level, voortgang en wat het volgende level oplevert.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { COLORS, textStyle, makeButton } from './style.js';
import { createPanel } from './Panel.js';
import { SKILL_IDS } from '../systems/Skills.js';

export class SkillsPanel {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
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
    const skills = this.game.skills;
    const rowH = 92 * S;

    const panel = createPanel(sc, {
      title: TEXT.skillsTitle,
      subtitle: TEXT.skillsSubtitle,
      height: SKILL_IDS.length * rowH + 170 * S,
      onBackdrop: () => this.close(),
    });
    const { c, px, py, pw, ph, pad } = panel;
    let y = panel.y;

    for (const id of SKILL_IDS) {
      const p = skills.progress(id);
      const name = CONFIG.skills[id].name;
      const fightLater = id === 'vechten' && p.level === 0 && skills.xp[id] === 0;

      c.add(sc.add.text(px + pad, y, name, textStyle(S, 16, COLORS.text, { fontStyle: '700' })));
      c.add(sc.add.text(px + pw - pad, y, p.max ? TEXT.skillMax : `${TEXT.skillLevel} ${p.level}`,
        textStyle(S, 14, COLORS.text, { fontStyle: '700' })).setOrigin(1, 0));

      // voortgangsbalk
      const bw = pw - pad * 2, by = y + 26 * S, bh = 8 * S;
      c.add(sc.add.rectangle(px + pad, by, bw, bh, 0xffffff, 0.08).setOrigin(0));
      const frac = p.max ? 1 : p.cur / p.need;
      if (frac > 0) c.add(sc.add.rectangle(px + pad, by, Math.max(2 * S, bw * frac), bh, 0xc9a6ff, 0.85).setOrigin(0));
      if (!p.max) {
        c.add(sc.add.text(px + pw - pad, by + bh + 4 * S, `${p.cur}/${p.need} xp`, textStyle(S, 11, COLORS.dim)).setOrigin(1, 0));
      }

      const now = p.level > 0 ? skills.bonusText(id, p.level) : '—';
      const next = p.max ? '' : `${TEXT.skillNext}: ${skills.bonusText(id, p.level + 1)}`;
      c.add(sc.add.text(px + pad, by + bh + 4 * S, fightLater ? TEXT.skillFightLater : now,
        textStyle(S, 12, COLORS.text, { wordWrap: { width: bw - 70 * S } })));
      if (next && !fightLater) {
        c.add(sc.add.text(px + pad, by + bh + 22 * S, next, textStyle(S, 11, COLORS.dim, { wordWrap: { width: bw } })));
      }
      y += rowH;
    }

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
