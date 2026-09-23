# 👁️ Blink-Buddy (Blink Popper)

> **A playful, private desktop app that combats digital eye strain by tracking your blinks and rewarding healthy eye habits with explosive celebrations!**

[![Platform: Desktop](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://electronjs.org)
[![Built with: Electron](https://img.shields.io/badge/Built%20with-Electron%2031-47848F?logo=electron&logoColor=white)](https://electronjs.org)
[![AI Engine: MediaPipe](https://img.shields.io/badge/AI-MediaPipe%20FaceLandmarker-orange)](https://developers.google.com/mediapipe)
[![Privacy: 100% Offline](https://img.shields.io/badge/Privacy-100%25%20Offline-success)](https://github.com/fathimaafrin431-del/Blink-Buddy)

---

## 🌟 Overview

When staring at computer screens, human blink rates drop by over **60%**, leading to dry eyes, fatigue, and headaches (Computer Vision Syndrome / Digital Eye Strain).

**Blink-Buddy** runs right on your desktop, uses your webcam to monitor natural blinks in real time using local AI computer vision, and keeps tracking in the background while you work or game. Every time you reach **20 blinks**, a dramatic, playful fullscreen celebration with cartoon sound effects pops up on your screen!

---

## 💻 Desktop Application Only

> [!IMPORTANT]
> **This is a Desktop Application**: Blink-Buddy is built with Electron and runs natively on **Windows**, **macOS**, and **Linux**. It requires access to desktop windowing and webcam hardware to track in the background and display transparent, fullscreen overlay celebrations. It cannot run as a mobile or browser-only web app.

---

## ✨ Features

- 🧠 **Real-Time Webcam Blink Detection**: Powered by Google's MediaPipe Face Landmarker (`@mediapipe/tasks-vision`) using Eye Aspect Ratio (EAR) across 468 facial mesh landmarks.
- 🔒 **100% Offline & Private**: Zero cloud processing or telemetry. All computer vision runs locally via WebAssembly SIMD. No video or images ever leave your device.
- 🖥️ **Continuous Background Tracking**: Optimized to keep running smoothly in the background while you type, code, read, or play games.
- 💥 **Fullscreen Celebration Overlay**: Transparent, always-on-top celebration animation with particles, shockwaves, and synthesized cartoon sound effects.
- 🎮 **Quick Controls & Hotkeys**:
  - <kbd>B</kbd> : Simulate a test blink
  - <kbd>R</kbd> : Reset counter back to 0
  - <kbd>F12</kbd> : Open diagnostic DevTools
- 🛠️ **Live Diagnostics**: Built-in HUD reporting camera status, face detection state, and live EAR values.

---

## 📋 Requirements

- **Node.js** (v18.x or LTS recommended)
- **Webcam**: Built-in laptop webcam, external USB webcam, or a mobile webcam app (like Iriun or DroidCam)
- **Operating System**: Windows 10/11, macOS, or Linux

---

## 🚀 Setup & How to Run

### 1. Clone the Repository
```bash
git clone https://github.com/fathimaafrin431-del/Blink-Buddy.git
cd Blink-Buddy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch the Application

- **On Windows (One-Click Launcher)**:  
  Double-click `run.bat` in the project root folder.

- **Via Terminal (Any Platform)**:
  ```bash
  npm start
  ```

---

## 🎯 How to Use

1. Click the green **▶ START (RUN IN BG)** button.
2. Position your face in front of your camera until the badge shows **🟢 Face Detected**.
3. Work, study, or game normally — every natural blink counts toward your 20-blink goal.
4. Hit **20 blinks** to trigger the fullscreen celebration!
5. Click **⏹ STOP (CAMERA OFF)** at any time to immediately stop tracking and turn off your camera hardware.

---

## 🔧 Troubleshooting Camera Access

If the app reports *"Requested device not found"* or *"Camera unavailable"*:

1. **Check Physical Privacy Shutter**: Many laptops (such as Lenovo IdeaPad/Legion or HP) have a physical plastic slider switch above the webcam lens. Slide it open so the red/orange dot is gone.
2. **Windows Privacy Settings**: Ensure camera permissions are turned on in **Windows Settings &rarr; Privacy & security &rarr; Camera &rarr; "Let desktop apps access your camera"**.
3. **Alternative Camera Options**: You can connect any USB webcam or use free software like [Iriun Webcam](https://iriun.com/) or DroidCam to use your smartphone as a PC webcam over Wi-Fi or USB.

---

## 📦 Build & Packaging

Package the application into a standalone desktop installer using `electron-builder`:

```bash
npm run dist
```
The packaged installers will be generated inside the `dist/` directory (e.g. Windows NSIS `.exe` installer).

---

## 📁 Project Structure

```text
Blink-Buddy/
├── assets/                  # Offline MediaPipe AI model weights and WASM bundles
│   ├── face_landmarker.task # Local 3.7MB MediaPipe Face Landmarker model
│   └── tasks-vision/        # Offline WASM binaries and JS bundles
├── src/
│   ├── index.html           # Main dashboard user interface
│   ├── style.css            # Dark mode neon HUD styles
│   ├── renderer.js          # Main window logic & camera controls
│   ├── blink-detector.js    # MediaPipe EAR calculation & state machine
│   ├── celebration.html     # Transparent fullscreen celebration window
│   ├── celebration.js       # Celebration sequence controller
│   ├── particle-system.js   # Cartoon physics, shockwave & particle simulator
│   ├── sound.js             # Web Audio API procedural sound synthesizer
│   └── fireworks.js         # Fireworks effect generator
├── main.js                  # Electron main process (windows, IPC, permissions)
├── preload.js               # Secure IPC bridge between frontend and main process
├── run.bat                  # One-click Windows desktop launcher
├── package.json             # Electron configuration & dependencies
└── .gitignore               # Ignored files and build artifacts
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

