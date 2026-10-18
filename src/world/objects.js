// Maakt een object in de wereld op basis van opgeslagen gegevens ({ type, gx, gy, ... }).
import { Tree } from './Tree.js';
import { Source } from './Source.js';
import { Chest } from './Chest.js';
import { Workbench } from './Workbench.js';
import { Generator } from './Generator.js';
import { Wall, Lamp, Tower } from './Defenses.js';
import { Grave } from './Grave.js';
import { Anchor } from './Anchor.js';
import { ResourceNode, Note, KernCore } from './Remote.js';
import { Altar, Portal, Anvil, Machine } from './Endgame.js';

// Welk object hoort bij welk plaatsbaar item
export const ITEM_TO_OBJECT = {
  werkbank: { type: 'workbench' },
  steengenerator: { type: 'generator' },
  muur: { type: 'wall' },
  lantaarn: { type: 'lamp' },
  kristallamp: { type: 'lamp', crystal: true },
  wachttoren: { type: 'tower' },
  anker: { type: 'anchor' },
  aambeeld: { type: 'anvil' },
  roestmagneet: { type: 'source', kind: 'magneet' },
  kristalboor: { type: 'source', kind: 'boor' },
  zaagmolen: { type: 'machine', machine: 'zaagmolen' },
  steenmaler: { type: 'machine', machine: 'steenmaler' },
  roestvanger: { type: 'machine', machine: 'roestvanger' },
  kristalpers: { type: 'machine', machine: 'kristalpers' },
  zwavelpomp: { type: 'machine', machine: 'zwavelpomp' },
  sterrenzeef: { type: 'machine', machine: 'sterrenzeef' },
};

// Omgekeerd: welk item krijg je terug van een object
export function itemForObject(o) {
  if (o.type === 'lamp') return o.crystal ? 'kristallamp' : 'lantaarn';
  if (o.type === 'machine') return o.machine;
  if (o.type === 'source') return Object.keys(ITEM_TO_OBJECT).find((k) => ITEM_TO_OBJECT[k].kind === o.kind) || null;
  return Object.keys(ITEM_TO_OBJECT).find((k) => ITEM_TO_OBJECT[k].type === o.type) || null;
}

export function createObject(scene, data) {
  switch (data.type) {
    case 'tree': return new Tree(scene, data.gx, data.gy, data);
    case 'chest': return new Chest(scene, data.gx, data.gy);
    case 'workbench': return new Workbench(scene, data.gx, data.gy);
    case 'generator': return new Generator(scene, data.gx, data.gy);
    case 'wall': return new Wall(scene, data.gx, data.gy);
    case 'lamp': return new Lamp(scene, data.gx, data.gy, data);
    case 'tower': return new Tower(scene, data.gx, data.gy);
    case 'grave': return new Grave(scene, data.gx, data.gy, data);
    case 'anchor': return new Anchor(scene, data.gx, data.gy, data);
    case 'node': return new ResourceNode(scene, data.gx, data.gy, data);
    case 'note': return new Note(scene, data.gx, data.gy, data);
    case 'kern': return new KernCore(scene, data.gx, data.gy);
    case 'altar': return new Altar(scene, data.gx, data.gy, data);
    case 'portal': return new Portal(scene, data.gx, data.gy);
    case 'anvil': return new Anvil(scene, data.gx, data.gy);
    case 'machine': return new Machine(scene, data.gx, data.gy, data);
    case 'source': return new Source(scene, data.gx, data.gy, data);
    default: return null;
  }
}
