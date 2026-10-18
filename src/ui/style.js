// Gedeelde UI-stijl. S = schaalfactor (pixeldichtheid), zodat alles op elke telefoon even groot oogt.
export const FONT = 'ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace';

export const COLORS = {
  text: '#d9cdea',
  dim: '#8f84a3',
  panel: 0x120c1a,
  panelEdge: 0x3d2f55,
  button: 0x1a1224,
  accent: 0xd9cdea,
};

export function textStyle(S, size, color = COLORS.text, extra = {}) {
  return { fontFamily: FONT, fontSize: `${Math.round(size * S)}px`, color, ...extra };
}

// Simpele knop: rechthoek met tekst. Geeft een container terug.
export function makeButton(scene, x, y, w, h, label, onTap, size = 13) {
  const S = scene.S;
  const bg = scene.add.rectangle(0, 0, w, h, COLORS.button, 0.85)
    .setStrokeStyle(Math.max(1, 1.5 * S), COLORS.panelEdge)
    .setInteractive({ useHandCursor: true });
  const text = scene.add.text(0, 0, label, textStyle(S, size)).setOrigin(0.5);
  const c = scene.add.container(x, y, [bg, text]);
  bg.on('pointerdown', () => {
    scene.tweens.add({ targets: c, scale: 0.94, duration: 50, yoyo: true });
    onTap(text);
  });
  c.label = text;
  return c;
}
