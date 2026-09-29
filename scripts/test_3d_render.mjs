import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  console.log('[Test 3D] Bundling Remotion project...');
  const entryPoint = path.join(rootDir, 'src', 'index.ts');
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });
  console.log('[Test 3D] Bundle created at:', bundleLocation);

  const inputProps = {
    modelType: 'smartphone',
    motionType: 'spin',
    motionSpeed: 1,
    lightingPreset: 'cyber',
    material: { color: '#06b6d4', metalness: 0.85, roughness: 0.2, wireframe: false },
    textOverlay: {
      badge: '3D TEST',
      headline: 'Testing *Remotion 3D*',
      subtext: 'Verifying WebGL context in headless Chromium',
      ctaText: 'Test Passed',
    },
    durationSec: 1, // 1 second for fast test
    aspectRatio: 'landscape',
  };

  const glRenderer = process.env.GL_RENDERER || 'angle';
  console.log(`[Test 3D] Using gl option: "${glRenderer}"`);

  const chromiumOptions = {
    gl: glRenderer,
    enableMultiProcessOnLinux: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--ignore-gpu-blocklist',
    ],
  };

  console.log('[Test 3D] Selecting composition MotionCraft3D...');
  const comp = await selectComposition({
    serveUrl: bundleLocation,
    id: 'MotionCraft3D',
    inputProps,
    chromiumOptions,
  });

  console.log(`[Test 3D] Composition selected: ${comp.width}x${comp.height}, ${comp.durationInFrames} frames`);

  const outPath = path.join(rootDir, 'renders', 'test_3d_out.mp4');
  console.log('[Test 3D] Rendering media to:', outPath);

  await renderMedia({
    composition: comp,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outPath,
    inputProps,
    chromiumOptions,
    onProgress: ({ progress, renderedFrames }) => {
      console.log(`[Test 3D Progress] ${(progress * 100).toFixed(0)}% (frame ${renderedFrames})`);
    },
  });

  console.log('[Test 3D] Render complete! File size:', (fs.statSync(outPath).size / 1024 / 1024).toFixed(2), 'MB');
}

main().catch(err => {
  console.error('[Test 3D Error]:', err);
  process.exit(1);
});
