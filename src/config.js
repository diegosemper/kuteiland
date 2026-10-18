// Alle balansgetallen en instellingen op één plek.
// Pas hier iets aan en herlaad de pagina; de rest van de code leest alleen uit CONFIG.

export const CONFIG = {
  render: {
    maxDpr: 2,          // hogere pixeldichtheid ziet er scherper uit maar kost prestaties
    viewTilesWide: 6.5, // hoeveel tegels je ongeveer in de breedte ziet (bepaalt de zoom)
    minZoom: 0.45,
    maxZoom: 1.3,       // verder inzoomen maakt de graphics wazig
  },

  iso: {
    tileW: 128,         // breedte van een tegel in wereldpixels
    tileH: 64,          // hoogte van de bovenkant van een tegel
    blockDepth: 30,     // dikte van een blok (de zijkant)
  },

  player: {
    speed: 2.4,              // tegels per seconde
    radius: 0.2,             // botsingsstraal, in tegels
    reach: 0.9,              // hoe ver je iets kunt raken, gemeten vanaf de rand van het object
    actionCooldownMs: 380,   // tijd tussen twee slagen als je de actieknop vasthoudt
  },

  // Lijsten per gereedschapsniveau: [zonder, hout, steen, roest]
  tree: {
    hitsPerYield: [4, 3, 2, 2],   // slagen per opbrengst (skill Hakken maakt elke slag sterker)
    woodPerYield: [1, 1, 2, 3],   // wrakhout per opbrengst
    radius: 0.3,
  },

  generator: {
    hitsPerYield: [0, 4, 3, 2],   // 0 = kan niet zonder houweel
    puinPerYield: [0, 1, 2, 2],
    regrowMs: 1500,            // hoe snel er een nieuwe steen groeit
    radius: 0.34,
  },

  chest: { radius: 0.3 },
  workbench: { radius: 0.34 },

  tools: {
    axe:     ['Handen', 'Houten bijl', 'Stenen bijl', 'Roestige bijl'],
    pickaxe: ['Geen houweel', 'Houten houweel', 'Stenen houweel', 'Roestig houweel'],
    weapon:  ['Vuisten', 'Houten knuppel', 'Puinhamer', 'Roestzwaard', 'Leegtezwaard'],
  },

  // ---------- dag, nacht en vechten ----------

  dayNight: {
    dayMs: 5 * 60 * 1000,
    nightMs: 2 * 60 * 1000,
    duskMs: 25000,          // laatste stuk van de dag: het wordt donker
    dawnMs: 15000,          // eerste stuk van de dag: het wordt licht
    warnBeforeMs: 30000,    // waarschuwing voor de nacht
    maxDarkness: 0.78,
  },

  combat: {
    weaponDamage: [1, 2, 3, 5, 8],   // per wapenniveau
    reach: 1.0,                      // tegels, vanaf de rand van het wezen
    baseHp: 10,                      // levens (2 per hartje)
    regenPerSec: 0.25,               // overdag
    hurtCooldownMs: 450,
    respawnMs: 2600,
  },

  // Wezens. Per nacht sterker: waarde * (1 + groei * (nacht - 1))
  enemies: {
    crawler: { hp: 6, damage: 1, speed: 1.25, attackMs: 1200, radius: 0.22, crystals: [0, 1], crystalChance: 0.55 },
    brute:   { hp: 22, damage: 2, speed: 0.85, attackMs: 1600, radius: 0.32, crystals: [1, 2], crystalChance: 1 },
    hpGrowth: 0.3,
    damageGrowth: 0.2,
    perNight: { base: 4, extra: 2 },        // kruipers: base + extra * (nacht - 1)
    brutesFrom: 3,                          // vanaf deze nacht ook brutes
    spawnSpread: 0.7,                       // ze komen binnen dit deel van de nacht
    attackRange: 0.45,                      // tegels tussen de randen
  },

  defenses: {
    wall:   { hp: 40, radius: 0.42 },
    lamp:   { hp: 15, radius: 0.2, light: 2.4, burnPerSec: 1, slow: 0.5 },
    crystallamp: { hp: 25, radius: 0.2, light: 3.6, burnPerSec: 2, slow: 0.4 },
    tower:  { hp: 30, radius: 0.36, range: 3.6, damage: 2, cooldownMs: 1500, light: 1.2 },
  },

  // Skills: XP per actie, bonus per level. Nodig voor level L+1: base * growth^L
  skillCurve: { base: 10, growth: 1.45, max: 20 },
  skills: {
    hakken: { name: 'Hakken', xp: 1, power: 0.08, double: 0.03 },       // xp per slag
    delven: { name: 'Delven', xp: 2, power: 0.08, double: 0.04 },       // xp per slag
    bouwen: { name: 'Bouwen', xpTile: 6, xpObject: 10, xpCraft: 1, free: 0.04 },
    vechten: { name: 'Vechten', xp: 3, xpKill: 10, damage: 0.05, heartEvery: 2 },
  },

  // Drijvend wrak dat langs het eiland zweeft
  drift: {
    intervalMs: [6000, 12000],   // tijd tussen twee drijvers
    speed: [32, 55],             // wereldpixels per seconde
    grabRange: 2.3,              // tegels: zo dichtbij moet je staan om iets te vangen
    // kans, en wat het oplevert [min, max]
    kinds: {
      branch: { chance: 0.68, loot: { wrakhout: [1, 2] } },
      scrap:  { chance: 0.27, loot: { roest: [1, 2] } },
      crate:  { chance: 0.05, loot: { wrakhout: [2, 3], roest: [1, 2], puin: [1, 2] } },
    },
  },

  save: {
    key: 'kuteiland.save.v1',
    intervalMs: 10000,
  },

  ui: {
    joystickRadius: 52,
    joystickThumb: 24,
    actionRadius: 42,
    buildRadius: 28,
    messageMs: 2800,     // hoe lang een melding blijft staan
  },

  island: {
    seed: 7,
    // '#' aarde, 'T' boom, 'C' kist, 'P' startplek, '.' leegte
    // Rijen lopen schuin naar rechtsonder, kolommen schuin naar linksonder.
    layout: [
      '..##..',
      '.####.',
      '##T#P#',
      '.#####',
      '..#C#.',
      '...#..',
    ],
  },

  // Volgorde hier = volgorde in de HUD en rugzak.
  // place: 'tile' = maakt het eiland groter, 'object' = zet je op het eiland.
  items: {
    wrakhout:       { name: 'Wrakhout',       resource: true },
    puin:           { name: 'Puin',           resource: true },
    roest:          { name: 'Roest',          resource: true },
    leegtekristal:  { name: 'Leegtekristal',  resource: true },
    sterrenstof:    { name: 'Sterrenstof',    resource: true },
    vlonder:        { name: 'Vlonder',        place: 'tile', tile: 'plank' },
    puinblok:       { name: 'Puinblok',       place: 'tile', tile: 'stone' },
    werkbank:       { name: 'Werkbank',       place: 'object' },
    steengenerator: { name: 'Steengenerator', place: 'object' },
    muur:           { name: 'Puinmuur',       place: 'object' },
    lantaarn:       { name: 'Lantaarn',       place: 'object' },
    kristallamp:    { name: 'Kristallamp',    place: 'object' },
    wachttoren:     { name: 'Wachttoren',     place: 'object' },
  },

  // at: 'hand' = in de rugzak, 'werkbank' = bij een werkbank
  // gives: { item, amount } of { tool, tier }
  recipes: [
    { id: 'werkbank',       at: 'hand',     cost: { wrakhout: 4 },           gives: { item: 'werkbank', amount: 1 } },
    { id: 'houweel1',       at: 'werkbank', cost: { wrakhout: 3 },           gives: { tool: 'pickaxe', tier: 1 } },
    { id: 'bijl1',          at: 'werkbank', cost: { wrakhout: 3 },           gives: { tool: 'axe', tier: 1 } },
    { id: 'vlonder',        at: 'werkbank', cost: { wrakhout: 2 },           gives: { item: 'vlonder', amount: 1 } },
    { id: 'steengenerator', at: 'werkbank', cost: { wrakhout: 8 },           gives: { item: 'steengenerator', amount: 1 } },
    { id: 'puinblok',       at: 'werkbank', cost: { puin: 3 },               gives: { item: 'puinblok', amount: 1 } },
    { id: 'houweel2',       at: 'werkbank', cost: { wrakhout: 2, puin: 5 },  gives: { tool: 'pickaxe', tier: 2 } },
    { id: 'bijl2',          at: 'werkbank', cost: { wrakhout: 2, puin: 5 },  gives: { tool: 'axe', tier: 2 } },
    { id: 'houweel3',       at: 'werkbank', cost: { wrakhout: 3, puin: 4, roest: 6 }, gives: { tool: 'pickaxe', tier: 3 } },
    { id: 'bijl3',          at: 'werkbank', cost: { wrakhout: 3, puin: 4, roest: 6 }, gives: { tool: 'axe', tier: 3 } },
    { id: 'wapen1',         at: 'werkbank', cost: { wrakhout: 4 },                   gives: { tool: 'weapon', tier: 1 } },
    { id: 'wapen2',         at: 'werkbank', cost: { wrakhout: 2, puin: 6 },          gives: { tool: 'weapon', tier: 2 } },
    { id: 'wapen3',         at: 'werkbank', cost: { wrakhout: 2, roest: 8 },         gives: { tool: 'weapon', tier: 3 } },
    { id: 'wapen4',         at: 'werkbank', cost: { roest: 4, leegtekristal: 6 },    gives: { tool: 'weapon', tier: 4 } },
    { id: 'lantaarn',       at: 'werkbank', cost: { wrakhout: 3, roest: 1 },         gives: { item: 'lantaarn', amount: 1 } },
    { id: 'muur',           at: 'werkbank', cost: { puin: 4 },                       gives: { item: 'muur', amount: 1 } },
    { id: 'wachttoren',     at: 'werkbank', cost: { wrakhout: 6, puin: 6, roest: 4 }, gives: { item: 'wachttoren', amount: 1 } },
    { id: 'kristallamp',    at: 'werkbank', cost: { roest: 2, leegtekristal: 3 },    gives: { item: 'kristallamp', amount: 1 } },
  ],
};
