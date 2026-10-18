import { CONFIG } from './config.js';

// Pixeldichtheid, begrensd voor prestaties. Het canvas draait op deze resolutie.
export function getDpr() {
  return Math.min(window.devicePixelRatio || 1, CONFIG.render.maxDpr);
}

// Ruimte voor notch en home-balk, in canvaspixels.
export function getSafeArea() {
  const cs = getComputedStyle(document.documentElement);
  const d = getDpr();
  const v = (name) => (parseFloat(cs.getPropertyValue(name)) || 0) * d;
  return { top: v('--sat'), right: v('--sar'), bottom: v('--sab'), left: v('--sal') };
}
