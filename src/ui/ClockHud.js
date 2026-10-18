// Dag of nacht, met een balkje dat aangeeft hoe lang het nog duurt.
import { TEXT } from '../texts.js';
import { getMeta } from '../systems/Meta.js';
import { COLORS, textStyle, shade } from './style.js';

export class ClockHud {
  constructor(scene) {
    this.scene = scene;
    const S = scene.S;
    this.w = 104 * S;
    this.label = shade(scene.add.text(0, 0, '', textStyle(S, 11, COLORS.text, { fontStyle: '700', letterSpacing: 1.5 * S })).setOrigin(0.5, 0), S);
    this.track = scene.add.rectangle(0, 18 * S, this.w, 4 * S, 0xffffff, 0.12).setOrigin(0.5, 0);
    this.fill = scene.add.rectangle(-this.w / 2, 18 * S, 1, 4 * S, 0xe8d6b8, 0.9).setOrigin(0, 0);
    this.c = scene.add.container(0, 0, [this.label, this.track, this.fill]).setDepth(10);
  }

  layout(w, h, safe) {
    const S = this.scene.S;
    this.c.setPosition(w - safe.right - 16 * S - 52 * S, safe.top + 132 * S);
  }

  update(dn) {
    const night = dn.isNight;
    const cycle = getMeta().cycle;
    this.label.setText(`${night ? TEXT.nightLabelCaps : TEXT.dayLabel} ${dn.day}${cycle > 1 ? ` · ${TEXT.cycleLabel}${cycle}` : ''}`);
    this.label.setColor(night ? '#d9c2ff' : COLORS.text);
    // balkje loopt leeg tot de volgende fase
    this.fill.width = Math.max(1, this.w * (1 - dn.phaseProgress));
    this.fill.fillColor = night ? 0x9b6bff : (dn.phaseLeftMs < 30000 ? 0xe0a070 : 0xe8d6b8);
  }
}
