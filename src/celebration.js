// celebration.js
// Drives a dramatic, playful Angry Birds style explosion sequence:
// 1. Slingshot launch whistle ->
// 2. Cartoon Bomb appears in center with sizzling sparking fuse ->
// 3. Bomb swells up frantically with cartoon bird battle squawk ->
// 4. KAAA-BOOOM! Screen flash + violent screen shake ->
// 5. Giant comic starburst + billowing smoke clouds + flying feathers + tumbling wooden planks ->
// 6. 3D Comic Text slams in ("KAAA-BOOOM!" -> "20 BLINKS! TARGET CRUSHED!") ->
// 7. Victory fireworks & fluttering feather confetti ->
// 8. Smooth cinematic fade.

import { ParticleSystem } from './particle-system.js';
import { FireworksManager } from './fireworks.js';
import { SoundManager } from './sound.js';

const canvas = document.getElementById('celebration-canvas');
const ctx = canvas.getContext('2d');
const textEl = document.getElementById('celebration-text');
const subtextEl = document.getElementById('celebration-subtext');

const sound = new SoundManager();
const ps = new ParticleSystem();
let fireworksManager = null;

let shakeTime = 0;
let shakeDuration = 0;
let shakeMagnitude = 0;

let animRunning = false;
let rafId = null;
let lastTime = 0;

let timeouts = [];
let intervals = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (fireworksManager) {
    fireworksManager.width = canvas.width;
    fireworksManager.height = canvas.height;
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function schedule(fn, delayMs) {
  const id = setTimeout(fn, delayMs);
  timeouts.push(id);
  return id;
}

function scheduleInterval(fn, everyMs) {
  const id = setInterval(fn, everyMs);
  intervals.push(id);
  return id;
}

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
  intervals.forEach(clearInterval);
  intervals = [];
}

function triggerShake(durationMs, magnitude) {
  shakeDuration = durationMs;
  shakeTime = durationMs;
  shakeMagnitude = magnitude;
}

function screenFlash() {
  document.body.style.transition = 'none';
  document.body.style.background = 'rgba(255, 255, 255, 0.95)';
  requestAnimationFrame(() => {
    document.body.style.transition = 'background 0.35s ease-out';
    document.body.style.background = 'transparent';
  });
}

function resetText() {
  textEl.style.transition = 'none';
  textEl.style.opacity = '1';
  textEl.style.transform = 'scale(0)';
  textEl.textContent = '';
  if (subtextEl) {
    subtextEl.style.transition = 'none';
    subtextEl.style.opacity = '1';
    subtextEl.style.transform = 'scale(0)';
    subtextEl.textContent = '';
  }
}

function animateText() {
  textEl.textContent = '💥 KAAA-BOOOM!';
  textEl.style.transition = 'none';
  textEl.style.transform = 'scale(0)';

  requestAnimationFrame(() => {
    // 1. Initial explosive punch & cartoon squash/stretch
    textEl.style.transition = 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.5)';
    textEl.style.transform = 'scale(1.25) rotate(-3deg)';

    schedule(() => {
      textEl.style.transition = 'transform 0.18s ease-in-out';
      textEl.style.transform = 'scale(1.0) rotate(0deg)';
    }, 350);

    // 2. Playful transition to 20 BLINKS with victory cheer
    schedule(() => {
      textEl.style.transition = 'transform 0.16s ease-in';
      textEl.style.transform = 'scale(0) rotate(8deg)';

      schedule(() => {
        textEl.textContent = '🎯 20 BLINKS! 🎯';
        if (subtextEl) {
          subtextEl.textContent = '✨ TARGET CRUSHED! ✨';
          subtextEl.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.4)';
          subtextEl.style.transform = 'scale(1)';
        }
        textEl.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.45)';
        textEl.style.transform = 'scale(1.05) rotate(2deg)';
        sound.playVictoryCheer();
      }, 180);
    }, 1300);
  });

  schedule(() => {
    textEl.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-in';
    textEl.style.opacity = '0';
    textEl.style.transform = 'scale(0.8)';
    if (subtextEl) {
      subtextEl.style.transition = 'opacity 0.8s ease-out';
      subtextEl.style.opacity = '0';
    }
  }, 5600);
}

function runCelebrationSequence() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  resetText();
  ps.clear();
  fireworksManager = new FireworksManager(ps, canvas.width, canvas.height);

  // 1. Slingshot launch whistle (0.0s)
  sound.playSlingshot();

  // 2. Cartoon Bomb appears in center with burning sparking fuse (0.08s)
  schedule(() => {
    ps.spawnCartoonBomb(cx, cy);
    sound.playFuse(0.55);
  }, 80);

  // 3. Anticipation: Bomb swells, eyes bulge, Angry Bird war squawk! (0.42s)
  schedule(() => {
    sound.playBirdSquawk();
    triggerShake(200, 6); // subtle anticipatory tremble
  }, 420);

  // 4. KAAA-BOOOM! (0.72s)
  schedule(() => {
    screenFlash();
    triggerShake(650, 28); // violent cartoon camera shake
    sound.playBoom();

    // Giant cartoon spiky starburst
    ps.spawnComicBurst(cx, cy);

    // Billowing cartoon smoke puffs
    ps.spawnSmokePuffs(cx, cy, 65);

    // Flying cartoon bird feathers
    ps.spawnFeathers(cx, cy, 55);

    // Tumbling wooden planks and TNT debris
    ps.spawnWoodDebris(cx, cy, 40);

    // Comic spark burst
    ps.spawnBurst(cx, cy, 240);
  }, 720);

  // 5. Wooden debris clatter sound & comic text entrance (0.95s)
  schedule(() => {
    sound.playWoodCrash();
    animateText();
  }, 950);

  // 6. Secondary pop bursts & playful fireworks
  schedule(() => { fireworksManager.launch(); sound.playPop(); }, 1600);
  schedule(() => { fireworksManager.launch(); sound.playPop(); }, 2100);
  schedule(() => { fireworksManager.launch(); sound.playPop(); }, 2700);
  schedule(() => { fireworksManager.launch(); sound.playPop(); }, 3300);

  // Confetti & star rain drifting through the air
  scheduleInterval(() => ps.spawnConfettiRain(canvas.width, 10), 120);
  schedule(() => {
    intervals.forEach(clearInterval);
    intervals = [];
  }, 5200);

  // Wrap up & fade (~7.5s)
  schedule(() => finishCelebration(), 7500);
}

function finishCelebration() {
  clearTimers();
  const fadeStart = performance.now();
  const fadeDuration = 1000;

  function fadeStep(now) {
    const t = Math.min(1, (now - fadeStart) / fadeDuration);
    const factor = 1 - t * 0.2;
    ps.particles.forEach((p) => (p.opacity *= factor));
    ps.feathers.forEach((f) => (f.life *= factor));
    ps.woodPlanks.forEach((w) => (w.life *= factor));
    ps.smokePuffs.forEach((s) => (s.life *= factor));
    if (t < 1) {
      requestAnimationFrame(fadeStep);
    } else {
      stopAnimation();
      window.blinkPopperAPI.notifyCelebrationFinished();
    }
  }
  requestAnimationFrame(fadeStep);
}

function stopAnimation() {
  animRunning = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  ps.clear();
  if (fireworksManager) fireworksManager.clear();
  resetText();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function loop(now) {
  if (!animRunning) return;
  rafId = requestAnimationFrame(loop);

  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  if (shakeTime > 0) {
    shakeTime -= dt * 1000;
    const progress = Math.max(0, shakeTime / shakeDuration);
    const mag = shakeMagnitude * progress;
    const dx = (Math.random() * 2 - 1) * mag;
    const dy = (Math.random() * 2 - 1) * mag;
    ctx.translate(dx, dy);
  }

  ps.update(dt);
  ps.draw(ctx);

  if (fireworksManager) {
    fireworksManager.update(dt);
    fireworksManager.draw(ctx);
  }

  ctx.restore();
}

function startCelebration() {
  clearTimers();
  stopAnimation();
  animRunning = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
  runCelebrationSequence();
}

window.blinkPopperAPI.onStartCelebration(() => {
  startCelebration();
});

window.blinkPopperAPI.onSetMuted((muted) => {
  sound.setMuted(muted);
});

