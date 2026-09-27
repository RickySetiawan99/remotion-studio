# Design Specification: General-Purpose Programmatic Video Engine

**Date:** 2026-09-27  
**Status:** Approved by User  
**Target:** Transform `remotion_studio` from a hardcoded template showcase into a 100% data-driven, general-purpose programmatic video rendering engine powered by Remotion, MotionCraft dynamics, and procedural audio.

---

## 1. Executive Summary & Goals

Users want to generate custom motion-graphics explainer and marketing videos using their own scripts, scenes, and media assets. Currently, `src/Composition.tsx` contains hardcoded text and showcase elements. 

This project overhauls the engine into a **Headless + GUI Programmatic Video Rendering Engine**:
1. **Universal JSON Composition Contract**: Any external script (Python, Node.js, AI agent, cURL) or user can provide a standard `composition.json`.
2. **100% Data-Driven Remotion Renderer**: `src/Composition.tsx` contains 0 hardcoded copy. It renders 7 high-taste motion archetypes dynamically based on the input scene data.
3. **Multi-Modal Asset & Voiceover Support**: Users can upload custom images/diagrams and voiceover narration audio tracks with automatic audio ducking for background music.
4. **Frame-Accurate Dynamic SFX**: Sound effects (`whoosh`, `pop`, `type`, `tick`, `success`) are automatically synthesized and placed at exact visual transition frames for any scene arrangement.
5. **Dual Ingestion Paths**:
   - **Web Studio GUI**: Drag-and-drop JSON upload, raw JSON code editor, asset uploaders, live canvas preview, and one-click render.
   - **Direct Headless API**: `POST /api/render-edu-video` to render MP4 directly without a browser.

---

## 2. Universal Data Contract (`composition.json`)

The engine accepts a JSON specification that is easy for humans, scripts, and LLMs to produce:

```typescript
export interface SceneItem {
  type: 
    | 'hook_kinetic'       // Blur-to-ink kinetic text with accented word highlight
    | 'comparison_split'   // Before vs After, Bad vs Good comparison cards
    | 'stat_focus'         // Big bold numeric metric callout with label and ring
    | 'bullet_cards'       // 3 to 5 sequential feature cards with spotlight sweeps
    | 'media_spotlight'    // Custom uploaded image/screenshot with 3D glass tilt & caption
    | 'code_terminal'      // macOS IDE or CLI terminal with typewriter code execution
    | 'outro_cta';         // Final call-to-action button, logo/mascot, and social badges

  tag?: string;            // Optional eyebrow pill text (e.g. "01 / INTRO")
  headline: string;        // Main text. Words enclosed in asterisks (e.g. *kata*) are accented!
  subtext?: string;        // Supporting description or caption

  // Archetype-specific optional fields:
  durationFrames?: number; // Duration of this specific scene in frames (default: 150)
  startFrame?: number;     // Computed or explicit start frame
  endFrame?: number;       // Computed or explicit end frame

  // comparison_split:
  itemsBad?: string[];     // Negative/Before items (red badge)
  itemsGood?: string[];    // Positive/After items (green badge)

  // stat_focus:
  metricValue?: number | string; // e.g. "10x", 94, "Rp 50Jt"
  metricLabel?: string;          // e.g. "Peningkatan Efisiensi"

  // bullet_cards:
  points?: string[];       // 3-5 key points or step descriptions

  // media_spotlight:
  mediaUrl?: string;       // URL or local path to uploaded image/screenshot

  // code_terminal:
  codeSnippet?: string;    // Multi-line code or terminal command
  language?: string;       // "tsx" | "bash" | "json"

  // outro_cta:
  ctaText?: string;        // e.g. "Klik link di bio" or "npx create-video@latest"
  badges?: string[];       // e.g. ["Gratis", "Setup 2 Menit", "Open Source"]
}

export interface VideoCompositionSpec {
  title: string;
  fps?: number;              // Default: 30
  width?: number;            // Default: 1080
  height?: number;           // Default: 1920 (Vertical 9:16)
  durationSec?: number;      // Total duration in seconds (computed or explicit)
  style?: string;            // 'remotion-light' | 'pi-v2-dark' | 'tech-neon-soft' | 'hyper-crypto' | 'sunset-creator' | 'warm-paper' | 'mono-editorial'
  voiceoverUrl?: string;     // Optional voiceover audio path (triggers BGM ducking)
  scenes: SceneItem[];
}
```

---

## 3. Architecture & Subsystems

```
┌────────────────────────────────────────────────────────┐
│                   Input Ingestion                      │
│   Web UI (Upload / Paste JSON)  OR  Headless HTTP API  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           Validation & Timeline Scheduler              │
│  - Validates scene fields & archetypes                 │
│  - Computes sequential startFrame & endFrame           │
│  - Total durationInFrames = sum(scene durations)       │
└──────────────────────────┬─────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     Audio Processing      │ │     Visual Rendering      │
│  - Procedural BGM (music) │ │  - Remotion Chromium      │
│  - VO Speech Ducking      │ │  - src/Composition.tsx    │
│  - Dynamic SFX Cues (sfx) │ │  - 7 Universal Archetypes │
│  - Master to -14.0 LUFS   │ │  - MotionCraft Springs    │
└─────────────┬─────────────┘ └─────────────┬─────────────┘
              │                             │
              └──────────────┬──────────────┘
                             ▼
              ┌─────────────────────────────┐
              │      FFmpeg Video Muxer     │
              │  Fast copy -c:v + aac audio │
              │  Output: renders/<file>.mp4 │
              └─────────────────────────────┘
```

### 3.1. Universal Motion Archetypes (`src/Composition.tsx`)
`src/Composition.tsx` is completely decoupled from any hardcoded copy. It implements:
1. **Dynamic Timeline Scheduler**: Iterates through `props.composition.scenes`, accumulating durations to assign precise `from` and `durationInFrames` to each `<Sequence>`.
2. **Unified Kinetic Typography (`KineticHeadline`)**: Parses words, detects asterisks `*...*` as accent keywords, and generates staggered spring entrances + glowing underlines.
3. **Archetype 1 (`hook_kinetic`)**: Impact entrance, kinetic staggered headline, subtext, and optional badge callouts.
4. **Archetype 2 (`comparison_split`)**: Side-by-side or stacked Before/After cards with icons, bad/good coloration, and sequential pop springs.
5. **Archetype 3 (`stat_focus`)**: Huge animated metric number with glow, circular progress halo, and descriptive label.
6. **Archetype 4 (`bullet_cards`)**: Sequential 3D floating cards with automated spotlight cycling (synchronous tick audio cues).
7. **Archetype 5 (`media_spotlight`)**: Glassmorphic 3D frame rendering `scene.mediaUrl` with floating particles and animated caption.
8. **Archetype 6 (`code_terminal`)**: Code IDE or CLI terminal with typewriter line reveals, live syntax styling, and render/command execution progress bar.
9. **Archetype 7 (`outro_cta`)**: Centered call-to-action button with pulsating glow, branding logo/mascot, and social proof chips.

### 3.2. Audio Synthesis & Voiceover Auto-Ducking (`lib/`)
1. **Dynamic SFX (`lib/sfx.mjs`)**:
   - Loops over arbitrary user scenes.
   - Places `whoosh_in` at relative frame 0.
   - Based on each scene's `type`, places frame-perfect sound cues (`word_pop`, `icon_pop`, `type`, `button`, `slot_tick`, `success`, `check`) on the exact frames where elements enter.
   - Enforces `snap: false` to eliminate beat-grid timing distortion.
2. **Voiceover Auto-Ducking (`lib/dsp.mjs` + `server.js`)**:
   - If `voiceoverUrl` is provided, reads the audio file.
   - Computes RMS envelope of the speech track.
   - Ducks background music by $-14\text{ dB}$ wherever speech energy exceeds $-30\text{ dBFS}$ with a $150\text{ms}$ smooth crossfade.
   - Overlays voiceover + ducked BGM + punchy SFX, mastering final output to $-14.0\text{ LUFS}$ with true peak clipping protection.

### 3.3. Asset Upload & Web Studio UI (`public/index.html` & `server.js`)
1. **JSON Ingestion Controls**:
   - **Upload JSON button**: File input to load local `.json` composition files directly into the editor.
   - **JSON Code Modal / Editor**: Allows pasting raw JSON, auto-validates syntax, and applies it immediately to canvas preview.
2. **Media Asset Upload Endpoint (`POST /api/upload-asset`)**:
   - Accepts images (`.png`, `.jpg`, `.webp`, `.svg`) and audio (`.mp3`, `.wav`).
   - Saves to `public/uploads/` and returns public URL for use in `mediaUrl` or `voiceoverUrl`.
3. **Live Canvas Preview**:
   - Updates canvas preview to render the user's custom uploaded scenes and archetypes in real-time.

---

## 4. Error Handling & Edge Cases

1. **Missing or Incomplete Scene Fields**:
   - If `headline` is missing, defaults gracefully to `scene.tag` or `"Untitled Scene"`.
   - If `durationFrames` is omitted, defaults to 150 frames (5 seconds @ 30fps).
   - If an archetype type is unrecognized, falls back to `hook_kinetic` gracefully.
2. **Media Not Found**:
   - If `mediaUrl` points to a missing file, displays a clean placeholder graphic with an icon rather than crashing Chromium render.
3. **Zero Audio Destruction / PostTooLarge Safeguards**:
   - Multipart asset uploads restricted to 50MB with client-side pre-flight file size validation.
   - Clear client alerts for JSON parsing errors.

---

## 5. Verification Plan

1. **JSON Schema Validation Test**:
   - Create a test script with custom user content (different from Remotion, e.g. "Coffee Roasting Tips" or "SaaS Financial App").
   - Send payload to `POST /api/render-edu-video`.
2. **Audio Mux & Voiceover Ducking Test**:
   - Verify that voiceover mixes cleanly with BGM and that audio loudness stays within $-14\text{ LUFS} \pm 0.5\text{ LUFS}$.
3. **SFX Sync Verification**:
   - Extract frames at milestone timestamps to confirm 100% visual-to-audio sync across custom archetypes.
4. **Web UI End-to-End Test**:
   - Test JSON upload and paste functionality in browser to verify canvas preview updates cleanly.
