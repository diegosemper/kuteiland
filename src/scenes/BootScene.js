import { generateTextures } from '../art/index.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    generateTextures(this);
    this.scene.start('Game');
  }
}
