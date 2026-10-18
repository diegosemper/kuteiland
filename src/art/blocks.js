// Minecraft-achtige blokken: 16x16 pixel-texturen en een schilder die ze op isometrische kubussen legt.
import { CONFIG } from '../config.js';
import { mulberry32 } from './util.js';

const { tileW: TW, tileH: TH } = CONFIG.iso;
const N = 16;

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const seedOf = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

// ---------- texturen ----------

function makeFace(name, fn) {
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const ctx = c.getContext('2d');
  const r = mulberry32(seedOf(name));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const col = fn(x, y, r);
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// cellen voor kasseien en kristal (wikkelt rond, zodat blokken naadloos aansluiten)
function cells(r, n) {
  const pts = Array.from({ length: n }, () => ({ x: r() * N, y: r() * N, v: r() }));
  return (x, y) => {
    let d1 = 99, d2 = 99, best = null;
    for (const p of pts) {
      for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
        const d = Math.hypot(x + 0.5 - p.x - ox, y + 0.5 - p.y - oy);
        if (d < d1) { d2 = d1; d1 = d; best = p; } else if (d < d2) d2 = d;
      }
    }
    return { edge: d2 - d1 < 1.1, v: best.v, d1 };
  };
}

const GRASS = ['#5d8c3b', '#548336', '#679a42', '#4c7a31', '#5a8838'];
const DIRT = ['#79553a', '#6c4a31', '#85603f', '#5f412a'];
const STONE = ['#7d7d7d', '#717171', '#888888', '#686868'];
const PLANK = ['#a07c4c', '#93703f', '#ad8a55', '#8a683b'];

const FACES = {
  grass_top: (x, y, r) => (r() < 0.12 ? '#41702a' : r() < 0.06 ? '#77ad4c' : pick(r, GRASS)),
  dirt: (x, y, r) => (r() < 0.05 ? '#8f8f8f' : pick(r, DIRT)),
  grass_side: (() => {
    const fringe = [];
    const rr = mulberry32(77);
    for (let x = 0; x < N; x++) fringe.push(2 + Math.floor(rr() * 3) + (rr() < 0.25 ? 2 : 0));
    return (x, y, r) => {
      if (y < fringe[x]) return y === fringe[x] - 1 ? '#4a7a2f' : pick(r, GRASS);
      return r() < 0.05 ? '#8f8f8f' : pick(r, DIRT);
    };
  })(),
  stone: (x, y, r) => (r() < 0.08 ? '#5a5a5a' : pick(r, STONE)),
  cobble: (() => {
    const c = cells(mulberry32(5), 7);
    return (x, y, r) => {
      const k = c(x, y);
      if (k.edge) return r() < 0.5 ? '#3c3c3c' : '#474747';
      const base = ['#8a8a8a', '#7a7a7a', '#9a9a9a', '#6e6e6e'][Math.floor(k.v * 4)];
      return k.d1 < 1.3 && r() < 0.5 ? '#a8a8a8' : base;
    };
  })(),
  planks: (x, y, r) => {
    const board = Math.floor(y / 4);
    if (y % 4 === 3) return '#6a4f2a';
    if (x === (board * 7 + 3) % N) return '#6a4f2a';
    return r() < 0.15 ? '#b8935c' : PLANK[(board + Math.floor(r() * 2)) % PLANK.length];
  },
  log_side: (x, y, r) => {
    const stripe = (x * 3 + Math.floor(y / 5)) % 4;
    if (r() < 0.12) return '#2e2216';
    return ['#5a4128', '#4a3520', '#654a2e', '#523b24'][stripe];
  },
  log_top: (x, y, r) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d > 6.6) return pick(r, ['#5a4128', '#4a3520']);
    return Math.floor(d) % 2 ? '#a07c4c' : '#b8935c';
  },
  leaves: (x, y, r) => (r() < 0.22 ? null : r() < 0.15 ? '#2f5a1e' : pick(r, ['#3f7a2a', '#4a8a33', '#356a24', '#56963a'])),
  leaves_dead: (x, y, r) => (r() < 0.32 ? null : r() < 0.4 ? pick(r, ['#7a6a32', '#8a6a3a', '#6a5a2a']) : pick(r, ['#4a6a2a', '#3d5a24', '#55702f'])),
  ash_top: (x, y, r) => (r() < 0.07 ? pick(r, ['#e07030', '#f0a040', '#c05020']) : pick(r, ['#3a3636', '#2e2b2b', '#454040', '#363232'])),
  basalt: (x, y, r) => {
    if (r() < 0.04) return '#c05020';
    return ['#3a3636', '#2a2727', '#454040', '#333030'][(x + Math.floor(r() * 2)) % 4];
  },
  amethyst: (() => {
    const c = cells(mulberry32(9), 6);
    return (x, y, r) => {
      const k = c(x, y);
      if (k.edge) return '#4a2d7a';
      if (k.d1 < 1.5 && r() < 0.6) return '#e2c8ff';
      return ['#8a5fd0', '#7a4fc0', '#9b6be0', '#6a45a8'][Math.floor(k.v * 4)];
    };
  })(),
  deepslate: (x, y, r) => (y % 4 === 0 && r() < 0.5 ? '#26232b' : pick(r, ['#3a3640', '#2e2b33', '#46424d', '#34313a'])),
  deepslate_amethyst: (x, y, r) => (r() < 0.07 ? pick(r, ['#9b6be0', '#c9a6ff']) : (y % 4 === 0 && r() < 0.5 ? '#26232b' : pick(r, ['#3a3640', '#2e2b33', '#46424d']))),
  bricks: (x, y, r) => {
    const row = Math.floor(y / 4);
    const off = row % 2 ? 4 : 0;
    if (y % 4 === 3 || (x + off) % 8 === 7) return '#4a4a52';
    return r() < 0.15 ? '#a0a0a8' : pick(r, ['#8a8a92', '#7e7e86', '#95959c']);
  },
  bricks_glow: (x, y, r) => {
    const row = Math.floor(y / 4);
    const off = row % 2 ? 4 : 0;
    if ((x === 5 && y > 2 && y < 12) || (y === 11 && x > 5 && x < 11)) return r() < 0.7 ? '#c9a6ff' : '#9b6bff';
    if (y % 4 === 3 || (x + off) % 8 === 7) return '#4a4a52';
    return r() < 0.15 ? '#5a6a40' : pick(r, ['#8a8a92', '#7e7e86', '#95959c']);
  },
  bridge: (x, y, r) => {
    if (y % 4 === 3) return null;          // gaten tussen de planken
    if (x === 0 || x === 15) return '#8a7a52';
    return r() < 0.15 ? '#b8935c' : pick(r, PLANK);
  },
  starbridge: (x, y, r) => {
    if (y % 4 === 3) return null;
    if (x === 0 || x === 15) return '#b48cff';
    return r() < 0.08 ? '#ffffff' : pick(r, ['#ddd6ee', '#cfc8e4', '#e8e2f8']);
  },
  quartz: (x, y, r) => (r() < 0.06 ? '#b48cff' : pick(r, ['#ddd6ee', '#cfc8e4', '#e8e2f8'])),
  iron: (x, y, r) => {
    if (x === 0 || y === 0) return '#e6e6e6';
    if (x === 15 || y === 15) return '#8a8a8a';
    return pick(r, ['#c8c8c8', '#bdbdbd', '#d2d2d2']);
  },
  rust: (x, y, r) => (r() < 0.25 ? pick(r, ['#5a2e18', '#4a2414']) : pick(r, ['#9a5030', '#8a4628', '#a85a36', '#7a3e22'])),
  rust_ore: (() => {
    const c = cells(mulberry32(13), 5);
    return (x, y, r) => {
      const k = c(x, y);
      if (k.v > 0.6 && k.d1 < 2.4) return pick(r, ['#b0602a', '#c87838', '#8a4628']);
      return r() < 0.08 ? '#5a5a5a' : pick(r, STONE);
    };
  })(),
  star_ore: (() => {
    const c = cells(mulberry32(17), 5);
    return (x, y, r) => {
      const k = c(x, y);
      if (k.v > 0.55 && k.d1 < 2) return r() < 0.4 ? '#ffffff' : pick(r, ['#f8eeb0', '#f0e090', '#e8d8a0']);
      return pick(r, ['#b8b8c8', '#a8a8b8', '#c4c4d4']);
    };
  })(),
  obsidian: (x, y, r) => (r() < 0.1 ? pick(r, ['#4a2a7a', '#5e3a9a']) : pick(r, ['#14091f', '#1c0f2a', '#100818', '#22133a'])),
  void_eyes: (x, y, r) => {
    if ((y === 6 || y === 7) && (x === 3 || x === 4 || x === 11 || x === 12)) return y === 6 ? '#f2e8ff' : '#b48cff';
    return r() < 0.1 ? '#2a1a40' : pick(r, ['#140c1e', '#1a1026', '#0f0816']);
  },
  craft_top: (x, y, r) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return '#5a3e22';
    if ((x === 5 || x === 10 || y === 5 || y === 10) && x > 0 && y > 0) return '#7a5a34';
    if (x > 1 && x < 5 && y > 1 && y < 4) return '#8a8a8a';   // hamer
    return pick(r, PLANK);
  },
  craft_side: (x, y, r) => {
    if (y < 3) return pick(r, ['#5a3e22', '#6a4a2a']);
    if (y > 4 && y < 9 && x > 2 && x < 13 && (x + y) % 3 === 0) return '#9a9a9a';  // zaag
    if (y === 9 && x > 2 && x < 13) return '#6a6a6a';
    return pick(r, PLANK);
  },
  chest_side: (x, y, r) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return '#3e2a14';
    if (y === 5) return '#2a1c0c';
    return pick(r, ['#9a6a2a', '#8a5e24', '#a87430']);
  },
  chest_front: (x, y, r) => {
    if (x >= 7 && x <= 8 && y >= 4 && y <= 7) return y === 4 ? '#e8e8e8' : '#b0b0b0';   // slot
    if (x === 0 || x === 15 || y === 0 || y === 15) return '#3e2a14';
    if (y === 5) return '#2a1c0c';
    return pick(r, ['#9a6a2a', '#8a5e24', '#a87430']);
  },
  chest_inside: (x, y, r) => (x === 0 || x === 15 || y === 0 || y === 15 ? '#3e2a14' : pick(r, ['#2a1c10', '#24180c'])),
  hood: (x, y, r) => pick(r, ['#3d3a4a', '#35323f', '#433f52']),
  cloak: (x, y, r) => (y === 9 ? '#2a1f18' : y === 10 && x > 6 && x < 9 ? '#b09a5a' : pick(r, ['#3d3a4a', '#35323f', '#433f52'])),
  face: (x, y, r) => {
    if (y < 4 || x < 2 || x > 13) return pick(r, ['#3d3a4a', '#35323f']);          // kap rond het gezicht
    if (y === 7 && (x === 5 || x === 10)) return '#141018';                         // ogen
    if (y === 7 && (x === 4 || x === 11)) return '#e8e0d8';
    if (y < 6) return '#1a1620';                                                     // schaduw onder de kap
    return pick(r, ['#b8977c', '#ad8c72', '#c2a086']);
  },
  pants: (x, y, r) => (y > 12 ? '#1c1612' : pick(r, ['#2a2630', '#24212b'])),
  skin: (x, y, r) => pick(r, ['#b8977c', '#ad8c72']),
  lantern: (x, y, r) => {
    if (x < 2 || x > 13 || y < 2 || y > 13 || x === 7 || x === 8) return '#3a3a40';
    return y > 7 ? '#ffe08a' : '#ffc860';
  },
  lantern_off: (x, y, r) => {
    if (x < 2 || x > 13 || y < 2 || y > 13 || x === 7 || x === 8) return '#3a3a40';
    return '#5b5040';
  },
  crystal_lamp: (x, y, r) => {
    if (x < 2 || x > 13 || y < 2 || y > 13) return '#3a3a40';
    return pick(r, ['#d9c2ff', '#c9a6ff', '#efe4ff']);
  },
  crystal_lamp_off: (x, y, r) => {
    if (x < 2 || x > 13 || y < 2 || y > 13) return '#3a3a40';
    return pick(r, ['#5a4380', '#4a3570']);
  },
  kern: (x, y, r) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if ((x === y || x === y + 1) && x > 2 && x < 13) return '#120820';   // de breuk
    if (d < 3) return '#ffffff';
    return d < 5.5 ? pick(r, ['#e2d0ff', '#d0b8ff']) : pick(r, ['#b48cff', '#9b6be0', '#c9a6ff']);
  },
  sack: (x, y, r) => (y < 3 ? '#a08a5a' : pick(r, ['#7a6450', '#6a5440', '#846c56'])),
  void_liquid: (x, y, r) => {
    const w = Math.sin((x + y * 0.6) * 0.8) + Math.sin(y * 0.9 - x * 0.3);
    return w > 1.1 ? '#e2c8ff' : w > 0.2 ? '#9b6be0' : pick(r, ['#5e3a9a', '#4a2d7a']);
  },
  sign: (x, y, r) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return '#6a4f2a';
    if ((y === 4 || y === 7 || y === 10) && x > 2 && x < 13 && r() < 0.8) return '#2a1c10';
    return pick(r, PLANK);
  },
  dispenser: (x, y, r) => {
    if (x > 4 && x < 11 && y > 4 && y < 11) return x > 5 && x < 10 && y > 5 && y < 10 ? '#b48cff' : '#1a1a1a';
    return FACES_REF.cobble(x, y, r);
  },
};
const FACES_REF = FACES;

// ---------- verre eilanden (ring 2 en 3) ----------
Object.assign(FACES, {
  sulfur: (x, y, r) => (r() < 0.1 ? '#f8f0a0' : pick(r, ['#d8c040', '#c8b030', '#e0cc50', '#b8a028'])),
  sulfur_side: (x, y, r) => (r() < 0.08 ? '#f0e070' : pick(r, ['#a89028', '#988020', '#b09a30', '#8a7418'])),
  sulfur_ore: (() => {
    const c = cells(mulberry32(41), 5);
    return (x, y, r) => {
      const k = c(x, y);
      if (k.v > 0.5 && k.d1 < 2.2) return pick(r, ['#fff070', '#f0d830', '#e8c820']);
      return pick(r, ['#7a6a40', '#6a5a34', '#857446']);
    };
  })(),
  mycelium_top: (x, y, r) => (r() < 0.15 ? pick(r, ['#b8a0c0', '#c8b0d0']) : pick(r, ['#7a6478', '#6e5a6c', '#857082', '#665264'])),
  mycelium_side: (() => {
    const fringe = [];
    const rr = mulberry32(55);
    for (let x = 0; x < N; x++) fringe.push(2 + Math.floor(rr() * 3));
    return (x, y, r) => (y < fringe[x] ? pick(r, ['#7a6478', '#6e5a6c']) : (r() < 0.05 ? '#8f8f8f' : pick(r, DIRT)));
  })(),
  mushroom_cap: (x, y, r) => ((x * 7 + y * 3) % 11 < 2 && r() < 0.8 ? '#f0e8e0' : pick(r, ['#a02828', '#b03030', '#8a2020'])),
  mushroom_stem: (x, y, r) => pick(r, ['#e8e0d0', '#d8d0c0', '#f0e8dc']),
  snow_top: (x, y, r) => (r() < 0.12 ? '#e0ecf8' : pick(r, ['#f8fcff', '#eef4fa', '#f4f8fc'])),
  snow_side: (() => {
    const fringe = [];
    const rr = mulberry32(57);
    for (let x = 0; x < N; x++) fringe.push(2 + Math.floor(rr() * 4));
    return (x, y, r) => (y < fringe[x] ? pick(r, ['#f8fcff', '#e8f0f8']) : (r() < 0.05 ? '#8f8f8f' : pick(r, DIRT)));
  })(),
  packed_ice: (x, y, r) => (r() < 0.1 ? '#e8f8ff' : pick(r, ['#88b8e8', '#7aa8d8', '#98c4f0', '#6e9ccc'])),
  ice_ore: (() => {
    const c = cells(mulberry32(43), 5);
    return (x, y, r) => {
      const k = c(x, y);
      if (k.v > 0.55 && k.d1 < 2) return r() < 0.4 ? '#ffffff' : pick(r, ['#f8eeb0', '#e0f0ff']);
      return pick(r, ['#88b8e8', '#7aa8d8', '#98c4f0']);
    };
  })(),
  sculk: (x, y, r) => (r() < 0.06 ? pick(r, ['#40ffd0', '#80fff0']) : pick(r, ['#0c1a22', '#102430', '#0a141c', '#14303a'])),
  sculk_side: (x, y, r) => (r() < 0.05 ? '#30e0c0' : (y % 4 === 0 && r() < 0.4 ? '#06100e' : pick(r, ['#1a2a30', '#14222a', '#203238']))),
  soul_ore: (() => {
    const c = cells(mulberry32(47), 5);
    return (x, y, r) => {
      const k = c(x, y);
      if (k.v > 0.5 && k.d1 < 2.2) return r() < 0.3 ? '#e0fff8' : pick(r, ['#40ffd0', '#30d8b8', '#60ffe0']);
      return pick(r, ['#1a2a30', '#14222a', '#203238']);
    };
  })(),
  soul_crystal: (x, y, r) => (r() < 0.2 ? '#e0fff8' : pick(r, ['#40ffd0', '#30d8b8', '#60ffe0', '#20b898'])),
  anvil: (x, y, r) => {
    if (y === 0) return '#9a9aa2';
    return pick(r, ['#4a4a52', '#424248', '#525258']);
  },
});

// Machinefront: ijzeren kader met een gekleurd venster (kleur per machine)
export function machineFace(name, glow) {
  if (!FACES[name]) {
    FACES[name] = (x, y, r) => {
      if (x < 2 || x > 13 || y < 2 || y > 13) return x === 0 || y === 0 ? '#d8d8d8' : pick(r, ['#9a9a9a', '#8a8a8a']);
      if (x < 4 || x > 11 || y < 4 || y > 11) return '#3a3a40';
      return (x + y) % 5 === 0 ? '#ffffff' : glow;
    };
  }
  return name;
}

// Barsten zoals bij het slopen van een blok: alleen donkere lijnen, de rest doorzichtig
FACES.crack = (() => {
  const set = new Set();
  const rr = mulberry32(31);
  for (let i = 0; i < 4; i++) {
    let x = 7 + Math.floor(rr() * 3) - 1, y = 7 + Math.floor(rr() * 3) - 1;
    for (let k = 0; k < 9; k++) {
      set.add(`${x},${y}`);
      x += [-1, 0, 1][Math.floor(rr() * 3)] * (i % 2 ? 1 : -1) + (i < 2 ? 1 : -1) * (rr() < 0.4 ? 1 : 0);
      y += [-1, 0, 1][Math.floor(rr() * 3)] + (i % 2 ? 1 : -1) * (rr() < 0.4 ? 1 : 0);
      x = Math.max(0, Math.min(15, x)); y = Math.max(0, Math.min(15, y));
    }
  }
  return (x, y) => (set.has(`${x},${y}`) ? '#0a0604' : null);
})();

const cache = new Map();
export function face(name) {
  if (!cache.has(name)) cache.set(name, makeFace(name, FACES[name]));
  return cache.get(name);
}

// Donkerdere kopie voor de zijkanten (alleen op bestaande pixels)
const shadeCache = new Map();
function shaded(name, amount) {
  const k = `${name}:${amount}`;
  if (shadeCache.has(k)) return shadeCache.get(k);
  const src = face(name);
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(0,0,0,${amount})`;
  ctx.fillRect(0, 0, N, N);
  shadeCache.set(k, c);
  return c;
}

// ---------- schilderen ----------

// Isometrisch punt: u, v in tegels, z in pixels omhoog
export function iso(ox, oy) {
  return (u, v, z = 0) => ({ x: ox + (u - v) * TW / 2, y: oy + (u + v) * TH / 2 - z });
}

// Een texture op een parallellogram leggen: o = hoek (0,0), ax = hoek (breedte,0), ay = hoek (0,hoogte)
export function quad(ctx, img, o, ax, ay, rows = N) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform((ax.x - o.x) / N, (ax.y - o.y) / N, (ay.x - o.x) / rows, (ay.y - o.y) / rows, o.x, o.y);
  ctx.drawImage(img, 0, 0, N, rows, 0, 0, N, rows);
  ctx.restore();
}

// Een kubus (of balk). faces: { top, left, right } = namen van texturen (of null)
// opts.rows: hoeveel rijen van de zijtextuur gebruiken (voor platte blokken)
export function cube(ctx, P, u0, u1, v0, v1, z0, z1, faces, opts = {}) {
  const rows = opts.rows || N;
  const lift = 0.6;   // zijkanten iets onder de bovenkant door, geen naadjes
  if (faces.left) {
    quad(ctx, shaded(faces.left, opts.shadeL ?? 0.22), P(u0, v1, z1 + lift), P(u1, v1, z1 + lift), P(u0, v1, z0), rows);
  }
  if (faces.right) {
    quad(ctx, shaded(faces.right, opts.shadeR ?? 0.42), P(u1, v1, z1 + lift), P(u1, v0, z1 + lift), P(u1, v1, z0), rows);
  }
  if (faces.top) {
    quad(ctx, opts.shadeT ? shaded(faces.top, opts.shadeT) : face(faces.top), P(u0, v0, z1), P(u1, v0, z1), P(u0, v1, z1));
  }
}

// Meerdere blokjes in de juiste volgorde tekenen (achter eerst, laag eerst)
// boxes: [{ u0, u1, v0, v1, z0, z1, faces, opts }]
export function drawBoxes(ctx, P, boxes) {
  const sorted = [...boxes].sort((a, b) => ((a.u0 + a.u1 + a.v0 + a.v1) - (b.u0 + b.u1 + b.v0 + b.v1)) || (a.z0 - b.z0));
  for (const b of sorted) cube(ctx, P, b.u0, b.u1, b.v0, b.v1, b.z0, b.z1, b.faces, b.opts);
}

// Blokje rond (u, v) met zijde s (in tegels) en hoogte h (in pixels), staand op z
export function boxAt(u, v, z, s, h, faces, sv = s, opts) {
  return { u0: u - s / 2, u1: u + s / 2, v0: v - sv / 2, v1: v + sv / 2, z0: z, z1: z + h, faces, opts };
}

// Kubus met dezelfde textuur rondom
export const all = (name, top = name) => ({ top, left: name, right: name });

// Phaser-texture scherp houden bij in- en uitzoomen
export function crisp(scene, key) {
  scene.textures.get(key)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}
