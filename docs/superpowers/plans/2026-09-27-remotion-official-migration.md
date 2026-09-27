# Official Remotion Framework Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `remotion_studio` from raw Canvas 2D/FFmpeg pipe to the official Remotion framework (`remotion`, `@remotion/bundler`, `@remotion/renderer`, React JSX), enabling official Remotion Studio GUI and React-based programmatic video rendering.

**Architecture:** Hybrid Minimalist (Ponytail-compliant). React video compositions live in `src/` (`Root.tsx`, `Composition.tsx`). `server.js` bundles and renders them via `@remotion/bundler` and `@remotion/renderer`, muxing procedural audio seamlessly. The web studio UI at `http://localhost:3005` triggers real Remotion renders.

**Tech Stack:** `remotion`, `@remotion/bundler`, `@remotion/renderer`, `@remotion/cli`, `react`, `react-dom`, `typescript`, `express`.

## Global Constraints
- Target workspace directory: `/Users/ricky/Documents/js/remotion_studio`
- Keep existing server endpoints (`/api/generate-script`, `/api/preview-audio`, `/api/renders`) operational.
- Output directory: `renders/`
- Zero bloat, zero unnecessary wrapper classes.

---

### Task 1: Install Remotion Dependencies & Configure TypeScript

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`

**Interfaces:**
- Produces: Remotion CLI and build tools in `node_modules`

- [ ] **Step 1: Install official packages**
Run in terminal:
```bash
npm install remotion@^4.0.0 @remotion/cli@^4.0.0 @remotion/bundler@^4.0.0 @remotion/renderer@^4.0.0 react@^18.2.0 react-dom@^18.2.0
npm install -D typescript @types/react @types/react-dom
```

- [ ] **Step 2: Add Remotion scripts to package.json**
Add to `package.json` under `"scripts"`:
```json
"remotion:studio": "remotion preview src/index.ts",
"remotion:render": "remotion render src/index.ts MotionCraftVideo renders/cli_out.mp4"
```

- [ ] **Step 3: Create tsconfig.json**
Create `tsconfig.json` with React JSX and module resolution for Remotion:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Verify installation**
Run: `npx remotion --version`
Expected: Output showing Remotion version (e.g., 4.x.x).

---

### Task 2: Create React Video Compositions in `src/`

**Files:**
- Create: `src/index.ts`
- Create: `src/Root.tsx`
- Create: `src/Composition.tsx`

**Interfaces:**
- Produces: Remotion root component `RemotionRoot` with composition ID `MotionCraftVideo` accepting `VideoProps`.

- [ ] **Step 1: Create src/index.ts**
```typescript
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
```

- [ ] **Step 2: Create src/Root.tsx**
```typescript
import React from 'react';
import { Composition } from 'remotion';
import { MainVideo, defaultVideoProps } from './Composition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MotionCraftVideo"
        component={MainVideo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultVideoProps}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const durationSec = props.durationSec || 60;
          const width = props.width || 1080;
          const height = props.height || 1920;
          return {
            durationInFrames: durationSec * fps,
            fps,
            width,
            height,
          };
        }}
      />
    </>
  );
};
```

- [ ] **Step 3: Create src/Composition.tsx**
Implement React scenes using Remotion hooks (`useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`, `<Sequence>`, `<Audio>`):
- Scene 1: Hero Typography with kinetic staggered headline
- Scene 2: Split screen comparison (Traditional vs Autonomous)
- Scene 3: Metric Stat Focus with counting number
- Scene 4: macOS Terminal IDE runner
- Background atmosphere & audio synchronization

- [ ] **Step 4: Verify Remotion bundling**
Run: `npx remotion render src/index.ts MotionCraftVideo renders/test_task2.mp4 --frames=0-30`
Expected: Renders 1 second MP4 using Remotion Chromium renderer.

---

### Task 3: Integrate `@remotion/renderer` into `server.js`

**Files:**
- Modify: `server.js`

**Interfaces:**
- Consumes: `src/index.ts`, `MotionCraftVideo`
- Modifies: `POST /api/render-edu-video` to execute Remotion `bundle()` and `renderMedia()`

- [ ] **Step 1: Update renderMedia in server.js**
Replace the custom canvas streaming pipe in `server.js` with:
```javascript
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
```
Bundle `src/index.ts` with caching so consecutive renders are fast. Pass `inputProps: { composition, style, durationSec, width, height, audioUrl }` into `renderMedia`.

- [ ] **Step 2: Mux MotionCraft DSP audio**
Synthesize procedural audio into `renders/audio_<timestamp>.wav`, pass as `audioUrl` or mux in `renderMedia` audio track.

- [ ] **Step 3: Test server endpoint**
Run: `curl -X POST http://localhost:3005/api/render-edu-video -H "Content-Type: application/json" -d '{"composition":{"durationSec":5,"fps":30,"scenes":[{"type":"hero_typography","headline":"Testing Remotion","tag":"01/TEST","startFrame":0,"endFrame":150}]}}'`
Expected: `{ "success": true, "filename": "..." }`

---

### Task 4: End-to-End Verification & Verification Gate

**Files:**
- Verify: `public/index.html`
- Verify: `npm run remotion:studio`

- [ ] **Step 1: Restart server with Remotion engine**
Launch server on port 3005.

- [ ] **Step 2: Test Web Studio Export**
Trigger render from web studio UI (`http://localhost:3005`) and inspect the generated MP4 in gallery.

- [ ] **Step 3: Check official Remotion Studio GUI**
Verify `npm run remotion:studio` starts on `localhost:3000` and displays interactive scrub controls.
