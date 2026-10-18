// Route over de tegels naar een object, om andere objecten heen (breadth-first search).
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export function findPath(game, target) {
  const { island, objects, player } = game;
  const blocked = new Set(objects.map((o) => `${o.gx},${o.gy}`));
  const free = (gx, gy) => island.get(gx, gy) && !blocked.has(`${gx},${gy}`);

  // doel: een vrije tegel recht naast het object
  const goals = new Set([[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => [target.gx + dx, target.gy + dy])
    .filter(([gx, gy]) => free(gx, gy))
    .map(([gx, gy]) => `${gx},${gy}`));
  if (!goals.size) return null;

  const start = { gx: Math.round(player.gx), gy: Math.round(player.gy) };
  const startKey = `${start.gx},${start.gy}`;
  const prev = new Map([[startKey, null]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    const k = `${cur.gx},${cur.gy}`;
    if (goals.has(k)) {
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
