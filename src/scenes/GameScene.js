// De spelwereld: eiland, speler, objecten, acties en opslaan.
import { CONFIG } from '../config.js';
import { TEXT, pick } from '../texts.js';
import { bus } from '../bus.js';
import { controls } from '../controls.js';
import { gridToScreen } from '../iso.js';
import { layoutFromConfig } from '../world/Island.js';
import { World, remoteLayout, islandDefs } from '../world/World.js';
import { Depth } from '../systems/Depth.js';
import { machineUpgradeCost, gearUpgradeCost, pay } from '../systems/Upgrades.js';
import { Boss } from '../world/Boss.js';
import { getMeta, startNextCycle } from '../systems/Meta.js';
import { getAudio } from '../systems/Audio.js';
import { Player } from '../world/Player.js';
import { createObject } from '../world/objects.js';
import { Inventory } from '../systems/Inventory.js';
import { BuildMode } from '../systems/Building.js';
import { Objectives } from '../systems/Objectives.js';
import { craft } from '../systems/Crafting.js';
import { drawAnchorRing } from '../systems/Building.js';
import { findPath, findPathNear } from '../systems/Pathfinding.js';
import { Skills } from '../systems/Skills.js';
import { Drift } from '../systems/Drift.js';
import { Mods, tierFor, COLLECTION_IDS } from '../systems/Mods.js';
import { DayNight } from '../systems/DayNight.js';
import { Night } from '../systems/Night.js';
import { Crumble } from '../systems/Crumble.js';
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
    this.tools = { axe: 0, pickaxe: 0, weapon: 0, ...save?.tools };
    this.skills = new Skills(save?.skills);
    this.inventory = new Inventory(save?.inventory);
    this.chestStore = new Inventory(save?.chest);
    // collecties: oude saves beginnen bij wat ze al verzamelden
    this.stats.collected = {
      wrakhout: this.stats.wood || 0, puin: this.stats.puin || 0, roest: this.stats.roest || 0,
      leegtekristal: this.stats.crystals || 0, sterrenstof: this.stats.sterrenstof || 0, wezens: this.stats.kills || 0,
      ...save?.stats?.collected,
    };
    this.mods = new Mods(this);
    this.skills.modsFn = (k) => this.mods.get(k);

    this.meta = getMeta();
    this.audio = getAudio();
    // nieuwe cyclus: je begint niet helemaal met niks
    if (!save && this.meta.cycle > 1) {
      this.inventory.add('werkbank', 1);
      this.inventory.add('wrakhout', 5);
    }

    // Wereld: opgeslagen, of de startopstelling. Oude saves hebben alleen het starteiland (of minder).
    const start = layoutFromConfig();
    const savedIslands = save?.world?.islands || (save?.world?.tiles ? { home: save.world.tiles } : null);
    const objects = save?.world?.objects
      || start.objects.map((o) => (o.type === 'tree' ? { ...o, ...save?.tree } : o));
    // verre eilanden die nog niet in de save zitten: hun objecten erbij
    for (const def of islandDefs()) {
      const layoutObjects = remoteLayout(def).objects;
      if (!savedIslands?.[def.id]) {
        objects.push(...layoutObjects);
      } else {
        // oudere saves: altaar en poort bestonden nog niet; zet ze erbij
        for (const o of layoutObjects) {
          if ((o.type === 'portal' || o.type === 'altar') && !objects.some((x) => x.type === o.type && x.gx === o.gx && x.gy === o.gy)) objects.push(o);
        }
      }
    }
    if (!this.flags.note1Placed) {
      this.flags.note1Placed = true;
      objects.push({ type: 'note', note: 1, gx: 1, gy: 1 });
    }

    this.island = new World(this, savedIslands, objects);
    this.objects = [];
    for (const data of objects) {
      // een object op een tegel die niet (meer) bestaat, laten we weg
      if (this.island.get(data.gx, data.gy)) this.addObject(data);
    }
    this.flags.discovered = { ...this.flags.discovered };
    this.flags.notes = { ...this.flags.notes };
    this.flags.seals = { ...this.flags.seals };
    this.upgrades = { axe: 0, pickaxe: 0, weapon: 0, armor: 0, ...save?.upgrades };
    this.tools.armor = this.tools.armor || 0;
    this.boss = null;
    this.depth = new Depth(this);

    this.spawnPoint = start.spawn;
    let pos = start.spawn;
    if (save?.player && this.canStand(save.player.gx, save.player.gy)) pos = save.player;
    this.player = new Player(this, pos.gx, pos.gy);
    this.hp = Math.min(this.maxHp, save?.hp ?? this.maxHp);
    this.dead = false;
    this.hurtUntil = 0;

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
    this.dayNight = new DayNight(save?.time);
    this.night = new Night(this);
    if (this.dayNight.isNight) this.night.start(this.dayNight.night, this.dayNight.t - CONFIG.dayNight.dayMs);
    this.crumble = new Crumble(this, save?.crumble);
    this.anchorRing = this.add.graphics().setDepth(-4000);
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
      'dusk': (n) => bus.emit('message', n === 1 ? TEXT.duskFirst : pick(TEXT.dusk), true),
      'night-start': (n) => { bus.emit('sfx', 'night'); this.onNightStart(n); },
      'prestige': (id) => this.startNewCycle(id),
      'day-start': (d) => { bus.emit('sfx', 'day'); this.onDayStart(d); },
      'anchor-closed': () => this.showAnchorRing(null),
      'anchor-upgrade': (a) => this.upgradeAnchor(a),
      'machine-collect': (m) => this.collectMachine(m),
      'machine-upgrade': (m) => this.upgradeMachine(m),
      'gear-upgrade': (slot) => this.upgradeGear(slot),
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
    const rule = CONFIG.cycleMods.find((m) => m.id === this.meta.cycleMod);
    if (rule && !hadSave) bus.emit('message', `${TEXT.cycleRule} ${rule.name}. ${rule.text}.`);
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

  removeObject(obj) {
    this.objects = this.objects.filter((o) => o !== obj);
    if (this.target === obj) this.target = null;
    if (obj.destroy) obj.destroy();
    else { obj.sprite?.destroy(); obj.shadow?.destroy(); }
    this.island.puff.explode(10, obj.sprite?.x ?? 0, obj.hitY ?? 0);
  }

  // Bereik van een anker op de grond tekenen (null = weghalen)
  showAnchorRing(anchor) {
    const g = this.anchorRing;
    g.clear();
    if (!anchor) return;
    drawAnchorRing(g, this, anchor, 0.9);
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
    // wezens gaan voor: vechten is belangrijker dan hout
    let best = null;
    let bestDist = Infinity;
    for (const e of this.night.enemies) {
      if (!e.alive || e.state !== 'hunt') continue;
      const d = this.distanceTo(e);
      if (d <= CONFIG.combat.reach && d < bestDist) { best = e; bestDist = d; }
    }
    if (best) return best;
    for (const o of [...this.objects, ...this.crumble.targets()]) {
      if (!o.label) continue;
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
    for (const o of [...this.objects, ...this.crumble.targets(), ...this.night.enemies.filter((e) => e.alive)]) {
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
    if (this.dead) return;
    if (obj.type === 'enemy') {
      // wezen aangetikt: erop af en slaan
      this.target = obj;
      if (this.distanceTo(obj) <= CONFIG.combat.reach) controls.actionQueued = true;
      else { this.autoTarget = obj; this.autoPath = []; this.autoUntil = this.time.now + AUTO_WALK_MS; }
      return;
    }
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

    this.dayNight.update(dt);
    this.night.update(time, dt);
    this.audio.update(this.dayNight.darkness);
    this.crumble.update(time, dt);
    this.depth.update(time);
    for (const o of this.objects) if (o.type === 'machine') o.tick(dt);
    if (!this.dayNight.isNight && !this.dead && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + CONFIG.combat.regenPerSec * dt / 1000);
      bus.emit('hp', this.hp, this.maxHp);
    }
    if (this.dead) {
      this.marker.setVisible(false);
      return;
    }

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
      const reachFor = this.autoTarget.type === 'enemy' ? CONFIG.combat.reach * 0.8 : CONFIG.player.reach * 0.8;
      if (this.autoTarget.type === 'enemy' && !this.autoTarget.alive) {
        this.autoTarget = null;
      } else if (this.distanceTo(this.autoTarget) <= reachFor) {
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
      this.checkDiscovery();
      this.objectives.check();
    }
  }

  // Voor het eerst op een ver eiland?
  checkDiscovery() {
    const isl = this.island.islandAt(Math.round(this.player.gx), Math.round(this.player.gy));
    if (!isl || isl.id === 'home' || this.flags.discovered[isl.id]) return;
    this.flags.discovered[isl.id] = true;
    const def = CONFIG.islands.find((d) => d.id === isl.id);
    bus.emit('message', def.arrive, true);
    bus.emit('sfx', 'note');
    this.saveNow();
  }

  doAction() {
    const target = this.target;
    if (target) this.player.faceTowards(target.sprite.x);
    if (!target || !['chest', 'workbench', 'grave', 'note', 'kern', 'anchor'].includes(target.type)) this.player.swing();
    if (target) {
      const sfx = { tree: 'chop', generator: 'mine', node: 'mine', crack: 'place' }[target.type];
      if (sfx) bus.emit('sfx', sfx);
      else if (target.type === 'enemy') bus.emit('sfx', 'swing');
    } else {
      bus.emit('sfx', 'swing');
    }
    if (!target) return;

    const result = target.act(this);
    if (!result) return;

    if (result.skill) this.skills.gain(result.skill, CONFIG.skills[result.skill].xp);
    if (result.item) {
      this.inventory.add(result.item, result.amount);
      this.collect(result.item, result.amount);
      const def = CONFIG.items[result.item];
      bus.emit('float', {
        wx: target.sprite.x,
        wy: target.hitY,
        text: `+${result.amount} ${def.name.toLowerCase()}${result.double ? ` ${TEXT.doubleDrop}` : ''}`,
        color: result.double ? '#ffd98a' : '#e8d6b8',
      });
      if (result.item === 'wrakhout') this.onWood(result.amount);
      if (result.item === 'puin') this.stats.puin += result.amount;
      if (result.item === 'sterrenstof') this.stats.sterrenstof = (this.stats.sterrenstof || 0) + result.amount;
      if (result.item === 'roest') this.stats.roest = (this.stats.roest || 0) + result.amount;
    }
    if (result.openChest) {
      this.chest.setOpen(true);
      bus.emit('open-chest');
    }
    if (result.openCraft) bus.emit('open-craft');
    if (result.attack) this.attackEnemy(result.attack);
    if (result.reclaim) this.reclaimGrave(target);
    if (result.repair) this.crumble.repair(result.repair);
    if (result.readNote) this.readNote(result.readNote);
    if (result.kern) this.onKern();
    if (result.summon) this.summonGuardian(result.summon);
    if (result.portal) this.onPortal();
    if (result.openAnvil) bus.emit('open-anvil');
    if (result.openMachine) bus.emit('open-machine', result.openMachine);
    if (result.openAnchor) {
      this.showAnchorRing(result.openAnchor);
      bus.emit('open-anchor', result.openAnchor);
    }
    if (result.message) bus.emit('message', result.message, true);
  }

  // ---------- collecties ----------

  collectionTier(id) {
    return tierFor(id, this.stats.collected[id] || 0);
  }

  // Verzameld: telt op voor de collectie; een nieuw niveau geeft een recept of bonus
  collect(id, n) {
    if (!COLLECTION_IDS.includes(id) || !n) return;
    const before = this.collectionTier(id);
    this.stats.collected[id] = (this.stats.collected[id] || 0) + n;
    const after = this.collectionTier(id);
    if (after > before) {
      this.mods.invalidate();
      for (let t = before + 1; t <= after; t++) bus.emit('collection-up', { id, tier: t, reward: CONFIG.collections.items[id][t - 1] });
      bus.emit('hp', this.hp, this.maxHp);
      this.objectives.check();
    }
  }

  // ---------- vechten en levens ----------

  get maxHp() {
    const V = CONFIG.skills.vechten;
    return CONFIG.combat.baseHp + 2 * Math.floor(this.skills.level('vechten') / V.heartEvery) + this.mods.get('hp');
  }

  attackEnemy(e) {
    if (!e.alive) return;
    const base = CONFIG.combat.weaponDamage[this.tools.weapon || 0];
    const dmg = base * (1 + this.skills.level('vechten') * CONFIG.skills.vechten.damage) * (1 + this.mods.get('damage'))
      * this.upgradeMult('weapon');
    bus.emit('sfx', 'enemyHit');
    // zichtbare slag
    const flip = this.player.sprite.flipX;
    const slash = this.add.image(this.player.sprite.x + (flip ? -36 : 36), this.player.sprite.y - 50, 'slash')
      .setFlipX(flip).setDepth(6e5).setAlpha(0.9).setScale(0.8);
    this.tweens.add({ targets: slash, alpha: 0, scale: 1.1, duration: 180, onComplete: () => slash.destroy() });
    bus.emit('float', { wx: e.sprite.x, wy: e.topY, text: '-' + Math.round(dmg * 10) / 10, color: '#ff9a9a' });
    this.skills.gain('vechten', CONFIG.skills.vechten.xp);
    this.night.damageEnemy(e, dmg, true);
  }

  hurtPlayer(dmg) {
    if (this.dead || this.time.now < this.hurtUntil) return;
    this.hurtUntil = this.time.now + CONFIG.combat.hurtCooldownMs;
    // harnas vangt een deel op
    const reduce = Math.min(0.8, CONFIG.combat.armorReduction[this.tools.armor || 0] + this.upgrades.armor * CONFIG.upgrades.per.armor);
    dmg *= 1 - reduce;
    this.hp -= dmg;
    const p = this.player.sprite;
    p.setTintFill(0xff6060);
    this.time.delayedCall(90, () => p.clearTint());
    this.cameras.main.shake(120, 0.004);
    bus.emit('hurt', dmg);
    bus.emit('sfx', 'hurt');
    bus.emit('hp', Math.max(0, this.hp), this.maxHp);
    if (this.hp <= 0) this.die();
  }

  die() {
    this.dead = true;
    if (this.depth.active) this.depth.stop('dood');
    this.autoTarget = null;
    this.autoGrab = null;
    if (this.build.active) this.build.close();
    const p = this.player;
    this.tweens.add({ targets: p.sprite, alpha: 0, angle: p.sprite.flipX ? -80 : 80, duration: 600 });

    // de helft van wat je draagt blijft liggen; de kist is veilig
    const lost = {};
    for (const [k, n] of Object.entries(this.inventory.items)) {
      const half = Math.floor(n / 2);
      if (half > 0 && this.inventory.remove(k, half)) lost[k] = half;
    }
    const old = this.objects.find((o) => o.type === 'grave');
    if (old) this.removeObject(old);
    let grave = null;
    if (Object.keys(lost).length) {
      const spot = this.freeTileNear(Math.round(p.gx), Math.round(p.gy));
      if (spot) grave = this.addObject({ type: 'grave', gx: spot.gx, gy: spot.gy, items: lost });
    }
    this.stats.deaths = (this.stats.deaths || 0) + 1;
    bus.emit('player-died', { lost: grave ? grave.summary() : '', lostOld: !!old });
    bus.emit('sfx', 'death');
    this.saveNow();

    this.time.delayedCall(CONFIG.combat.respawnMs, () => this.respawn());
  }

  respawn() {
    const spot = this.freeTileNear(this.spawnPoint.gx, this.spawnPoint.gy) || this.spawnPoint;
    const p = this.player;
    p.gx = spot.gx;
    p.gy = spot.gy;
    p.sync();
    this.tweens.killTweensOf(p.sprite);
    p.sprite.setAngle(0).setAlpha(0);
    this.tweens.add({ targets: p.sprite, alpha: 1, duration: 500 });
    this.hp = this.maxHp;
    this.dead = false;
    this.hurtUntil = this.time.now + 2000;
    this.cameras.main.centerOn(p.sprite.x, p.sprite.y);
    bus.emit('hp', this.hp, this.maxHp);
    bus.emit('respawn');
  }

  freeTileNear(gx, gy) {
    const taken = new Set(this.objects.map((o) => o.gx + ',' + o.gy));
    const tiles = [...this.island.tiles.values()].filter((t) => !taken.has(t.gx + ',' + t.gy));
    tiles.sort((a, b) => Math.hypot(a.gx - gx, a.gy - gy) - Math.hypot(b.gx - gx, b.gy - gy));
    return tiles[0] || null;
  }

  reclaimGrave(grave) {
    for (const [k, n] of Object.entries(grave.items)) this.inventory.add(k, n);
    bus.emit('message', TEXT.graveBack + ' ' + grave.summary() + '.', true);
    this.removeObject(grave);
    this.saveNow();
  }

  // ---------- verhaal, de Kern en de Hoeder ----------

  readNote(n) {
    const first = !this.flags.notes[n];
    this.flags.notes[n] = true;
    bus.emit('sfx', 'note');
    bus.emit('open-story', { title: TEXT.notes[n].title, text: TEXT.notes[n].text });
    if (first) this.objectives.check();
  }

  get sealCount() {
    return Object.values(this.flags.seals).filter(Boolean).length;
  }

  onKern() {
    if (this.boss?.alive) return;
    if (this.flags.bossDefeated) {
      bus.emit('open-prestige');
      return;
    }
    // het hart gaat pas open met alle zegels
    if (this.sealCount < CONFIG.kernSeals) {
      bus.emit('message', `${TEXT.kernSealed} ${this.sealCount}/${CONFIG.kernSeals}.`, true);
      return;
    }
    this.startBoss();
  }

  // Een baas laten opklimmen naast een object (het hart of een altaar)
  spawnBoss(near, key, text) {
    if (this.boss?.alive || this.depth.active) return;
    const spot = [[0, 2], [2, 0], [0, -2], [-2, 0], [1, 1], [1, -1], [-1, 1]].map(([dx, dy]) => ({ gx: near.gx + dx, gy: near.gy + dy }))
      .find((p) => this.island.get(p.gx, p.gy) && !this.objects.some((o) => o.gx === p.gx && o.gy === p.gy))
      || { gx: near.gx, gy: near.gy + 1 };
    this.boss = new Boss(this, spot.gx, spot.gy, key);
    this.night.enemies.push(this.boss);
    bus.emit('sfx', 'roar');
    bus.emit('message', text, true);
    bus.emit('boss-start', { name: this.boss.name });
    bus.emit('boss-hp', this.boss.hp, this.boss.maxHp);
  }

  startBoss() {
    const kern = this.objects.find((o) => o.type === 'kern');
    if (kern) this.spawnBoss(kern, 'hoeder', TEXT.bossStart);
  }

  summonGuardian(altar) {
    const first = !this.flags.seals[altar.boss];
    this.spawnBoss(altar, altar.boss, `${altar.def.name}. ${first ? TEXT.guardianFirst : TEXT.guardianAgain}`);
  }

  onPortal() {
    if (this.depth.active) {
      this.depth.stop('stop');
      return;
    }
    if (!this.flags.bossDefeated) {
      bus.emit('message', TEXT.portalClosed, true);
      return;
    }
    if (this.boss?.alive) return;
    this.depth.start();
  }

  onGuardianDefeated(boss) {
    const def = CONFIG.bewakers[boss.key];
    const first = !this.flags.seals[boss.key];
    this.flags.seals[boss.key] = true;
    this.stats.guardianKills = (this.stats.guardianKills || 0) + 1;
    bus.emit('boss-end');
    this.cameras.main.shake(700, 0.008);
    const p = this.player.sprite;
    let i = 0;
    for (const [k, n] of Object.entries(def.reward)) {
      this.inventory.add(k, n);
      this.collect(k, n);
      bus.emit('float', { wx: p.x, wy: p.y - 120 - i * 26, text: `+${n} ${CONFIG.items[k].name.toLowerCase()}`, color: '#ffd98a' });
      i++;
    }
    if (Math.random() < def.heartChance) {
      this.inventory.add('leegtehart', 1);
      bus.emit('message', TEXT.heartDrop, true);
    }
    this.skills.gain('vechten', 80);
    if (first) bus.emit('message', `${TEXT.sealGained} ${this.sealCount}/${CONFIG.kernSeals}.`, true);
    this.objectives.check();
    this.saveNow();
  }

  // ---------- machines en aambeeld ----------

  collectMachine(m) {
    const n = m.stored;
    if (!n) return;
    this.inventory.add(m.def.item, n);
    this.collect(m.def.item, n);
    m.stored = 0;
    m.draw();
    bus.emit('float', { wx: m.sprite.x, wy: m.topY, text: `+${n} ${CONFIG.items[m.def.item].name.toLowerCase()}`, color: '#e8d6b8' });
    this.saveNow();
  }

  upgradeMachine(m) {
    if (m.tier >= CONFIG.machines.maxTier) return;
    if (!pay(this.inventory, machineUpgradeCost(m))) return;
    m.tier++;
    m.draw();
    this.skills.gain('bouwen', CONFIG.skills.bouwen.xpObject);
    bus.emit('sfx', 'craft');
    bus.emit('message', `${m.def.name} ${TEXT.machineUpgraded} ${m.tier}.`, true);
    this.objectives.check();
    this.saveNow();
  }

  // Factor van versterken (+1 = 10%, enz.)
  upgradeMult(slot) {
    return 1 + (this.upgrades[slot] || 0) * CONFIG.upgrades.per[slot];
  }

  upgradeGear(slot) {
    const level = (this.upgrades[slot] || 0) + 1;
    if (level > CONFIG.upgrades.max) return;
    if ((this.tools[slot] || 0) === 0) return;
    if (!pay(this.inventory, gearUpgradeCost(level))) return;
    this.upgrades[slot] = level;
    bus.emit('sfx', 'craft');
    bus.emit('message', `${CONFIG.tools[slot][this.tools[slot]]} +${level}. ${TEXT.gearUpgraded}`, true);
    this.objectives.check();
    this.saveNow();
  }

  onBossDefeated(boss) {
    if (boss.key && boss.key !== 'hoeder') {
      this.onGuardianDefeated(boss);
      return;
    }
    this.flags.bossDefeated = true;
    this.stats.bossKills = (this.stats.bossKills || 0) + 1;
    bus.emit('boss-end');
    this.cameras.main.shake(1200, 0.01);
    this.cameras.main.flash(900, 220, 200, 255);
    for (const [k, n] of Object.entries(CONFIG.boss.reward)) { this.inventory.add(k, n); this.collect(k, n); }
    this.skills.gain('vechten', 200);
    this.saveNow();
    this.time.delayedCall(1800, () => {
      bus.emit('open-story', { title: TEXT.notes[5].title, text: TEXT.notes[5].text, after: 'prestige' });
      this.flags.notes[5] = true;
      this.objectives.check();
    });
  }

  startNewCycle(bonusId) {
    this.resetting = true;
    startNextCycle(bonusId);
    clearSave();
    window.location.reload();
  }

  onNightStart(n) {
    bus.emit('message', n === 1 ? TEXT.nightFirst : TEXT.nightLabel + ' ' + n + '. ' + pick(TEXT.night), true);
    this.night.start(n);
  }

  onDayStart(d) {
    this.night.end();
    this.stats.nights = Math.max(this.stats.nights || 0, d - 1);
    bus.emit('message', pick(TEXT.dawn), true);
    this.objectives.check();
    this.saveNow();
  }

  upgradeAnchor(a) {
    const cost = CONFIG.anchor.upgradeCost[a.tier + 1];
    if (!cost || !Object.entries(cost).every(([k, n]) => this.inventory.has(k, n))) return;
    for (const [k, n] of Object.entries(cost)) this.inventory.remove(k, n);
    a.upgrade();
    this.skills.gain('bouwen', CONFIG.skills.bouwen.xpObject);
    this.showAnchorRing(a);
    bus.emit('message', TEXT.anchorUpgraded, true);
    this.objectives.check();
    this.saveNow();
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
    bus.emit('sfx', 'craft');
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
    bus.emit('sfx', 'place');
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
      upgrades: this.upgrades,
      skills: this.skills.toJSON(),
      time: this.dayNight.toJSON(),
      crumble: this.crumble.serialize(),
      hp: this.dead ? this.maxHp : Math.round(this.hp * 10) / 10,
      stats: this.stats,
      flags: this.flags,
      world: {
        islands: this.island.serialize(),
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
