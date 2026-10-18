// Maakt een object in de wereld op basis van opgeslagen gegevens ({ type, gx, gy, ... }).
import { Tree } from './Tree.js';
import { Chest } from './Chest.js';
import { Workbench } from './Workbench.js';
import { Generator } from './Generator.js';
import { Wall, Lamp, Tower } from './Defenses.js';
import { Grave } from './Grave.js';

// Welk object hoort bij welk plaatsbaar item
export const ITEM_TO_OBJECT = {
  werkbank: { type: 'workbench' },
  steengenerator: { type: 'generator' },
  muur: { type: 'wall' },
  lantaarn: { type: 'lamp' },
  kristallamp: { type: 'lamp', crystal: true },
  wachttoren: { type: 'tower' },
};

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
    default: return null;
  }
}
