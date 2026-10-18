// Alle vaste textures in één keer maken. Grondtegels worden door het eiland zelf gemaakt.
import { CONFIG } from '../config.js';
import { makeNoise } from '../noise.js';
import { generateProps } from './props.js';
import { generateCharacter } from './character.js';
import { generateFx } from './fx.js';
import { generateIcons } from './icons.js';

let noise = null;
export function getNoise() {
  if (!noise) noise = makeNoise(CONFIG.island.seed);
  return noise;
}

export function generateTextures(scene) {
  generateFx(scene, getNoise());
  generateProps(scene);
  generateCharacter(scene);
  generateIcons(scene);
}
