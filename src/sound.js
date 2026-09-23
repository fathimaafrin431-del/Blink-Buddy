// sound.js
// Dramatic, game-style cartoon sound effects synthesized with the Web Audio API.
// Features slingshot stretch, sizzling fuse, Angry-Bird-style squawk, massive
// cartoon explosion, wooden clatter, and triumphant victory chirps.

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMuted(muted) {
    this.muted = !!muted;
  }

  toggleMuted() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Classic cartoon slingshot "WHEEEW-ZOOM"
  playSlingshot() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.28);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.42);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Sizzling, crackling bomb fuse
  playFuse(duration = 0.5) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      // Crackly burst noise
      const crackle = Math.random() > 0.85 ? (Math.random() * 2 - 1) * 1.5 : (Math.random() * 2 - 1) * 0.2;
      data[i] = crackle;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(4500, now + duration);
    filter.Q.value = 4.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
  }

  // Angry Birds battle squawk: "HWEET-YAAAA-HA!"
  playBirdSquawk() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Carrier + vibrato FM modulation creates that funny cartoon squawk
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const mainGain = ctx.createGain();

    carrier.type = 'triangle';
    mod.type = 'sine';

    mod.frequency.setValueAtTime(35, now); // fast warble
    modGain.gain.setValueAtTime(140, now); // vibrato depth

    carrier.frequency.setValueAtTime(420, now);
    carrier.frequency.exponentialRampToValueAtTime(1150, now + 0.12);
    carrier.frequency.exponentialRampToValueAtTime(540, now + 0.35);

    mod.connect(carrier.frequency);

    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.exponentialRampToValueAtTime(0.45, now + 0.04);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    carrier.connect(mainGain).connect(ctx.destination);
    mod.start(now);
    carrier.start(now);
    mod.stop(now + 0.4);
    carrier.stop(now + 0.4);
  }

  // Massive, punchy cartoon explosion with sub-bass, crunchy distortion, and reverb tail
  playBoom() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // 1. Heavy sub-bass punch (thump)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(180, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.exponentialRampToValueAtTime(1.0, now + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    subOsc.connect(subGain).connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.9);

    // 2. Mid punch punchiness (triangle wave)
    const midOsc = ctx.createOscillator();
    const midGain = ctx.createGain();
    midOsc.type = 'triangle';
    midOsc.frequency.setValueAtTime(280, now);
    midOsc.frequency.exponentialRampToValueAtTime(60, now + 0.3);

    midGain.gain.setValueAtTime(0.001, now);
    midGain.gain.exponentialRampToValueAtTime(0.7, now + 0.02);
    midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    midOsc.connect(midGain).connect(ctx.destination);
    midOsc.start(now);
    midOsc.stop(now + 0.45);

    // 3. Crunchy explosion debris noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.75);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.pow(1 - i / bufferSize, 2);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.6);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
  }

  // Wooden blocks clattering and crashing
  playWoodCrash() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const delay = i * 0.06 + Math.random() * 0.04;
      const t = now + delay;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 260, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  // Playful pop sound
  playPop() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650 + Math.random() * 250, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Cheerful celebratory arpeggio after the blast
  playVictoryCheer() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  playFirework() {
    this.playPop();
  }
}

