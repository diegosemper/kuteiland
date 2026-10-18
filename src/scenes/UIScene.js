// Alles wat over het spel heen ligt: joystick, knoppen, grondstoffen, doelen, panelen, meldingen.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { controls } from '../controls.js';
import { getDpr, getSafeArea } from '../display.js';
import { Joystick } from '../ui/Joystick.js';
import { ActionButton } from '../ui/ActionButton.js';
import { Toast } from '../ui/Toast.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { ChestPanel } from '../ui/ChestPanel.js';
import { CraftPanel } from '../ui/CraftPanel.js';
import { BuildBar } from '../ui/BuildBar.js';
import { ObjectiveHud } from '../ui/ObjectiveHud.js';
import { SkillsPanel } from '../ui/SkillsPanel.js';
import { SkillXpBar } from '../ui/SkillXpBar.js';
import { NightOverlay } from '../ui/NightOverlay.js';
import { HeartsHud } from '../ui/HeartsHud.js';
import { ClockHud } from '../ui/ClockHud.js';
import { DeathScreen } from '../ui/DeathScreen.js';
import { AnchorPanel } from '../ui/AnchorPanel.js';
import { StoryPanel } from '../ui/StoryPanel.js';
import { MapPanel } from '../ui/MapPanel.js';
import { PrestigePanel } from '../ui/PrestigePanel.js';
import { BossBar } from '../ui/BossBar.js';
import { MachinePanel } from '../ui/MachinePanel.js';
import { AnvilPanel } from '../ui/AnvilPanel.js';
import { recipeName } from '../systems/Crafting.js';
import { COLORS, textStyle, makeButton, roundedBox, shade } from '../ui/style.js';
import { pick } from '../texts.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.S = getDpr();
    this.safe = getSafeArea();
    const game = this.gameScene = this.scene.get('Game');
    this.inventory = game.inventory;

    this.vignette = this.add.image(0, 0, 'vignette').setOrigin(0).setAlpha(0.75).setDepth(-100);
    this.nightOverlay = new NightOverlay(this);
    this.hearts = new HeartsHud(this);
    this.hearts.set(game.hp, game.maxHp);
    this.clock = new ClockHud(this);
    this.deathScreen = new DeathScreen(this);

    this.joystick = new Joystick(this);
    this.action = new ActionButton(this);
    this.action.onPress = () => { controls.actionQueued = true; };
    this.action.setLabel(game.target?.label ?? null);
    this.buildButton = this.makeRoundButton(TEXT.build, () => bus.emit('build-open'));
    this.toast = new Toast(this);
    this.objective = new ObjectiveHud(this);
    this.objective.set(game.objectives.describe());
    this.panel = new InventoryPanel(this, game);
    this.chestPanel = new ChestPanel(this, this.inventory, game.chestStore);
    this.craftPanel = new CraftPanel(this, game);
    this.buildBar = new BuildBar(this);
    this.skillsPanel = new SkillsPanel(this, game);
    this.anchorPanel = new AnchorPanel(this, game);
    this.storyPanel = new StoryPanel(this);
    this.mapPanel = new MapPanel(this, game);
    this.prestigePanel = new PrestigePanel(this);
    this.bossBar = new BossBar(this);
    this.machinePanel = new MachinePanel(this, game);
    this.anvilPanel = new AnvilPanel(this, game);
    this.mapButton = this.makeRoundButton(TEXT.mapButton, () => this.openPanel(this.mapPanel));
    this.xpBar = new SkillXpBar(this);

    this.bagButton = makeButton(this, 0, 0, 104 * this.S, 40 * this.S, 'RUGZAK', () => this.togglePanel(), 12);
    this.skillsButton = makeButton(this, 0, 0, 104 * this.S, 36 * this.S, TEXT.skillsButton, () => this.openPanel(this.skillsPanel), 11);
    this.resBar = null;
    this.buildResources();

    // Eén plek die bepaalt wat een aanraking doet: knop, bouwen, object in de wereld, of joystick
    this.input.on('pointerdown', (pointer, over) => {
      if (over.length || this.anyPanelOpen()) return;
      if (this.buildBar.active) {
        if (this.tryPlace(pointer)) return;
      } else if (this.tryDriftTap(pointer) || this.tryWorldTap(pointer)) {
        return;
      }
      if (this.joystick.inZone(pointer)) this.joystick.start(pointer);
    });

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E');
    this.input.keyboard.on('keydown-I', () => this.togglePanel());
    this.input.keyboard.on('keydown-B', () => bus.emit(this.buildBar.active ? 'build-close' : 'build-open'));
    this.input.keyboard.on('keydown-ESC', () => this.closeAll());

    const handlers = {
      'target': (label) => this.action.setLabel(label),
      'message': (text, urgent) => this.toast.show(text, urgent),
      'float': (f) => this.floatText(f),
      'open-chest': () => this.openPanel(this.chestPanel),
      'open-craft': () => this.openPanel(this.craftPanel),
      'open-anchor': (a) => { this.anchorPanel.anchor = a; this.openPanel(this.anchorPanel); },
      'open-story': (st) => { this.closeAll(); this.joystick.release(); this.action.release(); this.storyPanel.open(st); },
      'open-prestige': () => this.openPanel(this.prestigePanel),
      'boss-start': (b) => this.bossBar.show(b?.name),
      'open-machine': (m) => { this.machinePanel.machine = m; this.openPanel(this.machinePanel); },
      'open-anvil': () => this.openPanel(this.anvilPanel),
      'boss-hp': (hp, max) => this.bossBar.set(hp, max),
      'boss-end': () => this.bossBar.hide(),
      'objective': (o) => this.objective.set(o),
      'build-changed': (state) => this.onBuildChanged(state),
      'crafted': (r) => this.onCrafted(r),
      'skill-xp': (x) => this.xpBar.show(x),
      'skill-up': (u) => this.onSkillUp(u),
      'milestone': (m) => this.onMilestone(m),
      'collection-up': (cu) => this.onCollectionUp(cu),
      'hp': (hp, max) => this.hearts.set(hp, max),
      'hurt': () => this.flashHurt(),
      'player-died': (info) => { this.closeAll(); this.joystick.release(); this.action.release(); this.deathScreen.show(info); },
      'respawn': () => this.deathScreen.hide(),
      'minigame-start': () => { this.closeAll(); this.joystick.release(); this.action.release(); },
    };
    for (const [ev, fn] of Object.entries(handlers)) bus.on(ev, fn);
    let lastPickup = 0;
    const onChange = (key, n, diff) => {
      this.buildResources(key);
      // geluidje bij iets erbij krijgen (niet bij bouwen of craften)
      if (diff > 0 && CONFIG.items[key]?.resource && this.time.now - lastPickup > 120) {
        lastPickup = this.time.now;
        bus.emit('sfx', 'pickup');
      }
    };
    this.inventory.on('change', onChange);

    // als je de app wegklikt, geen vastzittende knoppen bij terugkomst
    const onHide = () => { this.joystick.release(); this.action.release(); };
    document.addEventListener('visibilitychange', onHide);

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => {
      for (const [ev, fn] of Object.entries(handlers)) bus.off(ev, fn);
      this.inventory.off('change', onChange);
      document.removeEventListener('visibilitychange', onHide);
      this.scale.off('resize', this.layout, this);
    });

    this.layout();
  }

  makeRoundButton(label, onTap) {
    const S = this.S;
    const R = CONFIG.ui.buildRadius * S;
    const circle = this.add.circle(0, 0, R, COLORS.button, 0.7).setStrokeStyle(1.5 * S, COLORS.accent, 0.45);
    const text = shade(this.add.text(0, 0, label, textStyle(S, 11, COLORS.text, { fontStyle: '700' })).setOrigin(0.5), S);
    const zone = this.add.zone(0, 0, R * 2.4, R * 2.4).setInteractive();
    const c = this.add.container(0, 0, [circle, text, zone]);
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: c, scale: 0.9, duration: 60, yoyo: true });
      onTap();
    });
    return c;
  }

  anyPanelOpen() {
    return this.panels().some((p) => p.isOpen);
  }

  panels() {
    return [this.panel, this.chestPanel, this.craftPanel, this.skillsPanel, this.anchorPanel,
      this.storyPanel, this.mapPanel, this.prestigePanel, this.machinePanel, this.anvilPanel];
  }

  closeAll() {
    this.panel.close();
    this.chestPanel.close();
    this.craftPanel.close();
    this.skillsPanel.close();
    this.anchorPanel.close();
    this.mapPanel.close();
    this.prestigePanel.close();
    this.machinePanel.close();
    this.anvilPanel.close();
  }

  openPanel(p) {
    if (this.buildBar.active) bus.emit('build-close');
    this.closeAll();
    this.joystick.release();
    this.action.release();
    p.open();
  }

  layout() {
    const { width: w, height: h } = this.scale;
    this.safe = getSafeArea();
    const S = this.S;
    this.vignette.setDisplaySize(w, h);
    this.joystick.layout(w, h, this.safe);
    this.action.layout(w, h, this.safe);
    this.toast.layout(w, h, this.safe);
    this.objective.layout(w, h, this.safe);
    this.xpBar.layout(w, h, this.safe);
    this.nightOverlay.layout(w, h);
    this.hearts.layout(w, h, this.safe);
    this.clock.layout(w, h, this.safe);
    // bouwknop schuin boven de actieknop
    const ax = this.action.circle.x, ay = this.action.circle.y;
    this.buildButton.setPosition(ax - this.action.R * 1.05, ay - this.action.R * 1.75);
    this.mapButton.setPosition(ax - this.action.R * 1.05 - CONFIG.ui.buildRadius * S * 2.4, ay - this.action.R * 1.75);
    this.bossBar.layout(w, h, this.safe);
    this.bagButton.setPosition(w - this.safe.right - 16 * S - 52 * S, this.safe.top + 16 * S + 20 * S);
    this.skillsButton.setPosition(w - this.safe.right - 16 * S - 52 * S, this.safe.top + 16 * S + 20 * S + 48 * S);
    this.resBar?.setPosition(this.safe.left + 16 * S, this.safe.top + 36 * S);
    this.closeAll();
    this.buildBar.render();
  }

  togglePanel() {
    if (this.panels().some((p) => p !== this.panel && p.isOpen)) return;
    if (this.buildBar.active) bus.emit('build-close');
    this.panel.toggle();
    this.joystick.release();
    this.action.release();
  }

  onBuildChanged(state) {
    this.buildBar.update(state);
    const on = state.active;
    this.action.circle.setVisible(!on);
    this.action.ring.setVisible(!on);
    this.action.text.setVisible(!on);
    this.action.zone.input.enabled = !on;
    this.buildButton.setVisible(!on);
    this.buildButton.list[2].input.enabled = !on;
    this.mapButton.setVisible(!on);
    this.mapButton.list[2].input.enabled = !on;
    this.joystick.setVisible(!on);
    if (on) this.action.release();
  }

  onCrafted(r) {
    const p = this.gameScene.player.sprite;
    this.floatText({ wx: p.x, wy: p.y - 110, text: `+ ${recipeName(r)}`, color: '#efe3c8' });
    this.panel.rebuild();
  }

  onSkillUp({ id, level }) {
    bus.emit('sfx', 'levelUp');
    const p = this.gameScene.player.sprite;
    const name = CONFIG.skills[id].name.toUpperCase();
    this.floatText({ wx: p.x, wy: p.y - 150, text: `${name} ${level}`, color: '#ffd98a' });
    this.toast.show(`${CONFIG.skills[id].name} ${level}. ${pick(TEXT.skillUp[id])}`, true);
  }

  flashHurt() {
    this.tweens.killTweensOf(this.vignette);
    this.vignette.setTint(0xff2030).setAlpha(1);
    this.tweens.add({
      targets: this.vignette, alpha: 0.75, duration: 450,
      onComplete: () => this.vignette.clearTint(),
    });
  }

  onMilestone({ id, level, text }) {
    const p = this.gameScene.player.sprite;
    this.time.delayedCall(1200, () => {
      this.floatText({ wx: p.x, wy: p.y - 170, text: `${TEXT.milestone}!`, color: '#d9c2ff' });
      this.toast.show(`${CONFIG.skills[id].name} ${level}: ${text}`, true);
    });
  }

  onCollectionUp({ id, tier, reward }) {
    const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    const name = id === 'wezens' ? TEXT.collectionKills : CONFIG.items[id].name;
    const what = reward.recipe
      ? `${TEXT.collectionUnlocked}: ${CONFIG.items[reward.recipe]?.name || reward.recipe}`
      : reward.text;
    bus.emit('sfx', 'levelUp');
    const p = this.gameScene.player.sprite;
    this.floatText({ wx: p.x, wy: p.y - 160, text: `${name.toUpperCase()} ${ROMAN[tier]}`, color: '#ffd98a' });
    this.toast.show(`${TEXT.collectionWord} ${name} ${ROMAN[tier]}. ${what}.`, true);
    this.panel.rebuild();
  }

  // Tik op drijvend wrak
  tryDriftTap(pointer) {
    const p = this.worldPoint(pointer);
    const it = this.gameScene.driftAt(p.x, p.y);
    if (!it) return false;
    bus.emit('tap-drift', it);
    return true;
  }

  worldPoint(pointer) {
    return this.gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }

  // Tik op een object in de wereld (boom, kist, werkbank): daarheen lopen en gebruiken
  tryWorldTap(pointer) {
    const p = this.worldPoint(pointer);
    const obj = this.gameScene.objectAt(p.x, p.y);
    if (!obj) return false;
    bus.emit('tap-object', obj);
    return true;
  }

  tryPlace(pointer) {
    const p = this.worldPoint(pointer);
    return this.gameScene.build.tryPlaceAt(p.x, p.y);
  }

  // Grondstoffen linksboven. Wrakhout altijd, de rest zodra je het hebt.
  buildResources(changedKey) {
    const S = this.S;
    this.resBar?.destroy();
    const c = this.add.container(this.safe.left + 16 * S, this.safe.top + 36 * S);
    const items = [];
    let x = 12 * S;
    for (const [k, def] of Object.entries(CONFIG.items)) {
      if (!def.resource) continue;
      const n = this.inventory.get(k);
      if (n <= 0 && k !== 'wrakhout') continue;
      const icon = this.add.image(x + 12 * S, 0, `icon_${k}`).setDisplaySize(26 * S, 26 * S);
      const t = shade(this.add.text(x + 28 * S, 0, String(n), textStyle(S, 16, COLORS.text, { fontStyle: '700' })).setOrigin(0, 0.5), S);
      items.push(icon, t);
      if (k === changedKey) {
        const sx = icon.scaleX, sy = icon.scaleY;
        this.tweens.add({ targets: icon, scaleX: sx * 1.3, scaleY: sy * 1.3, duration: 90, yoyo: true });
        this.tweens.add({ targets: t, scale: 1.25, duration: 90, yoyo: true });
      }
      x += 28 * S + t.width + 16 * S;
    }
    const bg = roundedBox(this, x, 40 * S, { fill: 0x0c0812, alpha: 0.55, edgeAlpha: 0.12, radius: 20 });
    bg.setPosition(x / 2, 0);
    c.add([bg, ...items]);
    const maxW = this.scale.width - this.safe.left - this.safe.right - 16 * S - 104 * S - 28 * S;
    if (x > maxW) c.setScale(maxW / x);
    this.resBar = c;
  }

  // Tekstje dat omhoog zweeft op een plek in de wereld
  floatText({ wx, wy, text, color }) {
    const cam = this.gameScene.cameras.main;
    const x = (wx - cam.worldView.x) * cam.zoom;
    const y = (wy - cam.worldView.y) * cam.zoom;
    const S = this.S;
    const t = shade(this.add.text(x, y, text, textStyle(S, 14, color || COLORS.text, { fontStyle: '700' })), S)
      .setOrigin(0.5, 1).setDepth(40);
    this.tweens.add({
      targets: t,
      y: y - 44 * S,
      alpha: { from: 1, to: 0 },
      duration: 1200,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  update() {
    this.nightOverlay.update(this.gameScene);
    this.clock.update(this.gameScene.dayNight, this.gameScene.depth);

    const k = this.keys;
    let kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (kx && ky) { kx *= Math.SQRT1_2; ky *= Math.SQRT1_2; }

    if (this.anyPanelOpen() || this.gameScene.dead) {
      controls.move.x = 0;
      controls.move.y = 0;
      controls.action = false;
      controls.actionQueued = false;
      return;
    }

    const j = this.joystick.vector;
    const useStick = j.x !== 0 || j.y !== 0;
    controls.move.x = useStick ? j.x : kx;
    controls.move.y = useStick ? j.y : ky;
    controls.action = !this.buildBar.active && (this.action.held || k.SPACE.isDown || k.E.isDown);
  }
}
