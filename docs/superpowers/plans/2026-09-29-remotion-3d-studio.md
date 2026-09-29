# MotionCraft 3D Animation Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated 3D Animation Studio (`/3d`) featuring an interactive client-side WebGL viewport, official Remotion `@remotion/three` rendering engine, preset 3D meshes (Smartphone, Golden Coin, Product Box, Cyber Geometry), lighting presets, and a headless server-side MP4 video render pipeline.

**Architecture:** A secondary Remotion composition `MotionCraft3D` registered in `src/Root.tsx` powered by `@remotion/three` and Three.js. The web app serves a dedicated `public/3d.html` interface with an interactive Three.js viewport and custom controls. The server exposes `POST /api/render-3d-video` which compiles and renders 3D scenes via headless Chromium with WebGL acceleration and procedural audio sync.

**Tech Stack:** React 18, Three.js, `@react-three/fiber`, `@remotion/three`, Remotion (`@remotion/renderer`, `@remotion/bundler`), Express, Tailwind CSS (CDN), FontAwesome, Vanilla JS.

## Global Constraints

- Remotion React version: 18.3.1 (must match React and ReactDOM versions).
- Three.js animation contract: All 3D movement must be derived from `useCurrentFrame()` and `spring()` / `interpolate()`, never `Date.now()` or `useFrame()`.
- Dual Studio Switcher: Segmented pill switcher present on both `/` and `/3d` headers.
- Visual Theme: Dark Obsidian (`#0a0b10`), Inter/Outfit fonts, glassmorphism borders (`rgba(255,255,255,0.08)`), amber and cyan glowing accents.
- Headless WebGL on VPS: Chromium arguments must include `--enable-webgl`, `--disable-dev-shm-usage`, and appropriate software GL fallback (`--use-gl=angle` or `--use-gl=swiftshader`).

---

## File Structure

```
remotion_studio/
├── package.json                        # Add three, @types/three, @react-three/fiber, @remotion/three
├── src/
│   ├── Root.tsx                        # Register MotionCraft3D composition
│   ├── ThreeDComposition.tsx           # Remotion 3D canvas, lighting, presets, and text overlay
├── public/
│   ├── 3d.html                         # Dedicated 3D Animation Studio UI
│   ├── index.html                      # Update navbar with dual-studio switcher
│   └── js/
│       └── 3d-studio.js                # Interactive client Three.js viewport & timeline controller
├── server.js                           # Add /3d route and POST /api/render-3d-video endpoint
```

---

## Tasks

### Task 1: Install 3D Dependencies & Configure Package Manifest

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: Installed packages `three`, `@types/three`, `@react-three/fiber`, `@remotion/three`.

- [x] **Step 1: Install Three.js and Remotion Three packages**
  Run `npm install three@^0.174.0 @types/three@^0.174.0 @react-three/fiber@^8.18.0 @remotion/three@^4.0.529`.

- [x] **Step 2: Verify package installation**
  Check that `node_modules/@remotion/three` and `node_modules/three` exist and `npm list three @remotion/three` succeeds.

- [x] **Step 3: Commit dependency changes**
  `git add package.json package-lock.json && git commit -m "chore(deps): install three, @react-three/fiber, and @remotion/three"`

---

### Task 2: Implement Remotion 3D Composition Engine

**Files:**
- Create: `src/ThreeDComposition.tsx`
- Modify: `src/Root.tsx`

**Interfaces:**
- Produces: `ThreeDMainVideo`, `defaultThreeDProps`, `ThreeDVideoProps`, and `MotionCraft3D` composition.

- [x] **Step 1: Create `src/ThreeDComposition.tsx`**
  Implement the 3D composition with:
  1. `ThreeDVideoProps` interface with models (`smartphone`, `coin`, `box`, `geometric`), motion types (`spin`, `float`, `orbit`, `spring-pop`), lighting presets (`cyber`, `luxury`, `obsidian`, `clean`), material configs, and text overlay.
  2. `<ThreeCanvas>` wrapped with `useVideoConfig()` dimensions and camera position.
  3. Studio lighting setups with directional, ambient, and colored rim point lights.
  4. Procedural mesh geometries:
     - `smartphone`: Rounded chassis box + glossy screen plane showing title/text.
     - `coin`: Golden cylinder with bevel and metallic PBR material.
     - `box`: Chamfered cube with illuminated seams.
     - `geometric`: TorusKnot with wireframe & core glow.
  5. 2D text overlay layer (`ThreeDOverlay`) with animated headline, badge, and CTA button.

- [x] **Step 2: Register `MotionCraft3D` in `src/Root.tsx`**
  Import `ThreeDMainVideo` and `defaultThreeDProps`, register `<Composition id="MotionCraft3D" ... calculateMetadata={...} />`.

- [x] **Step 3: Type check**
  Run `npx tsc --noEmit` and confirm 0 errors.

- [x] **Step 4: Commit 3D composition**
  `git add src/ThreeDComposition.tsx src/Root.tsx && git commit -m "feat(3d): implement MotionCraft3D Remotion composition with Three.js"`

---

### Task 3: Build Server 3D Render Pipeline & Route

**Files:**
- Modify: `server.js`

**Interfaces:**
- Produces: `GET /3d` route serving `public/3d.html` and `POST /api/render-3d-video` endpoint.

- [x] **Step 1: Add `GET /3d` route**
  In `server.js`, add `app.get('/3d', (req, res) => res.sendFile(path.join(__dirname, 'public', '3d.html')));`.

- [x] **Step 2: Add `POST /api/render-3d-video` endpoint**
  Implement render endpoint:
  1. Parse `ThreeDVideoProps` from `req.body`.
  2. Select composition `MotionCraft3D`.
  3. Configure Chromium flags for headless WebGL (`--enable-webgl`, `--use-gl=angle`, `--enable-accelerated-2d-canvas`).
  4. Generate matching procedural background music and whoosh SFX.
  5. Call `renderMedia` with progress logging.
  6. FFmpeg mux video and audio, cleanup temporary files, return `{ success: true, filename, url, sizeMB }`.

- [x] **Step 3: Verify server syntax**
  Run `node -c server.js` to ensure no syntax errors.

- [x] **Step 4: Commit server updates**
  `git add server.js && git commit -m "feat(server): add /3d route and POST /api/render-3d-video endpoint"`

---

### Task 4: Create Dedicated 3D Studio Web UI

**Files:**
- Create: `public/3d.html`
- Create: `public/js/3d-studio.js`

**Interfaces:**
- Produces: Standalone 3D studio with interactive Three.js OrbitControls canvas, workbench sidebar, and render execution.

- [x] **Step 1: Create `public/3d.html`**
  Create full responsive HTML matching the dark luxury UI:
  1. Top navbar with Studio Switcher pill `[ 🎬 2D Video Studio | 🧊 3D Animation Studio ]`.
  2. Left sidebar workbench with 4 tabs:
     - Model: Preset selector (Phone, Coin, Box, Cyber) & GLB upload.
     - Motion: Spin, Float, Orbit, Spring-Pop, Speed slider.
     - Lighting: Cyber Neon, Warm Luxury, Obsidian, Clean Tech, Metalness, Roughness.
     - Overlay: Headline text, Badge, CTA text, Aspect ratio, Duration (5s, 10s, 15s).
  3. Right viewport with WebGL container, playback controls, and Render button.

- [x] **Step 2: Create `public/js/3d-studio.js`**
  Implement interactive Three.js client viewer:
  1. Three.js Scene, PerspectiveCamera, WebGLRenderer, OrbitControls.
  2. Real-time mesh generation matching selected preset (Phone, Coin, Box, Geometric).
  3. Dynamic lighting and material updates upon control changes.
  4. Animation loop reflecting motion speed and type.
  5. `render3DVideo()` function dispatching payload to `/api/render-3d-video` with progress feedback.

- [x] **Step 3: Commit 3D studio UI**
  `git add public/3d.html public/js/3d-studio.js && git commit -m "feat(ui): create dedicated 3D Studio page and interactive Three.js viewport"`

---

### Task 5: Integrate Dual-Studio Switcher on 2D Studio

**Files:**
- Modify: `public/index.html`

**Interfaces:**
- Produces: Seamless 1-click navigation between 2D Studio (`/`) and 3D Studio (`/3d`).

- [x] **Step 1: Update header in `public/index.html`**
  Replace or augment the top header branding with the dual-studio segmented pill switcher:
  - Button 1: `🎬 2D Video Studio` (active highlight)
  - Button 2: `🧊 3D Animation Studio` (links to `/3d`)

- [x] **Step 2: Verify navigation flow**
  Confirm clicking `🧊 3D Animation Studio` loads `/3d`, and clicking `🎬 2D Video Studio` returns to `/`.

- [x] **Step 3: Commit header update**
  `git add public/index.html && git commit -m "feat(nav): add dual-studio switcher pill on 2D Studio header"`

---

### Task 6: End-to-End Test, Render Verification, Git Commit & VPS Deployment

**Files:**
- All touched files

**Interfaces:**
- Produces: Verified local 3D render, clean git working tree, synced VPS deployment on `nyobaai.my.id`.

- [x] **Step 1: Test TypeScript build**
  Run `npx tsc --noEmit` and verify 0 errors.

- [x] **Step 2: Test local 3D render**
  Run a test node script executing `selectComposition({ id: 'MotionCraft3D' })` and `renderMedia` to generate a 5-second 3D MP4.

- [x] **Step 3: Push changes to GitHub `origin/master`**
  Ensure working tree is clean and `git push origin master` completes.

- [x] **Step 4: Pull and deploy to VPS Tencent (`vps-tencent`)**
  SSH into VPS:
  1. `cd /home/ubuntu/remotion-studio`
  2. `git pull origin master`
  3. `npm install`
  4. `pm2 restart remotion-studio`

- [x] **Step 5: Verify live deployment on `https://nyobaai.my.id/3d`**
  Curl `https://nyobaai.my.id/3d` and verify HTTP 200 OK.
  Execute live smoke-test render via `curl -X POST https://nyobaai.my.id/api/render-3d-video`.
