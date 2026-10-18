// Gedeeld berichtenkanaal tussen de spelscène en de UI-scène.
// Events: 'message' (tekst), 'float' ({wx, wy, text, color}), 'target' (label|null), 'reset'.
export const bus = new Phaser.Events.EventEmitter();
