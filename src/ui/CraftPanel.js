// Werkbank: alle recepten die je bij de werkbank kunt maken.
import { TEXT } from '../texts.js';
import { bus } from '../bus.js';
import { makeButton } from './style.js';
import { createPanel, recipeRow } from './Panel.js';
import { recipesAt, recipeName, recipeIcon, recipeState } from '../systems/Crafting.js';

export class CraftPanel {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.container = null;
  }

  get isOpen() {
    return !!this.container;
  }

  rebuild() {
    if (!this.isOpen) return;
    const old = this.container;
    this.scrollY = this.panel?.list?.y || 0;
    this.container = null;
    this.open();
    if (this.panel?.list) { this.panel.list.y = this.scrollY; this.panel.setContentEnd(this.contentEnd); }
    this.scene.time.delayedCall(0, () => old.destroy());
  }

  open() {
    if (this.isOpen) return;
    const sc = this.scene;
    const S = sc.S;
    const recipes = recipesAt('werkbank');

    const panel = createPanel(sc, {
      title: TEXT.craftTitle,
      subtitle: TEXT.craftSubtitle,
      height: recipes.length * 50 * S + 200 * S,
      onBackdrop: () => this.close(),
      anchor: 'bottom',
    });
    const { c, px, py, pw, ph, pad } = panel;
    this.panel = panel;
    let y = panel.y;

    for (const r of recipes) {
      y += recipeRow(sc, panel, y, {
        icon: recipeIcon(r),
        name: recipeName(r),
        cost: r.cost,
        inventory: this.game.inventory,
        state: recipeState(this.game, r),
        onMake: () => { bus.emit('craft', r.id); this.rebuild(); },
        makeButton,
        labels: { make: TEXT.craftMake, owned: TEXT.craftOwned },
      });
    }

    this.contentEnd = y;
    panel.setContentEnd(y);
    c.add(makeButton(sc, px + pw / 2, py + ph - pad - 22 * S, pw - pad * 2, 44 * S, TEXT.close, () => this.close()));
    this.container = c;
  }

  close() {
    if (!this.container) return;
    const c = this.container;
    this.container = null;
    this.scene.time.delayedCall(0, () => c.destroy());
  }
}
