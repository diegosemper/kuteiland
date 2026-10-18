// Maakt een object in de wereld op basis van opgeslagen gegevens ({ type, gx, gy, ... }).
import { Tree } from './Tree.js';
import { Chest } from './Chest.js';
import { Workbench } from './Workbench.js';
import { Generator } from './Generator.js';

// Welk object hoort bij welk plaatsbaar item
export const ITEM_TO_OBJECT = {
  werkbank: 'workbench',
  steengenerator: 'generator',
};

export function createObject(scene, data) {
  switch (data.type) {
    case 'tree': return new Tree(scene, data.gx, data.gy, data);
    case 'chest': return new Chest(scene, data.gx, data.gy);
    case 'workbench': return new Workbench(scene, data.gx, data.gy);
    case 'generator': return new Generator(scene, data.gx, data.gy);
    default: return null;
  }
}
