// Rugzak: wat je bij je hebt, je gereedschap, en wat je met de hand kunt maken.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { COLORS, textStyle, makeButton } from './style.js';
import { createPanel, itemRow, recipeRow } from './Panel.js';
import { recipesAt, recipeName, recipeIcon, recipeState } from '../systems/Crafting.js';
import { lockedLabel } from './labels.js';
import { getAudio } from '../systems/Audio.js';

export class InventoryPanel {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.inventory = game.inventory;
    this.container = null;
  }

  get isOpen() {
    return !!this.container;
  }

  toggle() {
    if (this.isOpen) this.close(); else this.open();
  }

  rebuild() {
    if (!this.isOpen) return;
    const old = this.container;
    this.container = null;
    this.open();
    this.scene.time.delayedCall(0, () => old.destroy());
  }

  open() {
    if (this.isOpen) return;
    const sc = this.scene;
    const S = sc.S;
    const game = this.game;
    const owned = Object.keys(CONFIG.items).filter((k) => this.inventory.get(k) > 0);
    const tools = Object.keys(CONFIG.tools).filter((k) => game.tools[k] > 0);
    const hand = recipesAt('hand');
    const hasBench = game.countObjects('workbench') > 0;

    const height = Math.max(1, owned.length) * 40 * S
      + (tools.length ? 36 * S + tools.length * 40 * S : 0)
      + 36 * S + hand.length * 50 * S + (hasBench ? 0 : 24 * S)
      + 210 * S;
    const panel = createPanel(sc, { title: TEXT.bagTitle, height: height + 50 * S, onBackdrop: () => this.close(), footer: 190 });
    const { c, px, py, pw, ph, pad } = panel;
    const list = panel.list;
    let y = panel.y;

    const label = (text) => {
      list.add(sc.add.text(px + pad, y, text, textStyle(S, 11, COLORS.dim, { fontStyle: '700', letterSpacing: 1.5 * S })));
      y += 20 * S;
    };

    if (!owned.length) {
      list.add(sc.add.text(px + pad, y + 8 * S, TEXT.bagEmpty, textStyle(S, 14, COLORS.dim, { wordWrap: { width: pw - pad * 2 } })));
      y += 40 * S;
    }
    for (const k of owned) y += itemRow(sc, panel, k, this.inventory.get(k), y);

    if (tools.length) {
      y += 16 * S;
      label(TEXT.toolsTitle);
      for (const k of tools) {
        const tier = game.tools[k];
        const cy = y + 16 * S;
        list.add(sc.add.image(px + pad + 13 * S, cy, `icon_${k}${tier}`).setDisplaySize(28 * S, 28 * S));
        const plus = game.upgrades?.[k] ? ` +${game.upgrades[k]}` : '';
        list.add(sc.add.text(px + pad + 36 * S, cy, CONFIG.tools[k][tier] + plus, textStyle(S, 15)).setOrigin(0, 0.5));
        y += 40 * S;
      }
    }

    y += 16 * S;
    label(TEXT.handTitle);
    for (const r of hand) {
      y += recipeRow(sc, panel, y, {
        icon: recipeIcon(r),
        name: recipeName(r),
        cost: r.cost,
        inventory: this.inventory,
        state: recipeState(game, r),
        onMake: () => { bus.emit('craft', r.id); this.rebuild(); },
        makeButton,
        labels: { make: TEXT.craftMake, owned: TEXT.craftOwned, locked: lockedLabel },
      });
    }
    if (!hasBench) {
      list.add(sc.add.text(px + pad, y + 4 * S, TEXT.moreAtBench, textStyle(S, 12, COLORS.dim)));
      y += 24 * S;
    }
    panel.setContentEnd(y);

    const bw = (pw - pad * 3) / 2;
    const by = py + ph - pad - 22 * S;
    // geluid aan/uit
    const audio = getAudio();
    const onOff = (name, on) => `${name}: ${on ? TEXT.on : TEXT.off}`;
    const b3 = (pw - pad * 4) / 3;
    c.add(makeButton(sc, px + pad + b3 / 2, by - 54 * S, b3, 40 * S, onOff(TEXT.soundMusic, audio.settings.music), (lbl) => {
      audio.setMusic(!audio.settings.music);
      lbl.setText(onOff(TEXT.soundMusic, audio.settings.music));
    }, 10));
    c.add(makeButton(sc, px + pad * 2 + b3 * 1.5, by - 54 * S, b3, 40 * S, onOff(TEXT.soundSfx, audio.settings.sfx), (lbl) => {
      audio.setSfx(!audio.settings.sfx);
      lbl.setText(onOff(TEXT.soundSfx, audio.settings.sfx));
    }, 10));
    // nachten: spannend (wezens) of rustig (niemand komt)
    c.add(makeButton(sc, px + pw / 2, by - 104 * S, pw - pad * 2, 40 * S, `${TEXT.nightsToggle}: ${game.flags.peaceful ? TEXT.nightsCalm : TEXT.nightsWild}`, (lbl) => {
      game.flags.peaceful = !game.flags.peaceful;
      lbl.setText(`${TEXT.nightsToggle}: ${game.flags.peaceful ? TEXT.nightsCalm : TEXT.nightsWild}`);
      game.saveNow();
    }, 11));
    const voiceOn = () => audio.settings.voice !== false;
    c.add(makeButton(sc, px + pad * 3 + b3 * 2.5, by - 54 * S, b3, 40 * S, onOff(TEXT.voiceToggle, voiceOn()), (lbl) => {
      audio.settings.voice = !voiceOn();
      audio.save();
      lbl.setText(onOff(TEXT.voiceToggle, voiceOn()));
    }, 10));
    c.add(sc.add.text(px + pw - pad, py + ph - 6 * S, `versie ${CONFIG.version}`, textStyle(S, 10, COLORS.dim)).setOrigin(1, 1));
    let confirmReset = false;
    c.add(makeButton(sc, px + pad + bw / 2, by, bw, 44 * S, TEXT.reset, (lbl) => {
      if (!confirmReset) {
        confirmReset = true;
        lbl.setText(TEXT.resetConfirm).setColor(COLORS.warn);
      } else {
        bus.emit('reset');
      }
    }, 11));
    c.add(makeButton(sc, px + pad * 2 + bw * 1.5, by, bw, 44 * S, TEXT.close, () => this.close()));

    this.container = c;
  }

  close() {
    if (!this.container) return;
    // pas een frame later weghalen, zodat de tik die sluit niet doorvalt naar de joystick
    const c = this.container;
    this.container = null;
    this.scene.time.delayedCall(0, () => c.destroy());
  }
}
