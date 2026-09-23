Blink Popper
Blink 20 times in front of your webcam to trigger a fullscreen celebration explosion. Built with Electron and MediaPipe's face landmarker (@mediapipe/tasks-vision) for real-time blink detection.

Features

Real-time webcam-based blink detection (MediaPipe Face Landmarker)
Fullscreen, always-on-top celebration animation with particles and fireworks
Sound effects with mute toggle
Blink counter and progress UI
Requirements

Node.js (LTS recommended)
A webcam
Windows, macOS, or Linux
Setup

npm install
Run

npm start
On Windows you can also double-click run.bat, which runs npm start from the project folder.

On first launch, grant camera permission when prompted (permission is auto-granted at the Electron level, but your OS may still ask). Blink 20 times to trigger the celebration screen.

Build / Package

Package the app into a distributable using electron-builder (Windows NSIS installer configured by default):

npm run dist
Output goes to the dist/ folder.

Project Structure

main.js              Electron main process (windows, IPC, permissions)
preload.js            Preload script exposing safe IPC bridge to renderer
src/
  index.html          Main window UI
  renderer.js          Main window logic
  blink-detector.js   Blink detection via MediaPipe
  celebration.html     Fullscreen celebration window
  celebration.js       Celebration orchestration
  particle-system.js  Particle effects
  fireworks.js         Fireworks effects
  sound.js              Sound effects
  style.css             Styles
assets/               Model files (face_landmarker.task) and vision task assets
License

MIT
