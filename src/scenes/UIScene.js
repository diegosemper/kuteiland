// Alles wat over het spel heen ligt: joystick, actieknop, grondstoffen, rugzak, meldingen.
import { CONFIG } from '../config.js';
import { bus } from '../bus.js';
import { controls } from '../controls.js';
import { getDpr, getSafeArea } from '../display.js';
import { Joystick } from '../ui/Joystick.js';
import { ActionButton } from '../ui/ActionButton.js';
import { Toast } from '../ui/Toast.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { COLORS, textStyle, makeButton } from '../ui/style.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.S = getDpr();
    this.safe = getSafeArea();
    this.gameScene = this.scene.get('Game');
    this.inventory = this.gameScene.inventory;

    this.joystick = new Joystick(this);
    this.action = new ActionButton(this);
    this.action.onPress = () => { controls.actionQueued = true; };
    this.action.setLabel(this.gameScene.target?.label ?? null);
    this.toast = new Toast(this);
    this.panel = new InventoryPanel(this, this.inventory);

    this.bagButton = makeButton(this, 0, 0, 100 * this.S, 38 * this.S, 'RUGZAK', () => this.togglePanel());
    this.resBar = null;
    this.buildResources();

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E');
    this.input.keyboard.on('keydown-I', () => this.togglePanel());
    this.input.keyboard.on('keydown-ESC', () => this.panel.close());

    const onTarget = (label) => this.action.setLabel(label);
    const onMessage = (text) => this.toast.show(text);
    const onFloat = (f) => this.floatText(f);
    const onChange = (key) => this.buildResources(key);
    bus.on('target', onTarget);
    bus.on('message', onMessage);
    bus.on('float', onFloat);
    this.inventory.on('change', onChange);

    // als je de app wegklikt, geen vastzittende knoppen bij terugkomst
    const onHide = () => { this.joystick.release(); this.action.release(); };
    document.addEventListener('visibilitychange', onHide);

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => {
      bus.off('target', onTarget);
      bus.off('message', onMessage);
      bus.off('float', onFloat);
      this.inventory.off('change', onChange);
      document.removeEventListener('visibilitychange', onHide);
      this.scale.off('resize', this.layout, this);
    });

    this.layout();
  }

  layout() {
    const { width: w, height: h } = this.scale;
    this.safe = getSafeArea();
    const S = this.S;
    this.joystick.layout(w, h, this.safe);
    this.action.layout(w, h, this.safe);
    this.toast.layout(w, h, this.safe);
    this.bagButton.setPosition(w - this.safe.right - 16 * S - 50 * S, this.safe.top + 16 * S + 19 * S);
    this.resBar?.setPosition(this.safe.left + 16 * S, this.safe.top + 16 * S + 19 * S);
    if (this.panel.isOpen) {
      this.panel.close();
    }
  }

  togglePanel() {
    this.panel.toggle();
    this.joystick.release();
    this.action.release();
  }

  // Grondstoffen linksboven. Wrakhout altijd, de rest zodra je het hebt.
  buildResources(changedKey) {
    const S = this.S;
    this.resBar?.destroy();
    const c = this.add.container(this.safe.left + 16 * S, this.safe.top + 35 * S);
    let x = 0;
    for (const [k, def] of Object.entries(CONFIG.items)) {
      const n = this.inventory.get(k);
      if (n <= 0 && k !== 'wrakhout') continue;
      const icon = this.add.rectangle(x, 0, 14 * S, 14 * S, Phaser.Display.Color.HexStringToColor(def.color).color)
        .setOrigin(0, 0.5)
        .setStrokeStyle(S, 0x000000, 0.6);
      const t = this.add.text(x + 21 * S, 0, String(n), textStyle(S, 15, COLORS.text, {
        stroke: '#0b0612', strokeThickness: Math.round(3 * S),
      })).setOrigin(0, 0.5);
      c.add([icon, t]);
      if (k === changedKey) {
        this.tweens.add({ targets: [t, icon], scale: 1.3, duration: 90, yoyo: true });
      }
      x += 21 * S + t.width + 16 * S;
    }
    this.resBar = c;
  }

  // Tekstje dat omhoog zweeft op een plek in de wereld
  floatText({ wx, wy, text, color }) {
    const cam = this.gameScene.cameras.main;
    const x = (wx - cam.worldView.x) * cam.zoom;
    const y = (wy - cam.worldView.y) * cam.zoom;
    const S = this.S;
    const t = this.add.text(x, y, text, textStyle(S, 13, color || COLORS.text, {
      stroke: '#0b0612', strokeThickness: Math.round(3 * S),
    })).setOrigin(0.5, 1).setDepth(40);
    this.tweens.add({
      targets: t,
      y: y - 36 * S,
      alpha: { from: 1, to: 0 },
      duration: 1100,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  update() {
    const k = this.keys;
    let kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (kx && ky) { kx *= Math.SQRT1_2; ky *= Math.SQRT1_2; }

    if (this.panel.isOpen) {
      controls.move.x = 0;
      controls.move.y = 0;
      controls.action = false;
      controls.actionQueued = false;
      this.joystick.enabled = false;
      return;
    }
    this.joystick.enabled = true;

    const j = this.joystick.vector;
    const useStick = j.x !== 0 || j.y !== 0;
    controls.move.x = useStick ? j.x : kx;
    controls.move.y = useStick ? j.y : ky;
    controls.action = this.action.held || k.SPACE.isDown || k.E.isDown;
  }
}
