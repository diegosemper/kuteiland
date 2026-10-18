// Basis voor elke minigame: eigen scherm, uitleg vooraf, juice-hulpjes en het resultaatscherm.
// Een minigame zelf bouwt zijn spel in build(), start in begin() en roept end(reden) aan als het klaar is.
// reward() rekent de score om naar grondstoffen: { score, items: { id: n }, xp, stats }.
import { CONFIG } from '../../config.js';
import { TEXT } from '../../texts.js';
import { bus } from '../../bus.js';
import { getDpr, getSafeArea } from '../../display.js';
import { COLORS, textStyle, makeButton, roundedBox, shade } from '../../ui/style.js';
import { perkSummary, perkText } from '../../systems/Perks.js';

export class MinigameScene extends Phaser.Scene {
  init(data) {
    this.gs = data.gs;          // de GameScene
    this.spec = data.spec;      // { id, item, rate, skill, tool, art, name }
    this.cfg = CONFIG.minigames[this.mgId] || {};
    this.started = false;
    this.ended = false;
  }

  get mgId() {
    return this.scene.key.replace(/^mg-/, '');
  }

  // waaronder de highscore bewaard wordt
  get scoreKey() {
    return this.mgId;
  }

  create() {
    this.S = getDpr();
    this.safe = getSafeArea();
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0b0612');
    this.cameras.main.fadeIn(250, 11, 6, 18);
    this.drawBackdrop();
    this.build();
    this.showIntro();
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
  }

  onResize() {
    // simpel en betrouwbaar: opnieuw beginnen op de nieuwe maat (alleen vóór de start)
    if (!this.started) this.scene.restart({ gs: this.gs, spec: this.spec });
  }

  // ---------- door de minigame in te vullen ----------

  build() {}
  begin() {}
  reward() { return { score: 0, items: {}, xp: 0 }; }
  get title() { return (this.cfg.name || this.mgId).toUpperCase(); }
  get howTo() { return this.cfg.howTo || ''; }

  // ---------- achtergrond en HUD ----------

  drawBackdrop() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(-100);
    const top = Phaser.Display.Color.ValueToColor(this.cfg.skyTop ?? 0x1a1030);
    const bottom = Phaser.Display.Color.ValueToColor(this.cfg.skyBottom ?? 0x07040c);
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, steps - 1, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (H / steps) * i, W, H / steps + 1);
    }
    // stofjes in de leegte
    this.add.particles(0, 0, 'mote', {
      x: { min: 0, max: W }, y: { min: 0, max: H },
      lifespan: 6000, speedY: { min: -12 * this.S, max: -4 * this.S }, speedX: { min: -4, max: 4 },
      scale: { min: 0.6 * this.S, max: 1.4 * this.S }, alpha: { start: 0.5, end: 0 },
      frequency: 220, tint: 0xb48cff,
    }).setDepth(-90);
  }

  // titel, score en (optioneel) levens bovenin
  makeHud({ lives = 0 } = {}) {
    const { S, W } = this;
    const top = this.safe.top + 14 * S;
    this.hudTitle = shade(this.add.text(16 * S, top, this.title, textStyle(S, 13, COLORS.dim, { fontStyle: '700' })), S).setDepth(50);
    this.scoreText = shade(this.add.text(W / 2, top + 16 * S, '0', textStyle(S, 40, COLORS.text, { fontStyle: '800' })).setOrigin(0.5, 0), S).setDepth(50);
    this.comboText = shade(this.add.text(W / 2, top + 66 * S, '', textStyle(S, 15, '#ffd98a', { fontStyle: '700' })).setOrigin(0.5, 0), S).setDepth(50);
    this.hearts = [];
    for (let i = 0; i < lives; i++) {
      this.hearts.push(this.add.image(W - 22 * S - i * 30 * S, top + 10 * S, 'heart_full').setDisplaySize(26 * S, 26 * S).setDepth(50));
    }
    // tijdbalk
    this.timeBar = this.add.graphics().setDepth(50);
    this.timeBarY = top + 100 * S;
  }

  setScore(n) {
    this.scoreText.setText(String(n));
    this.tweens.killTweensOf(this.scoreText);
    this.scoreText.setScale(1.25);
    this.tweens.add({ targets: this.scoreText, scale: 1, duration: 180, ease: 'Back.easeOut' });
  }

  setLives(n) {
    this.hearts.forEach((h, i) => {
      const full = i < n;
      if (!full && h.texture.key === 'heart_full') {
        h.setTexture('heart_empty');
        h.setScale(h.scaleX * 1.6, h.scaleY * 1.6);
        this.tweens.add({ targets: h, scaleX: h.scaleX / 1.6, scaleY: h.scaleY / 1.6, duration: 300, ease: 'Back.easeOut' });
      }
    });
  }

  drawTime(frac) {
    const { S, W } = this;
    const g = this.timeBar;
    const w = W - 32 * S;
    g.clear();
    g.fillStyle(0x000000, 0.45).fillRoundedRect(16 * S, this.timeBarY, w, 6 * S, 3 * S);
    g.fillStyle(frac < 0.2 ? 0xe07a6a : 0xb8a6d9, 0.9).fillRoundedRect(16 * S, this.timeBarY, Math.max(6 * S, w * frac), 6 * S, 3 * S);
  }

  // ---------- juice ----------

  sfx(name) {
    bus.emit('sfx', name);
  }

  shake(ms = 120, power = 0.006) {
    this.cameras.main.shake(ms, power);
  }

  flash(color = 0xffffff, alpha = 0.35, ms = 140) {
    const r = this.add.rectangle(0, 0, this.W, this.H, color, alpha).setOrigin(0).setDepth(90);
    this.tweens.add({ targets: r, alpha: 0, duration: ms, onComplete: () => r.destroy() });
  }

  floatText(x, y, text, color = COLORS.text, size = 20) {
    const S = this.S;
    const t = shade(this.add.text(x, y, text, textStyle(S, size, color, { fontStyle: '800' })).setOrigin(0.5), S).setDepth(80);
    t.setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, y: y - 60 * S, alpha: 0, delay: 250, duration: 650, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
    return t;
  }

  // grote tekst die even in het midden knalt (COMBO, PERFECT, ...)
  shout(text, color = '#ffd98a', y = this.H * 0.4) {
    const S = this.S;
    const t = shade(this.add.text(this.W / 2, y, text, textStyle(S, 30, color, { fontStyle: '900' })).setOrigin(0.5), S).setDepth(85);
    t.setScale(0.3).setAngle(Phaser.Math.Between(-6, 6));
    this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, scale: 1.3, delay: 500, duration: 300, onComplete: () => t.destroy() });
  }

  // ---------- uitleg vooraf ----------

  showIntro() {
    const { S, W, H } = this;
    const best = this.gs.stats.highscores?.[this.scoreKey] || 0;
    const c = this.add.container(0, 0).setDepth(200);
    c.add(this.add.rectangle(0, 0, W, H, 0x07040c, 0.72).setOrigin(0));
    const pw = Math.min(W - 40 * S, 360 * S);
    // eerst alle onderdelen maken, dan pas de doos eromheen (hoogte hangt af van de uitleg)
    const parts = [];
    parts.push([shade(this.add.text(W / 2, 0, this.title, textStyle(S, 26, COLORS.text, { fontStyle: '800' })).setOrigin(0.5, 0), S), 6]);
    if (this.spec.name) parts.push([this.add.text(W / 2, 0, this.spec.name, textStyle(S, 13, COLORS.dim)).setOrigin(0.5, 0), 18]);
    else parts[0][1] = 18;
    parts.push([this.add.text(W / 2, 0, this.howTo, textStyle(S, 15, COLORS.text, {
      align: 'center', wordWrap: { width: pw - 40 * S }, lineSpacing: 4 * S,
    })).setOrigin(0.5, 0), 18]);
    // wat je gereedschap hier doet, en wat het volgende niveau brengt
    const { tool, tier } = this.spec;
    if (tool && this.mgId !== 'proef' && CONFIG.minigames.perks[tool]?.length > 1) {
      const toolName = CONFIG.tools[tool]?.[tier] || '';
      parts.push([this.add.text(W / 2, 0, `${toolName}: ${perkSummary(tool, tier)}`, textStyle(S, 12, '#b8e0a0', {
        align: 'center', wordWrap: { width: pw - 40 * S }, fontStyle: '700',
      })).setOrigin(0.5, 0), 6]);
      const next = perkText(tool, tier + 1);
      if (next) {
        parts.push([this.add.text(W / 2, 0, `${TEXT.mgNextTool} ${CONFIG.tools[tool][tier + 1]}: ${next}`, textStyle(S, 11, COLORS.dim, {
          align: 'center', wordWrap: { width: pw - 40 * S },
        })).setOrigin(0.5, 0), 18]);
      } else parts[parts.length - 1][1] = 18;
    }
    for (const d of this.spec.discoveries || []) {
      const fresh = (this.spec.fresh || []).includes(d);
      parts.push([this.add.text(W / 2, 0, `${fresh ? TEXT.discoveryNew : '◆'} ${d.name}: ${d.text}`, textStyle(S, 12, fresh ? '#ffd98a' : '#d9c2ff', {
        align: 'center', wordWrap: { width: pw - 40 * S }, fontStyle: '700',
      })).setOrigin(0.5, 0), 6]);
    }
    if (this.spec.discoveries?.length) parts[parts.length - 1][1] = 18;
    const bestRow = this.add.text(W / 2 + 16 * S, 0, `${TEXT.mgBest} ${best}`, textStyle(S, 14, COLORS.dim)).setOrigin(0.5, 0);
    parts.push([bestRow, 24]);
    const go = shade(this.add.text(W / 2, 0, TEXT.mgTapToStart, textStyle(S, 16, '#ffd98a', { fontStyle: '800' })).setOrigin(0.5, 0), S);
    parts.push([go, 0]);
    const pad = 26 * S;
    const total = parts.reduce((h, [o, gap]) => h + o.height + gap * S, 0) + pad * 2;
    let y = H / 2 - total / 2 + pad;
    for (const [o, gap] of parts) {
      o.setY(y);
      c.add(o);
      y += o.height + gap * S;
    }
    c.add(this.add.image(bestRow.x - bestRow.width / 2 - 18 * S, bestRow.y + bestRow.height / 2, `icon_${this.spec.item}`).setDisplaySize(24 * S, 24 * S));
    c.addAt(roundedBox(this, pw, total, { fill: COLORS.panel, alpha: 0.96, edgeAlpha: 0.45, radius: 16 }).setPosition(W / 2, H / 2), 1);
    this.tweens.add({ targets: go, alpha: 0.35, duration: 600, yoyo: true, repeat: -1 });
    this.intro = c;
    // kleine vertraging, zodat de tik die de minigame opende hem niet meteen start
    this.time.delayedCall(350, () => {
      this.input.once('pointerdown', () => this.startCountdown());
    });
  }

  startCountdown() {
    const c = this.intro;
    this.intro = null;
    this.tweens.add({ targets: c, alpha: 0, duration: 200, onComplete: () => c.destroy() });
    const steps = ['3', '2', '1'];
    steps.forEach((s, i) => this.time.delayedCall(i * 380, () => { this.shout(s, COLORS.text, this.H * 0.45); this.sfx('pickup'); }));
    this.time.delayedCall(steps.length * 380, () => {
      this.started = true;
      this.shout(this.cfg.goText || 'GO!', '#ffd98a', this.H * 0.45);
      this.begin();
    });
  }

  // ---------- einde en resultaat ----------

  end(reason) {
    if (this.ended) return;
    this.ended = true;
    this.sfx('craft');
    const res = this.reward();
    const best = this.gs.stats.highscores?.[this.scoreKey] || 0;
    const record = res.score > best && res.score > 0;
    // meteen bijschrijven: wie de app nu dichtklikt, verliest niks
    this.gs.applyMinigame(this.scoreKey, this.spec, res);
    this.time.delayedCall(600, () => this.showResult(reason, res, record, Math.max(best, res.score)));
  }

  showResult(reason, res, record, best) {
    const { S, W, H } = this;
    const c = this.add.container(0, 0).setDepth(300).setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 250 });
    c.add(this.add.rectangle(0, 0, W, H, 0x07040c, 0.82).setOrigin(0).setInteractive());
    const pw = Math.min(W - 32 * S, 380 * S);
    const ph = 470 * S;
    const py = H / 2 - ph / 2;
    c.add(roundedBox(this, pw, ph, { fill: COLORS.panel, alpha: 0.97, edgeAlpha: 0.5, radius: 16 }).setPosition(W / 2, H / 2));
    let y = py + 26 * S;
    c.add(shade(this.add.text(W / 2, y, TEXT.mgDone, textStyle(S, 24, COLORS.text, { fontStyle: '800' })).setOrigin(0.5, 0), S));
    y += 38 * S;
    c.add(this.add.text(W / 2, y, reason, textStyle(S, 13, COLORS.dim, { align: 'center', wordWrap: { width: pw - 40 * S } })).setOrigin(0.5, 0));
    y += 52 * S;
    c.add(this.add.text(W / 2, y, TEXT.mgScore, textStyle(S, 12, COLORS.dim, { fontStyle: '700' })).setOrigin(0.5, 0));
    y += 16 * S;
    const score = shade(this.add.text(W / 2, y, '0', textStyle(S, 46, COLORS.text, { fontStyle: '900' })).setOrigin(0.5, 0), S);
    c.add(score);
    // score optellen voor het gevoel
    const counter = { v: 0 };
    this.tweens.add({
      targets: counter, v: res.score, duration: Math.min(900, 200 + res.score * 8), ease: 'Cubic.easeOut',
      onUpdate: () => score.setText(String(Math.round(counter.v))),
    });
    y += 58 * S;
    const bestText = this.add.text(W / 2, y, record ? TEXT.mgRecord : `${TEXT.mgBest} ${best}`,
      textStyle(S, 14, record ? '#ffd98a' : COLORS.dim, { fontStyle: '800' })).setOrigin(0.5, 0);
    c.add(bestText);
    if (record) {
      this.tweens.add({ targets: bestText, scale: 1.15, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.time.delayedCall(700, () => { this.sfx('levelUp'); this.flash(0xffd98a, 0.18, 400); });
    }
    y += 34 * S;

    // opbrengst
    const entries = Object.entries(res.items).filter(([, n]) => n > 0);
    if (!entries.length) {
      c.add(this.add.text(W / 2, y + 8 * S, TEXT.mgNothing, textStyle(S, 14, COLORS.warn)).setOrigin(0.5, 0));
    }
    entries.forEach(([k, n], i) => {
      const ry = y + i * 34 * S + 12 * S;
      const icon = this.add.image(W / 2 - 60 * S, ry, `icon_${k}`).setDisplaySize(28 * S, 28 * S);
      const t = this.add.text(W / 2 - 38 * S, ry, `+${n} ${CONFIG.items[k].name.toLowerCase()}`, textStyle(S, 17, COLORS.text, { fontStyle: '700' })).setOrigin(0, 0.5);
      c.add([icon, t]);
      icon.setScale(0);
      this.tweens.add({ targets: icon, scaleX: 28 * S / icon.width, scaleY: 28 * S / icon.height, delay: 300 + i * 150, duration: 250, ease: 'Back.easeOut' });
    });
    y += Math.max(1, entries.length) * 34 * S + 8 * S;
    if (res.xp) {
      c.add(this.add.text(W / 2, y, `+${Math.round(res.xp)} ${CONFIG.skills[this.spec.skill].name}-xp`, textStyle(S, 13, '#b8e0a0')).setOrigin(0.5, 0));
      y += 22 * S;
    }
    if (res.line) c.add(this.add.text(W / 2, y, res.line, textStyle(S, 12, COLORS.dim, { align: 'center' })).setOrigin(0.5, 0));
    if (res.note) {
      const t = this.add.text(W / 2, y + 26 * S, TEXT.noteFound, textStyle(S, 14, '#ffd98a', { fontStyle: '800', align: 'center' })).setOrigin(0.5, 0);
      c.add(t);
      this.tweens.add({ targets: t, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
    }

    // knoppen
    const bw = (pw - 52 * S) / 2;
    const by = py + ph - 40 * S;
    const canAgain = this.gs.canRepeatMinigame();
    const again = makeButton(this, W / 2 - bw / 2 - 8 * S, by, bw, 46 * S, canAgain ? TEXT.mgAgain : TEXT.mgNightFalls, () => {
      if (!canAgain) return;
      this.scene.restart({ gs: this.gs, spec: this.spec });
    }, 13);
    if (!canAgain) again.setAlpha(0.4);
    const back = makeButton(this, W / 2 + bw / 2 + 8 * S, by, bw, 46 * S, TEXT.mgBack, () => this.leave(), 13);
    c.add([again, back]);
  }

  leave() {
    this.cameras.main.fadeOut(200, 11, 6, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.gs.endMinigame(this.spec);
      this.scene.stop();
    });
  }
}
