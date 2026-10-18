// Alle balansgetallen en instellingen op één plek.
// Pas hier iets aan en herlaad de pagina; de rest van de code leest alleen uit CONFIG.

export const CONFIG = {
  version: 15,   // ophogen bij elke nieuwe versie; staat onderin de rugzak

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
    hitsPerYield: [4, 3, 2, 2, 1.6, 1.2],   // slagen per opbrengst (skill Hakken maakt elke slag sterker)
    woodPerYield: [1, 1, 2, 3, 4, 5],       // wrakhout per opbrengst
    radius: 0.3,
  },

  generator: {
    hitsPerYield: [0, 4, 3, 2, 1.6, 1.2],   // 0 = kan niet zonder houweel
    puinPerYield: [0, 1, 2, 2, 3, 4],
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
      id: 'kern', name: 'De Kern', kind: 'ruin', offset: [10, 10], note: 4, ring: 1,
      arrive: 'De Kern. Hier begon het. Vier zegels houden het hart dicht.',
      layout: [
        '..###..',
        '.#####.',
        '###N###',
        '###X###',
        '#######',
        '.###O#.',
        '..###..',
      ],
    },
    // ring 2: verder weg, zwaarder, met een bewaker per eiland
    {
      id: 'zwavelklif', name: 'Het Zwavelklif', kind: 'sulfur', offset: [21, -2], note: 6, ring: 2, boss: 'zwavel',
      arrive: 'Het Zwavelklif. Het stinkt naar rotte eieren en slechte ideeën.',
      layout: [
        '.###.',
        '##Z##',
        '#ZAN#',
        '##Z##',
        '.###.',
      ],
    },
    {
      id: 'paddenbos', name: 'Het Paddenbos', kind: 'mycelium', offset: [-2, 21], note: 7, ring: 2, boss: 'padde',
      arrive: 'Het Paddenbos. De paddenstoelen zijn groter dan jij. En ze kijken.',
      layout: [
        '.###.',
        '#M#M#',
        '##A##',
        '#MN##',
        '.###.',
      ],
    },
    {
      id: 'ijsrots', name: 'De IJsrots', kind: 'snow', offset: [-13, 4], note: 8, ring: 2, boss: 'ijs',
      arrive: 'De IJsrots. Koud. Zelfs de leegte rilt hier.',
      layout: [
        '.###.',
        '##I##',
        '#IAN#',
        '##I##',
        '.###.',
      ],
    },
    // ring 3: het verste en zwaarste
    {
      id: 'echokloof', name: 'De Echokloof', kind: 'sculk', offset: [22, 21], note: 9, ring: 3, boss: 'echo',
      arrive: 'De Echokloof. Elke stap die je zet, hoor je twee keer. De tweede keer niet van jou.',
      layout: [
        '..###..',
        '.##E##.',
        '##E#E##',
        '###A##N',
        '##E#E##',
        '.#####.',
        '..###..',
      ],
    },
  ],

  // Grondstof-aders op de verre eilanden. hits per houweel-niveau (0 = kan niet)
  nodes: {
    wrak:        { name: 'Wrakhoop',     item: 'roest',         amount: [1, 2], hits: [0, 4, 3, 2, 2, 1.5], regrowMs: 2500, tool: 'hook' },
    kristalader: { name: 'Kristalader',  item: 'leegtekristal', amount: [1, 1], hits: [0, 0, 6, 4, 3, 2], regrowMs: 4500 },
    sterrenader: { name: 'Sterrenader',  item: 'sterrenstof',   amount: [1, 1], hits: [0, 0, 0, 6, 5, 4], regrowMs: 5500 },
    zwavelader:  { name: 'Zwavelader',   item: 'zwavel',        amount: [1, 2], hits: [0, 0, 0, 5, 4, 3], regrowMs: 4000 },
    paddenstoel: { name: 'Reuzenpaddenstoel', item: 'wrakhout', amount: [3, 6], hits: [0, 0, 0, 3, 2, 2], regrowMs: 3000 },
    ijsader:     { name: 'IJsader',      item: 'sterrenstof',   amount: [1, 2], hits: [0, 0, 0, 0, 5, 4], regrowMs: 5000 },
    zielenader:  { name: 'Zielenader',   item: 'zielenkristal', amount: [1, 1], hits: [0, 0, 0, 0, 7, 5], regrowMs: 7000 },
  },

  // Zegels: zoveel bewakers moet je verslaan voor het hart opengaat
  kernSeals: 4,

  // Bewakers op ring 2 en 3. Steeds opnieuw op te roepen bij hun altaar.
  bewakers: {
    zwavel: { name: 'De Zwavelvreter', hp: 450, damage: 3, tint: 0xfff080, scale: 1.3, reward: { zwavel: 12, zielenkristal: 2 }, heartChance: 0.2 },
    padde:  { name: 'De Sporenmoeder', hp: 600, damage: 3, tint: 0xd8a0ff, scale: 1.35, reward: { wrakhout: 60, zwavel: 6, zielenkristal: 2 }, heartChance: 0.25 },
    ijs:    { name: 'De Vrieskoning', hp: 800, damage: 4, tint: 0xa8e0ff, scale: 1.4, reward: { sterrenstof: 12, zielenkristal: 3 }, heartChance: 0.3 },
    echo:   { name: 'De Echo', hp: 1300, damage: 5, tint: 0x60ffd8, scale: 1.55, reward: { zielenkristal: 8, leegtekristal: 10 }, heartChance: 0.6 },
  },

  boss: {
    name: 'De Hoeder van de Kern',
    hp: 1500,
    damage: 4,              // bij aanraking
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
    reward: { sterrenstof: 15, leegtekristal: 10, zielenkristal: 10, leegtehart: 2 },
    cycleGrowth: 0.3,              // per prestige-cyclus sterker
  },

  // ---------- automatisering ----------

  // Machines maken iets zolang het spel open is. Niveau 1 t/m 5: sneller en meer opslag.
  machines: {
    maxTier: 5,
    speed: [0, 1, 1.35, 1.8, 2.4, 3.2],
    storage: [0, 1, 1.5, 2.2, 3.2, 5],
    types: {
      zaagmolen:   { name: 'Zaagmolen',   item: 'wrakhout',      everyMs: 8000,  store: 30, glow: '#d89a50' },
      steenmaler:  { name: 'Steenmaler',  item: 'puin',          everyMs: 11000, store: 30, glow: '#c8c8c8' },
      roestvanger: { name: 'Roestvanger', item: 'roest',         everyMs: 16000, store: 20, glow: '#e07a40' },
      kristalpers: { name: 'Kristalpers', item: 'leegtekristal', everyMs: 40000, store: 12, glow: '#b48cff' },
      zwavelpomp:  { name: 'Zwavelpomp',  item: 'zwavel',        everyMs: 24000, store: 16, glow: '#f0d830' },
      sterrenzeef: { name: 'Sterrenzeef', item: 'sterrenstof',   everyMs: 50000, store: 10, glow: '#fff4c0' },
    },
  },

  // ---------- versterken op het aambeeld ----------

  upgrades: {
    max: 10,
    per: { axe: 0.1, pickaxe: 0.1, weapon: 0.12, armor: 0.02 },   // per +1
  },

  // ---------- de Diepte: eindeloze golven bij de Kern ----------

  depth: {
    crawlers: [3, 1],        // 3 + 1 per diepte
    brutesEvery: 3,          // elke 3 dieptes een brute extra
    strength: 0.7,           // wezens zijn zo sterk als nacht 2 + diepte * dit
    breakMs: 4000,           // adempauze tussen golven
  },

  // ---------- cyclusregels: elke nieuwe cyclus één ----------

  cycleMods: [
    { id: 'woest',  name: 'Woeste nachten',   text: '50% meer nachtwezens, +15% schade', mod: { 'enemy.count': 0.5, damage: 0.15 } },
    { id: 'honger', name: 'Hongerige leegte', text: 'Randen brokkelen sneller af, ankers reiken verder', mod: { 'crumble.speed': 0.6, anchor: 0.25 } },
    { id: 'rijk',   name: 'Rijk wrak',        text: 'Veel meer drijvend wrak en buit', mod: { 'drift.rate': 0.6, 'drift.loot': 0.5 } },
    { id: 'gul',    name: 'Gulle bomen',      text: '+1 wrakhout per opbrengst, één hartje minder', mod: { 'yield.wrakhout': 1, hp: -2 } },
    { id: 'dun',    name: 'Dunne lucht',      text: 'Twee hartjes minder, +35% schade', mod: { hp: -4, damage: 0.35 } },
    { id: 'diep',   name: 'Diepe aders',      text: 'Meer opbrengst uit generator en aders', mod: { 'yield.puin': 1, 'yield.roest': 0.5, 'yield.leegtekristal': 0.3 } },
  ],

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
    axe:     ['Handen', 'Houten bijl', 'Stenen bijl', 'Roestige bijl', 'Kristallen bijl', 'Zielenbijl'],
    pickaxe: ['Geen houweel', 'Houten houweel', 'Stenen houweel', 'Roestig houweel', 'Kristallen houweel', 'Zielenhouweel'],
    weapon:  ['Vuisten', 'Houten knuppel', 'Puinhamer', 'Roestzwaard', 'Leegtezwaard', 'Sterrenzwaard', 'Zielenzwaard'],
    armor:   ['Geen harnas', 'Houten harnas', 'Roestharnas', 'Kristalharnas', 'Sterrenharnas', 'Zielenharnas'],
    hook:    ['Geen grijphaak', 'Touwhaak', 'Roesthaak', 'Kristalhaak', 'Sterrenhaak'],
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
    weaponDamage: [1, 2, 3, 5, 8, 13, 20],   // per wapenniveau
    armorReduction: [0, 0.1, 0.2, 0.32, 0.45, 0.58],   // minder schade per harnasniveau
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
  // Nodig voor level L+1: base * (L+1)^exp. Level 50 kost tientallen uren per skill.
  skillCurve: { base: 10, exp: 1.7, max: 50 },
  // Per level een kleine bonus; elke 10 levels een mijlpaal (mod = blijvende bonus, zie Mods.js)
  // ---------- minigames ----------
  // Bronnen starten een minigame. Hoe goed je speelt bepaalt de opbrengst;
  // je gereedschap bepaalt hoe makkelijk het is (zie perks hieronder).
  minigames: {
    // welke minigame hoort bij welke bron
    sources: {
      tree: 'hakken',
      generator: 'delven',
      source: { magneet: 'grijphaak', boor: 'afdaling' },
      node: {
        wrak: 'grijphaak', kristalader: 'afdaling', sterrenader: 'arena', zwavelader: 'delven',
        paddenstoel: 'hakken', ijsader: 'delven', zielenader: 'afdaling',
      },
    },
    // welke zijn al echt gebouwd; de rest draait voorlopig als 'proef'
    built: ['hakken', 'delven', 'grijphaak', 'afdaling'],
    skill: { hakken: 'hakken', delven: 'delven', grijphaak: 'delven', afdaling: 'delven', arena: 'vechten' },
    tool: { hakken: 'axe', delven: 'pickaxe', grijphaak: 'hook', afdaling: 'armor', arena: 'weapon' },
    name: { hakken: 'Hakken', delven: 'Delven', grijphaak: 'Grijphaak', afdaling: 'Afdaling', arena: 'Arena' },

    // Hakken: elke ronde hak je stammen om. Elke stam is taaier dan de vorige.
    hakken: {
      name: 'Hakken',
      timeMs: 45000,
      zone: 0.17,             // goede zone als deel van de balk
      zonePerLevel: 0.003,    // skill Hakken: zone breder per level
      zoneMax: 0.36,
      perfect: 0.28,          // gouden kern als deel van de zone (dubbele kracht)
      speed: 0.6,             // balklengtes per seconde
      speedPerCombo: 0.05,
      speedMax: 2.4,
      comboStep: 5,           // elke 5 raak op rij: +1 kracht per slag
      tapCooldownMs: 110,
      logHp: 8,               // eerste stam
      logHpGrow: 5,           // elke volgende stam zoveel taaier
      perLog: 2,              // hout per omgehakte stam (paddenstoel: zie nodes.amount)
      xpPerHit: 1,
      skyTop: 0x1d1430, skyBottom: 0x0a060f,
    },

    // Delven: graaf van boven naar beneden. Gebarsten stenen storten in als je eronder graaft.
    delven: {
      name: 'Delven',
      timeMs: 60000,
      cols: 7,
      lives: 3,
      tapCooldownMs: 70,
      hpDirt: 1,
      hpStone: 2,
      hpDeep: 3,              // diepsteen vanaf deepFrom
      deepFrom: 12,
      hpPerRows: 10,          // elke zoveel rijen +1 hardheid
      ore: 0.13,              // kans op een ader van de hoofdgrondstof
      orePerRow: 0.004,
      unstable: 0.07,         // kans op een gebarsten steen
      unstablePerRow: 0.005,
      unstableMax: 0.22,
      collapseMs: 650,        // zo lang wiebelt hij voor hij valt
      crackAlpha: 0.3,        // hoe goed je barsten ziet zonder skill
      crackPerLevel: 0.02,    // skill Delven: barsten beter zichtbaar
      // zeldzame vondsten: [grondstof, vanaf rij, kans, blok]
      rare: [
        ['roest', 6, 0.035, 'rust_ore'],
        ['leegtekristal', 14, 0.022, 'deepslate_amethyst'],
        ['sterrenstof', 22, 0.014, 'star_ore'],
        ['zielenkristal', 32, 0.008, 'soul_ore'],
      ],
      scoreRow: 5, scoreOre: 10, scoreRare: 40,
      xpPerBlock: 0.5,
      skyTop: 0x15101c, skyBottom: 0x07050a,
    },

    // Grijphaak: wrakstukken drijven voorbij. Mik, schiet, binnenhalen. Klein en snel = meer buit.
    grijphaak: {
      name: 'Grijphaak',
      timeMs: 50000,
      spawnMs: [700, 1300],
      hookSpeed: 950,         // pixels per seconde (x schaal)
      catchRadius: 30,        // basis, x perk
      reelMs: 550,
      // soorten wrak: grootte, snelheid (schermbreedtes per seconde), buit en kans
      kinds: [
        { tex: 'drift_crate',  scale: 1.5, speed: [0.10, 0.16], loot: { roest: 1, puin: 1 }, points: 1, weight: 4 },
        { tex: 'drift_scrap',  scale: 1.1, speed: [0.16, 0.26], loot: { roest: 2 },          points: 2, weight: 4 },
        { tex: 'drift_branch', scale: 1.0, speed: [0.18, 0.28], loot: { wrakhout: 2 },       points: 1, weight: 2 },
        { tex: 'drift_scrap',  scale: 0.6, speed: [0.32, 0.46], loot: { roest: 4 },          points: 4, weight: 2 },
        { tex: 'mg_shard',     scale: 0.8, speed: [0.40, 0.55], loot: { leegtekristal: 1 },  points: 6, weight: 0.6, glow: 0xb48cff },
      ],
      xpPerCatch: 1,
      skyTop: 0x0f0c22, skyBottom: 0x05040c,
    },

    // Afdaling: val door je eigen boorgat de leegte in. Ontwijk, verzamel kristallen,
    // en druk op TERUG voordat iets je raakt. Geraakt = alles van deze duik kwijt.
    afdaling: {
      name: 'Afdaling',
      fallSpeed: 0.32,        // schermhoogtes per seconde aan het begin
      fallGrow: 0.012,        // erbij per seconde
      fallMax: 1.1,
      follow: 12,             // hoe snel je je vinger volgt
      spawnEvery: 0.16,       // schermhoogte tussen twee rijen dingen
      crystal: 0.55,          // kans per rij op een kristal
      obstacle: 0.45,         // kans per rij op een obstakel (groeit met diepte)
      obstacleGrow: 0.0004,   // per meter
      creature: 0.18,         // deel van de obstakels dat een wezen is (beweegt)
      metersPerScreen: 40,
      valueEvery: 150,        // elke zoveel meter is een kristal 1 meer waard
      star: [400, 0.05],      // vanaf zoveel meter: kans dat een kristal sterrenstof is
      magnetRange: 70,        // pixels x schaal (harnas-perk)
      hitRadius: 26,
      xpPer100m: 2,
      skyTop: 0x120a24, skyBottom: 0x030208,
    },

    proef: {
      name: 'Proef',
      timeMs: 20000,
      spawnMs: 650,
      lifeMs: 1300,
      yieldMult: 1.6,
      xpPerHit: 1,
    },

    // Wat elk gereedschapsniveau doet in zijn minigame. Effecten stapelen: een hoger niveau
    // houdt alles van de niveaus eronder. 'short' staat op het startscherm en bij de werkbank.
    perks: {
      axe: [
        { lives: 2, damage: 1, short: '2 levens' },
        { lives: 3, damage: 2, short: '3 levens, kracht 2' },
        { damage: 3, zoneMult: 1.35, short: 'kracht 3, brede zone' },
        { damage: 4, slowInZone: 0.45, short: 'kracht 4, pijl plakt in het groen' },
        { damage: 5, perfectMult: 2, short: 'kracht 5, gouden zone x2' },
        { damage: 7, forgive: 1, short: 'kracht 7, eerste misser vergeven' },
      ],
      pickaxe: [
        { damage: 0, short: '' },
        { damage: 1, short: 'kracht 1' },
        { damage: 2, short: 'kracht 2' },
        { damage: 2, seeCracks: true, short: 'je ziet elke barst' },
        { damage: 3, pierce: true, short: 'kracht 3, slaat door naar het blok eronder' },
        { damage: 4, shield: 1, short: 'kracht 4, eerste instorting tegengehouden' },
      ],
      hook: [
        { shots: 0, short: '' },
        { shots: 7, short: '7 schoten' },
        { shots: 9, short: '9 schoten' },
        { catchMult: 1.5, short: 'grote haak, vangt makkelijker' },
        { speedMult: 1.6, pierce: true, short: 'snelle haak, pakt twee in één schot' },
      ],
      armor: [
        { shields: 0, short: 'één klap en alles is weg' },
        { shields: 1, short: 'vangt één klap op' },
        { magnet: true, short: 'trekt kristallen naar je toe' },
        { shields: 2, short: 'vangt twee klappen op' },
        { slowFall: 0.8, short: 'je valt rustiger' },
        { keepHalf: true, short: 'geraakt? Je houdt de helft' },
      ],
      weapon: [{ short: '' }],
    },
  },

  // Verre eilanden aan of uit (uit sinds 'Het Lek': alles op je eigen eiland)
  remoteIslands: false,
  // kans per minigame-ronde dat je een verhaalbriefje vindt (zolang er nog zijn)
  noteFindChance: 0.22,
  noteFindOrder: [2, 3, 4, 6, 7, 8, 9],

  // ---------- bronnen ----------
  // Bouw ze zelf en zet ze neer. Elke bron opent zijn eigen minigame.
  // spot: 'edge' = aan de rand van het eiland, 'inner' = alle buren zijn eiland
  sources: {
    magneet: { name: 'Roestmagneet', item: 'roest', label: 'TREK', spot: 'edge' },
    boor:    { name: 'Kristalboor',  item: 'leegtekristal', label: 'BOOR', spot: 'inner' },
  },

  // ---------- ontdekkingen ----------
  // Wat je naast een bron zet, verandert wat hij doet. near: tegel (tile) of object (object) binnen 1 tegel.
  // effect wordt in de minigame gebruikt; hint staat in het boek zolang je hem nog niet hebt.
  discoveries: [
    { id: 'lichtboom',   source: 'tree',      near: { object: 'lamp' },           name: 'Lichtboom',
      hint: 'De boom groeit scheef. Naar iets dat brandt.', effect: { perLogBonus: 1 }, text: 'Hakken: +1 hout per stam' },
    { id: 'ijzersteen',  source: 'generator', near: { tile: 'ironblock' },        name: 'IJzersteen',
      hint: 'Steen die te lang naast metaal ligt, gaat erop lijken.', effect: { oreItem: 'roest' }, text: 'Delven: aders geven roest in plaats van puin' },
    { id: 'kristalsteen', source: 'generator', near: { tile: 'amethystblock' },   name: 'Kristalsteen',
      hint: 'Een generator die naar paars staart, droomt paars.', effect: { rareMult: 3 }, text: 'Delven: zeldzame vondsten 3x zo vaak' },
    { id: 'houtvuur',    source: 'generator', near: { tile: 'logs' },             name: 'Houtgestookt',
      hint: 'Warmte maakt steen zacht. Hout maakt warmte.', effect: { timeBonus: 15000 }, text: 'Delven: 15 seconden langer' },
    { id: 'zwaremagneet', source: 'magneet',  near: { tile: 'ironblock' },        name: 'Zware magneet',
      hint: 'Een magneet trekt harder als hij iets heeft om tegen te leunen.', effect: { lootBonus: 1 }, text: 'Grijphaak: +1 roest per vangst' },
    { id: 'lokkristal',  source: 'magneet',   near: { object: 'lamp', crystal: true }, name: 'Lokkristal',
      hint: 'Kristal roept kristal. Zet er een licht bij dat erop lijkt.', effect: { shardMult: 4 }, text: 'Grijphaak: kristalscherven 4x zo vaak' },
    { id: 'obsidiaanboor', source: 'boor',    near: { tile: 'obsidianblock' },    name: 'Obsidiaanboor',
      hint: 'De boor wil dieper. Geef hem iets dat uit de diepte komt.', effect: { valueMult: 2, dangerMult: 1.35 }, text: 'Afdaling: kristallen dubbel waard, maar gevaarlijker' },
    { id: 'kwartsboor',  source: 'boor',      near: { tile: 'quartzblock' },      name: 'Kwartsboor',
      hint: 'Wit kwarts vangt sterrenlicht. Ook onder de grond.', effect: { starMult: 4 }, text: 'Afdaling: sterrenstof 4x zo vaak' },
  ],

  skills: {
    hakken: {
      name: 'Hakken', xp: 1, power: 0.04, double: 0.015,       // xp per slag
      milestones: {
        10: { mod: { 'yield.wrakhout': 1 }, text: '+1 wrakhout per opbrengst' },
        20: { mod: { 'double.hakken': 0.1 }, text: '+10% kans op dubbel hout' },
        30: { mod: { 'yield.wrakhout': 1 }, text: 'Nog eens +1 wrakhout' },
        40: { mod: { 'xp.hakken': 0.25 }, text: '+25% Hakken-xp' },
        50: { mod: { 'yield.wrakhout': 2 }, text: 'Meester-houthakker: +2 wrakhout' },
      },
    },
    delven: {
      name: 'Delven', xp: 2, power: 0.04, double: 0.015,
      milestones: {
        10: { mod: { 'yield.puin': 1 }, text: '+1 puin per opbrengst' },
        20: { mod: { 'double.delven': 0.1 }, text: '+10% kans op dubbele opbrengst' },
        30: { mod: { 'yield.roest': 1, 'yield.leegtekristal': 0.25 }, text: 'Meer roest en kristal uit aders' },
        40: { mod: { 'xp.delven': 0.25 }, text: '+25% Delven-xp' },
        50: { mod: { 'yield.sterrenstof': 1, 'yield.puin': 2 }, text: 'Meester-delver: meer sterrenstof en puin' },
      },
    },
    bouwen: {
      name: 'Bouwen', xpTile: 6, xpObject: 10, xpCraft: 1, free: 0.012,
      milestones: {
        10: { mod: { anchor: 0.15 }, text: '+15% ankerbereik' },
        20: { mod: { free: 0.1 }, text: '+10% kans op gratis extra blok' },
        30: { mod: { anchor: 0.25 }, text: '+25% ankerbereik' },
        40: { mod: { 'xp.bouwen': 0.25 }, text: '+25% Bouwen-xp' },
        50: { mod: { anchor: 0.5, free: 0.15 }, text: 'Meesterbouwer: groot bereik, veel gratis blokken' },
      },
    },
    vechten: {
      name: 'Vechten', xp: 3, xpKill: 10, damage: 0.03, heartEvery: 5,
      milestones: {
        10: { mod: { damage: 0.15 }, text: '+15% schade' },
        20: { mod: { hp: 4 }, text: '+2 hartjes' },
        30: { mod: { damage: 0.25 }, text: '+25% schade' },
        40: { mod: { hp: 6 }, text: '+3 hartjes' },
        50: { mod: { damage: 0.5 }, text: 'Leegtejager: +50% schade' },
      },
    },
  },

  // Collecties: hoeveel je in totaal verzamelde. Elk niveau geeft een recept of een blijvende bonus.
  collections: {
    thresholds: [25, 100, 250, 750, 2000, 5000, 15000, 50000],
    items: {
      wrakhout: [
        { recipe: 'houtblok' },
        { mod: { 'xp.hakken': 0.1 }, text: '+10% Hakken-xp' },
        { mod: { 'yield.wrakhout': 0.25 }, text: '25% kans op extra wrakhout' },
        { recipe: 'zaagmolen' },
        { mod: { 'double.hakken': 0.05, 'drift.rate': 0.15 }, text: '+5% dubbel hout, +15% drijvend wrak' },
        { mod: { 'yield.wrakhout': 0.5 }, text: '50% kans op extra wrakhout' },
        { mod: { 'xp.hakken': 0.2 }, text: '+20% Hakken-xp' },
        { mod: { 'yield.wrakhout': 1 }, text: '+1 wrakhout per opbrengst' },
      ],
      puin: [
        { recipe: 'bakstenen' },
        { mod: { 'xp.delven': 0.1 }, text: '+10% Delven-xp' },
        { mod: { 'yield.puin': 0.25 }, text: '25% kans op extra puin' },
        { recipe: 'steenmaler' },
        { mod: { 'double.delven': 0.05, anchor: 0.1 }, text: '+5% dubbele opbrengst, +10% ankerbereik' },
        { mod: { 'yield.puin': 0.5 }, text: '50% kans op extra puin' },
        { mod: { 'xp.delven': 0.2 }, text: '+20% Delven-xp' },
        { mod: { 'yield.puin': 1 }, text: '+1 puin per opbrengst' },
      ],
      roest: [
        { mod: { 'drift.loot': 0.25 }, text: '25% kans op extra buit uit wrak' },
        { recipe: 'ijzerblok' },
        { recipe: 'roestvanger' },
        { mod: { 'drift.rate': 0.2 }, text: '+20% drijvend wrak' },
        { mod: { 'yield.roest': 0.5 }, text: '50% kans op extra roest' },
        { mod: { damage: 0.05 }, text: '+5% schade' },
        { mod: { 'drift.loot': 1 }, text: '+1 buit uit drijvend wrak' },
        { mod: { 'yield.roest': 1 }, text: '+1 roest per opbrengst' },
      ],
      leegtekristal: [
        { recipe: 'amethistblok' },
        { mod: { hp: 2 }, text: '+1 hartje' },
        { recipe: 'lichtblok' },
        { recipe: 'kristalpers' },
        { mod: { 'xp.vechten': 0.2 }, text: '+20% Vechten-xp' },
        { recipe: 'obsidiaanblok' },
        { mod: { hp: 4 }, text: '+2 hartjes' },
        { mod: { damage: 0.2 }, text: '+20% schade' },
      ],
      sterrenstof: [
        { recipe: 'kwartsblok' },
        { mod: { 'yield.sterrenstof': 0.25 }, text: '25% kans op extra sterrenstof' },
        { mod: { 'xp.delven': 0.15, 'xp.hakken': 0.15 }, text: '+15% Hakken- en Delven-xp' },
        { recipe: 'sterrenzeef' },
        { mod: { 'yield.sterrenstof': 0.5 }, text: '50% kans op extra sterrenstof' },
        { mod: { damage: 0.15 }, text: '+15% schade' },
        { mod: { hp: 4 }, text: '+2 hartjes' },
        { mod: { 'yield.sterrenstof': 1 }, text: '+1 sterrenstof per opbrengst' },
      ],
      zwavel: [
        { mod: { 'yield.zwavel': 0.25 }, text: '25% kans op extra zwavel' },
        { recipe: 'zwavelpomp' },
        { mod: { 'xp.delven': 0.1 }, text: '+10% Delven-xp' },
        { mod: { 'yield.zwavel': 0.5 }, text: '50% kans op extra zwavel' },
        { mod: { damage: 0.1 }, text: '+10% schade' },
        { mod: { 'yield.zwavel': 1 }, text: '+1 zwavel per opbrengst' },
        { mod: { 'crumble.speed': -0.2 }, text: 'Randen brokkelen 20% trager af' },
        { mod: { 'yield.zwavel': 1, 'yield.puin': 1 }, text: '+1 zwavel en puin per opbrengst' },
      ],
      zielenkristal: [
        { mod: { hp: 2 }, text: '+1 hartje' },
        { mod: { damage: 0.1 }, text: '+10% schade' },
        { mod: { 'yield.zielenkristal': 0.2 }, text: '20% kans op extra zielenkristal' },
        { mod: { hp: 4 }, text: '+2 hartjes' },
        { mod: { 'xp.vechten': 0.25 }, text: '+25% Vechten-xp' },
        { mod: { damage: 0.2 }, text: '+20% schade' },
        { mod: { 'yield.zielenkristal': 0.5 }, text: '50% kans op extra zielenkristal' },
        { mod: { hp: 6, damage: 0.25 }, text: '+3 hartjes en +25% schade' },
      ],
      wezens: [
        { mod: { damage: 0.05 }, text: '+5% schade' },
        { mod: { hp: 2 }, text: '+1 hartje' },
        { mod: { 'xp.vechten': 0.15 }, text: '+15% Vechten-xp' },
        { mod: { damage: 0.1 }, text: '+10% schade' },
        { mod: { hp: 2 }, text: '+1 hartje' },
        { mod: { damage: 0.15 }, text: '+15% schade' },
        { mod: { hp: 4 }, text: '+2 hartjes' },
        { mod: { damage: 0.25 }, text: '+25% schade' },
      ],
    },
    // nachtwezens tellen langzamer op: eigen drempels
    thresholdsWezens: [10, 40, 120, 300, 750, 2000, 5000, 15000],
    thresholdsZielen: [5, 20, 60, 150, 400, 1000, 2500, 6000],
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
    zwavel:         { name: 'Zwavel',         resource: true },
    zielenkristal:  { name: 'Zielenkristal',  resource: true },
    leegtehart:     { name: 'Leegtehart',     resource: true },
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
    houtblok:       { name: 'Houtblok',       place: 'tile', tile: 'logs' },
    bakstenen:      { name: 'Stenen bakstenen', place: 'tile', tile: 'bricksblock' },
    ijzerblok:      { name: 'IJzerblok',      place: 'tile', tile: 'ironblock' },
    amethistblok:   { name: 'Amethistblok',   place: 'tile', tile: 'amethystblock' },
    kwartsblok:     { name: 'Kwartsblok',     place: 'tile', tile: 'quartzblock' },
    obsidiaanblok:  { name: 'Obsidiaanblok',  place: 'tile', tile: 'obsidianblock' },
    lichtblok:      { name: 'Lichtblok',      place: 'tile', tile: 'glow' },
    roestmagneet:   { name: 'Roestmagneet',   place: 'object', spot: 'edge' },
    kristalboor:    { name: 'Kristalboor',    place: 'object', spot: 'inner' },
    aambeeld:       { name: 'Aambeeld',       place: 'object' },
    zaagmolen:      { name: 'Zaagmolen',      place: 'object' },
    steenmaler:     { name: 'Steenmaler',     place: 'object' },
    roestvanger:    { name: 'Roestvanger',    place: 'object' },
    kristalpers:    { name: 'Kristalpers',    place: 'object' },
    zwavelpomp:     { name: 'Zwavelpomp',     place: 'object' },
    sterrenzeef:    { name: 'Sterrenzeef',    place: 'object' },
  },

  // at: 'hand' = in de rugzak, 'werkbank' = bij een werkbank
  // gives: { item, amount } of { tool, tier }
  recipes: [
    { id: 'werkbank',       at: 'hand',     cost: { wrakhout: 5 },           gives: { item: 'werkbank', amount: 1 } },
    { id: 'bijl1',          at: 'werkbank', cost: { wrakhout: 8 },           gives: { tool: 'axe', tier: 1 } },
    { id: 'houweel1',       at: 'werkbank', cost: { wrakhout: 10 },          gives: { tool: 'pickaxe', tier: 1 } },
    { id: 'vlonder',        at: 'werkbank', cost: { wrakhout: 3 },           gives: { item: 'vlonder', amount: 1 } },
    { id: 'steengenerator', at: 'werkbank', cost: { wrakhout: 14 },          gives: { item: 'steengenerator', amount: 1 } },
    { id: 'puinblok',       at: 'werkbank', cost: { puin: 3 },               gives: { item: 'puinblok', amount: 1 } },
    { id: 'haak1',          at: 'werkbank', cost: { wrakhout: 12, puin: 8 }, gives: { tool: 'hook', tier: 1 } },
    { id: 'houweel2',       at: 'werkbank', cost: { wrakhout: 6, puin: 12 },  gives: { tool: 'pickaxe', tier: 2 } },
    { id: 'bijl2',          at: 'werkbank', cost: { wrakhout: 6, puin: 12 },  gives: { tool: 'axe', tier: 2 } },
    { id: 'roestmagneet',   at: 'werkbank', cost: { wrakhout: 10, puin: 14 },   gives: { item: 'roestmagneet', amount: 1 } },
    { id: 'haak2',          at: 'werkbank', cost: { wrakhout: 8, roest: 14 }, gives: { tool: 'hook', tier: 2 } },
    { id: 'houweel3',       at: 'werkbank', cost: { wrakhout: 8, puin: 10, roest: 14 }, gives: { tool: 'pickaxe', tier: 3 } },
    { id: 'bijl3',          at: 'werkbank', cost: { wrakhout: 8, puin: 10, roest: 14 }, gives: { tool: 'axe', tier: 3 } },
    { id: 'wapen1',         at: 'werkbank', cost: { wrakhout: 8 },                   gives: { tool: 'weapon', tier: 1 } },
    { id: 'wapen2',         at: 'werkbank', cost: { wrakhout: 4, puin: 12 },         gives: { tool: 'weapon', tier: 2 } },
    { id: 'wapen3',         at: 'werkbank', cost: { wrakhout: 6, roest: 16 },        gives: { tool: 'weapon', tier: 3 } },
    { id: 'wapen4',         at: 'werkbank', cost: { roest: 4, leegtekristal: 6 },    gives: { tool: 'weapon', tier: 4 } },
    { id: 'lantaarn',       at: 'werkbank', cost: { wrakhout: 5, roest: 2 },         gives: { item: 'lantaarn', amount: 1 } },
    { id: 'muur',           at: 'werkbank', cost: { puin: 5 },                       gives: { item: 'muur', amount: 1 } },
    { id: 'wachttoren',     at: 'werkbank', cost: { wrakhout: 12, puin: 12, roest: 8 }, gives: { item: 'wachttoren', amount: 1 } },
    { id: 'kristallamp',    at: 'werkbank', cost: { roest: 2, leegtekristal: 3 },    gives: { item: 'kristallamp', amount: 1 } },
    { id: 'anker',          at: 'werkbank', cost: { roest: 8, puin: 6 },             gives: { item: 'anker', amount: 1 } },
    { id: 'kristalboor',    at: 'werkbank', cost: { wrakhout: 10, puin: 16, roest: 20 }, gives: { item: 'kristalboor', amount: 1 } },
    { id: 'haak3',          at: 'werkbank', cost: { leegtekristal: 6, roest: 12 },   gives: { tool: 'hook', tier: 3 } },
    { id: 'wapen5',         at: 'werkbank', cost: { sterrenstof: 5, leegtekristal: 4 }, gives: { tool: 'weapon', tier: 5 } },
    { id: 'bijl4',          at: 'werkbank', cost: { leegtekristal: 8, sterrenstof: 2, roest: 6 },  gives: { tool: 'axe', tier: 4 } },
    { id: 'houweel4',       at: 'werkbank', cost: { leegtekristal: 8, sterrenstof: 2, roest: 6 },  gives: { tool: 'pickaxe', tier: 4 } },
    { id: 'haak4',          at: 'werkbank', cost: { sterrenstof: 6, leegtekristal: 6, roest: 10 }, gives: { tool: 'hook', tier: 4 } },
    { id: 'bijl5',          at: 'werkbank', cost: { zielenkristal: 6, leegtekristal: 10, zwavel: 6 }, gives: { tool: 'axe', tier: 5 } },
    { id: 'houweel5',       at: 'werkbank', cost: { zielenkristal: 6, leegtekristal: 10, zwavel: 6 }, gives: { tool: 'pickaxe', tier: 5 } },
    { id: 'wapen6',         at: 'werkbank', cost: { zielenkristal: 10, sterrenstof: 8, leegtehart: 1 }, gives: { tool: 'weapon', tier: 6 } },
    { id: 'harnas1',        at: 'werkbank', cost: { wrakhout: 12 },                                 gives: { tool: 'armor', tier: 1 } },
    { id: 'harnas2',        at: 'werkbank', cost: { roest: 15, puin: 10 },                          gives: { tool: 'armor', tier: 2 } },
    { id: 'harnas3',        at: 'werkbank', cost: { leegtekristal: 12, roest: 10 },                 gives: { tool: 'armor', tier: 3 } },
    { id: 'harnas4',        at: 'werkbank', cost: { sterrenstof: 10, leegtekristal: 10 },           gives: { tool: 'armor', tier: 4 } },
    { id: 'harnas5',        at: 'werkbank', cost: { zielenkristal: 12, leegtehart: 1 },             gives: { tool: 'armor', tier: 5 } },
    { id: 'aambeeld',       at: 'werkbank', cost: { roest: 20, puin: 30, leegtekristal: 4 },        gives: { item: 'aambeeld', amount: 1 } },
    // ontgrendeld via collecties
    { id: 'zaagmolen',     at: 'werkbank', cost: { wrakhout: 60, roest: 10 },                gives: { item: 'zaagmolen', amount: 1 },   requires: 'wrakhout' },
    { id: 'steenmaler',    at: 'werkbank', cost: { puin: 60, roest: 10 },                    gives: { item: 'steenmaler', amount: 1 },  requires: 'puin' },
    { id: 'roestvanger',   at: 'werkbank', cost: { roest: 40, puin: 20 },                    gives: { item: 'roestvanger', amount: 1 }, requires: 'roest' },
    { id: 'kristalpers',   at: 'werkbank', cost: { leegtekristal: 30, roest: 20 },           gives: { item: 'kristalpers', amount: 1 }, requires: 'leegtekristal' },
    { id: 'zwavelpomp',    at: 'werkbank', cost: { zwavel: 20, roest: 20 },                  gives: { item: 'zwavelpomp', amount: 1 },  requires: 'zwavel' },
    { id: 'sterrenzeef',   at: 'werkbank', cost: { sterrenstof: 30, zwavel: 10 },            gives: { item: 'sterrenzeef', amount: 1 }, requires: 'sterrenstof' },
    { id: 'houtblok',      at: 'werkbank', cost: { wrakhout: 3 },                  gives: { item: 'houtblok', amount: 1 },      requires: 'wrakhout' },
    { id: 'bakstenen',     at: 'werkbank', cost: { puin: 4 },                      gives: { item: 'bakstenen', amount: 1 },     requires: 'puin' },
    { id: 'ijzerblok',     at: 'werkbank', cost: { roest: 6 },                     gives: { item: 'ijzerblok', amount: 1 },     requires: 'roest' },
    { id: 'amethistblok',  at: 'werkbank', cost: { leegtekristal: 2 },             gives: { item: 'amethistblok', amount: 1 },  requires: 'leegtekristal' },
    { id: 'lichtblok',     at: 'werkbank', cost: { wrakhout: 2, leegtekristal: 1 }, gives: { item: 'lichtblok', amount: 1 },    requires: 'leegtekristal' },
    { id: 'kwartsblok',    at: 'werkbank', cost: { sterrenstof: 2, puin: 2 },      gives: { item: 'kwartsblok', amount: 1 },    requires: 'sterrenstof' },
    { id: 'obsidiaanblok', at: 'werkbank', cost: { leegtekristal: 4, puin: 4 },    gives: { item: 'obsidiaanblok', amount: 1 }, requires: 'leegtekristal' },
  ],
};
