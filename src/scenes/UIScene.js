// Alles wat over het spel heen ligt: joystick, actieknop, grondstoffen, rugzak, kist, meldingen.
import { CONFIG } from '../config.js';
import { bus } from '../bus.js';
import { controls } from '../controls.js';
import { getDpr, getSafeArea } from '../display.js';
import { Joystick } from '../ui/Joystick.js';
import { ActionButton } from '../ui/ActionButton.js';
import { Toast } from '../ui/Toast.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { ChestPanel } from '../ui/ChestPanel.js';
import { COLORS, textStyle, makeButton, roundedBox, shade } from '../ui/style.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.S = getDpr();
    this.safe = getSafeArea();
    this.gameScene = this.scene.get('Game');
    this.inventory = this.gameScene.inventory;

    this.vignette = this.add.image(0, 0, 'vignette').setOrigin(0).setAlpha(0.75).setDepth(-100);

    this.joystick = new Joystick(this);
    this.action = new ActionButton(this);
    this.action.onPress = () => { controls.actionQueued = true; };
    this.action.setLabel(this.gameScene.target?.label ?? null);
    this.toast = new Toast(this);
    this.panel = new InventoryPanel(this, this.inventory);
    this.chestPanel = new ChestPanel(this, this.inventory, this.gameScene.chestStore);

    this.bagButton = makeButton(this, 0, 0, 104 * this.S, 40 * this.S, 'RUGZAK', () => this.togglePanel(), 12);
    this.resBar = null;
    this.buildResources();

    // Eén plek die bepaalt wat een aanraking doet: knop, object in de wereld, of joystick
    this.input.on('pointerdown', (pointer, over) => {
      if (over.length || this.anyPanelOpen()) return;
      if (this.tryWorldTap(pointer)) return;
      if (this.joystick.inZone(pointer)) this.joystick.start(pointer);
    });

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E');
    this.input.keyboard.on('keydown-I', () => this.togglePanel());
    this.input.keyboard.on('keydown-ESC', () => { this.panel.close(); this.chestPanel.close(); });

    const onTarget = (label) => this.action.setLabel(label);
    const onMessage = (text, urgent) => this.toast.show(text, urgent);
    const onFloat = (f) => this.floatText(f);
    const onOpenChest = () => this.openChest();
    const onChange = (key) => this.buildResources(key);
    bus.on('target', onTarget);
    bus.on('message', onMessage);
    bus.on('float', onFloat);
    bus.on('open-chest', onOpenChest);
    this.inventory.on('change', onChange);

    // als je de app wegklikt, geen vastzittende knoppen bij terugkomst
    const onHide = () => { this.joystick.release(); this.action.release(); };
    document.addEventListener('visibilitychange', onHide);

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => {
      bus.off('target', onTarget);
      bus.off('message', onMessage);
      bus.off('float', onFloat);
      bus.off('open-chest', onOpenChest);
      this.inventory.off('change', onChange);
      document.removeEventListener('visibilitychange', onHide);
      this.scale.off('resize', this.layout, this);
    });

    this.layout();
  }

  anyPanelOpen() {
    return this.panel.isOpen || this.chestPanel.isOpen;
  }

  layout() {
    const { width: w, height: h } = this.scale;
    this.safe = getSafeArea();
    const S = this.S;
    this.vignette.setDisplaySize(w, h);
    this.joystick.layout(w, h, this.safe);
    this.action.layout(w, h, this.safe);
    this.toast.layout(w, h, this.safe);
    this.bagButton.setPosition(w - this.safe.right - 16 * S - 52 * S, this.safe.top + 16 * S + 20 * S);
    this.resBar?.setPosition(this.safe.left + 16 * S, this.safe.top + 36 * S);
    if (this.panel.isOpen) this.panel.close();
    if (this.chestPanel.isOpen) this.chestPanel.close();
  }

  togglePanel() {
    if (this.chestPanel.isOpen) return;
    this.panel.toggle();
    this.joystick.release();
    this.action.release();
  }

  openChest() {
    this.panel.close();
    this.joystick.release();
    this.action.release();
    this.chestPanel.open();
  }

  // Tik op een object in de wereld (boom, kist): daarheen lopen en gebruiken
  tryWorldTap(pointer) {
    const cam = this.gameScene.cameras.main;
    const p = cam.getWorldPoint(pointer.x, pointer.y);
    const obj = this.gameScene.objectAt(p.x, p.y);
    if (!obj) return false;
    bus.emit('tap-object', obj);
    return true;
  }

  // Grondstoffen linksboven. Wrakhout altijd, de rest zodra je het hebt.
  buildResources(changedKey) {
    const S = this.S;
    this.resBar?.destroy();
    const c = this.add.container(this.safe.left + 16 * S, this.safe.top + 36 * S);
    const items = [];
    let x = 12 * S;
    for (const k of Object.keys(CONFIG.items)) {
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
    controls.action = this.action.held || k.SPACE.isDown || k.E.isDown;
  }
}
