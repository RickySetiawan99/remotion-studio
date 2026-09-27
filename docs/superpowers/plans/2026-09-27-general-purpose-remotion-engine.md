# General-Purpose Remotion Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `remotion_studio` into a 100% data-driven, general-purpose programmatic video engine where users can upload or send arbitrary `composition.json` specs with custom text, images, and voiceover to render broadcast-quality MP4 videos.

**Architecture:** A normalized JSON composition schema feeds a pure dynamic `src/Composition.tsx` containing 7 universal motion archetypes (MotionCraft standard). `lib/sfx.mjs` generates frame-accurate procedural sound cues dynamically, while `lib/dsp.mjs` handles voiceover auto-ducking against procedural BGM. Ingestion occurs via Web Studio (Upload/Paste JSON & Asset Upload) and headless HTTP API (`POST /api/render-edu-video`).

**Tech Stack:** Remotion v4, React 18, Node.js (Express), Procedural DSP / WebAudio synthesis, FFmpeg, Vanilla CSS/HTML Canvas.

## Global Constraints

- Zero hardcoded scene copy in `src/Composition.tsx`.
- Mastered audio output: `-14.0 LUFS` ($\pm 0.5\text{ LUFS}$), True Peak $\le +0.5\text{ dBFS}$.
- Dynamic SFX cues must enforce `snap: false` to prevent beat-grid time distortion.
- Max asset upload limit: 50MB with client-side pre-flight file size check.
- High-taste visuals: Clean typography, smooth spring physics (`fps: 60` spring evaluation), 3D perspective tilts, organic camera drift, no generic AI slop.

---

### Task 1: Universal Scene Types & Timeline Normalizer in `src/Composition.tsx`

**Files:**
- Modify: `src/Composition.tsx:11-105`
- Test: `test_timeline_normalizer.mjs`

**Interfaces:**
- Consumes: Raw user `composition` object with optional `durationFrames`, `startFrame`, `endFrame`.
- Produces: `normalizeComposition(comp: VideoCompositionSpec, defaultFps?: number): NormalizedComposition`

- [ ] **Step 1: Write test for timeline normalizer**
Create `test_timeline_normalizer.mjs`:
```javascript
import assert from 'assert';
import { normalizeComposition } from './src/Composition.js'; // or exported from tsx via compile

const rawComp = {
  title: "Test Video",
  fps: 30,
  scenes: [
    { type: 'hook_kinetic', headline: "Hello *World*", durationFrames: 120 },
    { type: 'comparison_split', headline: "Old vs New", durationFrames: 180 },
    { type: 'outro_cta', headline: "Buy Now", durationFrames: 150 }
  ]
};

const norm = normalizeComposition(rawComp, 30);
assert.strictEqual(norm.durationInFrames, 450);
assert.strictEqual(norm.durationSec, 15);
assert.strictEqual(norm.scenes[0].startFrame, 0);
assert.strictEqual(norm.scenes[0].endFrame, 120);
assert.strictEqual(norm.scenes[1].startFrame, 120);
assert.strictEqual(norm.scenes[1].endFrame, 300);
assert.strictEqual(norm.scenes[2].startFrame, 300);
assert.strictEqual(norm.scenes[2].endFrame, 450);
console.log("✓ normalizeComposition passed!");
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node test_timeline_normalizer.mjs`
Expected: FAIL (cannot import or `normalizeComposition` is not exported).

- [ ] **Step 3: Implement universal `Scene` interfaces & `normalizeComposition` in `src/Composition.tsx`**
Update `src/Composition.tsx`:
```typescript
export interface Scene {
  type: string;
  tag?: string;
  headline: string;
  subtext?: string;
  durationFrames?: number;
  startFrame: number;
  endFrame: number;

  // Archetype fields:
  itemsBad?: string[];
  itemsGood?: string[];
  metricValue?: number | string;
  metricLabel?: string;
  points?: string[];
  mediaUrl?: string;
  codeSnippet?: string;
  language?: string;
  ctaText?: string;
  badges?: string[];
}

export function normalizeComposition(comp: any, defaultFps = 30) {
  const fps = comp?.fps || defaultFps;
  let currentFrame = 0;
  const scenes = (comp?.scenes || []).map((sc: any, idx: number) => {
    const dur = sc.durationFrames || (sc.endFrame && sc.startFrame != null ? sc.endFrame - sc.startFrame : 150);
    const start = sc.startFrame != null ? sc.startFrame : currentFrame;
    const end = sc.endFrame != null ? sc.endFrame : start + dur;
    currentFrame = end;
    return {
      ...sc,
      durationFrames: dur,
      startFrame: start,
      endFrame: end,
    };
  });
  const totalFrames = currentFrame > 0 ? currentFrame : 1800;
  return {
    ...comp,
    fps,
    durationInFrames: totalFrames,
    durationSec: Math.ceil(totalFrames / fps),
    scenes,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `node test_timeline_normalizer.mjs`
Expected: `✓ normalizeComposition passed!`

- [ ] **Step 5: Clean up test script**
Run: `rm test_timeline_normalizer.mjs`

---

### Task 2: Implement 7 Universal Motion Archetypes in `src/Composition.tsx`

**Files:**
- Modify: `src/Composition.tsx:600-1450`
- Test: `test_bundle.mjs`

**Interfaces:**
- Consumes: Normalized `scene: Scene`, `theme`, `fps`, `width`, `height`.
- Produces: React JSX components for each of the 7 archetypes:
  1. `hook_kinetic` / `hero_typography`
  2. `comparison_split` / `split_screen`
  3. `stat_focus` / `stat_callout`
  4. `bullet_cards` / `frame_sequence_cards`
  5. `media_spotlight`
  6. `code_terminal` / `code_window_react` / `terminal_cli_render`
  7. `outro_cta` / `remotion_outro`

- [ ] **Step 1: Write bundle verification test script**
Create `test_bundle.mjs`:
```javascript
import { spawn } from 'child_process';

const p = spawn('npx', ['remotion', 'bundle', 'src/index.ts', '--props={}']);
p.on('close', code => {
  if (code === 0) console.log("✓ Bundle verification passed!");
  else { console.error("Bundle failed with code", code); process.exit(1); }
});
```

- [ ] **Step 2: Implement 7 pure data-driven archetypes in `SceneRenderer`**
Remove all hardcoded text ("Kenalin Remotion", "Canva", "After Effects", etc.).
Render dynamically:
- `comparison_split`: Maps `scene.itemsBad || ['Cara Lama']` with red badges & cross icons, and `scene.itemsGood || ['Cara Baru']` with emerald badges & check icons.
- `stat_focus`: Animates `scene.metricValue || '10x'` using spring scaling and glowing progress ring, with `scene.metricLabel`.
- `bullet_cards`: Maps `scene.points || []` into 3D cards with staggered entry and automated spotlight active state cycling every 35 frames.
- `media_spotlight`: Renders `scene.mediaUrl` inside an elevated glassmorphic card with smooth 3D tilt `Math.sin(frame * 0.05) * 4deg`, specular highlight, and subtitle caption. If `mediaUrl` is empty, displays a clean placeholder icon.
- `code_terminal`: Renders `scene.codeSnippet` in macOS dark terminal window with typewriter line reveal per frame milestone.
- `outro_cta`: Displays `scene.headline`, big glowing CTA button with `scene.ctaText || 'Mulai Sekarang'`, and social badge chips from `scene.badges || []`.

- [ ] **Step 3: Run bundle verification test**
Run: `node test_bundle.mjs`
Expected: `✓ Bundle verification passed!` with exit code 0.

- [ ] **Step 4: Clean up test script**
Run: `rm test_bundle.mjs`

---

### Task 3: Dynamic Frame-Accurate SFX Generation in `lib/sfx.mjs`

**Files:**
- Modify: `lib/sfx.mjs:70-160`
- Test: `test_sfx_dynamic.mjs`

**Interfaces:**
- Consumes: Normalized `composition` with arbitrary user `scenes`.
- Produces: Array of `{ type, t, gain, snap: false, pitch? }` cues matching each scene archetype's animation frames.

- [ ] **Step 1: Write test for dynamic SFX cue generation**
Create `test_sfx_dynamic.mjs`:
```javascript
import assert from 'assert';
import * as S from './lib/sfx.mjs';

const comp = {
  scenes: [
    { type: 'hook_kinetic', startFrame: 0, endFrame: 150 },
    { type: 'comparison_split', startFrame: 150, endFrame: 300, itemsBad: ['A', 'B'], itemsGood: ['C'] },
    { type: 'stat_focus', startFrame: 300, endFrame: 450 },
    { type: 'media_spotlight', startFrame: 450, endFrame: 600 },
    { type: 'outro_cta', startFrame: 600, endFrame: 750 }
  ]
};

const cues = S.generateAutoSfxCues(comp, 30);
assert(cues.length > 10, "Should generate cues for all scenes");
assert(cues.every(c => c.snap === false), "All visual cues must have snap: false");
assert(cues.some(c => c.t === 0), "Opening whoosh at t=0");
assert(cues.some(c => c.t === 150 / 30), "Scene 2 whoosh at t=5.0");
console.log("✓ SFX dynamic generator passed!");
```

- [ ] **Step 2: Run test to verify it fails on missing archetypes**
Run: `node test_sfx_dynamic.mjs`
Expected: FAIL if `media_spotlight` or `comparison_split` dynamic mapping is missing.

- [ ] **Step 3: Update `generateAutoSfxCues` in `lib/sfx.mjs`**
Ensure every archetype is handled:
- `hook_kinetic` / `hero_typography`: `impact` at f0, `word_pop` at f15.
- `comparison_split`: `icon_pop` at f18 & f24 for bad items, `bubble` at f32 for good items.
- `stat_focus`: `impact` at f10, `success` at f25.
- `bullet_cards`: `icon_pop` for each card entrance, `slot_tick` on every spotlight frame switch.
- `media_spotlight`: `whoosh_in` at f0, `button` at f16 (media snap), `bubble` at f30.
- `code_terminal`: typewriter clicks `type` sequentially, `riser` sweep and `success` chime on complete.
- `outro_cta`: `logo_sting` at f0, `button` at f18 (CTA pop), `confetti` at f26.

- [ ] **Step 4: Run test to verify it passes**
Run: `node test_sfx_dynamic.mjs`
Expected: `✓ SFX dynamic generator passed!`

- [ ] **Step 5: Clean up test script**
Run: `rm test_sfx_dynamic.mjs`

---

### Task 4: Voiceover Auto-Ducking in `lib/dsp.mjs` & `server.js`

**Files:**
- Modify: `lib/dsp.mjs:200-240`
- Modify: `server.js:650-680`
- Test: `test_ducking.mjs`

**Interfaces:**
- Consumes: `bgmBuf: StereoBuffer`, `voiceBuf: StereoBuffer`, `{ duckDb?: number, thresholdDb?: number }`.
- Produces: `duckedBgmBuf: StereoBuffer` with smooth volume attenuation during speech.

- [ ] **Step 1: Write unit test for `duckAudio`**
Create `test_ducking.mjs`:
```javascript
import assert from 'assert';
import * as D from './lib/dsp.mjs';

const len = D.SR * 2; // 2 seconds
const bgm = D.stereo(len);
bgm[0].fill(0.5); bgm[1].fill(0.5); // Constant BGM

const voice = D.stereo(len);
// Speech active between 0.5s and 1.5s
const startIdx = Math.floor(0.5 * D.SR);
const endIdx = Math.floor(1.5 * D.SR);
for (let i = startIdx; i < endIdx; i++) {
  voice[0][i] = 0.8 * Math.sin(2 * Math.PI * 440 * i / D.SR);
  voice[1][i] = 0.8 * Math.sin(2 * Math.PI * 440 * i / D.SR);
}

const ducked = D.duckAudio(bgm, voice, { duckDb: -14, thresholdDb: -30 });
// Check that ducked level at 1.0s is substantially lower than at 0.1s
const rmsQuiet = Math.sqrt(ducked[0].slice(startIdx + 2000, startIdx + 4000).reduce((s, x) => s + x*x, 0) / 2000);
const rmsLoud = Math.sqrt(ducked[0].slice(100, 2100).reduce((s, x) => s + x*x, 0) / 2000);
assert(rmsQuiet < rmsLoud * 0.4, "BGM should be ducked by at least -8dB during speech");
console.log("✓ duckAudio passed!");
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node test_ducking.mjs`
Expected: FAIL (`D.duckAudio is not a function`).

- [ ] **Step 3: Implement `duckAudio` in `lib/dsp.mjs`**
Calculate envelope follower on voice track, apply smooth gain multiplier:
```javascript
export function duckAudio(bgm, voice, { duckDb = -14, thresholdDb = -30, attackSec = 0.05, releaseSec = 0.15 } = {}) {
  const n = bgm[0].length;
  const out = [new Float32Array(bgm[0]), new Float32Array(bgm[1])];
  const duckGain = db(duckDb);
  const threshAmp = db(thresholdDb);
  const aCoeff = Math.exp(-1 / (attackSec * SR));
  const rCoeff = Math.exp(-1 / (releaseSec * SR));

  let env = 0;
  for (let i = 0; i < n; i++) {
    const vL = i < voice[0].length ? Math.abs(voice[0][i]) : 0;
    const vR = i < voice[1].length ? Math.abs(voice[1][i]) : 0;
    const vMax = Math.max(vL, vR);
    env = vMax > env ? aCoeff * env + (1 - aCoeff) * vMax : rCoeff * env + (1 - rCoeff) * vMax;

    const g = env > threshAmp ? duckGain + (1 - duckGain) * Math.max(0, 1 - (env - threshAmp) / 0.2) : 1.0;
    out[0][i] *= g;
    out[1][i] *= g;
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `node test_ducking.mjs`
Expected: `✓ duckAudio passed!`

- [ ] **Step 5: Clean up test script**
Run: `rm test_ducking.mjs`

---

### Task 5: Asset Upload Endpoint in `server.js`

**Files:**
- Modify: `server.js:40-60`
- Test: `test_upload_endpoint.mjs`

**Interfaces:**
- Consumes: `POST /api/upload-asset` with `multipart/form-data` or raw body.
- Produces: `{ success: true, url: "/uploads/<filename>", filename: string, size: number }`

- [ ] **Step 1: Write integration test for `/api/upload-asset`**
Create `test_upload_endpoint.mjs`:
```javascript
import assert from 'assert';
import fs from 'fs';

const dummyData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header
const form = new FormData();
form.append('file', new Blob([dummyData]), 'test_image.png');

const res = await fetch('http://localhost:3005/api/upload-asset', {
  method: 'POST',
  body: form
});
const json = await res.json();
assert.strictEqual(json.success, true);
assert(json.url.startsWith('/uploads/'));
assert(fs.existsSync('./public' + json.url));
console.log("✓ /api/upload-asset passed!");
```

- [ ] **Step 2: Implement `/api/upload-asset` in `server.js`**
Ensure `public/uploads` directory exists.
Use `multer` or standard streaming to save files safely, checking file extensions (`.png`, `.jpg`, `.jpeg`, `.webp`, `.mp3`, `.wav`) and enforcing 50MB limit.

- [ ] **Step 3: Run integration test**
Run: `node test_upload_endpoint.mjs`
Expected: `✓ /api/upload-asset passed!`

- [ ] **Step 4: Clean up test script and uploaded file**
Run: `rm test_upload_endpoint.mjs && rm -f ./public/uploads/test_image*`

---

### Task 6: Web Studio GUI JSON Ingestion & Media Dropzone in `public/index.html`

**Files:**
- Modify: `public/index.html:70-150`
- Modify: `public/index.html:1640-1780`
- Test: Browser verification of UI controls

**Interfaces:**
- Consumes: User uploaded `.json` file or pasted JSON text.
- Produces: Updated global `composition`, canvas re-render, and timeline scrubber update.

- [ ] **Step 1: Add "📁 Upload JSON" & "📋 JSON Editor" buttons in `public/index.html`**
Include:
- Hidden `<input type="file" id="jsonFileInput" accept=".json" onchange="handleJsonUpload(event)">`.
- Button **"📁 Upload JSON"** triggering file dialog.
- Button **"📋 Edit / Paste JSON"** opening modal with syntax-highlighted textarea.
- Pre-flight validation catching malformed JSON or invalid scenes with clean SweetAlert / inline feedback.

- [ ] **Step 2: Add Asset Upload Dropzone in Scene Editor modal**
For any scene with `media_spotlight`, show an image upload dropzone calling `/api/upload-asset` and populating `scene.mediaUrl`.
For global voiceover, show audio file uploader populating `composition.voiceoverUrl`.

- [ ] **Step 3: Update Canvas Preview logic in `public/index.html`**
Ensure `renderPreviewFrame()` draws the 7 universal archetypes on canvas matching the Remotion render logic.

- [ ] **Step 4: Test in browser via automated headless curl or browser check**
Verify clicking upload / pasting JSON parses and updates canvas frame without console errors.

---

### Task 7: End-to-End Test with Novel Real-World Custom Composition

**Files:**
- Create: `test_e2e_custom_render.mjs`
- Test: Verification of generated MP4

**Interfaces:**
- Consumes: A completely novel, non-Remotion topic (e.g. "Kopi Nusantara: 3 Rahasia Espresso Creamy").
- Produces: Output MP4 verified for duration, audio mastering (-14.0 LUFS), and correct visual archetypes.

- [ ] **Step 1: Write E2E test script with novel custom content**
Create `test_e2e_custom_render.mjs`:
```javascript
import assert from 'assert';
import fs from 'fs';

const customPayload = {
  composition: {
    title: "Kopi Nusantara Espresso",
    style: "warm-paper",
    scenes: [
      {
        type: "hook_kinetic",
        durationFrames: 120,
        tag: "01 / KOPI TERBAIK",
        headline: "Rahasia Bikin Espresso *Super Creamy*",
        subtext: "Bukan mesin mahal, kuncinya ada pada 3 hal sederhana ini."
      },
      {
        type: "comparison_split",
        durationFrames: 150,
        tag: "02 / PERBANDINGAN",
        headline: "Biji Kopi Lama vs *Fresh Roasted*",
        itemsBad: ["Crema tipis & pahit", "Aroma apek hilang"],
        itemsGood: ["Crema tebal keemasan", "Aroma floral segar"]
      },
      {
        type: "stat_focus",
        durationFrames: 150,
        tag: "03 / RATIO EMAS",
        headline: "Rasio Ekstraksi *1 banding 2*",
        metricValue: "1:2",
        metricLabel: "Golden Extraction Ratio",
        subtext: "18 gram kopi bubuk menghasilkan 36 gram liquid espresso dalam 28 detik."
      },
      {
        type: "outro_cta",
        durationFrames: 120,
        tag: "04 / COBA DI RUMAH",
        headline: "Sudah Coba Seduh *Hari Ini?*",
        ctaText: "Bagikan Tips Ini ke Teman Kopi!",
        badges: ["Home Barista", "100% Arabika"]
      }
    ]
  }
};

const res = await fetch('http://localhost:3005/api/render-edu-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(customPayload)
});
const data = await res.json();
assert.strictEqual(data.success, true);
assert(fs.existsSync('./renders/' + data.filename));
console.log("✓ E2E Custom Render Succeeded:", data.filename);
```

- [ ] **Step 2: Run E2E test**
Run: `node test_e2e_custom_render.mjs`
Expected: Success with newly generated MP4 file.

- [ ] **Step 3: Verify video stream & audio loudness with ffmpeg**
Run:
`ffprobe -v error -show_entries format=duration -of json renders/<filename>.mp4`
`ffmpeg -i renders/<filename>.mp4 -filter:a ebur128=peak=true -f null - 2>&1 | tail -n 16`
Expected: Exact duration match, `-14.0 LUFS` ($\pm 0.5\text{ LUFS}$).

- [ ] **Step 4: Clean up test script**
Run: `rm test_e2e_custom_render.mjs`
