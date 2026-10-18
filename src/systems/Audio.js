// Geluid en muziek, helemaal in de browser opgewekt (WebAudio). Geen bestanden nodig.
// Overdag: rustige akkoorden met af en toe een toon. 's Nachts: een lage drone en een hartslag.
import { bus } from '../bus.js';

const KEY = 'kuteiland.audio';

function loadSettings() {
  try {
    return { music: true, sfx: true, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { music: true, sfx: true };
  }
}

// mineur-achtige akkoorden (frequenties in Hz)
const DAY_CHORDS = [
  [110, 164.8, 220, 261.6],   // Am
  [87.3, 130.8, 174.6, 220],  // F
  [98, 146.8, 196, 246.9],    // G
  [82.4, 123.5, 164.8, 196],  // Em
];
const PENTA = [440, 523.3, 587.3, 659.3, 784, 880];

export class Audio {
  constructor() {
    this.settings = loadSettings();
    this.ctx = null;
    this.darkness = 0;
    this.nextChordAt = 0;
    this.nextNoteAt = 0;
    this.nextBeatAt = 0;
    this.chord = 0;

    // pas starten na de eerste aanraking (browsers eisen dat)
    const unlock = () => {
      this.start();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.visibilityState === 'hidden') this.ctx.suspend();
      else this.ctx.resume();
    });

    bus.on('sfx', (name) => this.play(name));
  }

  start() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.settings.music ? 0.32 : 0;
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.settings.sfx ? 0.7 : 0;
    this.sfxBus.connect(this.master);

    // ruisbuffer voor hakken, gruis en wind
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // nachtdrone: twee lage tonen door een trage filter
    this.drone = ctx.createGain();
    this.drone.gain.value = 0;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 260;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain).connect(filt.frequency);
    lfo.start();
    for (const f of [36.7, 55, 77.8]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 12;
      o.connect(filt);
      o.start();
    }
    filt.connect(this.drone).connect(this.musicBus);
  }

  setMusic(on) {
    this.settings.music = on;
    this.save();
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.32 : 0, this.ctx.currentTime, 0.3);
  }

  setSfx(on) {
    this.settings.sfx = on;
    this.save();
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(on ? 0.7 : 0, this.ctx.currentTime, 0.05);
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.settings)); } catch { /* niks */ }
  }

  // ---------- bouwstenen ----------

  tone(freq, dur, { type = 'sine', vol = 0.3, to = null, attack = 0.005, dest = null, delay = 0 } = {}) {
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  hiss(dur, { freq = 800, q = 1, type = 'bandpass', vol = 0.3, to = null, delay = 0 } = {}) {
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.5 + Math.random();
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // ---------- geluidseffecten ----------

  play(name) {
    if (!this.ctx || !this.settings.sfx) return;
    const r = 1 + (Math.random() - 0.5) * 0.12;
    switch (name) {
      case 'chop':
        this.hiss(0.09, { freq: 520 * r, q: 2, vol: 0.5 });
        this.tone(95 * r, 0.12, { vol: 0.5, to: 60 });
        break;
      case 'mine':
        this.tone(1300 * r, 0.12, { type: 'triangle', vol: 0.18, to: 900 });
        this.hiss(0.06, { freq: 3000, type: 'highpass', vol: 0.25 });
        break;
      case 'place':
        this.tone(70, 0.18, { vol: 0.55, to: 45 });
        this.hiss(0.15, { freq: 300, type: 'lowpass', vol: 0.35 });
        break;
      case 'voice':
        this.tone(62, 0.9, { vol: 0.22, to: 48, attack: 0.08 });
        this.tone(93, 0.7, { type: 'triangle', vol: 0.05, to: 80, attack: 0.1, delay: 0.05 });
        this.hiss(0.6, { freq: 300, type: 'lowpass', vol: 0.12 });
        break;
      case 'pickup':
        this.tone(880 * r, 0.12, { vol: 0.12 });
        this.tone(1320 * r, 0.18, { vol: 0.1, delay: 0.06 });
        break;
      case 'craft':
        this.tone(330, 0.07, { type: 'triangle', vol: 0.18 });
        this.tone(220, 0.07, { type: 'triangle', vol: 0.18, delay: 0.09 });
        this.tone(440, 0.12, { type: 'triangle', vol: 0.14, delay: 0.18 });
        break;
      case 'swing':
        this.hiss(0.16, { freq: 600, to: 2400, q: 3, vol: 0.22 });
        break;
      case 'enemyHit':
        this.hiss(0.08, { freq: 900, q: 1.5, vol: 0.4 });
        this.tone(140 * r, 0.12, { type: 'sawtooth', vol: 0.12, to: 80 });
        break;
      case 'enemyDie':
        this.hiss(0.6, { freq: 2000, to: 200, q: 4, vol: 0.25 });
        this.tone(300, 0.5, { type: 'sine', vol: 0.12, to: 60 });
        break;
      case 'hurt':
        this.tone(220, 0.16, { type: 'square', vol: 0.12, to: 110 });
        this.hiss(0.1, { freq: 400, vol: 0.3 });
        break;
      case 'crack':
        for (let i = 0; i < 5; i++) this.hiss(0.03, { freq: 2500 + Math.random() * 2000, q: 6, vol: 0.35, delay: i * 0.05 + Math.random() * 0.03 });
        break;
      case 'fall':
        this.hiss(1.4, { freq: 400, to: 60, type: 'lowpass', vol: 0.5 });
        this.tone(55, 1.2, { vol: 0.3, to: 30 });
        break;
      case 'levelUp':
        [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', vol: 0.12, delay: i * 0.08 }));
        break;
      case 'night':
        this.tone(110, 2.5, { type: 'sawtooth', vol: 0.08, to: 55, attack: 0.8 });
        this.hiss(2.5, { freq: 200, to: 900, q: 2, vol: 0.15 });
        break;
      case 'day':
        [392, 523.3, 659.3].forEach((f, i) => this.tone(f, 1.6, { vol: 0.08, delay: i * 0.25, attack: 0.2 }));
        break;
      case 'slam':
        this.tone(50, 0.5, { vol: 0.7, to: 25 });
        this.hiss(0.5, { freq: 250, type: 'lowpass', vol: 0.6 });
        break;
      case 'roar':
        this.tone(65, 1.2, { type: 'sawtooth', vol: 0.25, to: 40, attack: 0.15 });
        this.tone(97, 1.1, { type: 'sawtooth', vol: 0.15, to: 58, attack: 0.15 });
        this.hiss(1.2, { freq: 300, q: 1, vol: 0.35 });
        break;
      case 'note':
        [659.3, 587.3, 523.3].forEach((f, i) => this.tone(f, 0.6, { vol: 0.08, delay: i * 0.18, attack: 0.05 }));
        break;
      case 'death':
        this.tone(196, 1.5, { type: 'triangle', vol: 0.15, to: 65, attack: 0.05 });
        break;
      default:
    }
  }

  // ---------- muziek, elke frame aangeroepen ----------

  update(darkness) {
    const ctx = this.ctx;
    if (!ctx || !this.settings.music) return;
    const now = ctx.currentTime;
    this.drone.gain.setTargetAtTime(darkness * 0.35, now, 1.5);

    // overdag: akkoorden en losse tonen
    if (darkness < 0.7) {
      const dayVol = 0.06 * (1 - darkness);
      if (now >= this.nextChordAt) {
        this.nextChordAt = now + 8;
        const chord = DAY_CHORDS[this.chord++ % DAY_CHORDS.length];
        for (const f of chord) {
          this.tone(f, 9, { type: 'triangle', vol: dayVol, attack: 2.5, dest: this.musicBus });
        }
      }
      if (now >= this.nextNoteAt) {
        this.nextNoteAt = now + 2 + Math.random() * 4;
        const f = PENTA[Math.floor(Math.random() * PENTA.length)] / (Math.random() < 0.5 ? 2 : 1);
        this.tone(f, 2.5, { vol: dayVol * 0.9, attack: 0.01, dest: this.musicBus });
      }
    }
    // 's nachts: een trage hartslag
    if (darkness > 0.6 && now >= this.nextBeatAt) {
      this.nextBeatAt = now + 1.25;
      this.tone(55, 0.25, { vol: 0.35 * darkness, to: 40, dest: this.musicBus });
      this.tone(50, 0.22, { vol: 0.25 * darkness, to: 38, dest: this.musicBus, delay: 0.22 });
    }
  }
}

let instance = null;
export function getAudio() {
  if (!instance) instance = new Audio();
  return instance;
}
