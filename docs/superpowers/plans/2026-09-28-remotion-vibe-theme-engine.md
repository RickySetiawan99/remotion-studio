# Implementation Plan: Programmatic Remotion Vibe & Theme Engine
**Spec Reference:** [`docs/superpowers/specs/2026-09-28-remotion-vibe-theme-engine-prd.md`](file:///Users/ricky/Documents/js/remotion_studio/docs/superpowers/specs/2026-09-28-remotion-vibe-theme-engine-prd.md)  
**Date:** 2026-09-28  
**Architecture:** Bundle-Once, Parametrize-Always via `inputProps` (`@remotion/bundler` + `@remotion/renderer`)  

---

## 1. Overview
Implement the centralized **Unified Parametric Vibe Engine** for MotionCraft Studio. This decouples video mood/atmosphere from the core render pipeline by compiling the Remotion React bundle once and driving all stylistic variations (*Ramai & Viral*, *Eksklusif & Minimalis*, *Cyber Tech*, *Clean Corporate*) dynamically through `inputProps`. This includes visual layer styling, spring physics, background ambience, auto-toggled motion primitives, and procedural audio/SFX synchronization.

---

## 2. Architecture & Dependency Graph

```
┌──────────────────────────────────────────────────────────────┐
│                    Shared VIBE_TOKENS                        │
│ (Colors, Spring Physics, Ambience, Audio Profiles, Primitives) │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ Remotion Composition (React) │ │     Studio Workbench UI      │
│     `src/Composition.tsx`    │ │ `workbench.html`, `studio.js`│
│  - Dynamic spring physics    │ │  - 4 Vibe Selector Cards     │
│  - Ambience layers (3D grid, │ │  - Auto-toggle active badges │
│    aura glow, scanline IDE)  │ │  - Live Canvas Preview Sync  │
└──────────────┬───────────────┘ └──────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│               Backend Render Pipeline (`server.js`)          │
│  - Reads `vibe` from payload & resolves `VIBE_TOKENS`        │
│  - Synthesizes mood-matched procedural audio & SFX cues      │
│  - Executes `renderMedia` with cached bundle & `inputProps`  │
│  - Muxes audio/video stream without video re-encoding        │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Ordered Task Breakdown

### Phase 1: Foundations & Token Contract

#### Task 1: Centralized Vibe Presets Token Registry
**Description:** Create a shared, authoritative token registry defining the 4 core vibes (`ramai`, `eksklusif`, `cyber`, `corporate`) with their exact color palettes, spring motion physics (`damping`, `stiffness`, `mass`), ambience flags, recommended visual elements, and audio profiles.
**Acceptance criteria:**
- [ ] Export `VIBE_PRESETS` catalog with comprehensive tokens for all 4 vibes (`ramai`, `eksklusif`, `cyber`, `corporate`).
- [ ] TypeScript interfaces for `VibePresetId`, `VibeThemeTokens`, and `VideoProps` exported in `src/Composition.tsx`.
- [ ] ESM export available for node/backend consumption (`lib/vibe-tokens.mjs`).
**Verification:**
- [ ] `npx tsc --noEmit` compiles cleanly (0 errors).
- [ ] Node can import and read `lib/vibe-tokens.mjs`.
**Dependencies:** None  
**Files likely touched:**
- `lib/vibe-tokens.mjs` (New)
- `src/Composition.tsx`
**Estimated scope:** Small (2 files)

---

### Phase 2: Remotion React Bundle Dynamic Theming

#### Task 2: Remotion Composition Dynamic Vibe Rendering
**Description:** Update `src/Composition.tsx` so that `MotionCraftVideo` consumes `vibe` and `theme` from `inputProps`. Implement dynamic spring physics interpolation and conditional ambient layers (3D horizon perspective grid for `ramai`, frosted glass aura for `eksklusif`, matrix scanline grid for `cyber`, clean slate panels for `corporate`).
**Acceptance criteria:**
- [ ] All scene text, badges, and cards use spring physics configured by `props.theme.motion` (`springDamping`, `springStiffness`, `springMass`).
- [ ] Background layer conditionally renders ambience matching `props.vibe` (Aura blur, 3D horizon grid, cyber terminal grid).
- [ ] Frosted glass highlight ribbon renders strictly behind headline text using `theme.colors.highlightRibbon`.
- [ ] Backward compatibility preserved if `inputProps` does not contain `vibe` (defaults gracefully to `ramai` or `pi-v2-dark`).
**Verification:**
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] Remotion test composition renders sample frames for each of the 4 vibes without runtime exceptions.
**Dependencies:** Task 1  
**Files likely touched:**
- `src/Composition.tsx`
**Estimated scope:** Medium (1-2 files)

---

### Phase 3: Server Render Pipeline & Audio Sync

#### Task 3: Backend Render & Audio Synthesis Vibe Integration
**Description:** Update `server.js` render endpoint (`POST /api/render-edu-video`) to resolve the requested `vibe`, generate procedural music with appropriate BPM/preset (e.g. `hype-punch` at 126 BPM for `ramai`, `calm-editorial` at 100 BPM for `eksklusif`), adapt SFX cues and gain, and pass complete `vibe` + `theme` tokens into `selectComposition` and `renderMedia`.
**Acceptance criteria:**
- [ ] Endpoint `/api/render-edu-video` accepts `vibe` parameter in request body.
- [ ] Resolves audio preset, BPM, and SFX pack dynamically based on `vibe`.
- [ ] `inputProps` passed to `selectComposition` and `renderMedia` includes `vibe`, `theme`, and `activeVisualElements`.
- [ ] Output MP4 retains audio-video synchronization with proper -14 LUFS mastering.
**Verification:**
- [ ] POST request with `{ vibe: 'eksklusif' }` synthesizes audio and calls renderMedia without server crash.
- [ ] Temporary mux files (`temp_video_*.mp4`, `audio_*.wav`) cleaned up post-render.
**Dependencies:** Tasks 1, 2  
**Files likely touched:**
- `server.js`
- `lib/sfx.mjs`
**Estimated scope:** Medium (2 files)

---

### Checkpoint 1: Engine & Render Verification
- [ ] TypeScript compilation verified: `npx tsc --noEmit`
- [ ] Single test render via official Remotion bundle succeeds and outputs valid playable MP4
- [ ] Audio correctly aligned with video timeline

---

### Phase 4: Studio Workbench UI & Real-Time Preview

#### Task 4: Studio Workbench Vibe Selector Cards & Auto-Toggle
**Description:** Replace generic style selectors in `public/sections/workbench.html` with the 4 dedicated **Suasana Video (Vibe)** interactive selector cards (*Ramai & Viral*, *Eksklusif & Minimalis*, *Cyber Tech*, *Clean Corporate*). Connect selection in `public/js/studio.js` to update studio state, auto-toggle recommended visual element buttons, and update payload dispatch.
**Acceptance criteria:**
- [ ] 4 interactive Vibe cards rendered in Section 2 with icons, badges, and micro-descriptions.
- [ ] Clicking a Vibe card updates `currentVibe` and highlights the active card.
- [ ] Switching vibe auto-toggles the recommended *Elemen Visual Gerak* buttons while still allowing the user to toggle them manually.
- [ ] Mobile responsive layout verified (no horizontal scroll, tap target > 40px).
**Verification:**
- [ ] Browser testing: Clicking each card updates active state and triggers element toggles.
- [ ] Dispatch payload includes correct `vibe` string.
**Dependencies:** Task 1  
**Files likely touched:**
- `public/sections/workbench.html`
- `public/js/studio.js`
- `public/css/style.css`
**Estimated scope:** Medium (3 files)

#### Task 5: Real-Time Canvas Preview Vibe Ambiance Sync
**Description:** Enhance `public/js/canvas-renderer.js` so that the client-side interactive preview immediately reflects the active `currentVibe` (background aura glow, 3D perspective grid, cyber scanline lines, and ribbon colors) during timeline playback and scrubbing.
**Acceptance criteria:**
- [ ] Real-time canvas draws background ambiance corresponding to `currentVibe`.
- [ ] Headline highlight ribbon reflects the active vibe accent color.
- [ ] Frame scrubbing at 60fps remains smooth (> 50fps) without layout jank.
**Verification:**
- [ ] Scrubbing timeline across 0s-60s shows updated vibe visual styling immediately.
**Dependencies:** Task 4  
**Files likely touched:**
- `public/js/canvas-renderer.js`
**Estimated scope:** Medium (1 file)

---

### Checkpoint 2: Studio UI & Preview Polish
- [ ] UI looks premium, polished, and responsive across desktop (1280x800) and mobile (390x844).
- [ ] Changing vibe updates canvas preview immediately without page reload.
- [ ] User can customize text/scenes and see vibe reflections in real time.

---

### Phase 5: Verification, Git Commit & VPS Deployment

#### Task 6: Full Verification, Master Push & VPS Tencent Deployment
**Description:** Perform complete end-to-end testing locally, commit verified code to `master`, push to GitHub `origin/master`, pull to VPS Tencent (`/home/ubuntu/remotion-studio`), install dependencies, restart PM2 `remotion-studio`, and verify live URL (`https://nyobaai.my.id/`).
**Acceptance criteria:**
- [ ] Local build and TypeScript check: 0 errors (`npx tsc --noEmit`).
- [ ] Git commit and push on branch `master`: clean working tree.
- [ ] VPS updated: `git pull origin master` on `vps-tencent`.
- [ ] PM2 restart successful: process `remotion-studio` online.
- [ ] Live verification: `curl -s -I https://nyobaai.my.id/` returns `HTTP/2 200 OK`.
**Verification:**
- [ ] Live site responsive and functional in browser.
**Dependencies:** Tasks 1-5  
**Files likely touched:**
- All modified project files
**Estimated scope:** Small-Medium

---

## 4. Risks and Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Remotion bundle cache stale after code change | High | Invalidate `remotionBundleLocation` on server startup and check timestamp / bundle existence before serving. |
| VPS memory exhaustion during Chromium rendering | Medium | Configure Chromium with `--no-sandbox --disable-dev-shm-usage` and keep concurrency = 1 on VPS. |
| Procedural audio synthesis warning if audio libraries miss edge case | Low | Graceful try/catch in `server.js` renders video without crashing if audio synthesis encounters unexpected error. |
