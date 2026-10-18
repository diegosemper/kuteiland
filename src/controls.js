// Huidige invoer. De UI-scène schrijft hierin, de spelscène leest eruit.
export const controls = {
  move: { x: 0, y: 0 },   // richting op het scherm, lengte 0..1
  action: false,          // actieknop wordt vastgehouden
  actionQueued: false,    // korte tik die nog verwerkt moet worden
};
