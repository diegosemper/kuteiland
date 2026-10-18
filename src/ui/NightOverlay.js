// Het donker: een laag over de wereld waar lampen, de speler en kristallen gaten in branden.
import { CONFIG } from '../config.js';

const DUSK = [0x2a, 0x14, 0x3a];
const NIGHT = [0x03, 0x02, 0x0a];

export class NightOverlay {
  constructor(scene) {
    this.scene = scene;
    const { width: w, height: h } = scene.scale;
    this.rt = scene.add.renderTexture(0, 0, w, h).setOrigin(0).setDepth(-95).setVisible(false);
    this.stamp = scene.make.image({ key: 'light', add: false });
  }

  layout(w, h) {
    this.rt.resize(w, h);
  }

  update(game) {
    const d = game.dayNight.darkness;
    if (d < 0.01) {
      this.rt.setVisible(false);
      return;
    }
    const cam = game.cameras.main;
    const t = Math.min(1, d * 1.4);
    const c = DUSK.map((v, i) => Math.round(v + (NIGHT[i] - v) * t));
    const color = (c[0] << 16) | (c[1] << 8) | c[2];

    const rt = this.rt;
    rt.setVisible(true);
    rt.clear();
    rt.fill(color, d * CONFIG.dayNight.maxDarkness);
    const tilePx = CONFIG.iso.tileW * cam.zoom;
    for (const l of game.night.lights()) {
      const x = (l.x - cam.worldView.x) * cam.zoom;
      const y = (l.y - cam.worldView.y) * cam.zoom;
      const r = l.r * tilePx;
      if (x < -r || y < -r || x > rt.width + r || y > rt.height + r) continue;
      this.stamp.setPosition(x, y).setDisplaySize(r * 2, r * 1.3);
      rt.erase(this.stamp);
    }
  }
}
