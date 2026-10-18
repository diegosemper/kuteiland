// Delven: graaf van boven naar beneden door een raster van blokken. Dieper = harder, maar ook meer en beter.
// Gebarsten stenen storten in als je het blok eronder weghaalt; dat kost een leven (en soms meer, als ze
// op elkaar staan). Skill Delven en een roestig houweel laten de barsten beter zien.
import { CONFIG } from '../../config.js';
import { TEXT, pick } from '../../texts.js';
import { COLORS, textStyle, shade } from '../../ui/style.js';
import { MinigameScene } from './MinigameScene.js';

// welk blok hoort bij welke hoofdgrondstof
const ORE_FACE = {
  puin: 'cobble', zwavel: 'sulfur_ore', sterrenstof: 'ice_ore', roest: 'rust_ore',
  leegtekristal: 'deepslate_amethyst', zielenkristal: 'soul_ore',
};

export class DelvenScene extends MinigameScene {
  constructor() {
    super('mg-delven');
  }

  get howTo() {
    return TEXT.mgDelvenHow;
  }

  build() {
    const { S, W, H, cfg } = this;
    const perks = this.spec.perks;
    this.makeHud({ lives: cfg.lives });
    this.drawTime(1);

    // tellers linksboven: hoofdgrondstof en diepte
    const top = this.safe.top + 40 * S;
    this.add.image(28 * S, top + 10 * S, `icon_${this.spec.item}`).setDisplaySize(26 * S, 26 * S).setDepth(50);
    this.oreText = shade(this.add.text(46 * S, top + 10 * S, '0', textStyle(S, 18, COLORS.text, { fontStyle: '800' })).setOrigin(0, 0.5), S).setDepth(50);
    this.comboText.setColor('#b8a6d9');

    // raster
    this.cols = cfg.cols;
    this.cell = Math.floor(Math.min((W - 24 * S) / this.cols, 62 * S));
    this.gridX = Math.round((W - this.cols * this.cell) / 2);
    this.gridTop = this.timeBarY + 22 * S;
    this.gridH = H - this.safe.bottom - 24 * S - this.gridTop;
    this.visibleRows = Math.floor(this.gridH / this.cell);
    this.grid = this.add.container(this.gridX, this.gridTop).setDepth(5);
    const maskG = this.make.graphics({ add: false });
    maskG.fillStyle(0xffffff).fillRect(this.gridX, this.gridTop, this.cols * this.cell, this.gridH);
    this.grid.setMask(maskG.createGeometryMask());
    // kader
    const frame = this.add.graphics().setDepth(6);
    frame.lineStyle(2 * S, 0xb8a6d9, 0.35).strokeRect(this.gridX - 2 * S, this.gridTop - 2 * S, this.cols * this.cell + 4 * S, this.gridH + 4 * S);

    this.rows = [];
    this.viewRow = 0;
    this.lives = cfg.lives;
    this.shield = perks.shield || 0;
    this.ores = 0;
    this.found = {};          // zeldzame vondsten
    this.rareCount = 0;
    this.blocks = 0;
    this.maxRow = 0;
    this.nextTapAt = 0;
    this.timeLeft = cfg.timeMs;
    this.crackAlpha = perks.seeCracks ? 0.95
      : Math.min(0.95, cfg.crackAlpha + this.gs.skills.level('delven') * cfg.crackPerLevel);
    this.ensureRows(this.visibleRows + 4);
    this.setDepthLabel();

    this.chips = this.add.particles(0, 0, 'stonechip', {
      emitting: false, speed: { min: 90 * S, max: 240 * S }, angle: { min: 200, max: 340 }, gravityY: 800 * S,
      rotate: { min: 0, max: 360 }, lifespan: 650, scale: { min: 1.2 * S, max: 2.2 * S }, alpha: { start: 1, end: 0 },
    }).setDepth(20);
    this.sparkle = this.add.particles(0, 0, 'mote', {
      emitting: false, speed: { min: 60 * S, max: 200 * S }, lifespan: 700,
      scale: { start: 2 * S, end: 0 }, alpha: { start: 1, end: 0 }, tint: 0xffe6a0,
    }).setDepth(21);

    this.input.on('pointerdown', (p) => this.onTap(p));
  }

  begin() {}

  // ---------- het raster ----------

  ensureRows(n) {
    while (this.rows.length < n) this.rows.push(this.makeRow(this.rows.length));
  }

  makeRow(r) {
    const cfg = this.cfg;
    const row = [];
    for (let c = 0; c < this.cols; c++) {
      let kind = 'stone';
      let faceName = 'stone';
      let hp = cfg.hpStone;
      if (r < 2 || (r < 5 && Math.random() < 0.4 - r * 0.08)) { kind = 'dirt'; faceName = r === 0 ? 'grass_top' : 'dirt'; hp = cfg.hpDirt; }
      else if (r >= cfg.deepFrom) { faceName = 'deepslate'; hp = cfg.hpDeep; }
      hp += Math.floor(r / cfg.hpPerRows);
      const cell = { r, c, kind, face: faceName, hp, maxHp: hp, unstable: false, dug: false };

      if (kind !== 'dirt') {
        const rare = cfg.rare.find(([, from, chance]) => r >= from && Math.random() < chance);
        if (rare) {
          Object.assign(cell, { kind: 'rare', item: rare[0], face: rare[3] });
          cell.hp = cell.maxHp = hp + 1;
        } else if (Math.random() < cfg.ore + r * cfg.orePerRow) {
          Object.assign(cell, { kind: 'ore', item: this.spec.item, face: ORE_FACE[this.spec.item] || 'cobble' });
          cell.hp = cell.maxHp = hp + 1;
        } else if (r >= 2 && Math.random() < Math.min(cfg.unstableMax, cfg.unstable + r * cfg.unstablePerRow)) {
          cell.unstable = true;
        }
      }
      this.drawCell(cell);
      row.push(cell);
    }
    return row;
  }

  drawCell(cell) {
    const { cell: size } = this;
    const x = cell.c * size + size / 2;
    const y = cell.r * size + size / 2;
    cell.img = this.add.image(x, y, `flat_${cell.face}`).setDisplaySize(size, size);
    this.grid.add(cell.img);
    if (cell.unstable) {
      cell.crack = this.add.image(x, y, 'mg_crack').setDisplaySize(size, size).setAlpha(this.crackAlpha);
      this.grid.add(cell.crack);
    }
    if (cell.kind === 'rare') {
      // zeldzaam glinstert een beetje
      this.tweens.add({ targets: cell.img, alpha: 0.75, duration: 500 + Math.random() * 300, yoyo: true, repeat: -1 });
    }
  }

  get(r, c) {
    return this.rows[r]?.[c] || null;
  }

  diggable(cell) {
    if (cell.dug || cell.falling) return false;
    if (cell.r === 0) return true;
    return [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => this.get(cell.r + dr, cell.c + dc)?.dug);
  }

  // wereldpositie van een cel (voor deeltjes en teksten)
  pos(cell) {
    return {
      x: this.gridX + cell.c * this.cell + this.cell / 2,
      y: this.grid.y + cell.r * this.cell + this.cell / 2,
    };
  }

  setDepthLabel() {
    this.comboText.setText(`${TEXT.mgDepth} ${this.maxRow}`);
  }

  // ---------- tikken en graven ----------

  onTap(p) {
    if (!this.started || this.ended || this.time.now < this.nextTapAt) return;
    const c = Math.floor((p.x - this.gridX) / this.cell);
    const r = Math.floor((p.y - this.grid.y) / this.cell);
    if (p.y < this.gridTop || c < 0 || c >= this.cols) return;
    const cell = this.get(r, c);
    if (!cell) return;
    this.nextTapAt = this.time.now + this.cfg.tapCooldownMs;
    if (!this.diggable(cell)) {
      if (!cell.dug) {
        this.tweens.add({ targets: cell.img, x: cell.img.x + 3 * this.S, duration: 40, yoyo: true, repeat: 1 });
        this.sfx('swing');
      }
      return;
    }
    const dmg = (this.spec.perks.damage || 1) * this.spec.toolMult;
    this.damageCell(cell, dmg, true);
    // kristallen houweel: slaat door naar het blok eronder
    if (this.spec.perks.pierce) {
      const below = this.get(cell.r + 1, cell.c);
      if (below && !below.dug && !below.falling) this.damageCell(below, dmg * 0.5, false);
    }
  }

  damageCell(cell, dmg, direct) {
    const { S } = this;
    cell.hp -= dmg;
    const p = this.pos(cell);
    if (direct) {
      this.sfx('mine');
      this.chips.explode(5, p.x, p.y);
      this.tweens.killTweensOf(cell.img);
      cell.img.setAlpha(1);
      const sx = this.cell / cell.img.width;
      this.tweens.add({ targets: cell.img, scaleX: sx * 0.9, scaleY: sx * 0.9, duration: 50, yoyo: true });
    }
    if (cell.hp > 0) {
      // donkerder naarmate hij kapotter is
      const f = cell.hp / cell.maxHp;
      const v = Math.round(130 + 125 * f);
      cell.img.setTint(Phaser.Display.Color.GetColor(v, v, v));
      return;
    }
    this.breakCell(cell);
  }

  breakCell(cell) {
    const { S, cfg, spec } = this;
    cell.dug = true;
    this.blocks++;
    const p = this.pos(cell);
    this.chips.explode(12, p.x, p.y);
    this.tweens.killTweensOf(cell.img);
    this.tweens.add({ targets: [cell.img, cell.crack].filter(Boolean), alpha: 0, duration: 120 });
    this.shake(50, 0.003);

    if (cell.kind === 'ore') {
      this.ores += spec.per;
      this.oreText.setText(String(this.ores));
      this.tweens.add({ targets: this.oreText, scale: { from: 1.5, to: 1 }, duration: 250, ease: 'Back.easeOut' });
      this.floatText(p.x, p.y - 20 * S, `+${spec.per}`, '#e8d6b8', 20);
      this.sfx('pickup');
    } else if (cell.kind === 'rare') {
      this.found[cell.item] = (this.found[cell.item] || 0) + 1;
      this.rareCount++;
      this.sparkle.explode(24, p.x, p.y);
      this.flash(0xffe6a0, 0.2, 250);
      this.shout(`${CONFIG.items[cell.item].name.toUpperCase()}!`, '#ffe6a0', this.H * 0.3);
      this.sfx('levelUp');
    }
    if (cell.r > this.maxRow) {
      this.maxRow = cell.r;
      this.setDepthLabel();
      this.setScore(this.score);
      this.scroll();
    } else {
      this.setScore(this.score);
    }
    // gebarsten stenen erboven of ernaast verliezen hun steun en storten in
    for (const [dr, dc] of [[-1, 0], [0, -1], [0, 1]]) {
      const n = this.get(cell.r + dr, cell.c + dc);
      if (n?.unstable && !n.dug && !n.falling) this.collapse(n);
    }
  }

  get score() {
    const c = this.cfg;
    return this.maxRow * c.scoreRow + Math.round(this.ores * c.scoreOre) + this.rareCount * c.scoreRare;
  }

  // gebarsten steen wiebelt even en stort dan in
  collapse(cell) {
    const { S } = this;
    cell.falling = true;
    if (cell.crack) cell.crack.setAlpha(1);
    this.sfx('crack');
    this.tweens.add({ targets: [cell.img, cell.crack].filter(Boolean), x: `+=${3 * S}`, duration: 50, yoyo: true, repeat: Math.floor(this.cfg.collapseMs / 100) });
    this.time.delayedCall(this.cfg.collapseMs, () => {
      if (this.ended && !this.started) return;
      cell.dug = true;
      cell.falling = false;
      const p = this.pos(cell);
      this.chips.explode(22, p.x, p.y);
      this.tweens.add({ targets: [cell.img, cell.crack].filter(Boolean), y: `+=${this.cell}`, alpha: 0, duration: 220, ease: 'Quad.easeIn' });
      if (this.ended) return;
      if (this.shield > 0) {
        this.shield--;
        this.sfx('place');
        this.shout(TEXT.mgShielded, '#40ffd0', this.H * 0.35);
      } else {
        this.lives--;
        this.setLives(this.lives);
        this.sfx('fall');
        this.shake(280, 0.018);
        this.flash(0xe0504a, 0.3, 250);
        this.shout(pick(TEXT.mgCollapse), '#ff8a80', this.H * 0.35);
        if (this.lives <= 0) { this.end(pick(TEXT.mgDelvenLives)); return; }
      }
      // kettingreactie: wat erboven hing, valt ook
      const above = this.get(cell.r - 1, cell.c);
      if (above?.unstable && !above.dug && !above.falling) this.collapse(above);
    });
  }

  // camera zakt mee als je dieper komt
  scroll() {
    const want = Math.max(0, this.maxRow - this.visibleRows + 4);
    if (want <= this.viewRow) return;
    this.viewRow = want;
    this.ensureRows(this.viewRow + this.visibleRows + 4);
    this.tweens.add({ targets: this.grid, y: this.gridTop - this.viewRow * this.cell, duration: 300, ease: 'Cubic.easeOut' });
  }

  update(time, delta) {
    if (!this.started || this.ended) return;
    this.timeLeft -= Math.min(delta, 50);
    this.drawTime(Math.max(0, this.timeLeft / this.cfg.timeMs));
    if (this.timeLeft <= 0) this.end(TEXT.mgDelvenTime);
  }

  reward() {
    // mijlpalen en collecties: +x per paar aders
    const extra = this.gs.mods.extra(`yield.${this.spec.item}`) * Math.ceil(this.ores / (this.spec.per * 3));
    const items = { [this.spec.item]: this.ores + extra };
    for (const [k, n] of Object.entries(this.found)) items[k] = (items[k] || 0) + n;
    return {
      score: this.score,
      items,
      xp: this.blocks * this.cfg.xpPerBlock,
      line: `${TEXT.mgDepth.toLowerCase()} ${this.maxRow} · ${this.blocks} ${TEXT.mgBlocks}${this.rareCount ? ` · ${this.rareCount} ${TEXT.mgRare}` : ''}`,
    };
  }
}
