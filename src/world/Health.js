// Levens voor gebouwen die aangevallen kunnen worden, met een balkje dat alleen verschijnt bij schade.
export function addHealth(obj, scene, maxHp, barY) {
  obj.maxHp = maxHp;
  obj.hp = maxHp;
  obj.defense = true;
  const bar = scene.add.graphics().setDepth(9e5).setVisible(false);

  const draw = () => {
    bar.clear();
    const w = 54, h = 6;
    const x = obj.sprite.x - w / 2, y = barY;
    bar.fillStyle(0x000000, 0.6);
    bar.fillRect(x - 1, y - 1, w + 2, h + 2);
    const f = Math.max(0, obj.hp / obj.maxHp);
    bar.fillStyle(f > 0.5 ? 0xb8d08a : f > 0.25 ? 0xe0b060 : 0xd05a5a, 1);
    bar.fillRect(x, y, w * f, h);
    bar.setVisible(obj.hp < obj.maxHp);
  };

  // geeft true terug als het gebouw kapot is
  obj.damage = (n) => {
    obj.hp -= n;
    obj.sprite.setTintFill(0xffffff);
    scene.time.delayedCall(70, () => obj.sprite.active && obj.sprite.clearTint());
    scene.tweens.add({ targets: obj.sprite, x: { from: obj.sprite.x + 2, to: obj.sprite.x }, duration: 120 });
    draw();
    return obj.hp <= 0;
  };

  obj.healFull = () => {
    obj.hp = obj.maxHp;
    draw();
  };

  obj.healthBar = bar;
}
