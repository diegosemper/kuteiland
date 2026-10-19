// Bouwmodus: kies een blok of bouwwerk, zie waar het kan, tik om te plaatsen.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { gridToScreen, screenToGrid } from '../iso.js';
import { ITEM_TO_OBJECT, itemForObject } from '../world/objects.js';

// 'weg' is geen item maar de sloopstand van het bouwmenu
export const REMOVE = 'weg';
const KEEP = ['tree', 'chest', 'castaway', 'grave', 'note'];

const { tileW: TW, tileH: TH } = CONFIG.iso;

// Bereik van een anker: een cirkel in tegels is een platte ellips op het scherm
export function drawAnchorRing(g, game, anchor, alpha = 0.5) {
  const s = gridToScreen(anchor.gx, anchor.gy);
  const r = anchor.range(game);
  const w = r * TW * Math.SQRT2, h = r * TH * Math.SQRT2;
  g.fillStyle(0x9b6bff, 0.08 * alpha);
  g.fillEllipse(s.x, s.y, w, h);
  g.lineStyle(3, 0xb48cff, 0.7 * alpha);
  g.strokeEllipse(s.x, s.y, w, h);
}

// Sommige dingen moeten op een bepaalde plek staan: aan de rand, of juist er middenin
export function spotAllowed(island, gx, gy, rule) {
  if (rule === 'edge') return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !island.has(gx + dx, gy + dy));
  if (rule === 'inner') {
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (!island.has(gx + dx, gy + dy)) return false;
  }
  return true;
}

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
    // niks om te bouwen? Dan meteen de weghaal-stand
    this.select(list.includes(this.item) ? this.item : list[0] || REMOVE);
  }

  // Wat mag je weghalen (en terug in je rugzak stoppen)?
  removable(o) {
    const g = this.game;
    if (KEEP.includes(o.type)) return false;
    if (o.type === 'bed' && g.objects.some((r) => r.type === 'castaway' && r.bed[0] === o.gx && r.bed[1] === o.gy)) return false;
    if ((o.type === 'kern' || o.type === 'altar') && g.boss?.alive) return false;
    if (o.type === 'portal' && g.depth.active) return false;
    return !!itemForObject(o);
  }

  // Welk item hoort bij een blok? (gras en aarde van het begin geven niks terug)
  tileItem(kind) {
    return Object.keys(CONFIG.items).find((k) => CONFIG.items[k].place === 'tile' && CONFIG.items[k].tile === kind) || null;
  }

  // Mag dit blok weg? Niet onder iets, niet onder jou, en het eiland moet één geheel blijven.
  removableTile(t) {
    const g = this.game;
    const home = g.island.home;
    if (!home.get(t.gx, t.gy) || home.size <= CONFIG.build.minTiles) return false;
    if (g.objects.some((o) => o.type !== 'castaway' && o.gx === t.gx && o.gy === t.gy)) return false;
    if (Math.round(g.player.gx) === t.gx && Math.round(g.player.gy) === t.gy) return false;
    return home.staysConnected(t.gx, t.gy);
  }

  removeTileAt(gx, gy) {
    const g = this.game;
    const t = g.island.home.get(gx, gy);
    if (!t || !this.removableTile(t)) return false;
    const item = this.tileItem(t.kind);
    const s = gridToScreen(gx, gy);
    g.island.removeTile(gx, gy);
    g.island.puff.explode(14, s.x, s.y);
    bus.emit('sfx', 'place');
    if (item) {
      g.inventory.add(item, 1);
      bus.emit('float', { wx: s.x, wy: s.y - 40, text: `+1 ${CONFIG.items[item].name.toLowerCase()}`, color: '#e8d6b8' });
    }
    // bewoners die daar stonden, gaan terug naar hun bed
    for (const o of g.objects) {
      if (o.type === 'castaway' && Math.round(o.gx) === gx && Math.round(o.gy) === gy) {
        [o.gx, o.gy] = o.bed;
        o.goal = null;
        o.sync();
      }
    }
    g.saveNow();
    this.redraw();
    this.emit();
    return true;
  }

  removeAt(gx, gy) {
    const g = this.game;
    const o = g.objects.find((x) => x.gx === gx && x.gy === gy && this.removable(x));
    if (!o) return this.removeTileAt(gx, gy);
    const item = itemForObject(o);
    // een machine geeft eerst zijn voorraad af
    if (o.type === 'machine' && o.stored) g.collectMachine(o);
    g.removeObject(o);
    g.inventory.add(item, 1);
    bus.emit('sfx', 'place');
    bus.emit('float', { wx: o.sprite.x, wy: o.topY ?? o.sprite.y - 60, text: `+1 ${CONFIG.items[item].name.toLowerCase()}`, color: '#e8d6b8' });
    g.saveNow();
    this.redraw();
    this.emit();
    return true;
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
    if (this.item === REMOVE) {
      const objs = this.game.objects.filter((o) => this.removable(o)).map((o) => ({ gx: o.gx, gy: o.gy }));
      const tiles = this.game.island.home.sortedTiles().filter((t) => this.removableTile(t)).map((t) => ({ gx: t.gx, gy: t.gy, tile: true }));
      return [...objs, ...tiles];
    }
    const def = CONFIG.items[this.item];
    const { island, player, objects } = this.game;
    if (def.place === 'tile') return island.freeEdgeSpots().filter((s) => island.canAddTile(s.gx, s.gy, def.tile));
    // object: op een vrije tegel, niet waar de speler staat
    return island.sortedTiles().filter((t) =>
      !objects.some((o) => o.gx === t.gx && o.gy === t.gy)
      && Math.hypot(player.gx - t.gx, player.gy - t.gy) > 0.55
      && spotAllowed(island, t.gx, t.gy, def.spot));
  }

  redraw() {
    const g = this.ghosts;
    g.clear();
    this.spots = this.computeSpots();
    if (this.active) {
      for (const a of this.game.objects.filter((o) => o.type === 'anchor')) drawAnchorRing(g, this.game, a, 0.6);
    }
    for (const sp of this.spots) {
      const s = gridToScreen(sp.gx, sp.gy);
      const pts = [
        { x: s.x, y: s.y - TH / 2 }, { x: s.x + TW / 2, y: s.y },
        { x: s.x, y: s.y + TH / 2 }, { x: s.x - TW / 2, y: s.y },
      ];
      const col = this.item === REMOVE ? (sp.tile ? 0xffb070 : 0xe07a6a) : 0xe6dcf2;
      g.fillStyle(col, this.item === REMOVE ? 0.18 : 0.1);
      g.fillPoints(pts, true);
      g.lineStyle(2, col, 0.6);
      g.strokePoints(pts, true);
    }
  }

  // Elke frame: plekken verschuiven als de speler loopt (voor objecten)
  update() {
    if (!this.active || !this.item || CONFIG.items[this.item]?.place !== 'object') return;
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
    if (this.item === REMOVE) return this.removeAt(gx, gy);
    this.place(gx, gy);
    return true;
  }

  place(gx, gy) {
    const game = this.game;
    const key = this.item;
    const def = CONFIG.items[key];
    const valid = def.place === 'tile'
      ? game.island.canAddTile(gx, gy, def.tile)
      : game.island.has(gx, gy) && !game.objects.some((o) => o.gx === gx && o.gy === gy) && spotAllowed(game.island, gx, gy, def.spot);
    if (!valid || !game.inventory.remove(key, 1)) return;

    if (def.place === 'tile') {
      game.island.addTile(gx, gy, def.tile);
      game.stats.tilesPlaced = (game.stats.tilesPlaced || 0) + 1;
    } else {
      game.island.clearTufts(gx, gy);
      game.addObject({ ...ITEM_TO_OBJECT[key], gx, gy }, true);
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
