import { BlinkDetector, CONFIG } from './blink-detector.js';

const DEBUG_MODE = true; // flip to false to hide the debug panel by default

const els = {
  countLabel: document.getElementById('countLabel'),
  progressBar: document.getElementById('progressBar'),
  video: document.getElementById('video'),
  cameraStatus: document.getElementById('cameraStatus'),
  faceBadge: document.getElementById('faceBadge'),
  cameraNote: document.getElementById('cameraNote'),
  cameraNoteText: document.getElementById('cameraNoteText'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  testBtn: document.getElementById('testBtn'),
  resetBtn: document.getElementById('resetBtn'),
  muteBtn: document.getElementById('muteBtn'),
  debugPanel: document.getElementById('debugPanel'),
  debugCamera: document.getElementById('debugCamera'),
  debugFace: document.getElementById('debugFace'),
  debugLeftEye: document.getElementById('debugLeftEye'),
  debugRightEye: document.getElementById('debugRightEye'),
  debugEarLeft: document.getElementById('debugEarLeft'),
  debugEarRight: document.getElementById('debugEarRight'),
  debugState: document.getElementById('debugState'),
  debugCount: document.getElementById('debugCount'),
  debugLogs: document.getElementById('debugLogs'),
  devtoolsBtn: document.getElementById('devtoolsBtn'),
};

const TARGET = CONFIG.BLINK_TARGET;

let blinkCount = 0;
let celebrating = false;
let detector = null;
let muted = false;
let isStarting = false;
let isRunning = false;

function logDebug(msg, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${type.toUpperCase()}] ${msg}`);
  if (els.debugLogs) {
    const item = document.createElement('div');
    item.className = `debug-log-entry ${type}`;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = `[${timestamp}]`;
    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg';
    msgSpan.textContent = msg;
    item.appendChild(timeSpan);
    item.appendChild(msgSpan);
    els.debugLogs.appendChild(item);
    els.debugLogs.scrollTop = els.debugLogs.scrollHeight;
  }
}

function updateProgress() {
  els.countLabel.textContent = `${blinkCount} / ${TARGET}`;
  els.progressBar.style.width = `${Math.min(100, (blinkCount / TARGET) * 100)}%`;
  els.debugCount.textContent = `${blinkCount} / ${TARGET}`;
}

function handleBlink() {
  if (celebrating) return;
  blinkCount++;
  updateProgress();
  if (blinkCount >= TARGET) {
    triggerCelebration();
  }
}

function triggerCelebration() {
  celebrating = true;
  window.blinkPopperAPI.triggerCelebration();
}

function doReset() {
  blinkCount = 0;
  celebrating = false;
  if (detector) detector.reset();
  updateProgress();
}

window.blinkPopperAPI.onCelebrationFinished(() => {
  // Celebration played out - clear the counter so the user can go again.
  celebrating = false;
  blinkCount = 0;
  updateProgress();
});

function updateDebugPanel(info) {
  if (!info.faceDetected) {
    els.debugFace.textContent = 'NO';
    els.debugLeftEye.textContent = '-';
    els.debugRightEye.textContent = '-';
    els.debugEarLeft.textContent = '-';
    els.debugEarRight.textContent = '-';
    els.debugState.textContent = '-';
    if (els.faceBadge && isRunning) {
      els.faceBadge.textContent = '🟡 No Face in View';
      els.faceBadge.className = 'face-badge waiting';
    }
    return;
  }
  els.debugFace.textContent = 'YES';
  els.debugLeftEye.textContent = info.leftEyeOpen ? 'OPEN' : 'CLOSED';
  els.debugRightEye.textContent = info.rightEyeOpen ? 'OPEN' : 'CLOSED';
  els.debugEarLeft.textContent = info.earLeft.toFixed(2);
  els.debugEarRight.textContent = info.earRight.toFixed(2);
  els.debugState.textContent = info.state;
  if (els.faceBadge && isRunning) {
    els.faceBadge.textContent = '🟢 Face Detected';
    els.faceBadge.className = 'face-badge detected';
  }
}

// Turn off camera hardware and stop tracking loop
function stopTracking() {
  logDebug('Stopping tracking & releasing camera hardware...', 'info');
  if (detector) {
    detector.stop();
  }

  // Stop all media tracks to turn off the physical camera light and release hardware
  if (els.video.srcObject && typeof els.video.srcObject.getTracks === 'function') {
    els.video.srcObject.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {
        console.warn('Error stopping track:', e);
      }
    });
    els.video.srcObject = null;
  }

  isRunning = false;
  isStarting = false;

  if (els.faceBadge) {
    els.faceBadge.style.display = 'none';
  }

  els.startBtn.disabled = false;
  els.startBtn.textContent = '▶ START (RUN IN BG)';
  els.stopBtn.disabled = true;

  els.cameraStatus.textContent = 'Camera: OFF / Stopped';
  els.debugCamera.textContent = 'stopped';
  updateDebugPanel({ faceDetected: false });
  logDebug('Camera turned off & hardware released.', 'info');
}

// Request camera and start background blink detection
async function startTracking() {
  if (isRunning || isStarting) return;
  isStarting = true;

  els.startBtn.disabled = true;
  els.startBtn.textContent = '⏳ Starting...';
  els.stopBtn.disabled = true;

  els.cameraStatus.textContent = 'Camera: requesting access...';
  els.debugCamera.textContent = 'requesting';
  els.cameraNote.classList.remove('visible');
  if (els.openSettingsBtn) els.openSettingsBtn.style.display = 'none';

  logDebug('Checking camera devices...', 'info');

  // Diagnostic device enumeration
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');
    if (videoInputs.length === 0) {
      logDebug('No camera devices reported by OS/driver.', 'warn');
      logDebug('Lenovo check: slide the physical shutter switch above the lens to open, or press Fn+F9 / Fn+F8.', 'warn');
    } else {
      const names = videoInputs.map((d) => d.label || 'Webcam').join(', ');
      logDebug(`Found ${videoInputs.length} video input device(s): ${names}`, 'info');
    }
  } catch (enumErr) {
    logDebug(`enumerateDevices warning: ${enumErr.message}`, 'warn');
  }

  // Make sure any stale stream is stopped first
  if (els.video.srcObject && typeof els.video.srcObject.getTracks === 'function') {
    els.video.srcObject.getTracks().forEach((track) => track.stop());
    els.video.srcObject = null;
  }

  try {
    logDebug('Requesting camera stream via getUserMedia...', 'info');
    let stream;

    // Helper: race getUserMedia against a timeout so it never hangs forever
    function getUserMediaWithTimeout(constraints, timeoutMs = 8000) {
      return Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        new Promise((_, reject) =>
          setTimeout(() => reject(new DOMException(
            `Camera did not respond within ${timeoutMs / 1000}s. The hardware may still be initializing — click START again in a few seconds.`,
            'TimeoutError'
          )), timeoutMs)
        ),
      ]);
    }

    // Try flexible constraints first, fall back to pure { video: true } if needed
    try {
      stream = await getUserMediaWithTimeout({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
    } catch (constraintErr) {
      if (constraintErr.name === 'TimeoutError') throw constraintErr;
      logDebug(`Constraint fallback ({ video: true }): ${constraintErr.message}`, 'warn');
      stream = await getUserMediaWithTimeout({
        video: true,
        audio: false,
      });
    }

    const track = stream.getVideoTracks()[0];
    const settings = track ? track.getSettings() : {};
    logDebug(`Camera connected! Label: "${track?.label || 'Webcam'}" (${settings.width || '?'}x${settings.height || '?'})`, 'success');

    els.video.srcObject = stream;
    await els.video.play();

    els.cameraStatus.textContent = 'Camera: loading model...';
    els.debugCamera.textContent = 'loading model';
    logDebug('Initializing local MediaPipe FaceLandmarker model...', 'info');

    if (!detector) {
      detector = new BlinkDetector(els.video, {
        onBlink: handleBlink,
        onStatus: (status) => {
          els.debugCamera.textContent = status;
          if (status === 'ready') {
            els.cameraStatus.textContent = 'Camera: ACTIVE (Running in BG)';
            logDebug('MediaPipe model ready! Background tracking started (~30 FPS).', 'success');
          }
        },
        onDebug: updateDebugPanel,
      });

      await detector.init();
      detector.start();
    } else {
      detector.video = els.video;
      detector.start();
      els.cameraStatus.textContent = 'Camera: ACTIVE (Running in BG)';
      els.debugCamera.textContent = 'ready';
      logDebug('Background tracking resumed (~30 FPS).', 'success');
    }

    isRunning = true;
    isStarting = false;

    if (els.faceBadge) {
      els.faceBadge.style.display = 'block';
      els.faceBadge.textContent = '🟡 Looking for Face...';
      els.faceBadge.className = 'face-badge waiting';
    }

    els.startBtn.textContent = '▶ RUNNING';
    els.startBtn.disabled = true;
    els.stopBtn.disabled = false;
    els.cameraNote.classList.remove('visible');
  } catch (err) {
    console.error('Camera/model init failed:', err);
    logDebug(`Camera access error [${err.name}]: ${err.message}`, 'error');
    isRunning = false;
    isStarting = false;

    if (els.faceBadge) {
      els.faceBadge.style.display = 'none';
    }

    els.cameraStatus.textContent = 'Camera unavailable';
    els.debugCamera.textContent = err.name || 'error';

    let reason = 'Camera could not be accessed.';
    if (err.name === 'TimeoutError') {
      reason = 'Camera hardware detected but did not respond in time. The USB driver may still be waking up — click START again to retry.';
      logDebug('HINT: Camera hardware was slow to initialize. Click START to retry.', 'warn');
    } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      reason = 'Camera access was denied. If using a Lenovo laptop, check the physical privacy slider switch above the camera lens (slide it so the red dot is gone), and press Fn+F9 / F8.';
      logDebug('HINT: Check Lenovo physical webcam shutter switch and Windows Camera Privacy settings.', 'warn');
      if (els.openSettingsBtn) els.openSettingsBtn.style.display = 'inline-block';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || (err.message && err.message.toLowerCase().includes('device not found'))) {
      reason = 'No camera hardware detected by Windows (Hardware Disconnected). On Lenovo IdeaPad Gaming 3 laptops: 1) Slide the physical privacy switch on the webcam lens open (red dot disappears), 2) Check Lenovo Vantage Camera Privacy Mode, or 3) Connect an external USB or phone camera (e.g. Iriun/DroidCam).';
      logDebug('HINT: Hardware disconnected (Code 45). Slide open webcam lens shutter or connect an external webcam.', 'warn');
      if (els.openSettingsBtn) els.openSettingsBtn.style.display = 'inline-block';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      reason = 'Camera is currently locked by another application (Zoom, Teams, Skype, or browser). Close other camera apps and retry.';
      logDebug('HINT: Camera is locked by another running program (Zoom/Teams/browser).', 'warn');
    } else if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
      reason = 'Webcam connected, but AI model failed to download from CDN. Check your internet.';
      logDebug('HINT: Model loading network error.', 'error');
    } else {
      reason = `Camera error: ${err.message || err.name || 'Unknown error'}.`;
    }

    if (els.cameraNoteText) {
      els.cameraNoteText.textContent = `${reason} You can click START to retry or test using the TEST EXPLOSION button.`;
    }
    els.cameraNote.classList.add('visible');

    els.startBtn.textContent = '▶ START (RUN IN BG)';
    els.startBtn.disabled = false;
    els.stopBtn.disabled = true;
  }
}

els.startBtn.addEventListener('click', () => {
  startTracking();
});

els.stopBtn.addEventListener('click', () => {
  stopTracking();
});

if (els.devtoolsBtn) {
  els.devtoolsBtn.addEventListener('click', () => {
    if (window.blinkPopperAPI && window.blinkPopperAPI.openDevTools) {
      window.blinkPopperAPI.openDevTools();
    }
  });
}

if (els.openSettingsBtn) {
  els.openSettingsBtn.addEventListener('click', () => {
    if (window.blinkPopperAPI && window.blinkPopperAPI.openCameraSettings) {
      window.blinkPopperAPI.openCameraSettings();
    }
  });
}

els.testBtn.addEventListener('click', () => {
  triggerCelebration();
});

els.resetBtn.addEventListener('click', () => {
  doReset();
});

els.muteBtn.addEventListener('click', () => {
  muted = !muted;
  window.blinkPopperAPI.setMuted(muted);
  els.muteBtn.textContent = muted ? '🔇 Sound: Off' : '🔊 Sound: On';
});

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.key === 'b' || e.key === 'B') handleBlink();
  if (e.key === 'r' || e.key === 'R') doReset();
});

// Always release camera when window unloads
window.addEventListener('beforeunload', () => {
  stopTracking();
});

if (!DEBUG_MODE) {
  els.debugPanel.style.display = 'none';
}

// Detect when a camera is connected or disconnected without auto-hijacking
if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
  navigator.mediaDevices.addEventListener('devicechange', async () => {
    logDebug('Hardware event: Device change detected. Checking cameras...', 'info');
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      if (videoInputs.length > 0) {
        logDebug(`Camera detected! Found ${videoInputs.length} device(s): ${videoInputs.map((d) => d.label || 'Webcam').join(', ')}`, 'success');
        if (!isRunning && !isStarting) {
          els.cameraStatus.textContent = 'Camera: Ready — Click START to begin';
          els.startBtn.disabled = false;
          els.cameraNote.classList.remove('visible');
        }
      } else {
        logDebug('No active camera detected. Ensure privacy shutter is open.', 'warn');
        if (!isRunning && !isStarting) {
          els.cameraStatus.textContent = 'Camera: Disconnected';
        }
      }
    } catch (e) {
      console.warn('devicechange error:', e);
    }
  });
}

updateProgress();
logDebug('App ready. Click ▶ START (RUN IN BG) to access camera and begin tracking.', 'info');


