// Bouwmodus: kies een blok of bouwwerk, zie waar het kan, tik om te plaatsen.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { gridToScreen, screenToGrid } from '../iso.js';
import { ITEM_TO_OBJECT } from '../world/objects.js';

const { tileW: TW, tileH: TH } = CONFIG.iso;

export class BuildMode {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.item = null;
    this.spots = [];
    this.ghosts = game.add.graphics().setDepth(4e5);
    game.tweens.add({ targets: this.ghosts, alpha: { from: 1, to: 0.45 }, duration: 700, yoyo: true, repeat: -1 });
  }

  // Wat kan de speler nu plaatsen?
  placeables() {
    return Object.keys(CONFIG.items).filter((k) => CONFIG.items[k].place && this.game.inventory.get(k) > 0);
  }

  open() {
    this.active = true;
    const list = this.placeables();
    this.select(list.includes(this.item) ? this.item : list[0] || null);
    if (!list.length) bus.emit('message', TEXT.buildNothing, true);
  }

  close() {
    this.active = false;
    this.item = null;
    this.redraw();
    this.emit();
  }

  select(key) {
    this.item = key;
    this.redraw();
    this.emit();
  }

  emit() {
    bus.emit('build-changed', { active: this.active, item: this.item, options: this.placeables() });
  }

  computeSpots() {
    if (!this.active || !this.item) return [];
    const def = CONFIG.items[this.item];
    const { island, player, objects } = this.game;
    if (def.place === 'tile') return island.freeEdgeSpots();
    // object: op een vrije tegel, niet waar de speler staat
    return island.sortedTiles().filter((t) =>
      !objects.some((o) => o.gx === t.gx && o.gy === t.gy)
      && Math.hypot(player.gx - t.gx, player.gy - t.gy) > 0.55);
  }

  redraw() {
    const g = this.ghosts;
    g.clear();
    this.spots = this.computeSpots();
    for (const sp of this.spots) {
      const s = gridToScreen(sp.gx, sp.gy);
      const pts = [
        { x: s.x, y: s.y - TH / 2 }, { x: s.x + TW / 2, y: s.y },
        { x: s.x, y: s.y + TH / 2 }, { x: s.x - TW / 2, y: s.y },
      ];
      g.fillStyle(0xe6dcf2, 0.1);
      g.fillPoints(pts, true);
      g.lineStyle(2, 0xe6dcf2, 0.6);
      g.strokePoints(pts, true);
    }
  }

  // Elke frame: plekken verschuiven als de speler loopt (voor objecten)
  update() {
    if (!this.active || !this.item || CONFIG.items[this.item].place !== 'object') return;
    const key = this.spots.map((s) => `${s.gx},${s.gy}`).join();
    const next = this.computeSpots().map((s) => `${s.gx},${s.gy}`).join();
    if (key !== next) this.redraw();
  }

  // Tik op wereldpunt; true als er geplaatst is
  tryPlaceAt(wx, wy) {
    if (!this.active || !this.item) return false;
    const g = screenToGrid(wx, wy);
    const gx = Math.round(g.gx), gy = Math.round(g.gy);
    if (!this.spots.some((s) => s.gx === gx && s.gy === gy)) return false;
    this.place(gx, gy);
    return true;
  }

  place(gx, gy) {
    const game = this.game;
    const key = this.item;
    const def = CONFIG.items[key];
    const valid = def.place === 'tile'
      ? game.island.canAddTile(gx, gy)
      : game.island.has(gx, gy) && !game.objects.some((o) => o.gx === gx && o.gy === gy);
    if (!valid || !game.inventory.remove(key, 1)) return;

    if (def.place === 'tile') {
      game.island.addTile(gx, gy, def.tile);
      game.stats.tilesPlaced = (game.stats.tilesPlaced || 0) + 1;
    } else {
      game.island.clearTufts(gx, gy);
      game.addObject({ type: ITEM_TO_OBJECT[key], gx, gy }, true);
    }
    bus.emit('placed', { item: key, gx, gy });

    // op = op: kies het volgende wat je kunt plaatsen, of stop met bouwen
    if (game.inventory.get(key) <= 0) {
      const list = this.placeables();
      if (!list.length) {
        this.close();
        return;
      }
      this.item = list[0];
    }
    this.redraw();
    this.emit();
  }
}
