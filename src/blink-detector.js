// blink-detector.js
// Real webcam blink detection using MediaPipe's Face Landmarker and the
// classic Eye Aspect Ratio (EAR) technique, wrapped in a small debounced
// state machine so one long eye closure never counts as multiple blinks.

import {
  FaceLandmarker,
  FilesetResolver,
} from '../assets/tasks-vision/vision_bundle.mjs';

const WASM_BASE = '../assets/tasks-vision/wasm';
const MODEL_URL = '../assets/face_landmarker.task';

// All tunable thresholds live here in one place.
export const CONFIG = {
  BLINK_TARGET: 20,
  EAR_CLOSED_THRESHOLD: 0.21, // below this, eye counts as closed
  EAR_OPEN_THRESHOLD: 0.25,   // above this, eye counts as open again (hysteresis gap avoids flicker)
  MIN_CLOSED_DURATION_MS: 60, // must stay closed at least this long to be a real blink
  MAX_CLOSED_DURATION_MS: 500, // longer than this is treated as "eyes held shut", not a blink
  COOLDOWN_MS: 150,           // ignore new closures for a short window after counting one
};

// MediaPipe FaceMesh / FaceLandmarker 468-point indices used for EAR.
// Order per eye: [outer corner, top-outer, top-inner, inner corner, bottom-inner, bottom-outer]
const LEFT_EYE = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE = [33, 160, 158, 133, 153, 144];

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

function computeEAR(landmarks, idx) {
  const [p1, p2, p3, p4, p5, p6] = idx.map((i) => landmarks[i]);
  const vertical1 = dist(p2, p6);
  const vertical2 = dist(p3, p5);
  const horizontal = dist(p1, p4);
  if (horizontal < 1e-6) return 0.3; // fall back to "open" if geometry is degenerate
  return (vertical1 + vertical2) / (2 * horizontal);
}

// States: OPEN -> CLOSED -> (COUNT + COOLDOWN) -> OPEN
//                      \-> LONG_CLOSED (eyes held shut, no count) -> OPEN
class BlinkStateMachine {
  constructor(config, onBlink) {
    this.config = config;
    this.onBlink = onBlink;
    this.reset();
  }

  reset() {
    this.state = 'OPEN';
    this.closedSince = null;
    this.cooldownUntil = 0;
  }

  update(avgEar, now) {
    const {
      EAR_CLOSED_THRESHOLD,
      EAR_OPEN_THRESHOLD,
      MIN_CLOSED_DURATION_MS,
      MAX_CLOSED_DURATION_MS,
      COOLDOWN_MS,
    } = this.config;

    if (this.state === 'COOLDOWN') {
      if (now >= this.cooldownUntil) {
        this.state = 'OPEN';
      } else {
        return;
      }
    }

    if (this.state === 'OPEN') {
      if (avgEar < EAR_CLOSED_THRESHOLD) {
        this.state = 'CLOSED';
        this.closedSince = now;
      }
      return;
    }

    if (this.state === 'CLOSED') {
      const closedDuration = now - this.closedSince;

      if (avgEar > EAR_OPEN_THRESHOLD) {
        // Eyes reopened - decide whether this was a valid blink.
        if (
          closedDuration >= MIN_CLOSED_DURATION_MS &&
          closedDuration <= MAX_CLOSED_DURATION_MS
        ) {
          this.state = 'COOLDOWN';
          this.cooldownUntil = now + COOLDOWN_MS;
          this.closedSince = null;
          this.onBlink();
        } else {
          // Too short (likely noise) - just go back to OPEN, no count.
          this.state = 'OPEN';
          this.closedSince = null;
        }
        return;
      }

      if (closedDuration > MAX_CLOSED_DURATION_MS) {
        // Eyes have been shut too long to be a blink (e.g. deliberately closed).
        this.state = 'LONG_CLOSED';
      }
      return;
    }

    if (this.state === 'LONG_CLOSED') {
      if (avgEar > EAR_OPEN_THRESHOLD) {
        this.state = 'OPEN';
        this.closedSince = null;
      }
    }
  }
}

export class BlinkDetector {
  constructor(videoEl, { onBlink, onStatus, onDebug, config = CONFIG } = {}) {
    this.video = videoEl;
    this.onBlink = onBlink || (() => {});
    this.onStatus = onStatus || (() => {});
    this.onDebug = onDebug || (() => {});
    this.config = config;

    this.landmarker = null;
    this.running = false;
    this.timerId = null;
    this.rafId = null;
    this.isProcessing = false;
    this.lastDetectTime = 0;

    this.stateMachine = new BlinkStateMachine(this.config, () => this.onBlink());
  }

  async init() {
    this.onStatus('loading model');
    const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE);
    // Use CPU delegate by default: it runs in WebAssembly SIMD and is 100% immune
    // to WebGL GPU context loss when the window is minimized or in the background.
    try {
      this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    } catch (cpuErr) {
      console.warn('CPU delegate failed, falling back to GPU:', cpuErr);
      this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    }
    this.onStatus('ready');
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.isProcessing = false;
    this.lastDetectTime = 0;

    // Use interval to guarantee tracking continues even when minimized / in background
    this.timerId = setInterval(this.loop, 33);
  }

  stop() {
    this.running = false;
    this.isProcessing = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset() {
    this.stateMachine.reset();
  }

  // Arrow function class field so `this` stays bound across calls.
  // Continuous background & foreground detection loop
  loop = () => {
    if (!this.running || this.isProcessing) return;
    if (!this.landmarker || !this.video) return;
    if (this.video.readyState < 2) return;
    if (this.video.videoWidth === 0 || this.video.videoHeight === 0) return;

    this.isProcessing = true;
    try {
      // MediaPipe detectForVideo requires strictly monotonically increasing timestampMs
      const now = Math.max(performance.now(), (this.lastDetectTime || 0) + 1);
      this.lastDetectTime = now;

      const result = this.landmarker.detectForVideo(this.video, now);

      if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
        this.onDebug({ faceDetected: false });
        return;
      }

      const lm = result.faceLandmarks[0];
      const earLeft = computeEAR(lm, LEFT_EYE);
      const earRight = computeEAR(lm, RIGHT_EYE);
      const avgEar = (earLeft + earRight) / 2;

      this.stateMachine.update(avgEar, now);

      this.onDebug({
        faceDetected: true,
        earLeft,
        earRight,
        state: this.stateMachine.state,
        leftEyeOpen: earLeft > this.config.EAR_OPEN_THRESHOLD,
        rightEyeOpen: earRight > this.config.EAR_OPEN_THRESHOLD,
      });
    } catch (err) {
      // Catch transient frame-read errors during window occlusion/state changes
      console.warn('Frame detection warning:', err);
    } finally {
      this.isProcessing = false;
    }
  };
}
