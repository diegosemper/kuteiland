// De nacht op het scherm: in de bouwfase een balk onderin met wat je kunt neerzetten (en een KLAAR-knop),
// tijdens het gevecht een teller met de golf en hoeveel wezens er nog zijn.
import { CONFIG } from '../config.js';
import { TEXT } from '../texts.js';
import { COLORS, textStyle, makeButton, roundedBox, shade } from './style.js';

export class SiegeHud {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    const S = scene.S;
    this.title = shade(scene.add.text(0, 0, '', textStyle(S, 22, '#ffd98a', { fontStyle: '900', letterSpacing: 2 * S })).setOrigin(0.5, 0), S).setDepth(30).setVisible(false);
    this.sub = shade(scene.add.text(0, 0, '', textStyle(S, 12, COLORS.text, { align: 'center' })).setOrigin(0.5, 0), S).setDepth(30).setVisible(false);
    this.waveText = shade(scene.add.text(0, 0, '', textStyle(S, 13, '#ff9a9a', { fontStyle: '800' })).setOrigin(0.5, 0), S).setDepth(30).setVisible(false);
    this.bar = null;
    this.state = 'idle';
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.title.setPosition(w / 2, safe.top + 222 * S);
    this.sub.setPosition(w / 2, safe.top + 252 * S);
    this.waveText.setPosition(w / 2, safe.top + 222 * S);
    this.w = w; this.h = h; this.safe = safe;
    if (this.state === 'prep') this.buildBar();
  }

  // nieuwe status van het belegeringssysteem
  set(st) {
    const changed = st.state !== this.state;
    this.state = st.state;
    const prep = st.state === 'prep';
    this.title.setVisible(prep);
    this.sub.setVisible(prep);
    this.waveText.setVisible(st.state === 'fight');
    if (changed) this.scene.setSiegeMode(prep);
    if (prep) this.buildBar();
    else if (this.bar) { this.bar.destroy(); this.bar = null; }
    this.tick(st);
  }

  tick(st) {
    if (st.state === 'prep') {
      this.title.setText(`${TEXT.siegePrepTitle} ${Math.ceil(st.prepLeft / 1000)}`);
      this.sub.setText(TEXT.siegePrepHint);
    } else if (st.state === 'fight') {
      this.waveText.setText(`${TEXT.siegeWave.toUpperCase()} ${st.wave}/${st.waves} · ${st.alive} ${TEXT.siegeLeft}`);
    }
  }

  buildBar() {
    const sc = this.scene;
    const S = sc.S;
    const game = this.game;
    this.bar?.destroy();
    const w = this.w, h = this.h;
    const opts = CONFIG.siege.build;
    const bw = Math.min(70 * S, (w - 32 * S) / opts.length - 6 * S);
    const y = h - this.safe.bottom - 150 * S;
    const c = sc.add.container(0, 0).setDepth(40);
    const panelW = opts.length * (bw + 6 * S) + 16 * S;
    c.add(roundedBox(sc, panelW, 112 * S, { fill: COLORS.panel, alpha: 0.92, edgeAlpha: 0.4, radius: 14 }).setPosition(w / 2, y));
    opts.forEach((o, i) => {
      const x = w / 2 - panelW / 2 + 8 * S + bw / 2 + i * (bw + 6 * S);
      const sel = game.siege.selected === o.item;
      const ok = game.siege.affordable(o.item);
      const box = roundedBox(sc, bw, 96 * S, { fill: sel ? 0x2a1f3a : 0x1a1323, alpha: 1, edgeAlpha: sel ? 0.9 : 0.25, radius: 10 }).setPosition(x, y);
      const icon = sc.add.image(x, y - 24 * S, `icon_${o.item}`).setDisplaySize(36 * S, 36 * S).setAlpha(ok ? 1 : 0.4);
      const name = sc.add.text(x, y + 2 * S, CONFIG.items[o.item].name, textStyle(S, 9, ok ? COLORS.text : COLORS.dim, { align: 'center', wordWrap: { width: bw - 4 * S } })).setOrigin(0.5, 0);
      const have = game.inventory.get(o.item);
      const costText = have > 0 ? `${have}x ${TEXT.siegeInBag}` : Object.entries(o.cost).map(([k, n]) => `${n} ${CONFIG.items[k].name.slice(0, 5).toLowerCase()}`).join('\n');
      const cost = sc.add.text(x, y + 24 * S, costText, textStyle(S, 8, ok ? '#b8e0a0' : COLORS.warn, { align: 'center' })).setOrigin(0.5, 0);
      const z = sc.add.zone(x, y, bw, 96 * S).setInteractive();
      z.on('pointerup', () => { game.siege.select(o.item); game.siege.redraw(); this.buildBar(); });
      c.add([box, icon, name, cost, z]);
    });
    const ready = makeButton(sc, w / 2, y + 86 * S, 200 * S, 42 * S, TEXT.siegeReady, () => game.siege.ready(), 14);
    c.add(ready);
    this.bar = c;
  }
}
