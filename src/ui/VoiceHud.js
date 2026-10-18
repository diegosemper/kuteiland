// Hoe De Stem in beeld komt: een paars oog dat opengaat en tekst die letter voor letter verschijnt.
// Staat net boven de knoppen onderin, zodat de gewone meldingen bovenin vrij blijven.
import { VOICE } from '../voice.js';
import { textStyle, storyStyle, shade, roundedBox } from './style.js';

export class VoiceHud {
  constructor(scene) {
    this.scene = scene;
    const S = scene.S;
    this.c = scene.add.container(0, 0).setDepth(45).setAlpha(0);
    this.box = roundedBox(scene, 10, 10, { fill: 0x12081e, alpha: 0.82, edge: 0x9b6bff, edgeAlpha: 0.5, radius: 14 });
    this.eye = scene.add.image(0, 0, 'voice_eye').setDisplaySize(34 * S, 22 * S);
    this.name = scene.add.text(0, 0, VOICE.name, textStyle(S, 9, '#b48cff', { fontStyle: '800', letterSpacing: 2 * S }));
    this.text = shade(scene.add.text(0, 0, '', storyStyle(S, 14, '#e2d0ff', { wordWrap: { width: 100 } })), S);
    this.c.add([this.box, this.eye, this.name, this.text]);
    this.timer = null;
    this.queue = [];
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.w = Math.min(w - 32 * S, 380 * S);
    this.x = w / 2;
    this.y = h - safe.bottom - 300 * S;
    this.text.setWordWrapWidth(this.w - 70 * S);
  }

  show(line) {
    if (this.busy) {
      if (this.queue.length < 2) this.queue.push(line);
      return;
    }
    this.busy = true;
    const S = this.scene.S;
    const sc = this.scene;
    // eerst de volledige tekst neerzetten om de hoogte te weten
    this.text.setText(line);
    const h = Math.max(54 * S, this.text.height + 30 * S);
    this.box.destroy();
    this.box = roundedBox(sc, this.w, h, { fill: 0x12081e, alpha: 0.82, edge: 0x9b6bff, edgeAlpha: 0.5, radius: 14 });
    this.c.addAt(this.box, 0);
    const left = -this.w / 2;
    this.eye.setPosition(left + 26 * S, 0);
    this.name.setPosition(left + 52 * S, -h / 2 + 7 * S);
    this.text.setPosition(left + 52 * S, -h / 2 + 20 * S);
    this.c.setPosition(this.x, this.y - h / 2);
    this.text.setText('');
    sc.tweens.killTweensOf(this.c);
    this.c.setAlpha(0);
    sc.tweens.add({ targets: this.c, alpha: 1, duration: 250 });
    // oog gaat open
    this.eye.setScale(this.eye.scaleX, 0.05);
    sc.tweens.add({ targets: this.eye, scaleY: (22 * S) / this.eye.height, duration: 300, ease: 'Back.easeOut' });
    // letter voor letter
    let i = 0;
    this.timer?.remove();
    this.timer = sc.time.addEvent({
      delay: 28, repeat: line.length - 1,
      callback: () => { i++; this.text.setText(line.slice(0, i)); },
    });
    sc.time.delayedCall(line.length * 28 + 2600 + line.length * 25, () => this.hide());
  }

  hide() {
    const sc = this.scene;
    sc.tweens.add({
      targets: this.c, alpha: 0, duration: 400,
      onComplete: () => {
        this.busy = false;
        const next = this.queue.shift();
        if (next) sc.time.delayedCall(500, () => this.show(next));
      },
    });
  }
}
