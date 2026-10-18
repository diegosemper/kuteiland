// Levens als hartjes (2 levens per hartje), linksboven onder de grondstoffen.
export class HeartsHud {
  constructor(scene) {
    this.scene = scene;
    this.c = scene.add.container(0, 0).setDepth(10);
    this.shown = '';
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.c.setPosition(safe.left + 26 * S, safe.top + 72 * S);
  }

  set(hp, maxHp) {
    const halves = Math.max(0, Math.ceil(hp));
    const sig = `${halves}/${maxHp}`;
    if (sig === this.shown) return;
    const lost = this.shown && halves < Number(this.shown.split('/')[0]);
    this.shown = sig;
    const S = this.scene.S;
    this.c.removeAll(true);
    const hearts = Math.ceil(maxHp / 2);
    for (let i = 0; i < hearts; i++) {
      const left = halves - i * 2;
      const key = left >= 2 ? 'heart_full' : left === 1 ? 'heart_half' : 'heart_empty';
      this.c.add(this.scene.add.image(i * 22 * S, 0, key).setDisplaySize(20 * S, 20 * S));
    }
    if (lost) {
      this.scene.tweens.add({ targets: this.c, x: this.c.x + 4 * S, duration: 50, yoyo: true, repeat: 2 });
    }
  }
}
