// De spelwereld: eiland, speler, objecten, acties en opslaan.
import { CONFIG } from '../config.js';
import { TEXT, pick } from '../texts.js';
import { bus } from '../bus.js';
import { controls } from '../controls.js';
import { Island } from '../world/Island.js';
import { Player } from '../world/Player.js';
import { Tree } from '../world/Tree.js';
import { Chest } from '../world/Chest.js';
import { Inventory } from '../systems/Inventory.js';
import { loadGame, saveGame, clearSave } from '../systems/save.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const save = loadGame();
    this.flags = { ...save?.flags };
    this.stats = { chops: 0, wood: 0, ...save?.stats };
    this.inventory = new Inventory(save?.inventory);

    this.island = new Island(this);
    this.objects = [];
    for (const m of this.island.markers) {
      if (m.type === 'tree') {
        this.tree = new Tree(this, m.gx, m.gy, save?.tree);
        this.objects.push(this.tree);
      } else if (m.type === 'chest') {
        this.objects.push(new Chest(this, m.gx, m.gy));
      }
    }

    let start = this.island.spawn;
    if (save?.player && this.canStand(save.player.gx, save.player.gy)) start = save.player;
    this.player = new Player(this, start.gx, start.gy);

    this.marker = this.add.image(0, 0, 'marker').setOrigin(0.5, 1).setDepth(1e6).setVisible(false);
    this.target = null;
    this.nextActionAt = 0;
    this.nextEdgeLineAt = 0;

    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, 0.1, 0.1);
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);
    this.layoutCamera();
    this.scale.on('resize', this.layoutCamera, this);

    this.setupSaving();
    bus.on('reset', this.resetGame, this);
    this.events.once('shutdown', () => {
      bus.off('reset', this.resetGame, this);
      this.scale.off('resize', this.layoutCamera, this);
    });

    this.scene.launch('Background');
    this.scene.launch('UI');
    this.time.delayedCall(700, () => this.greet(!!save));
  }

  layoutCamera() {
    const cam = this.cameras.main;
    const zoom = Math.max(1, Math.round(this.scale.width / (CONFIG.render.viewTilesWide * CONFIG.iso.tileW)));
    cam.setZoom(zoom);
    // speler iets boven het midden, zodat de knoppen onderin niks verbergen
    cam.setFollowOffset(0, -this.scale.height * 0.06 / zoom);
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

  findTarget() {
    let best = null;
    let bestDist = Infinity;
    for (const o of this.objects) {
      const d = Math.hypot(this.player.gx - o.gx, this.player.gy - o.gy) - o.radius;
      if (d <= CONFIG.player.reach && d < bestDist) {
        best = o;
        bestDist = d;
      }
    }
    return best;
  }

  // ---------- spellus ----------

  update(time, delta) {
    const dt = Math.min(delta, 50);

    const hitEdge = this.player.update(dt, controls.move, this);
    if (hitEdge && time >= this.nextEdgeLineAt) {
      this.nextEdgeLineAt = time + 15000;
      bus.emit('message', pick(TEXT.edge));
    }

    const target = this.findTarget();
    if (target !== this.target) {
      this.target = target;
      bus.emit('target', target ? target.label : null);
    }
    if (target) {
      const bob = Math.round(Math.sin(time / 220) * 1.5);
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
    this.player.swing();
    if (!target) return;

    const result = target.act();
    if (!result) return;

    if (result.item) {
      this.inventory.add(result.item, result.amount);
      const def = CONFIG.items[result.item];
      bus.emit('float', {
        wx: target.sprite.x,
        wy: target.topY + 10,
        text: `+${result.amount} ${def.name.toLowerCase()}`,
        color: '#d9c7a8',
      });
      if (result.item === 'wrakhout') this.onWood(result.amount);
    }
    if (result.message) bus.emit('message', result.message);
  }

  onWood(amount) {
    this.stats.chops++;
    this.stats.wood += amount;
    if (!this.flags.firstWood) {
      this.flags.firstWood = true;
      bus.emit('message', TEXT.firstWood);
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
