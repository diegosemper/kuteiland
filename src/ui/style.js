// Gedeelde UI-stijl. S = schaalfactor (pixeldichtheid), zodat alles op elke telefoon even groot oogt.
export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const FONT_STORY = 'Georgia, "Times New Roman", serif';

export const COLORS = {
  text: '#e6dcf2',
  dim: '#9a8fae',
  warn: '#e0a090',
  panel: 0x100b16,
  panelEdge: 0xb8a6d9,
  button: 0x1a1323,
  buttonEdge: 0xb8a6d9,
  accent: 0xe6dcf2,
};

export function textStyle(S, size, color = COLORS.text, extra = {}) {
  return { fontFamily: FONT, fontSize: `${Math.round(size * S)}px`, color, ...extra };
}

export function storyStyle(S, size, color = COLORS.text, extra = {}) {
  return { fontFamily: FONT_STORY, fontStyle: 'italic', fontSize: `${Math.round(size * S)}px`, color, ...extra };
}

// Zachte schaduw onder tekst voor leesbaarheid op elke achtergrond
export function shade(text, S) {
  return text.setShadow(0, 1.5 * S, '#000000', 5 * S, false, true);
}

export function roundedBox(scene, w, h, { fill = COLORS.button, alpha = 0.85, edge = COLORS.buttonEdge, edgeAlpha = 0.3, radius = 10 } = {}) {
  const S = scene.S;
  const g = scene.add.graphics();
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, radius * S);
  g.lineStyle(Math.max(1, 1.2 * S), edge, edgeAlpha);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius * S);
  return g;
}

// Knop: afgeronde rechthoek met tekst. Geeft een container terug.
export function makeButton(scene, x, y, w, h, label, onTap, size = 13) {
  const S = scene.S;
  const bg = roundedBox(scene, w, h);
  const text = scene.add.text(0, 0, label, textStyle(S, size, COLORS.text, { fontStyle: '600' })).setOrigin(0.5);
  const zone = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  const c = scene.add.container(x, y, [bg, text, zone]);
  zone.on('pointerdown', () => {
    scene.tweens.add({ targets: c, scale: 0.95, duration: 60, yoyo: true });
    onTap(text);
  });
  c.label = text;
  return c;
}
