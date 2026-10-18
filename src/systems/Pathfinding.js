// Route over de tegels, om objecten heen (breadth-first search).
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

function walkable(game) {
  const blocked = new Set(game.objects.map((o) => `${o.gx},${o.gy}`));
  return (gx, gy) => !!game.island.get(gx, gy) && !blocked.has(`${gx},${gy}`);
}

// Route naar één van de doeltegels. Geeft een lijst tegels terug (zonder de start), of null.
export function findPathTo(game, goalTiles) {
  const free = walkable(game);
  const goals = new Set(goalTiles.filter(([gx, gy]) => free(gx, gy)).map(([gx, gy]) => `${gx},${gy}`));
  if (!goals.size) return null;

  const start = { gx: Math.round(game.player.gx), gy: Math.round(game.player.gy) };
  const prev = new Map([[`${start.gx},${start.gy}`, null]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    if (goals.has(`${cur.gx},${cur.gy}`)) {
      const path = [];
      for (let n = cur; n; n = prev.get(`${n.gx},${n.gy}`)) path.unshift(n);
      path.shift();   // starttegel: daar sta je al
      return path;
    }
    for (const [dx, dy] of DIRS) {
      const nx = cur.gx + dx, ny = cur.gy + dy;
      const nk = `${nx},${ny}`;
      if (prev.has(nk) || !free(nx, ny)) continue;
      // schuin alleen als je niet langs een hoek schuurt
      if (dx && dy && (!free(cur.gx + dx, cur.gy) || !free(cur.gx, cur.gy + dy))) continue;
      prev.set(nk, cur);
      queue.push({ gx: nx, gy: ny });
    }
  }
  return null;
}

// Route naar een vrije tegel recht naast een object
export function findPath(game, target) {
  return findPathTo(game, [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [target.gx + dx, target.gy + dy]));
}

// Route naar de vrije tegel die het dichtst bij een punt (in tegels) ligt
export function findPathNear(game, gx, gy) {
  const free = walkable(game);
  const tiles = [...game.island.tiles.values()].filter((t) => free(t.gx, t.gy));
  tiles.sort((a, b) => Math.hypot(a.gx - gx, a.gy - gy) - Math.hypot(b.gx - gx, b.gy - gy));
  return findPathTo(game, tiles.slice(0, 1).map((t) => [t.gx, t.gy]));
}
