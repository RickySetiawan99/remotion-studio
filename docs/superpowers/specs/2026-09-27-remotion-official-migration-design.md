# Design Specification: Official Remotion Framework Migration

## 1. Overview
Migrate `remotion_studio` from a custom Node.js Canvas 2D + FFmpeg pipe implementation to the official **[Remotion](https://github.com/remotion-dev/remotion)** framework (`remotion`, `@remotion/bundler`, `@remotion/renderer`, `react`, `react-dom`). This enables developers to author video compositions using React JSX, spring physics, and CSS, while retaining the existing lightweight Web Studio UI (`http://localhost:3005`) and adding the official Remotion Preview GUI (`npm run remotion:studio`).

## 2. Architecture & Design Principles (Ponytail & YAGNI)
- **Shortest Path to Done:** Use standard Remotion primitives (`<Composition>`, `<Sequence>`, `useCurrentFrame()`, `useVideoConfig()`, `spring()`, `interpolate()`, `<Audio>`).
- **Zero Unneeded Abstractions:** No multi-layered wrapper classes. Direct usage of `@remotion/bundler` and `@remotion/renderer` inside `server.js`.
- **Hybrid Coexistence:**
  - `src/` houses the React Remotion source code.
  - `server.js` orchestrates AI script generation, procedural audio synthesis, and server-side MP4 rendering via Remotion `renderMedia()`.
  - `public/index.html` provides the interactive client web studio with instant canvas/player scrubbing, platform aspect selection, preset themes, and export trigger.

## 3. Component Architecture (`src/`)

### 3.1 `src/index.ts`
Registers the Remotion root component via `registerRoot(RemotionRoot)`.

### 3.2 `src/Root.tsx`
Defines `<Composition>` configurations:
- **ID:** `MotionCraftVideo`
- **Default Resolution:** 1080x1920 (Vertical 9:16), dynamically overrideable via `inputProps` (4:5, 1:1, 16:9).
- **Default FPS:** 30
- **Duration:** Dynamic based on `durationSec` (default 1800 frames = 60s).
- **Component:** `MainVideo` from `./Composition`.

### 3.3 `src/Composition.tsx`
React video component accepting inputProps:
```typescript
export interface VideoProps {
  composition: {
    title: string;
    scenes: Array<{
      type: string;
      tag?: string;
      headline: string;
      subtext?: string;
      points?: string[];
      metricValue?: number;
      metricLabel?: string;
      codeSnippet?: string;
      quoteText?: string;
      quoteAuthor?: string;
      startFrame: number;
      endFrame: number;
    }>;
  };
  style: string;
  audioUrl?: string;
}
```
Scenes implemented:
1. `hero_typography`: Kinetic headline with staggered word animation, floating rings, focus badge.
2. `split_screen`: Side-by-side comparison (Traditional vs AI Autonomous) with smooth entry springs.
3. `stat_focus`: Large numeral counting with shockwave pulse rings and metric label.
4. `terminal_ide`: macOS terminal window with syntax-highlighted code execution.
5. `staggered_capsules`: Kinetic checkmark cards sliding in with spring physics.
6. `<Audio>` tag providing background music track.

## 4. Backend Engine Integration (`server.js`)
- Bundle caching:
  - Cache the Webpack/Remotion bundle output location in memory.
  - Invalidate cache only when `src/` changes.
- Endpoint `/api/render-edu-video`:
  1. Receives `{ composition, style }` from client.
  2. Synthesizes procedural MotionCraft DSP audio (or generates audio track).
  3. Invokes `selectComposition({ serveUrl: bundlePath, id: 'MotionCraftVideo', inputProps })`.
  4. Calls `renderMedia({ composition, serveUrl: bundlePath, codec: 'h264', outputLocation, inputProps })`.
  5. Returns `{ success: true, filename, url }`.

## 5. Verification & Definition of Done
1. Dependencies installed and `tsconfig.json` configured without errors.
2. Official Remotion GUI (`npx remotion preview src/index.ts`) launches and previews the composition.
3. Node.js backend (`server.js`) successfully renders a complete MP4 video using `@remotion/renderer`.
4. Output video verified for video playback, resolution, frame rate, and synchronized audio.
