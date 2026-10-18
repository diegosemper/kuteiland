// De nacht als spel. Eerst een bouwfase (de klok staat stil, de camera zoomt uit en je zet verdediging neer,
// betaald met grondstoffen). Dan het gevecht: golven wezens kruipen vanaf de randen omhoog. De nacht duurt
// tot de laatste golf verslagen is. Overleven levert een beloning op; kapotte gebouwen herstel je overdag.
import { CONFIG } from '../config.js';
import { TEXT, pick } from '../texts.js';
import { bus } from '../bus.js';
import { gridToScreen, screenToGrid } from '../iso.js';
import { ITEM_TO_OBJECT } from '../world/objects.js';
import { canPay, pay } from './Upgrades.js';

const C = () => CONFIG.siege;
const { tileW: TW, tileH: TH } = CONFIG.iso;

export class Siege {
  constructor(game) {
    this.game = game;
    this.state = 'idle';       // idle | prep | fight
    this.ghosts = game.add.graphics().setDepth(-3999);
    this.selected = C().build[0].item;
  }

  get prep() {
    return this.state === 'prep';
  }

  get fighting() {
    return this.state === 'fight';
  }

  // ---------- begin van de nacht ----------

  startNight(n) {
    this.n = n;
    this.state = 'prep';
    this.prepLeft = C().prepMs;
    this.wave = 0;
    this.waves = Math.min(C().maxWaves, C().waves[0] + Math.floor((n - 1) / C().waves[1]));
    const g = this.game;
    g.autoTarget = null;
    g.autoGrab = null;
    if (g.build.active) g.build.close();
    this.zoomOut();
    this.redraw();
    bus.emit('siege', this.status());
    bus.emit('message', n === 1 ? TEXT.siegePrepFirst : `${TEXT.siegePrep} ${pick(TEXT.night)}`, true);
  }

  // halverwege de nacht geladen: meteen vechten
  resume(n) {
    this.n = n;
    this.waves = Math.min(C().maxWaves, C().waves[0] + Math.floor((n - 1) / C().waves[1]));
    this.wave = 0;
    this.state = 'fight';
    this.nextWave();
  }

  // ---------- camera ----------

  zoomOut() {
    const g = this.game;
    const cam = g.cameras.main;
    const tiles = g.island.home.sortedTiles();
    const xs = tiles.map((t) => gridToScreen(t.gx, t.gy).x);
    const ys = tiles.map((t) => gridToScreen(t.gx, t.gy).y);
    const minX = Math.min(...xs) - TW, maxX = Math.max(...xs) + TW;
    const minY = Math.min(...ys) - TH * 3, maxY = Math.max(...ys) + TH * 2;
    const zoom = Math.min(cam.width / (maxX - minX), (cam.height * 0.62) / (maxY - minY), cam.zoom);
    cam.stopFollow();
    cam.pan((minX + maxX) / 2, (minY + maxY) / 2 + (maxY - minY) * 0.08, 500, 'Sine.easeInOut');
    cam.zoomTo(zoom, 500, 'Sine.easeInOut');
  }

  zoomBack() {
    const g = this.game;
    const cam = g.cameras.main;
    const { minZoom, maxZoom, viewTilesWide } = CONFIG.render;
    const zoom = Phaser.Math.Clamp(g.scale.width / (viewTilesWide * CONFIG.iso.tileW), minZoom, maxZoom);
    cam.zoomTo(zoom, 450, 'Sine.easeInOut');
    cam.pan(g.player.sprite.x, g.player.sprite.y, 450, 'Sine.easeInOut', false, (c, p) => {
      if (p === 1) c.startFollow(g.player.sprite, false, 0.1, 0.1);
    });
  }

  // ---------- bouwen in de bouwfase ----------

  option(item) {
    return C().build.find((b) => b.item === item);
  }

  // gratis als je hem al in je rugzak hebt, anders betaal je de grondstoffen
  affordable(item) {
    return this.game.inventory.get(item) > 0 || canPay(this.game.inventory, this.option(item).cost);
  }

  select(item) {
    this.selected = item;
    bus.emit('siege', this.status());
  }

  spots() {
    const g = this.game;
    const taken = new Set(g.objects.map((o) => `${o.gx},${o.gy}`));
    const p = { gx: Math.round(g.player.gx), gy: Math.round(g.player.gy) };
    return g.island.home.sortedTiles().filter((t) => !taken.has(`${t.gx},${t.gy}`) && !(t.gx === p.gx && t.gy === p.gy));
  }

  redraw() {
    const g = this.ghosts;
    g.clear();
    if (!this.prep) return;
    const ok = this.affordable(this.selected);
    for (const sp of this.spots()) {
      const s = gridToScreen(sp.gx, sp.gy);
      const pts = [{ x: s.x, y: s.y - TH / 2 }, { x: s.x + TW / 2, y: s.y }, { x: s.x, y: s.y + TH / 2 }, { x: s.x - TW / 2, y: s.y }];
      g.fillStyle(ok ? 0xe6dcf2 : 0xe07a6a, 0.1);
      g.fillPoints(pts, true);
      g.lineStyle(2, ok ? 0xe6dcf2 : 0xe07a6a, 0.5);
      g.strokePoints(pts, true);
    }
  }

  tapWorld(wx, wy) {
    if (!this.prep) return false;
    const gp = screenToGrid(wx, wy);
    const gx = Math.round(gp.gx), gy = Math.round(gp.gy);
    if (!this.spots().some((s) => s.gx === gx && s.gy === gy)) return false;
    const g = this.game;
    const item = this.selected;
    if (g.inventory.get(item) > 0) g.inventory.remove(item, 1);
    else if (!pay(g.inventory, this.option(item).cost)) {
      bus.emit('message', TEXT.siegeTooPoor, true);
      return true;
    }
    g.island.clearTufts(gx, gy);
    g.addObject({ ...ITEM_TO_OBJECT[item], gx, gy }, true);
    g.skills.gain('bouwen', CONFIG.skills.bouwen.xpObject);
    bus.emit('sfx', 'place');
    this.redraw();
    bus.emit('siege', this.status());
    return true;
  }

  ready() {
    if (this.prep) this.prepLeft = 0;
  }

  // ---------- gevecht ----------

  startFight() {
    this.state = 'fight';
    this.ghosts.clear();
    this.zoomBack();
    bus.emit('sfx', 'roar');
    this.nextWave();
  }

  nextWave() {
    const g = this.game;
    this.wave++;
    const more = 1 + g.mods.get('enemy.count');
    const crawlers = Math.round((C().perWave[0] + C().perWave[1] * (this.n - 1) + this.wave - 1) * more);
    const brutes = this.n >= C().brutesFrom ? Math.floor(this.wave / 2) + Math.floor((this.n - C().brutesFrom) / 3) : 0;
    const kinds = [...Array(crawlers).fill('crawler'), ...Array(brutes).fill('brute')].sort(() => Math.random() - 0.5);
    const now = g.time.now;
    this.queue = kinds.map((kind, i) => ({ kind, at: now + 600 + (i / kinds.length) * C().spreadMs }));
    this.breakUntil = 0;
    bus.emit('message', `${TEXT.siegeWave} ${this.wave}/${this.waves}`, true);
    bus.emit('siege', this.status());
  }

  get alive() {
    return this.game.night.enemies.filter((e) => e.siege && e.alive).length;
  }

  win() {
    const g = this.game;
    this.state = 'idle';
    const r = C().reward;
    const items = { leegtekristal: r.leegtekristal[0] + r.leegtekristal[1] * this.n, puin: r.puin[0] + r.puin[1] * this.n, roest: r.roest[0] + r.roest[1] * this.n };
    const p = g.player.sprite;
    Object.entries(items).forEach(([k, n], i) => {
      g.gainItem(k, n);
      g.time.delayedCall(i * 250, () => bus.emit('float', { wx: p.x, wy: p.y - 120 - i * 26, text: `+${n} ${CONFIG.items[k].name.toLowerCase()}`, color: '#ffd98a' }));
    });
    g.stats.nightsWon = (g.stats.nightsWon || 0) + 1;
    g.skills.gain('vechten', 20 + this.n * 5);
    bus.emit('sfx', 'levelUp');
    bus.emit('message', `${TEXT.siegeWon} ${this.n}. ${pick(TEXT.siegeWonLines)}`, true);
    bus.emit('siege', this.status());
    // de ochtend komt meteen
    const D = CONFIG.dayNight;
    g.dayNight.t = Math.max(g.dayNight.t, D.dayMs + D.nightMs - 1200);
    g.saveNow();
  }

  // Hoeveel tijd mag de dag/nacht-klok deze frame verder? (bouwfase: niks; gevecht: niet voorbij de nacht)
  clockStep(dt) {
    if (this.prep) return 0;
    if (this.fighting) {
      const D = CONFIG.dayNight;
      return Math.max(0, Math.min(dt, D.dayMs + D.nightMs - 2000 - this.game.dayNight.t));
    }
    return dt;
  }

  update(time, dt) {
    if (this.prep) {
      this.prepLeft -= dt;
      if (this.prepLeft <= 0) this.startFight();
      bus.emit('siege-tick', this.status());
      return;
    }
    if (!this.fighting) return;
    while (this.queue.length && this.queue[0].at <= time) {
      const e = this.game.night.spawn(this.queue.shift().kind);
      if (e) e.siege = true;
    }
    if (!this.queue.length && this.alive === 0) {
      if (this.wave >= this.waves) { this.win(); return; }
      if (!this.breakUntil) {
        this.breakUntil = time + C().breakMs;
        bus.emit('message', TEXT.siegeWaveCleared, true);
      } else if (time >= this.breakUntil) this.nextWave();
    }
    bus.emit('siege-tick', this.status());
  }

  status() {
    return {
      state: this.state, prepLeft: Math.max(0, this.prepLeft || 0), wave: this.wave, waves: this.waves,
      alive: this.fighting ? this.alive + (this.queue?.length || 0) : 0, selected: this.selected,
    };
  }
}
