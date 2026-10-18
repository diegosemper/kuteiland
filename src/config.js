// Alle balansgetallen en instellingen op één plek.
// Pas hier iets aan en herlaad de pagina; de rest van de code leest alleen uit CONFIG.

export const CONFIG = {
  render: {
    maxDpr: 2,          // hogere pixeldichtheid ziet er scherper uit maar kost prestaties
    viewTilesWide: 8,   // hoeveel tegels je ongeveer in de breedte ziet (bepaalt de zoom)
  },

  iso: {
    tileW: 32,          // breedte van een tegel in pixels
    tileH: 16,          // hoogte van de bovenkant van een tegel
    blockDepth: 8,      // dikte van een blok (de zijkant)
  },

  player: {
    speed: 2.4,              // tegels per seconde
    radius: 0.2,             // botsingsstraal, in tegels
    reach: 0.9,              // hoe ver je iets kunt raken, gemeten vanaf de rand van het object
    actionCooldownMs: 380,   // tijd tussen twee slagen als je de actieknop vasthoudt
  },

  tree: {
    hitsPerYield: 3,    // aantal slagen per opbrengst
    woodPerYield: 1,    // wrakhout per opbrengst
    radius: 0.3,
  },

  chest: {
    radius: 0.3,
  },

  save: {
    key: 'kuteiland.save.v1',
    intervalMs: 10000,
  },

  ui: {
    joystickRadius: 52,
    joystickThumb: 24,
    actionRadius: 42,
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
  items: {
    wrakhout:      { name: 'Wrakhout',      color: '#7a5c40' },
    puin:          { name: 'Puin',          color: '#6b6662' },
    roest:         { name: 'Roest',         color: '#8a4a2a' },
    leegtekristal: { name: 'Leegtekristal', color: '#9b6bff' },
    sterrenstof:   { name: 'Sterrenstof',   color: '#d8cfa0' },
  },
};
