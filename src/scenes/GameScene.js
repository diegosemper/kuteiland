// De spelwereld: eiland, speler, objecten, acties en opslaan.
import { CONFIG } from '../config.js';
import { TEXT, pick } from '../texts.js';
import { bus } from '../bus.js';
import { controls } from '../controls.js';
import { gridToScreen } from '../iso.js';
import { Island, layoutFromConfig } from '../world/Island.js';
import { Player } from '../world/Player.js';
import { createObject } from '../world/objects.js';
import { Inventory } from '../systems/Inventory.js';
import { BuildMode } from '../systems/Building.js';
import { Objectives } from '../systems/Objectives.js';
import { craft } from '../systems/Crafting.js';
import { findPath, findPathNear } from '../systems/Pathfinding.js';
import { Skills } from '../systems/Skills.js';
import { Drift } from '../systems/Drift.js';
import { loadGame, saveGame, clearSave } from '../systems/save.js';

const AUTO_WALK_MS = 4000;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const save = loadGame();
    this.flags = { ...save?.flags };
    this.stats = { chops: 0, wood: 0, puin: 0, tilesPlaced: 0, ...save?.stats };
    this.stats.crafted = { ...save?.stats?.crafted };
    this.tools = { axe: 0, pickaxe: 0, ...save?.tools };
    this.skills = new Skills(save?.skills);
    this.inventory = new Inventory(save?.inventory);
    this.chestStore = new Inventory(save?.chest);

    // Wereld: opgeslagen, of de startopstelling. Oude saves (fase 1) hebben alleen boom/kist-gegevens.
    const start = layoutFromConfig();
    const world = save?.world || {
      tiles: start.tiles,
      objects: start.objects.map((o) => (o.type === 'tree' ? { ...o, ...save?.tree } : o)),
    };

    this.island = new Island(this, world.tiles, world.objects);
    this.objects = [];
    for (const data of world.objects) this.addObject(data);

    let pos = start.spawn;
    if (save?.player && this.canStand(save.player.gx, save.player.gy)) pos = save.player;
    this.player = new Player(this, pos.gx, pos.gy);

    this.marker = this.add.image(0, 0, 'marker').setOrigin(0.5, 1).setDepth(1e6).setVisible(false);
    this.target = null;
    this.autoTarget = null;
    this.autoUntil = 0;
    this.nextActionAt = 0;
    this.nextEdgeLineAt = 0;
    this.nextObjectiveCheck = 0;

    this.build = new BuildMode(this);
    this.drift = new Drift(this);
    this.autoGrab = null;
    this.objectives = new Objectives(this, this.flags.objectiveId ?? this.flags.objective ?? 0);

    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, false, 0.1, 0.1);
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);
    this.layoutCamera();
    this.scale.on('resize', this.layoutCamera, this);

    this.setupSaving();
    const handlers = {
      'reset': () => this.resetGame(),
      'tap-object': (obj) => this.onTapObject(obj),
      'chest-closed': () => this.chest?.setOpen(false),
      'craft': (id) => this.onCraft(id),
      'build-open': () => this.build.open(),
      'build-close': () => this.build.close(),
      'build-select': (key) => this.build.select(key),
      'placed': (info) => this.onPlaced(info),
      'tap-drift': (it) => this.onTapDrift(it),
    };
    for (const [ev, fn] of Object.entries(handlers)) bus.on(ev, fn);
    this.events.once('shutdown', () => {
      for (const [ev, fn] of Object.entries(handlers)) bus.off(ev, fn);
      this.scale.off('resize', this.layoutCamera, this);
    });

    this.scene.launch('Background');
    this.scene.launch('UI');
    this.time.delayedCall(700, () => this.greet(!!save));
  }

  layoutCamera() {
    const cam = this.cameras.main;
    const { minZoom, maxZoom, viewTilesWide } = CONFIG.render;
    const zoom = Phaser.Math.Clamp(this.scale.width / (viewTilesWide * CONFIG.iso.tileW), minZoom, maxZoom);
    cam.setZoom(zoom);
    // speler iets boven het midden, zodat de knoppen onderin niks verbergen
    cam.setFollowOffset(0, -this.scale.height * 0.04 / zoom);
  }

  greet(hadSave) {
    if (!this.flags.introSeen) {
      TEXT.intro.forEach((line) => bus.emit('message', line));
      bus.emit('message', TEXT.introHint);
      this.flags.introSeen = true;
    } else if (hadSave) {
      bus.emit('message', TEXT.welcomeBack);
    }
    this.objectives.check();
  }

  // ---------- objecten ----------

  addObject(data, animate = false) {
    const obj = createObject(this, data);
    if (!obj) return null;
    this.objects.push(obj);
    if (obj.type === 'tree') this.tree = obj;
    if (obj.type === 'chest') this.chest = obj;
    if (animate) {
      const y = obj.sprite.y;
      obj.sprite.setY(y - 50).setAlpha(0);
      this.tweens.add({ targets: obj.sprite, y, alpha: 1, duration: 300, ease: 'Bounce.easeOut' });
      this.time.delayedCall(200, () => this.island.puff.explode(10, obj.sprite.x, y));
    }
    return obj;
  }

  countObjects(type) {
    return this.objects.filter((o) => o.type === type).length;
  }

  // ---------- beweging en botsing ----------

  canStand(gx, gy) {
    return this.onIsland(gx, gy) && this.objects.every(
      (o) => Math.hypot(gx - o.gx, gy - o.gy) >= CONFIG.player.radius + o.radius);
  }

  onIsland(gx, gy) {
    const r = CONFIG.player.radius;
    const isl = this.island;
    return isl.has(gx - r, gy - r) && isl.has(gx + r, gy - r)
      && isl.has(gx - r, gy + r) && isl.has(gx + r, gy + r);
  }

  tryMove(fromGx, fromGy, toGx, toGy) {
    if (!this.onIsland(toGx, toGy)) return { ok: false, edge: true };
    for (const o of this.objects) {
      const min = CONFIG.player.radius + o.radius;
      const d = Math.hypot(toGx - o.gx, toGy - o.gy);
      // wie al overlapt mag er wel uit bewegen, niet verder in
      if (d < min && d < Math.hypot(fromGx - o.gx, fromGy - o.gy)) return { ok: false };
    }
    return { ok: true };
  }

  distanceTo(o) {
    return Math.hypot(this.player.gx - o.gx, this.player.gy - o.gy) - o.radius;
  }

  findTarget() {
    let best = null;
    let bestDist = Infinity;
    for (const o of this.objects) {
      const d = this.distanceTo(o);
      if (d <= CONFIG.player.reach && d < bestDist) {
        best = o;
        bestDist = d;
      }
    }
    return best;
  }

  // Welk object staat op dit punt in de wereld? (voor tikken)
  // Overlappen er meerdere? Dan wint het object waarvan het midden het dichtst bij de vinger is.
  objectAt(wx, wy) {
    let hit = null;
    let best = Infinity;
    for (const o of this.objects) {
      const b = Phaser.Geom.Rectangle.Clone(o.hitArea || o.sprite.getBounds());
      Phaser.Geom.Rectangle.Inflate(b, 10, 10);
      if (!b.contains(wx, wy)) continue;
      const d = Math.hypot(wx - o.sprite.x, wy - o.hitY);
      if (d < best) { best = d; hit = o; }
    }
    return hit;
  }

  driftAt(wx, wy) {
    return this.drift.itemAt(wx, wy);
  }

  // Drijver aangetikt: vangen als hij dichtbij is, anders naar de rand lopen en dan vangen
  onTapDrift(it) {
    if (this.drift.inRange(it)) {
      this.drift.collect(it);
      return;
    }
    const g = this.drift.gridPos(it);
    const path = findPathNear(this, Math.round(g.gx), Math.round(g.gy));
    if (!path) {
      bus.emit('message', TEXT.driftFar, true);
      return;
    }
    this.autoTarget = null;
    this.autoGrab = it;
    this.autoPath = path;
    this.autoUntil = this.time.now + AUTO_WALK_MS + path.length * 500;
  }

  onTapObject(obj) {
    this.autoGrab = null;
    if (this.distanceTo(obj) <= CONFIG.player.reach) {
      this.target = obj;
      controls.actionQueued = true;
      return;
    }
    const path = findPath(this, obj);
    if (!path) {
      bus.emit('message', TEXT.noPath, true);
      return;
    }
    this.autoTarget = obj;
    this.autoPath = path;
    this.autoUntil = this.time.now + AUTO_WALK_MS + path.length * 500;
  }

  // ---------- spellus ----------

  update(time, delta) {
    const dt = Math.min(delta, 50);

    this.drift.update(time, dt);
    if (!this.flags.driftSeen && this.drift.items.length && time > 8000) {
      this.flags.driftSeen = true;
      bus.emit('message', TEXT.driftFirst);
    }

    let move = controls.move;
    if (Math.hypot(move.x, move.y) > 0.15 || time > this.autoUntil) {
      this.autoTarget = null;
      this.autoGrab = null;
    }
    if (this.autoGrab) {
      const it = this.autoGrab;
      if (!this.drift.alive(it)) {
        this.autoGrab = null;
        bus.emit('message', TEXT.driftGone, true);
      } else if (this.drift.inRange(it)) {
        this.autoGrab = null;
        this.drift.collect(it);
      } else {
        const wp = this.autoPath[0];
        if (wp && Math.hypot(wp.gx - this.player.gx, wp.gy - this.player.gy) < 0.12) this.autoPath.shift();
        const g = this.drift.gridPos(it);
        const aim = this.autoPath[0];
        if (aim) {
          const v = gridToScreen(aim.gx - this.player.gx, aim.gy - this.player.gy);
          const len = Math.hypot(v.x, v.y) || 1;
          move = { x: v.x / len, y: v.y / len };
        } else {
          // aan de rand, maar nog te ver: wachten tot hij dichterbij drijft
          this.player.faceTowards(gridToScreen(g.gx, g.gy).x);
        }
      }
    } else if (this.autoTarget) {
      if (this.distanceTo(this.autoTarget) <= CONFIG.player.reach * 0.8) {
        this.target = this.autoTarget;
        this.autoTarget = null;
        controls.actionQueued = true;
      } else {
        // volg de route, tegel voor tegel; daarna recht op het doel af
        const wp = this.autoPath[0];
        if (wp && Math.hypot(wp.gx - this.player.gx, wp.gy - this.player.gy) < 0.12) this.autoPath.shift();
        const aim = this.autoPath[0] || this.autoTarget;
        const v = gridToScreen(aim.gx - this.player.gx, aim.gy - this.player.gy);
        const len = Math.hypot(v.x, v.y) || 1;
        move = { x: v.x / len, y: v.y / len };
      }
    }

    const hitEdge = this.player.update(dt, move, this);
    if (hitEdge && !this.autoTarget && !this.build.active && time >= this.nextEdgeLineAt) {
      this.nextEdgeLineAt = time + 15000;
      bus.emit('message', pick(TEXT.edge));
    }
    this.build.update();

    // een getikt doel blijft gekozen tot de actie gedaan is
    const target = controls.actionQueued && this.target ? this.target : this.findTarget();
    if (target !== this.shownTarget) {
      this.shownTarget = target;
      bus.emit('target', target ? target.label : null);
    }
    this.target = target;
    if (target && !this.build.active) {
      const bob = Math.sin(time / 220) * 4;
      this.marker.setVisible(true).setPosition(target.sprite.x, target.topY + bob);
    } else {
      this.marker.setVisible(false);
    }

    if ((controls.action || controls.actionQueued) && time >= this.nextActionAt) {
      controls.actionQueued = false;
      this.nextActionAt = time + CONFIG.player.actionCooldownMs;
      this.doAction();
    }

    if (time >= this.nextObjectiveCheck) {
      this.nextObjectiveCheck = time + 300;
      this.objectives.check();
    }
  }

  doAction() {
    const target = this.target;
    if (target) this.player.faceTowards(target.sprite.x);
    if (!target || (target.type !== 'chest' && target.type !== 'workbench')) this.player.swing();
    if (!target) return;

    const result = target.act(this);
    if (!result) return;

    if (result.skill) this.skills.gain(result.skill, CONFIG.skills[result.skill].xp);
    if (result.item) {
      this.inventory.add(result.item, result.amount);
      const def = CONFIG.items[result.item];
      bus.emit('float', {
        wx: target.sprite.x,
        wy: target.hitY,
        text: `+${result.amount} ${def.name.toLowerCase()}${result.double ? ` ${TEXT.doubleDrop}` : ''}`,
        color: result.double ? '#ffd98a' : '#e8d6b8',
      });
      if (result.item === 'wrakhout') this.onWood(result.amount);
      if (result.item === 'puin') this.stats.puin += result.amount;
    }
    if (result.openChest) {
      this.chest.setOpen(true);
      bus.emit('open-chest');
    }
    if (result.openCraft) bus.emit('open-craft');
    if (result.message) bus.emit('message', result.message, true);
  }

  onWood(amount) {
    this.stats.chops++;
    this.stats.wood += amount;
    if (!this.flags.firstWood) {
      this.flags.firstWood = true;
      bus.emit('message', TEXT.firstWood, true);
    }
  }

  onCraft(id) {
    const r = craft(this, id);
    if (!r) return;
    const B = CONFIG.skills.bouwen;
    this.skills.gain('bouwen', B.xpCraft);
    // skill Bouwen: kans op een gratis extra blok
    const item = r.gives.item && CONFIG.items[r.gives.item];
    if (item?.place === 'tile' && Math.random() < this.skills.freeBlockChance()) {
      this.inventory.add(r.gives.item, 1);
      const p = this.player.sprite;
      this.time.delayedCall(250, () => bus.emit('float', { wx: p.x, wy: p.y - 140, text: TEXT.freeBlock, color: '#ffd98a' }));
    }
    this.objectives.check();
    this.saveNow();
  }

  onPlaced(info) {
    const B = CONFIG.skills.bouwen;
    this.skills.gain('bouwen', CONFIG.items[info.item].place === 'tile' ? B.xpTile : B.xpObject);
    this.objectives.check();
    this.saveNow();
  }

  // ---------- opslaan ----------

  setupSaving() {
    this.time.addEvent({ delay: CONFIG.save.intervalMs, loop: true, callback: () => this.saveNow() });
    const onHide = () => { if (document.visibilityState === 'hidden') this.saveNow(); };
    const onPageHide = () => this.saveNow();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onPageHide);
    this.events.once('shutdown', () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onPageHide);
    });
  }

  saveNow() {
    if (this.resetting) return;
    this.flags.objectiveId = this.objectives?.id;
    delete this.flags.objective;
    saveGame({
      player: { gx: this.player.gx, gy: this.player.gy },
      inventory: this.inventory.toJSON(),
      chest: this.chestStore.toJSON(),
      tools: this.tools,
      skills: this.skills.toJSON(),
      stats: this.stats,
      flags: this.flags,
      world: {
        tiles: this.island.serialize(),
        objects: this.objects.map((o) => o.serialize()),
      },
    });
  }

  resetGame() {
    this.resetting = true;
    clearSave();
    window.location.reload();
  }
}
