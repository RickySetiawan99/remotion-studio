# Design Spec: MotionCraft Studio — Remotion Full Feature Expansion V2

**Version:** 2.0.0  
**Status:** Pending User Approval  
**Date:** 2026-09-28  
**Previous PRD:** `2026-09-28-remotion-vibe-theme-engine-prd.md` (V1 — 4 Vibes, 7 Elements)

---

## 1. Problem Statement & Motivation

MotionCraft Studio V1 ships with 4 Vibe presets and 7 basic visual elements, all packed into a monolithic 1,268-line `Composition.tsx`. The official Remotion ecosystem provides far richer capabilities that V1 does not expose:

| Capability | Remotion Package | V1 Status | V2 Target |
|:---|:---|:---|:---|
| Scene transitions (slide, wipe, flip, fade) | `@remotion/transitions` | ❌ Hard cuts only | ✅ 5 transition types |
| Parametric shapes (Star, Polygon, Triangle, Pie) | `@remotion/shapes` | ❌ None | ✅ 6 shape types |
| Lottie vector doodles | `@remotion/lottie` | ❌ None | ✅ Arrow, circle, sparkles |
| Audio-reactive visualizer | `@remotion/media-utils` | ❌ None | ✅ Frequency bars + waveform |
| Multi-aspect-ratio canvas | Core `<Composition>` props | ❌ 9:16 only | ✅ 9:16, 16:9, 1:1 |
| Kinetic typography (word-by-word spring) | Core `spring()` + `interpolate()` | ⚠️ Basic | ✅ 4 text animation modes |
| Dynamic data charts & gauges | Core `interpolate()` + SVG | ⚠️ Basic counter | ✅ Bar charts, pie gauges, progress rings |

V1's monolithic `Composition.tsx` must be decomposed into modular sub-components under `src/components/` to keep the codebase maintainable as features grow.

---

## 2. Architecture: Modular Remotion Component Engine

### 2.1 File Structure (Target)

```
src/
├── index.ts                       # Remotion entry point (unchanged)
├── Root.tsx                       # registerRoot (unchanged)
├── Composition.tsx                # Main orchestrator (slimmed down)
├── types.ts                       # Shared type definitions extracted
├── vibe-themes.ts                 # VIBE_THEMES registry extracted
├── components/
│   ├── transitions/
│   │   └── SceneTransition.tsx    # TransitionSeries wrapper
│   ├── shapes/
│   │   └── KineticShapes.tsx      # Star, Polygon, Triangle, Pie floating
│   ├── typography/
│   │   └── KineticText.tsx        # Word-by-word spring, typewriter, gradient clip
│   ├── data/
│   │   └── DataGauge.tsx          # Bar chart, circular gauge, progress ring
│   ├── audio/
│   │   └── AudioVisualizer.tsx    # Frequency bars & waveform
│   └── doodles/
│       └── LottieDoodle.tsx       # Arrow, circle-highlight, sparkles
```

### 2.2 Composition.tsx Orchestration Pattern

`Composition.tsx` becomes a thin orchestrator that reads `inputProps` and delegates rendering to sub-components:

```tsx
// Simplified Composition.tsx orchestration
<AbsoluteFill>
  <BackgroundLayer theme={theme} />
  <SceneTransition
    scenes={scenes}
    transition={inputProps.transition ?? 'auto'}
    theme={theme}
  >
    {scenes.map(scene => (
      <SceneRenderer scene={scene} theme={theme}>
        <KineticText mode={textMode} ... />
        <KineticShapes shapes={activeShapes} ... />
        <DataGauge data={scene.metricValue} ... />
        <LottieDoodle doodle={scene.doodle} ... />
      </SceneRenderer>
    ))}
  </SceneTransition>
  <AudioVisualizer src={audioUrl} style={vizStyle} />
</AbsoluteFill>
```

### 2.3 Core Principle: Bundle-Once, Parametrize-Always

This architecture preserves V1's SSR model. All new features are controlled exclusively via `inputProps` — no code changes needed between renders. The cached bundle stays warm.

---

## 3. Feature Module Specifications

### 3.1 Scene Transitions (`@remotion/transitions`)

**Package:** `@remotion/transitions` (compatible with project's Remotion v4.0.529)

**Available Transitions:**

| Transition ID | Import Path | Visual Effect | Best For Vibe |
|:---|:---|:---|:---|
| `fade` | `@remotion/transitions/fade` | Crossfade opacity blend | `eksklusif`, `corporate` |
| `slide` | `@remotion/transitions/slide` | Directional slide-over (left/right/up/down) | `ramai`, `corporate` |
| `wipe` | `@remotion/transitions/wipe` | Horizontal/vertical wipe reveal | `ramai`, `cyber` |
| `flip` | `@remotion/transitions/flip` | 3D card flip along axis | `cyber`, `ramai` |
| `clockWipe` | `@remotion/transitions/clock-wipe` | Radial clock sweep | `corporate`, `eksklusif` |

**`inputProps` Contract Extension:**

```typescript
export type TransitionType = 'fade' | 'slide' | 'wipe' | 'flip' | 'clockWipe' | 'auto' | 'none';

// Added to VideoProps
interface VideoProps {
  transition?: TransitionType;
  transitionDurationFrames?: number; // default: 15
}
```

**Auto Mode:** When `transition: 'auto'`, the system selects based on `vibe`:
- `ramai` → alternates `slide` and `wipe`
- `eksklusif` → `fade`
- `cyber` → alternates `flip` and `wipe`
- `corporate` → `clockWipe`

**Implementation (SceneTransition.tsx):**

```tsx
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { clockWipe } from '@remotion/transitions/clock-wipe';

const TRANSITION_MAP = {
  fade: fade(),
  slide: slide(),
  wipe: wipe(),
  flip: flip(),
  clockWipe: clockWipe(),
};
```

---

### 3.2 Kinetic Shapes (`@remotion/shapes`)

**Package:** `@remotion/shapes`

**Available Shape Components:**

| Shape | Component | Key Props | Animation |
|:---|:---|:---|:---|
| Star | `<Star>` | `points`, `innerRadius`, `outerRadius`, `fill` | Rotation + scale bounce |
| Polygon | `<Polygon>` | `points`, `radius`, `fill` | Floating drift + spin |
| Triangle | `<Triangle>` | `length`, `direction`, `fill` | Directional slide-in |
| Pie (Gauge) | `<Pie>` | `radius`, `progress`, `fill`, `stroke` | Progress interpolation |
| Rect | `<Rect>` | `width`, `height`, `fill` | Scale-in pop |
| Ellipse | `<Ellipse>` | `rx`, `ry`, `fill` | Pulsing orbit |

**`inputProps` Contract Extension:**

```typescript
export type ShapeType = 'star' | 'polygon' | 'triangle' | 'pie' | 'rect' | 'ellipse';

interface KineticShapesConfig {
  enabled: boolean;
  shapes: ShapeType[];
  density: number;           // 1-5, how many instances (default: 3)
  colorSource: 'vibe' | 'custom';
  customColors?: string[];
}

interface VideoProps {
  kineticShapes?: KineticShapesConfig;
}
```

**Behavior:** Shapes float as ambient decorative elements in the background/midground layer. They rotate, scale, and drift using `spring()` + `interpolate()`. The fill colors are driven by `theme.colors.accent` and `theme.colors.secondary` by default.

---

### 3.3 Kinetic Typography Engine

**No extra package needed** — uses core `spring()` and `interpolate()`.

**4 Text Animation Modes:**

| Mode ID | Visual Effect | Description |
|:---|:---|:---|
| `word-spring` | Word-by-word spring stagger | Each word pops in with spring physics, staggered by 3-4 frames |
| `typewriter` | Character-by-character reveal | Monospace cursor blink, character stream (fits `cyber` vibe) |
| `gradient-clip` | Animated gradient text fill | HSL gradient sweeps across text horizontally |
| `highlight-ribbon` | Word highlight with colored ribbon behind | Key words get a colored background ribbon that wipes in |

**`inputProps` Contract Extension:**

```typescript
export type TextAnimMode = 'word-spring' | 'typewriter' | 'gradient-clip' | 'highlight-ribbon' | 'auto';

interface VideoProps {
  textAnimMode?: TextAnimMode; // default: 'auto' (picks by vibe)
}
```

**Auto Mode Mapping:**
- `ramai` → `word-spring`
- `eksklusif` → `gradient-clip`
- `cyber` → `typewriter`
- `corporate` → `highlight-ribbon`

---

### 3.4 Data Charts & Dynamic Gauges

**No extra package** — uses core `interpolate()` + SVG `<circle>` / `<rect>`.

**3 Visualization Types:**

| Type | Visual | Use Case |
|:---|:---|:---|
| `bar-chart` | Horizontal/vertical animated bars | Comparing 2-5 values |
| `progress-ring` | SVG `<circle>` with `strokeDasharray` animation | Single metric (0-100%) |
| `pie-gauge` | `<Pie>` from `@remotion/shapes` with interpolated `progress` | Completion / ratio |

**Scene-Level Config (extends Scene interface):**

```typescript
export interface Scene {
  chartData?: {
    type: 'bar-chart' | 'progress-ring' | 'pie-gauge';
    values: { label: string; value: number; color?: string }[];
    unit?: string;
    animateFrom?: number;
  };
}
```

---

### 3.5 Audio-Reactive Visualizer (`@remotion/media-utils`)

**Package:** `@remotion/media-utils`

**Core APIs used:**
- `useAudioData(src)` — loads audio waveform data
- `visualizeAudio({ fps, frame, audioData, numberOfSamples })` — returns `number[]` frequency amplitudes

**2 Visualizer Styles:**

| Style | Visual | Placement |
|:---|:---|:---|
| `frequency-bars` | Vertical bars at bottom, heights reactive to frequency | Bottom edge of canvas |
| `waveform-line` | Smooth sine-wave line across middle | Center or top overlay |

**`inputProps` Contract Extension:**

```typescript
export type VisualizerStyle = 'frequency-bars' | 'waveform-line' | 'none';

interface AudioVisualizerConfig {
  enabled: boolean;
  style: VisualizerStyle;
  numberOfSamples: 16 | 32 | 64 | 128;
  barColor?: string;
  opacity?: number;          // 0.0 - 1.0, default 0.6
}

interface VideoProps {
  audioVisualizer?: AudioVisualizerConfig;
}
```

---

### 3.6 Vector Doodles & Lottie (`@remotion/lottie`)

**Package:** `@remotion/lottie` + `lottie-web` (peer dep)

**Bundled Doodle Animations:**

| Doodle ID | Visual | Purpose |
|:---|:---|:---|
| `arrow` | Hand-drawn animated arrow pointing | Directs attention to key stat/text |
| `circle-highlight` | Circle drawn around text/element | Emphasizes a word or data point |
| `sparkles` | Burst of star sparkles | Celebratory accent on CTAs / big numbers |
| `checkmark` | Animated checkmark stroke | Confirmation / checklist items |
| `underline` | Wavy hand-drawn underline | Emphasis under key phrase |

**Implementation:** Lottie JSON files stored in `public/lottie/` as static files. Loaded via `staticFile()` and `fetch()` with `delayRender()` / `continueRender()` pattern from Remotion docs.

**Scene-Level Config:**

```typescript
export interface Scene {
  doodle?: 'arrow' | 'circle-highlight' | 'sparkles' | 'checkmark' | 'underline' | 'none';
  doodleTarget?: 'headline' | 'metric' | 'cta';
}
```

---

### 3.7 Multi-Aspect Ratio Canvas

**No extra package** — uses core `<Composition>` `width` / `height` props + `calculateMetadata()`.

**Supported Aspect Ratios:**

| Ratio ID | Dimensions | Platform |
|:---|:---|:---|
| `portrait` | 1080 × 1920 | YouTube Shorts, TikTok, Instagram Reels |
| `landscape` | 1920 × 1080 | YouTube, Presentations |
| `square` | 1080 × 1080 | Instagram Feed, LinkedIn |

**`inputProps` Contract Extension:**

```typescript
export type AspectRatioId = 'portrait' | 'landscape' | 'square';

interface VideoProps {
  aspectRatio?: AspectRatioId; // default: 'portrait'
}
```

**Implementation:** `calculateMetadata()` in `Root.tsx` reads `inputProps.aspectRatio` and dynamically sets `width` / `height` on the `<Composition>`. Layout components adapt their padding, font sizes, and element placement based on the active ratio. The canvas preview in the Studio UI also updates aspect ratio in real-time.

---

## 4. Studio UI Expansion

### 4.1 New Workbench Controls

#### A. Aspect Ratio Selector (Section 1.5 — after title, before Vibe)
- 3 clickable cards: 📱 Portrait (9:16), 🖥️ Landscape (16:9), ⬛ Square (1:1)
- Selecting a ratio instantly resizes the canvas preview
- Default: Portrait

#### B. Scene Transition Selector (Section 2.5 — after Vibe, before Elements)
- Card selector: `Auto (by Vibe)`, `Fade`, `Slide`, `Wipe`, `Flip 3D`, `Clock Wipe`, `None`
- Duration slider: 10-30 frames (default: 15)
- Default: `Auto`

#### C. Expanded Visual Elements Tray (enhanced Section 3)

| New Element | Icon | Category |
|:---|:---|:---|
| Kinetic Shapes | 🔷 | Ambient decoration |
| Lottie Doodles | ✏️ | Annotation overlays |
| Audio Visualizer | 🎵 | Audio-reactive |
| Data Charts | 📊 | Data visualization |
| Gradient Text | 🌈 | Typography |
| Typewriter Text | ⌨️ | Typography |

#### D. Text Animation Mode (Section 3.5)
- Selector: `Auto`, `Word Spring`, `Typewriter`, `Gradient Clip`, `Highlight Ribbon`
- Default: `Auto`

### 4.2 Canvas Preview Sync
`canvas-renderer.js` must reflect:
- Aspect ratio change (canvas resize)
- Transition type (simplified CSS approximation)
- Kinetic shapes (floating SVG shapes in background)
- Text animation mode (CSS-approximated stagger/typewriter)

---

## 5. Updated `inputProps` Full Contract (V2)

```typescript
export type VibePresetId = 'ramai' | 'eksklusif' | 'cyber' | 'corporate';
export type TransitionType = 'fade' | 'slide' | 'wipe' | 'flip' | 'clockWipe' | 'auto' | 'none';
export type TextAnimMode = 'word-spring' | 'typewriter' | 'gradient-clip' | 'highlight-ribbon' | 'auto';
export type AspectRatioId = 'portrait' | 'landscape' | 'square';
export type VisualizerStyle = 'frequency-bars' | 'waveform-line' | 'none';
export type ShapeType = 'star' | 'polygon' | 'triangle' | 'pie' | 'rect' | 'ellipse';

export interface VideoProps {
  composition: {
    title: string;
    scenes: Scene[];
    fps?: number;
    durationInFrames?: number;
    width?: number;
    height?: number;
  };

  // V1 fields (preserved)
  vibe?: VibePresetId;
  theme?: VibeThemeTokens;
  persona?: string;
  activeVisualElements?: string[];
  audioUrl?: string;

  // V2 new fields
  aspectRatio?: AspectRatioId;
  transition?: TransitionType;
  transitionDurationFrames?: number;
  textAnimMode?: TextAnimMode;
  kineticShapes?: {
    enabled: boolean;
    shapes: ShapeType[];
    density: number;
  };
  audioVisualizer?: {
    enabled: boolean;
    style: VisualizerStyle;
    numberOfSamples: number;
    opacity?: number;
  };
}
```

---

## 6. New Package Dependencies

```json
{
  "@remotion/transitions": "^4.0.529",
  "@remotion/shapes": "^4.0.529",
  "@remotion/lottie": "^4.0.529",
  "@remotion/media-utils": "^4.0.529",
  "lottie-web": "^5.12.2"
}
```

---

## 7. Non-Functional Requirements

1. **Composition.tsx Refactor**: Slim from 1,268 lines → ~300 lines orchestrator. Sub-components in `src/components/`.
2. **TypeScript**: All new components must pass `npx tsc --noEmit` with 0 errors.
3. **Bundle Cache**: Adding new packages does NOT break the bundle-once pattern. Rebuild once after `npm install`, then cache.
4. **Render Performance**: 60-second video < 60s render time on VPS with all features active.
5. **Backward Compatibility**: V1 `inputProps` payloads (without V2 fields) must still render correctly. All V2 fields have defaults.

---

## 8. Implementation Phases

| Phase | Scope | Deliverable |
|:---|:---|:---|
| **Phase 1** | Extract types, vibe-themes, refactor Composition.tsx into modular components | Slim orchestrator + `src/components/` structure |
| **Phase 2** | Scene Transitions (`@remotion/transitions`) + Multi-Aspect Ratio | `SceneTransition.tsx` + dynamic `calculateMetadata` + Studio aspect ratio selector |
| **Phase 3** | Kinetic Shapes (`@remotion/shapes`) + Kinetic Typography | `KineticShapes.tsx` + `KineticText.tsx` + Studio toggles |
| **Phase 4** | Audio Visualizer (`@remotion/media-utils`) + Data Charts | `AudioVisualizer.tsx` + `DataGauge.tsx` + Studio controls |
| **Phase 5** | Lottie Doodles (`@remotion/lottie`) + Final integration | `LottieDoodle.tsx` + bundled Lottie JSONs + full Studio UI polish |
| **Phase 6** | TypeScript verification, test render, git push, VPS deploy | `npx tsc --noEmit` → render test → `master` push → PM2 restart |

---

## 9. Success Criteria

- [ ] `npx tsc --noEmit` — 0 errors
- [ ] All 5 transition types render correctly in MP4 output
- [ ] All 3 aspect ratios produce correctly dimensioned videos
- [ ] Kinetic shapes float and animate smoothly
- [ ] Audio visualizer bars react to actual audio data
- [ ] Lottie doodles animate in sync with scene timing
- [ ] Data charts interpolate from 0 to target value smoothly
- [ ] All 4 text animation modes produce distinct visual results
- [ ] V1 payloads (without V2 fields) still render correctly
- [ ] Studio UI shows all new controls and syncs with canvas preview
- [ ] Production deploy to `vps-tencent` succeeds with HTTP 200
