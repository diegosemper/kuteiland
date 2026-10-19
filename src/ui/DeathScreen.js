// Kort zwart scherm als je valt, met wat je achterliet.
import { TEXT } from '../texts.js';
import { COLORS, storyStyle, textStyle } from './style.js';

export class DeathScreen {
  constructor(scene) {
    this.scene = scene;
    this.c = null;
  }

  show({ lost, lostOld, fainted }) {
    const sc = this.scene;
    const S = sc.S;
    const { width: w, height: h } = sc.scale;
    this.c?.destroy();
    const c = sc.add.container(0, 0).setDepth(200).setAlpha(0);
    c.add(sc.add.rectangle(0, 0, w, h, 0x050208, 0.88).setOrigin(0).setInteractive());
    c.add(sc.add.text(w / 2, h * 0.38, fainted ? TEXT.faintTitle : TEXT.deathTitle, storyStyle(S, 28, '#ece3f7')).setOrigin(0.5));
    const lines = [];
    if (fainted) lines.push(TEXT.fainted);
    else if (lost) lines.push(`${TEXT.deathLost} ${lost}.`, TEXT.deathReturn);
    else lines.push(TEXT.deathNothing);
    if (lostOld) lines.push(TEXT.deathOldLost);
    c.add(sc.add.text(w / 2, h * 0.38 + 46 * S, lines.join('\n'),
      textStyle(S, 14, COLORS.dim, { align: 'center', wordWrap: { width: w - 60 * S }, lineSpacing: 6 * S })).setOrigin(0.5, 0));
    sc.tweens.add({ targets: c, alpha: 1, duration: 500 });
    this.c = c;
  }

  hide() {
    const c = this.c;
    if (!c) return;
    this.c = null;
    this.scene.tweens.add({ targets: c, alpha: 0, duration: 600, onComplete: () => c.destroy() });
  }
}
