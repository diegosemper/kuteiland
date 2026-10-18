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
import { recipeName } from '../systems/Crafting.js';
import { COLORS, textStyle, makeButton, roundedBox, shade } from '../ui/style.js';

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

    this.bagButton = makeButton(this, 0, 0, 104 * this.S, 40 * this.S, 'RUGZAK', () => this.togglePanel(), 12);
    this.resBar = null;
    this.buildResources();

    // Eén plek die bepaalt wat een aanraking doet: knop, bouwen, object in de wereld, of joystick
    this.input.on('pointerdown', (pointer, over) => {
      if (over.length || this.anyPanelOpen()) return;
      if (this.buildBar.active) {
        if (this.tryPlace(pointer)) return;
      } else if (this.tryWorldTap(pointer)) {
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
      'objective': (o) => this.objective.set(o),
      'build-changed': (state) => this.onBuildChanged(state),
      'crafted': (r) => this.onCrafted(r),
    };
    for (const [ev, fn] of Object.entries(handlers)) bus.on(ev, fn);
    const onChange = (key) => this.buildResources(key);
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
    return this.panel.isOpen || this.chestPanel.isOpen || this.craftPanel.isOpen;
  }

  closeAll() {
    this.panel.close();
    this.chestPanel.close();
    this.craftPanel.close();
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
    // bouwknop schuin boven de actieknop
    const ax = this.action.circle.x, ay = this.action.circle.y;
    this.buildButton.setPosition(ax - this.action.R * 1.05, ay - this.action.R * 1.75);
    this.bagButton.setPosition(w - this.safe.right - 16 * S - 52 * S, this.safe.top + 16 * S + 20 * S);
    this.resBar?.setPosition(this.safe.left + 16 * S, this.safe.top + 36 * S);
    this.closeAll();
    this.buildBar.render();
  }

  togglePanel() {
    if (this.chestPanel.isOpen || this.craftPanel.isOpen) return;
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
    this.joystick.setVisible(!on);
    if (on) this.action.release();
  }

  onCrafted(r) {
    const p = this.gameScene.player.sprite;
    this.floatText({ wx: p.x, wy: p.y - 110, text: `+ ${recipeName(r)}`, color: '#efe3c8' });
    this.panel.rebuild();
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
    const k = this.keys;
    let kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (kx && ky) { kx *= Math.SQRT1_2; ky *= Math.SQRT1_2; }

    if (this.anyPanelOpen()) {
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
