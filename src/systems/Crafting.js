// Recepten: kan het, en zo ja, maak het. Alle recepten staan in CONFIG.recipes.
import { CONFIG } from '../config.js';
import { bus } from '../bus.js';

export function recipesAt(place) {
  return CONFIG.recipes.filter((r) => r.at === place);
}

export function recipeName(r) {
  if (r.gives.tool) return CONFIG.tools[r.gives.tool][r.gives.tier];
  return CONFIG.items[r.gives.item].name;
}

export function recipeIcon(r) {
  return r.gives.tool ? `icon_${r.gives.tool}${r.gives.tier}` : `icon_${r.gives.item}`;
}

// Welk collectie-niveau ontgrendelt dit recept? (null = altijd beschikbaar)
export function recipeUnlock(r) {
  if (!r.requires) return null;
  const tier = CONFIG.collections.items[r.requires].findIndex((x) => x.recipe === r.id) + 1;
  return { collection: r.requires, tier };
}

// owned: gereedschap heb je al (of beter); locked: collectie nog niet ver genoeg
export function recipeState(game, r) {
  const owned = !!r.gives.tool && game.tools[r.gives.tool] >= r.gives.tier;
  const unlock = recipeUnlock(r);
  const locked = !!unlock && game.collectionTier(unlock.collection) < unlock.tier;
  const affordable = Object.entries(r.cost).every(([k, n]) => game.inventory.has(k, n));
  return { owned, affordable, locked, unlock, canCraft: affordable && !owned && !locked };
}

export function craft(game, id) {
  const r = CONFIG.recipes.find((x) => x.id === id);
  if (!r || !recipeState(game, r).canCraft) return null;
  for (const [k, n] of Object.entries(r.cost)) game.inventory.remove(k, n);
  if (r.gives.tool) {
    game.tools[r.gives.tool] = r.gives.tier;
  } else {
    game.inventory.add(r.gives.item, r.gives.amount);
  }
  game.stats.crafted[r.id] = (game.stats.crafted[r.id] || 0) + 1;
  bus.emit('crafted', r);
  return r;
}
