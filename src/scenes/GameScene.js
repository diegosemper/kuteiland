// De spelwereld: eiland, speler, objecten, acties en opslaan.
import { CONFIG } from '../config.js';
import { TEXT, pick } from '../texts.js';
import { bus } from '../bus.js';
import { controls } from '../controls.js';
import { gridToScreen } from '../iso.js';
import { Island } from '../world/Island.js';
import { Player } from '../world/Player.js';
import { Tree } from '../world/Tree.js';
import { Chest } from '../world/Chest.js';
import { Inventory } from '../systems/Inventory.js';
import { loadGame, saveGame, clearSave } from '../systems/save.js';

const AUTO_WALK_MS = 4000;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const save = loadGame();
    this.flags = { ...save?.flags };
    this.stats = { chops: 0, wood: 0, ...save?.stats };
    this.inventory = new Inventory(save?.inventory);
    this.chestStore = new Inventory(save?.chest);

    this.island = new Island(this);
    this.objects = [];
    for (const m of this.island.markers) {
      if (m.type === 'tree') {
        this.tree = new Tree(this, m.gx, m.gy, save?.tree);
        this.objects.push(this.tree);
      } else if (m.type === 'chest') {
        this.chest = new Chest(this, m.gx, m.gy);
        this.objects.push(this.chest);
      }
    }

    let start = this.island.spawn;
    if (save?.player && this.canStand(save.player.gx, save.player.gy)) start = save.player;
    this.player = new Player(this, start.gx, start.gy);

    this.marker = this.add.image(0, 0, 'marker').setOrigin(0.5, 1).setDepth(1e6).setVisible(false);
    this.target = null;
    this.autoTarget = null;
    this.autoUntil = 0;
    this.nextActionAt = 0;
    this.nextEdgeLineAt = 0;

    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, false, 0.1, 0.1);
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);
    this.layoutCamera();
    this.scale.on('resize', this.layoutCamera, this);

    this.setupSaving();
    const onTap = (obj) => this.onTapObject(obj);
    const onChestClosed = () => this.chest?.setOpen(false);
    bus.on('reset', this.resetGame, this);
    bus.on('tap-object', onTap);
    bus.on('chest-closed', onChestClosed);
    this.events.once('shutdown', () => {
      bus.off('reset', this.resetGame, this);
      bus.off('tap-object', onTap);
      bus.off('chest-closed', onChestClosed);
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
  objectAt(wx, wy) {
    let hit = null;
    for (const o of this.objects) {
      const b = Phaser.Geom.Rectangle.Clone(o.hitArea || o.sprite.getBounds());
      Phaser.Geom.Rectangle.Inflate(b, 10, 10);
      if (b.contains(wx, wy) && (!hit || o.sprite.depth > hit.sprite.depth)) hit = o;
    }
    return hit;
  }

  onTapObject(obj) {
    if (this.distanceTo(obj) <= CONFIG.player.reach) {
      this.target = obj;
      controls.actionQueued = true;
    } else {
      this.autoTarget = obj;
      this.autoUntil = this.time.now + AUTO_WALK_MS;
    }
  }

  // ---------- spellus ----------

  update(time, delta) {
    const dt = Math.min(delta, 50);

    let move = controls.move;
    if (Math.hypot(move.x, move.y) > 0.15 || time > this.autoUntil) this.autoTarget = null;
    if (this.autoTarget) {
      if (this.distanceTo(this.autoTarget) <= CONFIG.player.reach * 0.8) {
        this.target = this.autoTarget;
        this.autoTarget = null;
        controls.actionQueued = true;
      } else {
        const v = gridToScreen(this.autoTarget.gx - this.player.gx, this.autoTarget.gy - this.player.gy);
        const len = Math.hypot(v.x, v.y) || 1;
        move = { x: v.x / len, y: v.y / len };
      }
    }

    const hitEdge = this.player.update(dt, move, this);
    if (hitEdge && !this.autoTarget && time >= this.nextEdgeLineAt) {
      this.nextEdgeLineAt = time + 15000;
      bus.emit('message', pick(TEXT.edge));
    }

    // een getikt doel blijft gekozen tot de actie gedaan is
    const target = controls.actionQueued && this.target ? this.target : this.findTarget();
    if (target !== this.shownTarget) {
      this.shownTarget = target;
      bus.emit('target', target ? target.label : null);
    }
    this.target = target;
    if (target) {
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
  }

  doAction() {
    const target = this.target;
    if (target) this.player.faceTowards(target.sprite.x);
    if (!target || target.type !== 'chest') this.player.swing();
    if (!target) return;

    const result = target.act();
    if (!result) return;

    if (result.item) {
      this.inventory.add(result.item, result.amount);
      const def = CONFIG.items[result.item];
      bus.emit('float', {
        wx: target.sprite.x,
        wy: target.hitY,
        text: `+${result.amount} ${def.name.toLowerCase()}`,
        color: '#e8d6b8',
      });
      if (result.item === 'wrakhout') this.onWood(result.amount);
    }
    if (result.openChest) {
      this.chest.setOpen(true);
      bus.emit('open-chest');
    }
    if (result.message) bus.emit('message', result.message);
  }

  onWood(amount) {
    this.stats.chops++;
    this.stats.wood += amount;
    if (!this.flags.firstWood) {
      this.flags.firstWood = true;
      bus.emit('message', TEXT.firstWood, true);
    } else if (!this.flags.tenWood && this.stats.wood >= 10) {
      this.flags.tenWood = true;
      bus.emit('message', TEXT.tenWood);
    }
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
    saveGame({
      player: { gx: this.player.gx, gy: this.player.gy },
      inventory: this.inventory.toJSON(),
      chest: this.chestStore.toJSON(),
      stats: this.stats,
      flags: this.flags,
      tree: this.tree?.serialize(),
    });
  }

  resetGame() {
    this.resetting = true;
    clearSave();
    window.location.reload();
  }
}
