// Het huidige doel, linksboven onder de grondstoffen.
import { TEXT } from '../texts.js';
import { COLORS, textStyle, shade } from './style.js';

export class ObjectiveHud {
  constructor(scene) {
    this.scene = scene;
    const S = scene.S;
    this.label = shade(scene.add.text(0, 0, TEXT.objectiveLabel,
      textStyle(S, 10, COLORS.dim, { fontStyle: '700', letterSpacing: 1.5 * S })), S);
    this.text = shade(scene.add.text(0, 0, '', textStyle(S, 13, COLORS.text)), S);
    this.c = scene.add.container(0, 0, [this.label, this.text]).setDepth(10);
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.c.setPosition(safe.left + 22 * S, safe.top + 96 * S);
    this.label.setPosition(0, 0);
    this.text.setPosition(0, 14 * S).setWordWrapWidth(w * 0.62);
  }

  set({ text, progress, advanced }) {
    this.text.setText(progress ? `${text}  ${progress}` : text);
    if (advanced) {
      this.c.setAlpha(0);
      this.scene.tweens.add({ targets: this.c, alpha: 1, duration: 600, delay: 400 });
    }
  }
}
