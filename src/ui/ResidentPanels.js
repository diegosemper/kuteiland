// Panelen voor bewoners (wie, welke baan, hoe goed) en het leegtebeest (voeren, groeien).
import { CONFIG } from '../config.js';
import { TEXT, pick } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, storyStyle, makeButton } from './style.js';
import { createPanel } from './Panel.js';
import { petLevel } from '../world/Pet.js';

class BasePanel {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.container = null;
  }

  get isOpen() {
    return !!this.container;
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

export class CastawayPanel extends BasePanel {
  open() {
    const r = this.resident;
    if (this.isOpen || !r) return;
    const sc = this.scene;
    const S = sc.S;
    const C = CONFIG.castaways;
    const panel = createPanel(sc, { title: `${TEXT.castawayTitle}: ${r.name.toUpperCase()}`, height: 460 * S, onBackdrop: () => this.close(), anchor: 'bottom' });
    const { c, px, py, pw, ph, pad } = panel;
    let y = panel.y;
    const d = r.def;
    c.add(sc.add.image(px + pad + 22 * S, y + 30 * S, 'player_idle').setTint(r.tint).setDisplaySize(32 * S, 58 * S));
    c.add(sc.add.text(px + pad + 52 * S, y + 4 * S, d.name, textStyle(S, 18, COLORS.text, { fontStyle: '800' })));
    c.add(sc.add.text(px + pad + 52 * S, y + 30 * S, `${TEXT.castawayLevel} ${r.level}`, textStyle(S, 13, '#d9c2ff', { fontStyle: '700' })));
    const left = C.roundsPerLevel - (r.rounds % C.roundsPerLevel);
    c.add(sc.add.text(px + pad + 52 * S, y + 50 * S, r.level >= C.maxLevel ? TEXT.castawayMax : TEXT.castawayRounds.replace('{n}', left), textStyle(S, 11, COLORS.dim)));
    y += 84 * S;
    // wat doet hij
    let what;
    if (d.item) {
      const per = d.per * (1 + (r.level - 1) * C.perLevel);
      what = `${TEXT.castawayMakes}: ${per < 1 ? '±' + per.toFixed(1) : Math.round(per * 10) / 10} ${CONFIG.items[d.item].name.toLowerCase()}`;
      c.add(sc.add.image(px + pad + 10 * S, y + 9 * S, `icon_${d.item}`).setDisplaySize(20 * S, 20 * S));
    } else what = d.fight ? TEXT.castawayFights : TEXT.castawayRepairs;
    c.add(sc.add.text(px + pad + (d.item ? 28 * S : 0), y, what, textStyle(S, 13, '#b8e0a0', { wordWrap: { width: pw - pad * 2 - 30 * S } })));
    y += 40 * S;
    // iets wat hij zegt
    const lines = [...TEXT.castawayQuirks.any, ...(TEXT.castawayQuirks[r.job] || []), ...(TEXT.castawayQuirks[r.job] || [])];
    c.add(sc.add.text(px + pad, y, `"${pick(lines)}"`, storyStyle(S, 14, COLORS.text, { wordWrap: { width: pw - pad * 2 } })));

    const bw = (pw - pad * 3) / 2;
    const by = py + ph - pad - 22 * S;
    c.add(makeButton(sc, px + pad + bw / 2, by, bw, 44 * S, TEXT.castawayJob, () => {
      bus.emit('castaway-job', r);
      this.rebuild();
    }, 12));
    c.add(makeButton(sc, px + pad * 2 + bw * 1.5, by, bw, 44 * S, TEXT.close, () => this.close()));
    this.container = c;
  }
}

export class PetPanel extends BasePanel {
  open() {
    const g = this.game;
    const data = g.flags.pet;
    if (this.isOpen || !data) return;
    const sc = this.scene;
    const S = sc.S;
    const P = CONFIG.pet;
    const level = petLevel(data.xp || 0);
    const panel = createPanel(sc, { title: `${TEXT.petTitle}: ${data.name.toUpperCase()}`, height: 640 * S, onBackdrop: () => this.close(), anchor: 'bottom' });
    const { c, px, py, pw, ph, pad } = panel;
    const list = panel.list;
    let y = panel.y;
    const key = level >= 8 ? 'pet_l' : level >= 4 ? 'pet_m' : 'pet_s';
    list.add(sc.add.image(px + pad + 30 * S, y + 28 * S, key).setScale(S * 0.9));
    list.add(sc.add.text(px + pad + 74 * S, y + 4 * S, `${TEXT.petLevel} ${level}`, textStyle(S, 18, COLORS.text, { fontStyle: '800' })));
    // xp-balk
    const cur = P.xpFor[level] || 0, next = P.xpFor[level + 1];
    const bw = pw - pad * 2 - 74 * S;
    list.add(sc.add.rectangle(px + pad + 74 * S, y + 34 * S, bw, 8 * S, 0xffffff, 0.08).setOrigin(0));
    const frac = next ? (data.xp - cur) / (next - cur) : 1;
    list.add(sc.add.rectangle(px + pad + 74 * S, y + 34 * S, Math.max(2 * S, bw * frac), 8 * S, 0xc9a6ff, 0.9).setOrigin(0));
    if (next) list.add(sc.add.text(px + pw - pad, y + 46 * S, `${Math.floor(data.xp)}/${next} xp`, textStyle(S, 11, COLORS.dim)).setOrigin(1, 0));
    y += 70 * S;
    // wat het nu doet en wat het hierna leert
    const now = Object.entries(P.perks).filter(([l]) => Number(l) <= level).map(([, p]) => p.short);
    list.add(sc.add.text(px + pad, y, `${TEXT.petNow}: ${now.length ? now.join(', ') : '—'}`, textStyle(S, 12, '#b8e0a0', { wordWrap: { width: pw - pad * 2 } })));
    y += Math.max(22, Math.ceil(now.join(', ').length / 40) * 16) * S + 6 * S;
    const nxt = P.perks[level + 1];
    list.add(sc.add.text(px + pad, y, nxt ? `${TEXT.petNext} (${level + 1}): ${nxt.short}` : TEXT.petMax, textStyle(S, 12, '#d9c2ff', { wordWrap: { width: pw - pad * 2 } })));
    y += 34 * S;
    // voeren
    for (const [item, xp] of Object.entries(P.foodXp)) {
      const have = g.inventory.get(item);
      if (!have && item !== data.fav) continue;
      const fav = item === data.fav;
      list.add(sc.add.image(px + pad + 14 * S, y + 18 * S, `icon_${item}`).setDisplaySize(28 * S, 28 * S));
      list.add(sc.add.text(px + pad + 38 * S, y + 4 * S, CONFIG.items[item].name, textStyle(S, 14, COLORS.text)));
      list.add(sc.add.text(px + pad + 38 * S, y + 22 * S, `${have} · +${xp * P.feedAmount * (fav ? P.favMult : 1)} xp${fav ? ` · ${TEXT.petFav}!` : ''}`,
        textStyle(S, 11, fav ? '#ffd98a' : COLORS.dim)));
      const b = makeButton(sc, px + pw - pad - 46 * S, y + 18 * S, 92 * S, 34 * S, `${TEXT.petFeed} ${P.feedAmount}`, (lbl, p) => {
        if (!panel.inView(p.y)) return;
        bus.emit('pet-feed', item);
        this.rebuild();
      }, 12);
      b.setAlpha(have >= P.feedAmount ? 1 : 0.35);
      list.add(b);
      y += 48 * S;
    }
    panel.setContentEnd(y);
    c.add(makeButton(sc, px + pw / 2, py + ph - pad - 22 * S, pw - pad * 2, 44 * S, TEXT.close, () => this.close()));
    this.container = c;
  }
}
