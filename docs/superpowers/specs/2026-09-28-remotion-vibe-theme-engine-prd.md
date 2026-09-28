# PRD: Programmatic Remotion Vibe & Theme Engine
**Architecture: Bundle-Once, Parametrize-Always via `inputProps`**  
**Version:** 1.0.0  
**Status:** Implemented & Verified in Production (`nyobaai.my.id`)  
**Date:** 2026-09-28  

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
Previously, changing the mood, pacing, and visual density of videos required ad-hoc code adjustments or fragmented Canvas logic. Users in the studio had to manually tweak multiple disparate controls to make a video feel "ramai" (high-energy, viral) versus "eksklusif" (clean, luxury, minimal). Furthermore, rendering needed to strictly adhere to the official Remotion server-side rendering (SSR) standards without redundant re-bundling per render.

### 1.2 Target Architecture & Core Principles
Sesuai dengan dokumentasi resmi **Remotion SSR** (`@remotion/bundler` dan `@remotion/renderer`), arsitektur yang diterapkan adalah:
1. **Bundle Once, Cache Permanently**: Remotion React project di-bundle satu kali ke disk (`bundle({ entryPoint: './src/index.ts' })`) dan lokasinya disimpan di memori server.
2. **Parametrize Exclusively via `inputProps`**: Seluruh kustomisasi video — mulai dari *Suasana Video (Vibe / Mood)*, persona, warna, densitas partikel, parameter spring physics, hingga elemen gerak 2D/3D — dioper secara deklaratif ke dalam `selectComposition` dan `renderMedia` melalui `inputProps`.
3. **Full Audio-Visual Synchronization**: Suasana video tidak hanya mengubah visual dan ritme gerak, namun juga otomatis memilih aransemen musik (BPM, instrumen, mood) dan sound effect (SFX pack) yang sinkron.
4. **Zero Confusion for End-Users**: Pengguna di Studio cukup memilih **Suasana Video (Mood)** dan **Persona**, lalu studio otomatis menyiapkan prompt, tampilan canvas, dan parameter render secara presisi.

---

## 2. Core Personas & Video Vibe (Suasana) Presets

### 2.1 The 4 Core Video Vibes (Suasana)

| Vibe Preset ID | Nama Tampilan | Visual Ambience & Background | Motion Physics (Spring) | Karakter Audio & SFX | Auto-Active Visual Primitives |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ramai`** | **🔥 Ramai & Viral** | 3D Horizon perspective grid ribbon, kinetic floating particle sparks, gradient highlight badges | Snappy & High-Bounce (`damping: 11`, `stiffness: 175`, `mass: 0.8`), fast pop-in (12-14 frames) | Upbeat punchy beats (124-128 BPM), dynamic digital pops, whoosh impacts (+3.5 dB) | Hook Badges, 3D & Ribbon, Shockwave %, Split VS, Pulsing CTA |
| **`eksklusif`** | **✨ Eksklusif & Minimalis** | Deep obsidian background (`#090a0f`), frosted glass card (`backdrop-filter: blur(24px)`), aura glow champagne/gold | Silky & Damped (`damping: 24`, `stiffness: 85`, `mass: 1.2`), fluid easing, no jerky shakes | Smooth ambient jazz/lo-fi (98-104 BPM), subtle organic swooshes, soft tactile clicks | Frosted Glass Cards, Refined Checklist, Minimalist Stat, Elegant Outro |
| **`cyber`** | **💻 Cyber Tech** | Monospace typography, floating IDE terminal with live syntax highlight, glowing cyan/emerald matrix grid | Digital step & typewriter pacing, scanning laser line, 3D isometric window tilt | Electronic synthwave (118-124 BPM), mechanical click typing SFX, digital confirmation beeps | Terminal IDE, 10x Perf Badges, Checklist, Neon Code Block |
| **`corporate`** | **📊 Clean Corporate** | Modern navy/slate gradient, glassmorphism data panels, crisp metric percentage shockwaves | Structured ease-in-out slides, precision counter interpolation, clean cadence | Modern corporate tech beat (112-116 BPM), crisp interface clicks, positive chime cues | Counter %, Split VS, Metric Badges, Problem/Solusi Cards |

---

### 2.2 Relasi antara Suasana (Vibe) dan Persona Template
1. **Independen & Adaptif**:
   - **Persona Template** (misal: *Tech & Code*, *Fintech & Data*, *Content Creator*, *Edukasi & Bisnis*) menentukan sudut pandang naskah, struktur argumen (problem-solusi vs feature-showcase), dan copywriting LLM.
   - **Suasana Video (Vibe)** menentukan *feel*, *pacing*, warna tema, spring physics, dan audio style saat dirender di Remotion.
2. **User Flexibility**:
   - Memilih Suasana otomatis merekomendasikan dan me-toggle elemen visual yang relevan.
   - Pengguna tetap memiliki kebebasan penuh untuk menyalakan/mematikan tombol "Elemen Visual Gerak" secara manual kapan saja di workbench.

---

## 3. Data Contracts & Architecture Specifications

### 3.1 Remotion `inputProps` Data Contract

```typescript
// Shared Interface between Studio, Server, and Remotion Bundle
export type VibePresetId = 'ramai' | 'eksklusif' | 'cyber' | 'corporate';

export interface VibeThemeTokens {
  id: VibePresetId;
  label: string;
  colors: {
    accent: string;
    accentGlow: string;
    secondary: string;
    bgGradient: [string, string];
    surface: string;
    surfaceBorder: string;
    textPrimary: string;
    textMuted: string;
    highlightRibbon: string;
  };
  motion: {
    springDamping: number;
    springStiffness: number;
    springMass: number;
    transitionFrames: number;
    bounceIntensity: number; // 0.0 (smooth) to 1.0 (extra bouncy)
  };
  ambience: {
    show3DGrid: boolean;
    showParticles: boolean;
    showScanlines: boolean;
    showAuraGlow: boolean;
    glassBlurPx: number;
  };
  audio: {
    musicPreset: string;
    targetBpm: number;
    sfxPack: 'digital-punch' | 'organic-subtle' | 'cyber-terminal' | 'clean-interface';
    sfxGainMultiplier: number;
  };
}

export interface VideoProps {
  composition: {
    title: string;
    scenes: Scene[];
    fps: number;
    durationInFrames: number;
    durationSec: number;
    width: number;
    height: number;
  };
  vibe: VibePresetId;
  theme: VibeThemeTokens;
  persona: string;
  activeVisualElements: string[];
  audioUrl?: string;
}
```

---

## 4. System Implementation Workflow

### 4.1 Client-Side Studio Flow (`public/js/studio.js` & `workbench.html`)
1. **Vibe Selector Grid**:
   - Menampilkan 4 kartu Suasana Video di Section 2 Workbench dengan icon, deskripsi singkat, dan badge karakter visual.
   - Pemilihan suasana memicu update pada state `currentVibe`.
   - Otomatis memperbarui tombol toggle *Elemen Visual Gerak* dengan elemen default yang direkomendasikan.
2. **Instant Real-Time Preview**:
   - Canvas preview (`canvas-renderer.js`) membaca `currentVibe` dan seketika menerapkan background aura/grid, warna highlight ribbon, dan spring physics yang sesuai saat scrubbing timeline.
3. **Payload Dispatch**:
   - Tombol *Render Video Resmi* mengirimkan payload terstruktur ke server:
     ```json
     {
       "composition": { ... },
       "vibe": "ramai",
       "persona": "creator",
       "activeVisualElements": ["intro-hook", "doodle", "comparison", "metric", "points", "cta"]
     }
     ```

### 4.2 Server-Side Render Pipeline (`server.js`)
1. **Bundle Acquisition**:
   - Memeriksa apakah `remotionBundleLocation` sudah ter-compile dan ada di disk. Jika sudah ada, langsung gunakan kembali (0 ms overhead). Jika belum, jalankan `await bundle({ entryPoint: './src/index.ts' })`.
2. **Procedural Audio Synthesis by Vibe**:
   - Memilih preset musik (`hype-punch`, `calm-editorial`, `cyber-grid`, `corporate-modern`) berdasarkan `vibe`.
   - Mengenerasi SFX cues ter-sinkronisasi dengan scene timing dan menggabungkannya ke dalam WAV master (-14 LUFS, -1 dB True Peak).
3. **Remotion Select & Render**:
   - Memanggil `selectComposition({ serveUrl: bundleLocation, id: 'MotionCraftVideo', inputProps })`.
   - Menjalankan `renderMedia` dengan options optimal untuk Linux/macOS (`enableMultiProcessOnLinux: true`, concurrency control, headless flags).
4. **Mux Audio & Video**:
   - FFmpeg menggabungkan stream video H.264 dengan audio AAC (`-c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart`).
   - Mengembalikan response JSON dengan URL file render MP4.

### 4.3 Remotion Video Composition (`src/Composition.tsx`)
1. **Root Composition Resolver**:
   - Komponen membaca `theme` dan `vibe` dari `inputProps`.
2. **Dynamic Layer Stacking**:
   - **Background Layer**: Merender canvas background interaktif (Perspective Horizon Grid untuk `ramai`, Aura Blur untuk `eksklusif`, Matrix Grid untuk `cyber`).
   - **Scene Container**: Menerapkan spring interpolation dengan konfigurasi `theme.motion` untuk semua transisi masuk dan keluar teks/komponen.
   - **Visual Element Primitives**:
     - *Frosted Glass Highlight Ribbon* di belakang headline utama.
     - *Split Comparison VS* dengan dividing energy beam.
     - *3D Isometric Card* dengan rotating perspective.
     - *Terminal IDE Window* dengan colored syntax bars.
     - *Metric Shockwave Badge* dengan animated counter.

---

## 5. Non-Functional Requirements & Performance

1. **Rendering Performance**:
   - Bundle startup overhead: < 50ms untuk render kedua dan seterusnya (reusing cached bundle).
   - Video 60 detik (1800 frames) @ 1080x1920: Render time < 60 detik pada mesin multi-core.
2. **Memory & Stability (VPS Tencent)**:
   - Chromium instance dibatasi memory leak-nya dengan membersihkan process zombie setelah render.
   - Direct FFmpeg stream muxing tanpa re-encoding video stream (`-c:v copy`).
3. **Visual Taste & Aesthetics**:
   - Tidak ada elemen visual kaku atau "AI slop" — ribbon highlight strictly di belakang teks, kontras warna memenuhi standar WCAG AA (rasio kontras > 4.5:1 untuk teks utama).
   - Desain responsif mobile pada web studio (390px - 1440px+).

---

## 6. Success Metrics & Verification Plan
- **Verification 1**: `npx tsc --noEmit` wajib 0 error pada TypeScript types `Composition.tsx`.  
  *Result: ✅ PASSED (0 errors)*
- **Verification 2**: Memilih setiap suasana di Studio UI mengubah canvas visual & audio profile secara instan.  
  *Result: ✅ PASSED (Workbench 4 vibe cards + real-time canvas preview synchronization)*
- **Verification 3**: Render MP4 resmi via Remotion berhasil menghasilkan video dengan karakter suasana terpilih secara konsisten.  
  *Result: ✅ PASSED (Live render on Tencent Cloud VPS: `remotion_official_1790589202032.mp4`, 0.43 MB, HTTP 200 OK)*
- **Verification 4**: Deploy ke `vps-tencent` pada branch `master` berjalan lancar dengan status PM2 online dan HTTP/2 200 OK.  
  *Result: ✅ PASSED (PM2 id 2 online, https://nyobaai.my.id/ returns HTTP/2 200 OK)*
