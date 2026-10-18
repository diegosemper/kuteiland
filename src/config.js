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

  // Lijsten per gereedschapsniveau: [zonder, hout, steen]
  tree: {
    hitsPerYield: [4, 3, 2],   // slagen per opbrengst
    woodPerYield: [1, 1, 2],   // wrakhout per opbrengst
    radius: 0.3,
  },

  generator: {
    hitsPerYield: [0, 4, 3],   // 0 = kan niet zonder houweel
    puinPerYield: [0, 1, 2],
    regrowMs: 1500,            // hoe snel er een nieuwe steen groeit
    radius: 0.34,
  },

  chest: { radius: 0.3 },
  workbench: { radius: 0.34 },

  tools: {
    axe:     ['Handen', 'Houten bijl', 'Stenen bijl'],
    pickaxe: ['Geen houweel', 'Houten houweel', 'Stenen houweel'],
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
  ],
};
