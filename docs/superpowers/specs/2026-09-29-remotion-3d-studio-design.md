# Design Spec: MotionCraft 3D Animation Studio

**Version:** 1.0.0  
**Status:** Ready for Review  
**Date:** 2026-09-29  
**Feature:** Dedicated 3D Animation Studio Page (`/3d`) & Remotion Three.js Rendering Engine  
**Companion Spec:** [`2026-09-28-remotion-full-feature-expansion-v2.md`](file:///Users/ricky/Documents/js/remotion_studio/docs/superpowers/specs/2026-09-28-remotion-full-feature-expansion-v2.md)

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
MotionCraft Studio currently offers 2D programmatic motion graphics (kinetic typography, parametric 2D shapes, data gauges, and CSS 3D perspectives). However, users increasingly require real 3D product visualizers, spinning metallic tokens, gadget mockups, and custom 3D model (.glb/.gltf) animations for high-converting social media ads, product launches, and crypto/tech showcases.

### 1.2 Solution
Create a dedicated **3D Animation Studio** page at `/3d` with:
1. **Interactive Client-Side WebGL Viewport**: Allows creators to inspect, orbit, zoom, and customize 3D scenes in real time.
2. **Official `@remotion/three` Render Engine**: Frame-accurate, deterministic 3D rendering using Three.js and React Three Fiber.
3. **Preset 3D Object Catalog & Custom Upload**: Ready-to-use 3D presets (Smartphone mockup, Golden crypto coin, Product showcase cube, Cyber neon geometry) plus drag-and-drop `.glb` / `.gltf` model upload.
4. **Studio Lighting & Material Controls**: Physically-based rendering (PBR) with customizable lighting setups (Neon Cyber, Warm Luxury, Obsidian Spotlight).
5. **Headless Server-Side Rendering**: Server pipeline rendering 3D MP4 videos with synchronized background audio and sound effects.

---

## 2. User Experience & Navigation Architecture

### 2.1 Dual-Studio Navigation (Top Navbar Switcher)
Both the 2D Studio (`/`) and 3D Studio (`/3d`) share a persistent dark luxury navigation bar (`#0a0b10`) featuring a segmented pill switcher:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎬 MotionCraft Studio   [ 🎬 2D Video Studio | 🧊 3D Animation Studio ]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

- When active on 2D Studio (`/`), the 2D button is highlighted (`bg-zinc-800 text-white border-zinc-700`).
- Clicking `🧊 3D Animation Studio` navigates instantly to `/3d`.
- When active on 3D Studio (`/3d`), the 3D button is highlighted (`bg-amber-500/20 text-amber-300 border-amber-500/50`).

### 2.2 3D Studio Layout (`public/3d.html`)
The 3D studio follows a dual-pane workspace layout:

```
┌─────────────────────────┬───────────────────────────────────────────────────┐
│ LEFT PANEL: 3D CONTROLS │ RIGHT PANEL: INTERACTIVE 3D VIEWPORT              │
│ (Width: 400px)          │ (Flex-1)                                          │
│                         │                                                   │
│ [Tabs]                  │  ┌─────────────────────────────────────────────┐  │
│ [Model] [Motion]        │  │                                             │  │
│ [Light] [Text]          │  │        Interactive Three.js Canvas          │  │
│                         │  │        (OrbitControls: Rotate, Zoom)        │  │
│ 1. 3D Model Preset      │  │                                             │  │
│    - Smartphone Mockup  │  │                  [ 🧊 ]                     │  │
│    - Golden Coin        │  │                                             │  │
│    - Product Box        │  │                                             │  │
│    - Cyber Torus        │  │                                             │  │
│    - Upload .GLB        │  └─────────────────────────────────────────────┘  │
│                         │                                                   │
│ 2. Motion & Camera      │  ┌─────────────────────────────────────────────┐  │
│ 3. Lighting & Materials │  │ Timeline Scrubber: [ ▶ ] 00:02.15 / 00:05.00│  │
│ 4. Overlay & Audio      │  └─────────────────────────────────────────────┘  │
│                         │  [ 🚀 Render Video 3D (MP4) ]                      │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 3. Remotion 3D Engine Architecture

### 3.1 Technology Stack & Packages
- **`three`** (`^0.174.0`): WebGL 3D rendering engine.
- **`@types/three`**: TypeScript type definitions.
- **`@react-three/fiber`** (`^8.18.0`): React renderer for Three.js.
- **`@remotion/three`** (`^4.0.529`): Official Remotion bridge component (`<ThreeCanvas>`).

### 3.2 Remotion Composition Registration (`src/Root.tsx`)
A dedicated composition `MotionCraft3D` is registered alongside `MotionCraftVideo`:

```tsx
import { ThreeDMainVideo, defaultThreeDProps, ThreeDVideoProps } from './ThreeDComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 2D Composition */}
      <Composition id="MotionCraftVideo" ... />

      {/* 3D Composition */}
      <Composition
        id="MotionCraft3D"
        component={ThreeDMainVideo}
        durationInFrames={150} // Default 5s @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultThreeDProps}
        calculateMetadata={({ props }: { props: ThreeDVideoProps }) => {
          const fps = 30;
          const durationSec = Number(props.durationSec) || 5;
          const dims = ASPECT_DIMS[props.aspectRatio || 'portrait'];
          return {
            durationInFrames: Math.round(durationSec * fps),
            fps,
            width: dims.width,
            height: dims.height,
          };
        }}
      />
    </>
  );
};
```

### 3.3 Data Contract (`ThreeDVideoProps`)

```typescript
export type ThreeDModelType = 'smartphone' | 'coin' | 'box' | 'geometric' | 'custom-glb';
export type ThreeDMotionType = 'spin' | 'float' | 'orbit' | 'spring-pop';
export type ThreeDLightingPreset = 'cyber' | 'luxury' | 'obsidian' | 'clean';
export type AspectRatioId = 'portrait' | 'landscape' | 'square';

export interface ThreeDVideoProps {
  modelType: ThreeDModelType;
  customGlbUrl?: string;
  motionType: ThreeDMotionType;
  motionSpeed?: number; // 0.5x to 2.0x
  lightingPreset: ThreeDLightingPreset;
  material: {
    color: string;
    metalness: number; // 0.0 to 1.0
    roughness: number; // 0.0 to 1.0
    wireframe?: boolean;
  };
  textOverlay?: {
    headline?: string;
    subtext?: string;
    badge?: string;
    ctaText?: string;
  };
  durationSec: number; // 5, 10, 15
  aspectRatio: AspectRatioId; // 'portrait' | 'landscape' | 'square'
  audioPreset?: string;
}
```

---

## 4. 3D Model Preset Catalog

| Preset ID | Mesh Architecture | Visual Characteristics | Best Use Cases |
| :--- | :--- | :--- | :--- |
| **`smartphone`** | Rounded rectangular chassis + glass front screen plane + metallic rim edge | Realistic mobile device displaying user text/screenshot | App launches, UI/UX demo, SaaS teaser |
| **`coin`** | Cylindrical token with chamfered rim, high metallic reflection, radial relief | Golden crypto/loyalty token spinning in spotlight | Fintech, crypto, gaming, reward programs |
| **`box`** | Chamfered cube with illuminated edge seams and floating product badge | Minimalist product parcel with subtle hover levitation | E-commerce, luxury unboxing, physical goods |
| **`geometric`** | TorusKnot / Icosahedron mesh with dual-layer wireframe & neon core | Hypnotic futuristic geometry spinning along dual axes | Tech intro, cyber events, AI/Web3 branding |
| **`custom-glb`** | Loaded via `three/examples/jsm/loaders/GLTFLoader` | Any standard 3D asset supplied by the user | Custom merchandise, 3D character, CAD prototypes |

---

## 5. Lighting & Material Presets

### 5.1 Lighting Presets
1. **`cyber`**:
   - Ambient Light: `#06b6d4` (Cyan, intensity 0.3)
   - Key Directional: `#ec4899` (Magenta/Pink, position `[5, 5, 5]`, intensity 1.5)
   - Rim Point Light: `#3b82f6` (Blue, position `[-5, -3, -2]`, intensity 2.0)
2. **`luxury`**:
   - Ambient Light: `#fef3c7` (Warm cream, intensity 0.4)
   - Key Directional: `#f59e0b` (Champagne gold, position `[4, 8, 4]`, intensity 1.8)
   - Backlight: `#fbbf24` (Soft amber rim, position `[0, -4, -4]`, intensity 1.2)
3. **`obsidian`**:
   - Ambient Light: `#090a0f` (Deep charcoal, intensity 0.15)
   - Overhead Spotlight: `#ffffff` (Crisp white cone spotlight from top, intensity 2.5)
   - Edge Glow: `#6366f1` (Indigo specular highlight, intensity 1.0)
4. **`clean`**:
   - Balanced three-point studio lighting with neutral white tones (`#ffffff`).

---

## 6. Motion Physics & Deterministic Frame Animation

In Remotion, all 3D animations MUST be derived from `useCurrentFrame()` rather than real-time `Date.now()` or `useFrame()`:

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// 1. Continuous Rotation (normalized by speed multiplier)
const rotationY = frame * 0.03 * (motionSpeed || 1);
const rotationX = Math.sin(frame * 0.02) * 0.2;

// 2. Levitation Float (sine wave oscillation)
const positionY = Math.sin(frame * 0.05) * 0.25;

// 3. Entrance Spring (Smooth pop-in)
const enterScale = spring({
  frame,
  fps,
  config: { damping: 14, stiffness: 120, mass: 0.9 },
});
```

---

## 7. Server Render Pipeline (`server.js`)

### 7.1 New Endpoint: `POST /api/render-3d-video`
- Accepts `ThreeDVideoProps` JSON payload.
- Mappings to Remotion renderer:
  - `id: 'MotionCraft3D'`
  - `chromiumOptions`: Includes `--enable-webgl`, `--enable-accelerated-2d-canvas`, `--use-gl=angle` (or `--use-gl=swiftshader` on Linux headless).
  - Procedural audio synthesizer generates matching audio track based on `audioPreset`.
  - FFmpeg muxes the H.264 video with AAC audio without transcoding.
- Returns `{ success: true, filename, url, sizeMB }`.

---

## 8. Success Criteria & Verification Plan

1. **Type Safety & Build**:
   - `npx tsc --noEmit` passes with 0 errors across all 3D components.
2. **Interactive Client Studio (`/3d`)**:
   - User can switch between 2D and 3D studios via top navbar switcher.
   - 3D viewport renders Three.js canvas at 60 FPS with mouse orbit controls.
   - Switching model presets (Smartphone, Coin, Box, Geometric) updates 3D mesh instantly.
3. **Remotion Headless 3D Render**:
   - Live POST request to `/api/render-3d-video` successfully produces a valid, playable `.mp4` file with WebGL graphics rendered properly.
4. **Production Deployment**:
   - Code pushed to `master` and pulled to VPS Tencent (`nyobaai.my.id`).
   - PM2 service online, both `/` and `/3d` respond with HTTP 200 OK.
