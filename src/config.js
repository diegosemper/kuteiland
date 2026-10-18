// Alle balansgetallen en instellingen op één plek.
// Pas hier iets aan en herlaad de pagina; de rest van de code leest alleen uit CONFIG.

export const CONFIG = {
  version: 10,   // ophogen bij elke nieuwe versie; staat onderin de rugzak

  render: {
    maxDpr: 2,          // hogere pixeldichtheid ziet er scherper uit maar kost prestaties
    viewTilesWide: 6.5, // hoeveel tegels je ongeveer in de breedte ziet (bepaalt de zoom)
    minZoom: 0.45,
    maxZoom: 1.3,       // verder inzoomen maakt de graphics wazig
  },

  iso: {
    tileW: 128,         // breedte van een tegel in wereldpixels
    tileH: 64,          // hoogte van de bovenkant van een tegel
    blockDepth: 64,     // hoogte van een blok (echte kubus: gelijk aan tileH)
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

  // ---------- afbrokkelen en ankers ----------

  crumble: {
    startDay: 2,                    // vanaf deze dag brokkelen randen af
    intervalMs: [30000, 50000],     // tijd tussen twee nieuwe barsten
    nightFactor: 0.7,               // 's nachts sneller
    crackMs: 30000,                 // barsten zichtbaar, nog rustig
    shakeMs: 10000,                 // trillen en gruis: laatste kans
    minTiles: 8,                    // kleiner wordt het eiland nooit
    repairCost: [{ puin: 1 }, { wrakhout: 2 }],   // eerste die je kunt betalen
    fallDamage: 2,                  // als je op een vallende tegel staat
  },

  anchor: {
    radius: 0.3,
    range: [0, 2.2, 3.2, 4.5],      // bereik in tegels per niveau
    upgradeCost: [null, null, { roest: 6, leegtekristal: 1 }, { roest: 8, leegtekristal: 3 }],
    buildBonus: 0.03,               // +3% bereik per level Bouwen
  },

  // ---------- verre eilanden, bruggen en de Kern ----------

  // Elk eiland: plek (offset in tegels t.o.v. het starteiland), grondsoort en indeling.
  // '#' grond, 'W' wrakhoop, 'K' kristalader, 'S' sterrenader, 'N' briefje (nummer in notes), 'X' de Kern
  islands: [
    {
      id: 'asveld', name: 'Het Asveld', kind: 'ash', offset: [10, 0], note: 2,
      arrive: 'Het Asveld. Het ruikt naar verbrand metaal en oude beslissingen.',
      layout: [
        '.###.',
        '##W##',
        '#N###',
        '.##W#',
        '..##.',
      ],
    },
    {
      id: 'kristalklip', name: 'De Kristalklip', kind: 'crystal', offset: [0, 10], note: 3,
      arrive: 'De Kristalklip. De stenen zoemen. Je tanden ook.',
      layout: [
        '.##..',
        '##K#.',
        '#S#N#',
        '.#K##',
        '..##.',
      ],
    },
    {
      id: 'kern', name: 'De Kern', kind: 'ruin', offset: [10, 10], note: 4,
      arrive: 'De Kern. Hier begon het. Hier eindigt het, hoe dan ook.',
      layout: [
        '..###..',
        '.#####.',
        '###N###',
        '###X###',
        '#######',
        '.#####.',
        '..###..',
      ],
    },
  ],

  // Grondstof-aders op de verre eilanden. hits per houweel-niveau (0 = kan niet)
  nodes: {
    wrak:        { name: 'Wrakhoop',     item: 'roest',         amount: [1, 2], hits: [0, 4, 3, 2, 2], regrowMs: 2500 },
    kristalader: { name: 'Kristalader',  item: 'leegtekristal', amount: [1, 1], hits: [0, 0, 6, 4, 3], regrowMs: 4500 },
    sterrenader: { name: 'Sterrenader',  item: 'sterrenstof',   amount: [1, 1], hits: [0, 0, 0, 6, 5], regrowMs: 5500 },
  },

  boss: {
    name: 'De Hoeder van de Kern',
    hp: 300,
    damage: 2,              // bij aanraking
    speed: 0.7,
    radius: 0.55,
    attackMs: 1800,
    slamEveryMs: [5200, 3600],     // fase 1, fase 2
    slamWarnMs: 1200,
    slamRadius: 1.4,
    slamDamage: 4,
    summonEveryMs: [13000, 8000],
    summonCount: [2, 3],
    boltEveryMs: 2600,             // alleen fase 2
    boltDamage: 2,
    phase2At: 0.5,
    reward: { sterrenstof: 10, leegtekristal: 6 },
    cycleGrowth: 0.3,              // per prestige-cyclus sterker
  },

  // ---------- prestige ----------

  prestige: {
    choices: 3,     // zoveel bonussen om uit te kiezen
    bonuses: [
      { id: 'hakken', name: 'Zware armen',     text: '+20% hakkracht',            value: 0.2 },
      { id: 'delven', name: 'Stenen vuisten',  text: '+20% delfkracht',           value: 0.2 },
      { id: 'anker',  name: 'Diepe wortels',   text: '+25% ankerbereik',          value: 0.25 },
      { id: 'hart',   name: 'Taai vel',        text: '+2 levens',                 value: 2 },
      { id: 'schade', name: 'Wrok',            text: '+20% wapenschade',          value: 0.2 },
      { id: 'buit',   name: 'Aaseter',         text: '+1 buit van drijvend wrak', value: 1 },
    ],
  },

  chest: { radius: 0.3 },
  workbench: { radius: 0.34 },

  tools: {
    axe:     ['Handen', 'Houten bijl', 'Stenen bijl', 'Roestige bijl'],
    pickaxe: ['Geen houweel', 'Houten houweel', 'Stenen houweel', 'Roestig houweel'],
    weapon:  ['Vuisten', 'Houten knuppel', 'Puinhamer', 'Roestzwaard', 'Leegtezwaard', 'Sterrenzwaard'],
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
    weaponDamage: [1, 2, 3, 5, 8, 13],   // per wapenniveau
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
    anker:          { name: 'Anker',          place: 'object' },
    brug:           { name: 'Brug',           place: 'tile', tile: 'bridge' },
    sterrenbrug:    { name: 'Sterrenbrug',    place: 'tile', tile: 'starbridge' },
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
    { id: 'anker',          at: 'werkbank', cost: { roest: 5, puin: 3 },             gives: { item: 'anker', amount: 1 } },
    { id: 'brug',           at: 'werkbank', cost: { wrakhout: 2, roest: 1 },         gives: { item: 'brug', amount: 2 } },
    { id: 'sterrenbrug',    at: 'werkbank', cost: { sterrenstof: 2, roest: 2 },      gives: { item: 'sterrenbrug', amount: 1 } },
    { id: 'wapen5',         at: 'werkbank', cost: { sterrenstof: 5, leegtekristal: 4 }, gives: { tool: 'weapon', tier: 5 } },
  ],
};
