import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Audio,
  AbsoluteFill,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { Star, Polygon, Triangle, Pie } from '@remotion/shapes';

// ============================================================================
// DATA CONTRACT: SCENE & COMPOSITION INTERFACES
// ============================================================================
export interface Scene {
  type?: string;
  tag?: string;
  headline: string;
  subtext?: string;
  durationFrames?: number;

  // Doodle & Shape Animation block
  doodle?: 'arrow' | 'circle' | 'sparkles' | 'brackets' | 'none' | string;

  // Comparison block
  itemsBad?: string[];
  itemsGood?: string[];
  leftTitle?: string;
  rightTitle?: string;

  // Metric / Stat block
  metricValue?: number | string;
  metricLabel?: string;

  // Bullet points block
  points?: string[];

  // Media block
  mediaUrl?: string;
  caption?: string;

  // Code / Terminal block
  codeSnippet?: string;
  language?: string;

  // Outro / CTA block
  ctaText?: string;
  badges?: string[];

  // Quote block
  quoteText?: string;
  quoteAuthor?: string;

  // V2: Data chart block
  chartData?: {
    type?: 'bar-chart' | 'progress-ring' | 'pie-gauge' | 'bar' | string;
    values?: (number | { label?: string; value?: number; color?: string })[];
    labels?: string[];
    unit?: string;
    animateFrom?: number;
  };
  doodleTarget?: 'headline' | 'metric' | 'cta';

  // Computed timeline frames
  startFrame: number;
  endFrame: number;
}

export type VibePresetId = 'ramai' | 'eksklusif' | 'cyber' | 'corporate';
export type TransitionType = 'fade' | 'slide' | 'wipe' | 'flip' | 'clockWipe' | 'auto' | 'none';
export type TextAnimMode = 'word-spring' | 'typewriter' | 'gradient-clip' | 'highlight-ribbon' | 'auto';
export type AspectRatioId = 'portrait' | 'landscape' | 'square';
export type VisualizerStyle = 'frequency-bars' | 'waveform-line' | 'none';
export type ShapeType = 'star' | 'polygon' | 'triangle' | 'pie';

const ASPECT_RATIOS: Record<AspectRatioId, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

const TRANSITION_MAP: Record<string, (w: number, h: number) => any> = {
  fade: () => fade(),
  slide: () => slide(),
  wipe: () => wipe(),
  flip: () => flip(),
  clockWipe: (w, h) => clockWipe({ width: w, height: h }),
};

const VIBE_TRANSITION_AUTO: Record<VibePresetId, TransitionType[]> = {
  ramai: ['slide', 'wipe'],
  eksklusif: ['fade'],
  cyber: ['flip', 'wipe'],
  corporate: ['clockWipe', 'fade'],
};

const VIBE_TEXT_AUTO: Record<VibePresetId, TextAnimMode> = {
  ramai: 'word-spring',
  eksklusif: 'gradient-clip',
  cyber: 'typewriter',
  corporate: 'highlight-ribbon',
};

export interface VibeThemeTokens {
  id: VibePresetId;
  label: string;
  tag: string;
  isLight?: boolean;
  colors: {
    accent: string;
    accentGlow: string;
    secondary: string;
    bgGradient: [string, string, string];
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
    bounceIntensity: number;
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
    sfxPack: string;
    sfxGainMultiplier: number;
  };
  // Compatibility properties
  bg: string[];
  cardBg: string;
  cardBorder: string;
  text: string;
  sub: string;
  accent: string;
  accentGlow: string;
  accent2: string;
  font: string;
}

export interface VideoProps {
  [key: string]: unknown;
  composition: {
    title: string;
    scenes: Scene[];
    fps?: number;
    durationInFrames?: number;
    durationSec?: number;
    width?: number;
    height?: number;
  };
  vibe?: VibePresetId | string;
  theme?: Partial<VibeThemeTokens>;
  persona?: string;
  activeVisualElements?: string[];
  style?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  audioUrl?: string;
  // V2 fields
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

/**
 * Normalizes user-supplied composition JSON:
 * Computes startFrame/endFrame sequentially from durationFrames so user
 * does not have to calculate frame offsets manually.
 */
export function normalizeComposition(comp: any, defaultFps = 30) {
  const fps = comp?.fps || defaultFps;
  let currentFrame = 0;
  const scenes: Scene[] = (comp?.scenes || []).map((sc: any) => {
    const dur =
      sc.durationFrames ||
      (sc.endFrame != null && sc.startFrame != null ? sc.endFrame - sc.startFrame : 150);
    const start = sc.startFrame != null ? sc.startFrame : currentFrame;
    const end = sc.endFrame != null ? sc.endFrame : start + dur;
    currentFrame = end;
    return {
      ...sc,
      durationFrames: dur,
      startFrame: start,
      endFrame: end,
    } as Scene;
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

/**
 * Clean default placeholder composition (overridden dynamically by user JSON)
 */
export const defaultVideoProps: VideoProps = {
  composition: {
    title: 'MotionCraft Video',
    scenes: [
      {
        tag: '01 / INTRO',
        headline: 'Selamat Datang di *MotionCraft*',
        subtext: 'Engine video motion graphics programatik berbasis React.',
        durationFrames: 120,
        startFrame: 0,
        endFrame: 120,
      },
    ],
  },
  vibe: 'ramai',
  style: 'pi-v2-dark',
  durationSec: 4,
};

// ============================================================================
// THE 4 CORE VIDEO VIBE PRESETS (Centralized Parametric Design Tokens)
// ============================================================================
export const VIBE_THEMES: Record<VibePresetId, VibeThemeTokens> = {
  ramai: {
    id: 'ramai',
    label: 'Ramai & Viral',
    tag: 'High Energy & Punchy',
    isLight: false,
    colors: {
      accent: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.45)',
      secondary: '#ef4444',
      bgGradient: ['#3b1704', '#180d05', '#050201'],
      surface: 'rgba(28, 16, 8, 0.90)',
      surfaceBorder: 'rgba(245, 158, 11, 0.45)',
      textPrimary: '#ffffff',
      textMuted: '#fde68a',
      highlightRibbon: 'rgba(245, 158, 11, 0.32)',
    },
    motion: {
      springDamping: 11,
      springStiffness: 175,
      springMass: 0.8,
      transitionFrames: 14,
      bounceIntensity: 0.8,
    },
    ambience: {
      show3DGrid: true,
      showParticles: true,
      showScanlines: false,
      showAuraGlow: true,
      glassBlurPx: 16,
    },
    audio: {
      musicPreset: 'hype-punch',
      targetBpm: 126,
      sfxPack: 'digital-punch',
      sfxGainMultiplier: 1.6,
    },
    bg: ['#451a03', '#1c0a00', '#0a0300'],
    cardBg: 'rgba(30, 14, 4, 0.92)',
    cardBorder: 'rgba(245, 158, 11, 0.45)',
    text: '#ffffff',
    sub: '#fde68a',
    accent: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.45)',
    accent2: '#ef4444',
    font: 'system-ui, -apple-system, sans-serif',
  },
  eksklusif: {
    id: 'eksklusif',
    label: 'Eksklusif & Minimalis',
    tag: 'Luxury & Editorial',
    isLight: false,
    colors: {
      accent: '#f8fafc',
      accentGlow: 'rgba(248, 250, 252, 0.25)',
      secondary: '#94a3b8',
      bgGradient: ['#111827', '#080d1a', '#03060d'],
      surface: 'rgba(15, 23, 42, 0.75)',
      surfaceBorder: 'rgba(255, 255, 255, 0.16)',
      textPrimary: '#f8fafc',
      textMuted: '#94a3b8',
      highlightRibbon: 'rgba(255, 255, 255, 0.16)',
    },
    motion: {
      springDamping: 24,
      springStiffness: 85,
      springMass: 1.2,
      transitionFrames: 22,
      bounceIntensity: 0.1,
    },
    ambience: {
      show3DGrid: false,
      showParticles: false,
      showScanlines: false,
      showAuraGlow: true,
      glassBlurPx: 24,
    },
    audio: {
      musicPreset: 'calm-editorial',
      targetBpm: 100,
      sfxPack: 'organic-subtle',
      sfxGainMultiplier: 0.9,
    },
    bg: ['#1e293b', '#0f172a', '#020617'],
    cardBg: 'rgba(15, 23, 42, 0.85)',
    cardBorder: 'rgba(255, 255, 255, 0.18)',
    text: '#f8fafc',
    sub: '#94a3b8',
    accent: '#e2e8f0',
    accentGlow: 'rgba(226, 232, 240, 0.25)',
    accent2: '#cbd5e1',
    font: 'system-ui, -apple-system, sans-serif',
  },
  cyber: {
    id: 'cyber',
    label: 'Cyber Tech',
    tag: 'Developer & Terminal',
    isLight: false,
    colors: {
      accent: '#06b6d4',
      accentGlow: 'rgba(6, 182, 212, 0.40)',
      secondary: '#10b981',
      bgGradient: ['#042f2e', '#051923', '#01090f'],
      surface: 'rgba(5, 25, 35, 0.92)',
      surfaceBorder: 'rgba(6, 182, 212, 0.45)',
      textPrimary: '#ecfeff',
      textMuted: '#67e8f9',
      highlightRibbon: 'rgba(6, 182, 212, 0.25)',
    },
    motion: {
      springDamping: 14,
      springStiffness: 140,
      springMass: 0.9,
      transitionFrames: 16,
      bounceIntensity: 0.4,
    },
    ambience: {
      show3DGrid: true,
      showParticles: true,
      showScanlines: true,
      showAuraGlow: true,
      glassBlurPx: 12,
    },
    audio: {
      musicPreset: 'cyber-grid',
      targetBpm: 120,
      sfxPack: 'cyber-terminal',
      sfxGainMultiplier: 1.3,
    },
    bg: ['#042f2e', '#022c22', '#020617'],
    cardBg: 'rgba(4, 47, 46, 0.92)',
    cardBorder: 'rgba(45, 212, 191, 0.45)',
    text: '#2dd4bf',
    sub: '#99f6e4',
    accent: '#14b8a6',
    accentGlow: 'rgba(20, 184, 166, 0.35)',
    accent2: '#10b981',
    font: 'ui-monospace, Menlo, monospace',
  },
  corporate: {
    id: 'corporate',
    label: 'Clean Corporate',
    tag: 'Enterprise & Data',
    isLight: false,
    colors: {
      accent: '#3b82f6',
      accentGlow: 'rgba(59, 130, 246, 0.35)',
      secondary: '#6366f1',
      bgGradient: ['#1e1b4b', '#0f172a', '#030712'],
      surface: 'rgba(15, 23, 42, 0.90)',
      surfaceBorder: 'rgba(59, 130, 246, 0.35)',
      textPrimary: '#ffffff',
      textMuted: '#94a3b8',
      highlightRibbon: 'rgba(59, 130, 246, 0.25)',
    },
    motion: {
      springDamping: 18,
      springStiffness: 110,
      springMass: 1.0,
      transitionFrames: 18,
      bounceIntensity: 0.2,
    },
    ambience: {
      show3DGrid: false,
      showParticles: false,
      showScanlines: false,
      showAuraGlow: true,
      glassBlurPx: 20,
    },
    audio: {
      musicPreset: 'corporate-modern',
      targetBpm: 114,
      sfxPack: 'clean-interface',
      sfxGainMultiplier: 1.1,
    },
    bg: ['#1e1b4b', '#0f172a', '#030712'],
    cardBg: 'rgba(15, 23, 42, 0.94)',
    cardBorder: 'rgba(99, 102, 241, 0.45)',
    text: '#ffffff',
    sub: '#94a3b8',
    accent: '#6366f1',
    accentGlow: 'rgba(99, 102, 241, 0.35)',
    accent2: '#38bdf8',
    font: 'system-ui, -apple-system, sans-serif',
  },
};

/**
 * Resolves a complete VibeThemeTokens object from input props
 */
export function resolveVibeTheme(
  vibe?: string,
  customTheme?: Partial<VibeThemeTokens>,
  legacyStyle?: string
): VibeThemeTokens {
  const vKey = String(vibe || '').toLowerCase().trim();
  let base: VibeThemeTokens = VIBE_THEMES.ramai;

  if (vKey === 'ramai' || vKey === 'eksklusif' || vKey === 'cyber' || vKey === 'corporate') {
    base = VIBE_THEMES[vKey as VibePresetId];
  } else if (legacyStyle) {
    if (legacyStyle === 'sunset-creator' || legacyStyle === 'hyper-crypto') {
      base = VIBE_THEMES.ramai;
    } else if (legacyStyle === 'warm-paper' || legacyStyle === 'mono-editorial') {
      base = VIBE_THEMES.eksklusif;
    } else if (legacyStyle === 'tech-neon-soft') {
      base = VIBE_THEMES.cyber;
    } else {
      base = VIBE_THEMES.corporate;
    }
  }

  if (!customTheme) return base;

  return {
    ...base,
    ...customTheme,
    colors: { ...base.colors, ...(customTheme.colors || {}) },
    motion: { ...base.motion, ...(customTheme.motion || {}) },
    ambience: { ...base.ambience, ...(customTheme.ambience || {}) },
    audio: { ...base.audio, ...(customTheme.audio || {}) },
  };
}

// Legacy fallback reference
export const THEMES = VIBE_THEMES as unknown as Record<string, VibeThemeTokens>;

// ============================================================================
// MOTION HELPERS
// ============================================================================
const cl = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const ramp = (f: number, at: number, len: number) =>
  interpolate(f, [at, at + len], [0, 1], cl);

const spr = (
  f: number,
  at: number,
  fps: number,
  config: { damping: number; stiffness: number; mass?: number }
) =>
  spring({
    frame: (f - at) * (60 / fps),
    fps: 60,
    config: { damping: config.damping, stiffness: config.stiffness, mass: config.mass ?? 0.6 },
  });

// ============================================================================
// V2: TRANSITION RESOLVER
// ============================================================================
function getTransitionPresentation(
  transitionType: TransitionType,
  vibeId: VibePresetId,
  sceneIdx: number,
  w: number = 1080,
  h: number = 1920
): any {
  if (transitionType === 'none') return null;
  let key: string = transitionType;
  if (transitionType === 'auto') {
    const opts = VIBE_TRANSITION_AUTO[vibeId] || ['fade'];
    key = opts[sceneIdx % opts.length];
  }
  const factory = TRANSITION_MAP[key];
  return factory ? factory(w, h) : fade();
}

// ============================================================================
// V2: KINETIC SHAPES LAYER
// ============================================================================
const KineticShapesLayer: React.FC<{
  shapes: ShapeType[];
  density: number;
  theme: VibeThemeTokens;
}> = ({ shapes, density, theme }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const items: React.ReactNode[] = [];
  const colors = [theme.colors.accent, theme.colors.secondary, theme.accent2 || theme.colors.accent];

  for (let i = 0; i < density; i++) {
    const shapeType = shapes[i % shapes.length];
    const color = colors[i % colors.length];
    const seed = i * 137.5;
    const x = ((seed * 7.3) % width);
    const y = ((seed * 4.1) % height);
    const rot = (frame * (0.5 + i * 0.3)) % 360;
    const floatY = Math.sin(frame * 0.04 + i * 1.5) * 15;
    const opacity = 0.25 + (i % 3) * 0.08;
    const size = 30 + (i % 4) * 15;

    let shapeEl: React.ReactNode = null;
    if (shapeType === 'star') {
      shapeEl = <Star points={5} innerRadius={size * 0.4} outerRadius={size} fill={color} />;
    } else if (shapeType === 'polygon') {
      shapeEl = <Polygon points={6} radius={size} fill={color} />;
    } else if (shapeType === 'triangle') {
      shapeEl = <Triangle length={size} direction="up" fill={color} />;
    } else if (shapeType === 'pie') {
      const progress = interpolate(Math.sin(frame * 0.03 + i), [-1, 1], [0.2, 0.8], cl);
      shapeEl = <Pie radius={size} progress={progress} fill={color} />;
    }

    if (shapeEl) {
      items.push(
        <div
          key={`shape-${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: `translateY(${floatY}px) rotate(${rot}deg)`,
            opacity,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {shapeEl}
        </div>
      );
    }
  }

  return <>{items}</>;
};

// ============================================================================
// V2: KINETIC TEXT (4 MODES)
// ============================================================================
const KineticTextV2: React.FC<{
  text: string;
  mode: TextAnimMode;
  theme: VibeThemeTokens;
  fps: number;
  fontSize?: number;
}> = ({ text, mode, theme, fps, fontSize = 72 }) => {
  const frame = useCurrentFrame();

  if (mode === 'typewriter') {
    const totalChars = text.replace(/\*/g, '').length;
    const visibleChars = Math.floor(frame * 1.2);
    const shown = text.replace(/\*/g, '').slice(0, visibleChars);
    const showCursor = Math.floor(frame / 8) % 2 === 0;
    return (
      <div style={{
        fontSize, fontWeight: 900, color: theme.colors.textPrimary,
        fontFamily: 'ui-monospace, Menlo, monospace', lineHeight: 1.3,
        textAlign: 'center', letterSpacing: '-0.02em',
      }}>
        {shown}
        <span style={{ opacity: showCursor && visibleChars < totalChars ? 1 : 0, color: theme.colors.accent }}>▋</span>
      </div>
    );
  }

  if (mode === 'gradient-clip') {
    const gradOffset = frame * 3;
    return (
      <div style={{
        fontSize, fontWeight: 900, lineHeight: 1.22, textAlign: 'center',
        letterSpacing: '-0.03em',
        background: `linear-gradient(90deg, ${theme.colors.accent} ${gradOffset}%, ${theme.colors.secondary} ${gradOffset + 40}%, ${theme.colors.textPrimary} ${gradOffset + 80}%)`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      }}>
        {text.replace(/\*/g, '')}
      </div>
    );
  }

  if (mode === 'highlight-ribbon') {
    const parts = (text || '').split(/(\*[^*]+\*)/g).filter(Boolean);
    return (
      <div style={{
        fontSize, fontWeight: 900, lineHeight: 1.22, textAlign: 'center',
        letterSpacing: '-0.03em', color: theme.colors.textPrimary,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 12px',
      }}>
        {parts.map((p: string, i: number) => {
          const isHl = p.startsWith('*') && p.endsWith('*');
          const clean = p.replace(/\*/g, '');
          const delay = i * 4;
          const s = spr(frame, delay, fps, { damping: 16, stiffness: 120, mass: 0.6 });
          const op = ramp(frame, delay, 5);
          if (isHl) {
            const ribbonW = interpolate(s, [0, 1], [0, 100], cl);
            return (
              <span key={i} style={{
                display: 'inline-block', position: 'relative',
                opacity: op, color: theme.colors.accent, padding: '2px 14px',
              }}>
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 10,
                  background: theme.colors.highlightRibbon,
                  transform: `scaleX(${ribbonW / 100})`, transformOrigin: 'left',
                }} />
                <span style={{ position: 'relative' }}>{clean}</span>
              </span>
            );
          }
          return <span key={i} style={{ display: 'inline-block', opacity: op }}>{clean}</span>;
        })}
      </div>
    );
  }

  // word-spring (default)
  const words = (text || '').replace(/\*/g, '').split(/\s+/).filter(Boolean);
  return (
    <div style={{
      fontSize, fontWeight: 900, lineHeight: 1.22, textAlign: 'center',
      letterSpacing: '-0.03em', display: 'flex', flexWrap: 'wrap',
      justifyContent: 'center', gap: '6px 14px',
    }}>
      {words.map((w: string, i: number) => {
        const delay = i * 3;
        const s = spr(frame, delay, fps, { damping: 12, stiffness: 150, mass: 0.5 });
        const op = ramp(frame, delay, 4);
        const ty = interpolate(s, [0, 1], [30, 0]);
        const sc = interpolate(s, [0, 1], [0.7, 1]);
        return (
          <span key={i} style={{
            display: 'inline-block', opacity: op, color: theme.colors.textPrimary,
            transform: `translateY(${ty}px) scale(${sc})`,
          }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ============================================================================
// V2: DATA GAUGE / CHART BLOCK
// ============================================================================
const DataGaugeBlock: React.FC<{
  chartData: NonNullable<Scene['chartData']>;
  theme: VibeThemeTokens;
}> = ({ chartData, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const animProgress = spr(frame, 8, fps, { damping: 16, stiffness: 100, mass: 0.8 });

  // Resilient normalization for both [{label, value}] and raw number arrays [10, 20, 30]
  const rawValues = Array.isArray(chartData.values) ? chartData.values : [];
  const normalizedValues = rawValues.map((v: any, idx: number) => {
    if (typeof v === 'number') {
      const label = chartData.labels?.[idx] || `Item ${idx + 1}`;
      return { label, value: Number.isFinite(v) ? v : 0, color: undefined };
    }
    const num = Number(v?.value);
    return {
      label: String(v?.label || `Item ${idx + 1}`),
      value: Number.isFinite(num) ? num : 0,
      color: v?.color,
    };
  });

  if (normalizedValues.length === 0) return null;

  const chartType = (chartData.type === 'bar' || !chartData.type) ? 'bar-chart' : chartData.type;

  if (chartType === 'progress-ring') {
    const val = normalizedValues[0];
    const r = 80;
    const circ = 2 * Math.PI * r;
    const fromVal = Number.isFinite(Number(chartData.animateFrom)) ? Number(chartData.animateFrom) : 0;
    const targetVal = Number.isFinite(val.value) ? val.value : 0;
    const pct = interpolate(animProgress, [0, 1], [fromVal, targetVal], cl);
    const dash = ((Number.isFinite(pct) ? pct : 0) / 100) * circ;
    return (
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width={200} height={200} viewBox="0 0 200 200">
          <circle cx={100} cy={100} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={12} />
          <circle
            cx={100} cy={100} r={r} fill="none"
            stroke={val.color || theme.colors.accent}
            strokeWidth={12} strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 100 100)"
          />
          <text x={100} y={108} textAnchor="middle" fontSize={36} fontWeight={900}
            fill={theme.colors.textPrimary} fontFamily="monospace">
            {Math.round(pct)}{chartData.unit || '%'}
          </text>
        </svg>
        {val.label && (
          <div style={{ fontSize: 20, color: theme.colors.textMuted, fontWeight: 700, marginTop: 8 }}>
            {val.label}
          </div>
        )}
      </div>
    );
  }

  if (chartType === 'pie-gauge') {
    const val = normalizedValues[0];
    const targetPct = Number.isFinite(val.value) ? val.value / 100 : 0;
    const pct = interpolate(animProgress, [0, 1], [0, targetPct], cl);
    return (
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Pie radius={80} progress={Number.isFinite(pct) ? pct : 0} fill={val.color || theme.colors.accent}
          stroke={theme.colors.surfaceBorder} strokeWidth={2} />
        {val.label && (
          <div style={{ fontSize: 20, color: theme.colors.textMuted, fontWeight: 700, marginTop: 12 }}>
            {val.label}: {Math.round((Number.isFinite(pct) ? pct : 0) * 100)}{chartData.unit || '%'}
          </div>
        )}
      </div>
    );
  }

  // bar-chart
  const maxVal = Math.max(...normalizedValues.map(v => v.value), 1);
  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 700 }}>
      {normalizedValues.map((v, i) => {
        const targetPercent = maxVal > 0 ? (v.value / maxVal) * 100 : 0;
        const safeTargetPercent = Number.isFinite(targetPercent) ? targetPercent : 0;
        const safeValue = Number.isFinite(v.value) ? v.value : 0;
        const barW = interpolate(animProgress, [0, 1], [0, safeTargetPercent], cl);
        const valNum = Math.round(interpolate(animProgress, [0, 1], [0, safeValue], cl));
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 80, fontSize: 16, fontWeight: 700, color: theme.colors.textMuted, textAlign: 'right' }}>
              {v.label}
            </div>
            <div style={{ flex: 1, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{
                width: `${Number.isFinite(barW) ? barW : 0}%`, height: '100%', borderRadius: 8,
                background: v.color || theme.colors.accent,
                boxShadow: `0 0 12px ${theme.colors.accentGlow}`,
              }} />
            </div>
            <div style={{ width: 50, fontSize: 16, fontWeight: 800, color: theme.colors.textPrimary, fontFamily: 'monospace' }}>
              {valNum}{chartData.unit || ''}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ponytail: uses Math.sin pseudo-visualization; upgrade to useAudioData when real audio files become standard inputs
const AudioFrequencyViz: React.FC<{
  vizStyle: VisualizerStyle;
  theme: VibeThemeTokens;
  numberOfSamples: number;
  opacity: number;
}> = ({ vizStyle, theme, numberOfSamples, opacity }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  if (vizStyle === 'none') return null;

  if (vizStyle === 'waveform-line') {
    const pts: string[] = [];
    const segW = (width - 100) / numberOfSamples;
    for (let i = 0; i <= numberOfSamples; i++) {
      const y = 50 + Math.sin(frame * 0.1 + i * 0.5) * 30 + Math.cos(frame * 0.07 + i * 0.3) * 15;
      pts.push(`${i * segW},${y}`);
    }
    return (
      <div style={{ position: 'absolute', bottom: 40, left: 50, right: 50, height: 100, opacity, pointerEvents: 'none', zIndex: 3 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width - 100} 100`} preserveAspectRatio="none">
          <polyline points={pts.join(' ')} fill="none" stroke={theme.colors.accent} strokeWidth={2.5} />
        </svg>
      </div>
    );
  }

  // frequency-bars
  return (
    <div style={{
      position: 'absolute', bottom: 40, left: 50, right: 50, height: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3,
      opacity, pointerEvents: 'none', zIndex: 3,
    }}>
      {Array.from({ length: numberOfSamples }).map((_, i) => {
        const h = Math.abs(Math.sin(frame * 0.12 + i * 0.35) * 40) + 4;
        return (
          <div key={i} style={{
            flex: 1, height: h, borderRadius: 3,
            backgroundColor: i % 2 === 0 ? theme.colors.accent : (theme.accent2 || theme.colors.secondary),
          }} />
        );
      })}
    </div>
  );
};

// ============================================================================
// HIGH-TASTE 2D / 3D MOTION GRAPHIC PRIMITIVES
// ============================================================================

/**
 * 3D Perspective Grid Horizon Floor for true spatial depth
 */
const Perspective3DGrid: React.FC<{ theme: typeof THEMES['pi-v2-dark'] }> = ({ theme }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '55%',
          opacity: theme.isLight ? 0.35 : 0.45,
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 100%, black 25%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 100%, black 25%, transparent 85%)',
        }}
      >
        <defs>
          <pattern id="gridFloor" width="70" height="45" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="70" y2="0" stroke={theme.cardBorder || theme.accent} strokeWidth="1" opacity="0.35" />
            <line x1="0" y1="0" x2="0" y2="45" stroke={theme.cardBorder || theme.accent} strokeWidth="1" opacity="0.35" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridFloor)" />
      </svg>
    </div>
  );
};

/**
 * Authentic 3D Isometric Floating Studio Mockup (Hero/Intro visual element)
 */
const Isometric3DStudioCard: React.FC<{
  theme: typeof THEMES['pi-v2-dark'];
  frame: number;
  fps: number;
}> = ({ theme, frame, fps }) => {
  const enterSpring = spr(frame, 6, fps, { damping: 14, stiffness: 110, mass: 0.6 });
  const opacity = ramp(frame, 6, 6);
  const translateY = interpolate(enterSpring, [0, 1], [40, 0]);
  const floatY = Math.sin(frame * 0.06) * 6;

  return (
    <div
      style={{
        width: 820,
        height: 340,
        margin: '30px auto 0',
        perspective: 1200,
        opacity,
        transform: `translateY(${translateY + floatY}px)`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 24,
          background: theme.isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.90)',
          border: `2px solid ${theme.cardBorder || theme.accent}`,
          boxShadow: `0 24px 48px -12px rgba(0, 0, 0, 0.55), 0 0 32px ${theme.accentGlow}`,
          transform: 'rotateX(8deg) rotateY(-4deg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            height: 44,
            background: theme.isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(255, 255, 255, 0.04)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            position: 'relative',
          }}
        >
          {/* Traffic Dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#eab308' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#22c55e' }} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'ui-monospace, monospace',
              color: theme.sub,
            }}
          >
            ✦ MotionCraft Studio — 60 FPS Engine
          </div>
        </div>

        {/* Viewport Center */}
        <div
          style={{
            flex: 1,
            margin: '14px 20px',
            borderRadius: 16,
            background: theme.isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(3, 7, 18, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Concentric Audio Wave Rings */}
          {[1, 2, 3].map((r) => {
            const rad = 38 * r + Math.sin(frame * 0.08 + r) * 8;
            return (
              <div
                key={r}
                style={{
                  position: 'absolute',
                  width: rad * 2,
                  height: rad * 2,
                  borderRadius: '50%',
                  border: `1.8px solid ${theme.accent}`,
                  opacity: 0.22 / r,
                }}
              />
            );
          })}

          {/* Center Play Button Badge */}
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: theme.accent,
              boxShadow: `0 0 24px ${theme.accentGlow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 20,
            }}
          >
            ▶
          </div>
        </div>

        {/* Bottom Scrubber & Timecode */}
        <div
          style={{
            height: 44,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            fontWeight: 700,
            color: theme.accent,
          }}
        >
          <span>00:01:24</span>
          <div
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.12)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${((frame * 0.8) % 100)}%`,
                height: '100%',
                background: theme.accent,
              }}
            />
          </div>
          <span style={{ color: theme.sub }}>00:04:00</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// KINETIC HEADLINE (Clean Grouped Highlighting with Backdrop Ribbons)
// ============================================================================
const KineticHeadline: React.FC<{
  text: string;
  theme: typeof THEMES['pi-v2-dark'];
  fps: number;
  fontSize?: number;
}> = ({ text, theme, fps, fontSize = 72 }) => {
  const frame = useCurrentFrame();
  const rawParts = (text || '').split(/(\*[^*]+\*)/g).filter(Boolean);

  return (
    <h1
      style={{
        fontSize,
        fontWeight: 900,
        lineHeight: 1.22,
        letterSpacing: '-0.03em',
        margin: 0,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px 14px',
        color: theme.text,
        position: 'relative',
        textAlign: 'center',
      }}
    >
      {rawParts.map((part, segIdx) => {
        const isHighlight = part.startsWith('*') && part.endsWith('*');
        const cleanContent = part.replace(/\*/g, '');
        const segDelay = segIdx * 3;
        const sSpring = spr(frame, segDelay, fps, { damping: 14, stiffness: 130, mass: 0.5 });
        const opacity = ramp(frame, segDelay, 5);
        const translateY = interpolate(sSpring, [0, 1], [20, 0]);
        const blur = interpolate(sSpring, [0, 1], [10, 0]);

        if (isHighlight) {
          const sweepProg = Math.min(1, Math.max(0, (interpolate(sSpring, [0, 1], [0, 1]) - 0.2) * 1.3));
          return (
            <span
              key={segIdx}
              style={{
                display: 'inline-block',
                position: 'relative',
                transform: `translateY(${translateY}px)`,
                opacity,
                filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
                color: theme.accent,
                padding: '2px 16px',
                borderRadius: 14,
                backgroundColor: theme.isLight ? 'rgba(2, 132, 199, 0.10)' : 'rgba(99, 102, 241, 0.18)',
                border: `1.5px solid ${theme.isLight ? 'rgba(2, 132, 199, 0.35)' : 'rgba(99, 102, 241, 0.45)'}`,
                boxShadow: `0 0 25px ${theme.accentGlow}`,
              }}
            >
              {/* Kinetic Underline Sweep */}
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  bottom: -4,
                  height: 3,
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2 || theme.accent})`,
                  transform: `scaleX(${sweepProg})`,
                  transformOrigin: 'left center',
                }}
              />
              {cleanContent}
            </span>
          );
        }

        return (
          <span
            key={segIdx}
            style={{
              display: 'inline-block',
              transform: `translateY(${translateY}px)`,
              opacity,
              filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
              color: theme.text,
            }}
          >
            {cleanContent}
          </span>
        );
      })}
    </h1>
  );
};

// ============================================================================
// DATA-DRIVEN SCENE RENDERER (100% Adaptive to User's JSON)
// ============================================================================
const SceneRenderer: React.FC<{
  scene: Scene;
  theme: VibeThemeTokens;
  width: number;
  height: number;
  fps: number;
}> = ({ scene, theme, width, height, fps }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Dynamic spring physics from Vibe tokens
  const damping = theme.motion?.springDamping ?? 14;
  const stiffness = theme.motion?.springStiffness ?? 110;
  const mass = theme.motion?.springMass ?? 0.8;
  const transitionFrames = theme.motion?.transitionFrames ?? 14;

  const enterSpring = spr(frame, 0, fps, { damping, stiffness, mass });

  // Dynamic exit transition
  const exitProgress = ramp(frame, durationInFrames - transitionFrames, transitionFrames);
  const exitOpacity = 1 - exitProgress;
  const exitBlur = exitProgress * 12;

  const translateY = interpolate(enterSpring, [0, 1], [60, 0]);
  const scale = interpolate(enterSpring, [0, 1], [0.94, 1]);

  // Determine what visual elements exist in the user's scene data
  const hasComparison = (scene.itemsBad && scene.itemsBad.length > 0) || (scene.itemsGood && scene.itemsGood.length > 0);
  const hasMetric = scene.metricValue != null && scene.metricValue !== '';
  const hasPoints = scene.points && scene.points.length > 0;
  const hasCode = Boolean(scene.codeSnippet);
  const hasMedia = Boolean(scene.mediaUrl);
  const hasCta = Boolean(scene.ctaText);
  const hasChartData = Boolean(scene.chartData && scene.chartData.values && scene.chartData.values.length > 0);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 50px',
        opacity: exitOpacity,
        filter: exitBlur > 0.1 ? `blur(${exitBlur}px)` : undefined,
        transform: `translateY(${translateY}px) scale(${scale})`,
        zIndex: 10,
        textAlign: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 960, position: 'relative' }}>
        {/* 1. Category / Sequence Tag Pill */}
        {scene.tag && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 24px',
              borderRadius: 999,
              backgroundColor: theme.isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(99, 102, 241, 0.15)',
              border: `1px solid ${theme.cardBorder}`,
              color: theme.accent,
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '0.08em',
              marginBottom: 32,
              transform: `scale(${interpolate(enterSpring, [0, 1], [0.8, 1])})`,
            }}
          >
            <span>{scene.tag}</span>
          </div>
        )}

        {/* 2. Core Kinetic Headline with High-Taste Clean Highlight Ribbon */}
        <KineticHeadline
          text={scene.headline || ''}
          theme={theme}
          fps={fps}
          fontSize={hasComparison || hasCode ? 60 : 74}
        />

        {/* 3. Subtext Narration */}
        {scene.subtext && (
          <p
            style={{
              fontSize: 26,
              color: theme.sub,
              fontWeight: 500,
              lineHeight: 1.5,
              marginTop: 20,
              marginBottom: 0,
              opacity: ramp(frame, 10, 6),
              transform: `translateY(${interpolate(enterSpring, [0, 1], [15, 0])}px)`,
            }}
          >
            {scene.subtext}
          </p>
        )}

        {/* ================================================================== */}
        {/* DYNAMIC VISUAL BLOCKS (Rendered conditionally based on JSON fields) */}
        {/* ================================================================== */}

        {/* A. Comparison Grid (Before vs After) */}
        {hasComparison && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 32, textAlign: 'left' }}>
            {/* Left Card: Method Lama / Masalah */}
            <div
              style={{
                backgroundColor: theme.isLight ? 'rgba(239, 68, 68, 0.06)' : 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 20,
                padding: '24px 20px',
                opacity: ramp(frame, 12, 6),
                transform: `translateX(${interpolate(enterSpring, [0, 1], [-20, 0])}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18, color: '#ef4444' }}>✕</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>
                  {scene.leftTitle || 'Metode Lama'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(scene.itemsBad || []).map((item, idx) => (
                  <div key={idx} style={{ fontSize: 18, color: theme.isLight ? '#7f1d1d' : '#fca5a5', lineHeight: 1.4 }}>
                    • {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card: Solusi Baru */}
            <div
              style={{
                backgroundColor: theme.isLight ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.14)',
                border: '1.5px solid rgba(34, 197, 94, 0.45)',
                borderRadius: 20,
                padding: '24px 20px',
                opacity: ramp(frame, 16, 6),
                transform: `translateX(${interpolate(enterSpring, [0, 1], [20, 0])}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18, color: '#22c55e' }}>✓</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>
                  {scene.rightTitle || 'Solusi Cerdas'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(scene.itemsGood || []).map((item, idx) => (
                  <div key={idx} style={{ fontSize: 18, color: theme.isLight ? '#14532d' : '#86efac', fontWeight: 600, lineHeight: 1.4 }}>
                    • {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* B. Metric Focus Counter */}
        {hasMetric && (
          <div style={{ marginTop: 28 }}>
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: theme.accent,
                fontFamily: 'monospace',
                letterSpacing: '-0.04em',
                textShadow: `0 0 45px ${theme.accentGlow}`,
                lineHeight: 1,
              }}
            >
              {typeof scene.metricValue === 'number' && Number.isFinite(scene.metricValue)
                ? Math.round(interpolate(enterSpring, [0, 1], [0, scene.metricValue]))
                : scene.metricValue}
            </div>
            {scene.metricLabel && (
              <div style={{ fontSize: 22, color: theme.sub, fontWeight: 700, marginTop: 8, letterSpacing: '0.04em' }}>
                {scene.metricLabel}
              </div>
            )}
          </div>
        )}

        {/* C. Code IDE / Terminal Window */}
        {hasCode && (() => {
          const lines = (scene.codeSnippet || '').split('\n');
          const visibleLines = Math.min(lines.length, Math.floor(frame / 6) + 1);
          return (
            <div
              style={{
                marginTop: 24,
                width: '100%',
                backgroundColor: '#090d16',
                borderRadius: 20,
                border: '2px solid rgba(255,255,255,0.12)',
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  backgroundColor: '#0f172a',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#eab308' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                </div>
                <div style={{ margin: '0 auto', color: '#94a3b8', fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                  {scene.language || 'terminal'}
                </div>
              </div>
              <div style={{ padding: '22px 28px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 18, lineHeight: 1.8 }}>
                {lines.slice(0, visibleLines).map((line, i) => (
                  <div key={i} style={{ color: line.startsWith('$') ? '#22c55e' : (line.startsWith('✓') ? '#38bdf8' : '#f8fafc') }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* D. Media / Image Showcase */}
        {hasMedia && (
          <div
            style={{
              marginTop: 28,
              borderRadius: 20,
              overflow: 'hidden',
              border: `2px solid ${theme.cardBorder}`,
              boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
              maxHeight: 400,
            }}
          >
            <img src={scene.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            {scene.caption && (
              <div style={{ padding: '10px 16px', backgroundColor: theme.cardBg, color: theme.sub, fontSize: 16 }}>
                {scene.caption}
              </div>
            )}
          </div>
        )}

        {/* E. Bullet / Points Staggered Cards */}
        {hasPoints && !hasComparison && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 30, textAlign: 'left' }}>
            {scene.points!.map((pt, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: 16,
                  padding: '16px 24px',
                  fontSize: 22,
                  fontWeight: 600,
                  color: theme.text,
                  opacity: ramp(frame, 12 + i * 5, 5),
                  transform: `translateY(${interpolate(enterSpring, [0, 1], [20, 0])}px)`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.accent, flexShrink: 0 }} />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        )}

        {/* F. Outro / Call To Action Button */}
        {hasCta && (
          <div style={{ marginTop: 32 }}>
            <div
              style={{
                display: 'inline-block',
                backgroundColor: theme.accent,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 24,
                padding: '18px 44px',
                borderRadius: 999,
                boxShadow: `0 14px 35px ${theme.accentGlow}`,
                transform: `scale(${1.0 + Math.sin(frame * 0.1) * 0.02})`,
              }}
            >
              {scene.ctaText}
            </div>
            {scene.badges && scene.badges.length > 0 && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
                {scene.badges.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: theme.sub,
                      backgroundColor: theme.cardBg,
                      border: `1px solid ${theme.cardBorder}`,
                      padding: '6px 16px',
                      borderRadius: 999,
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* G. Standalone Badges / Intro Teasers (Hook & Feature Scenes) */}
        {!hasCta && scene.badges && scene.badges.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              marginTop: 30,
              flexWrap: 'wrap',
              opacity: ramp(frame, 10, 6),
              transform: `translateY(${interpolate(enterSpring, [0, 1], [15, 0])}px)`,
            }}
          >
            {scene.badges.map((b, i) => (
              <span
                key={i}
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: theme.isLight ? theme.accent : '#ffffff',
                  backgroundColor: theme.cardBg,
                  border: `1.5px solid ${theme.cardBorder}`,
                  padding: '10px 24px',
                  borderRadius: 999,
                  boxShadow: `0 8px 25px ${theme.accentGlow}`,
                  transform: `scale(${1.0 + Math.sin((frame + i * 15) * 0.08) * 0.02})`,
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: theme.accent, fontSize: 16 }}>✦</span>
                <span>{b}</span>
              </span>
            ))}
          </div>
        )}

        {/* V2: Data Chart / Gauge Block */}
        {hasChartData && (
          <DataGaugeBlock chartData={scene.chartData!} theme={theme} />
        )}

        {/* H. Authentic 3D Isometric Studio Card (Hero / Intro scene when no other visual block is present) */}
        {!hasComparison && !hasMetric && !hasCode && !hasPoints && !hasCta && !hasChartData && (!scene.badges || scene.badges.length === 0) && (
          <Isometric3DStudioCard theme={theme} frame={frame} fps={fps} />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPOSITION COMPONENT
// ============================================================================
export const MainVideo: React.FC<VideoProps> = ({
  composition = defaultVideoProps.composition,
  vibe = 'ramai',
  theme: customTheme,
  style = 'pi-v2-dark',
  audioUrl,
  // V2 props
  transition = 'auto',
  transitionDurationFrames = 15,
  textAnimMode = 'auto',
  kineticShapes,
  audioVisualizer,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const theme = resolveVibeTheme(vibe as string, customTheme, style);
  const vibeId = ((['ramai', 'eksklusif', 'cyber', 'corporate'].includes(String(vibe))) ? vibe : 'ramai') as VibePresetId;

  // Resolve text animation mode
  const resolvedTextMode: TextAnimMode = textAnimMode === 'auto'
    ? (VIBE_TEXT_AUTO[vibeId] || 'word-spring')
    : textAnimMode;

  // Smooth continuous camera drift
  const camZoom = 1.0 + Math.sin(frame * 0.02) * 0.015;
  const camPanX = Math.cos(frame * 0.018) * 6;
  const camPanY = Math.sin(frame * 0.015) * 6;

  // Timeline progress (0 to 1)
  const totalProgress = Math.min(1, frame / durationInFrames);
  const rawScenes = composition?.scenes || defaultVideoProps.composition.scenes;
  let currentOffset = 0;
  const scenes: Scene[] = rawScenes.map((sc: any) => {
    const dur = Number.isFinite(Number(sc.durationFrames))
      ? Number(sc.durationFrames)
      : (sc.endFrame != null && sc.startFrame != null && Number.isFinite(Number(sc.endFrame) - Number(sc.startFrame))
          ? Number(sc.endFrame) - Number(sc.startFrame)
          : 150);
    const safeDur = Math.max(1, Math.round(dur));
    const start = Number.isFinite(Number(sc.startFrame)) ? Number(sc.startFrame) : currentOffset;
    const end = Number.isFinite(Number(sc.endFrame)) ? Number(sc.endFrame) : start + safeDur;
    currentOffset = end;
    return {
      ...sc,
      durationFrames: safeDur,
      startFrame: start,
      endFrame: end,
    } as Scene;
  });

  // Determine if transitions are used
  const useTransitions = transition !== 'none' && scenes.length > 1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.font,
        background: `radial-gradient(circle at 50% 35%, ${theme.colors.bgGradient[0]} 0%, ${theme.colors.bgGradient[1]} 65%, ${theme.colors.bgGradient[2]} 100%)`,
        color: theme.text,
      }}
    >
      {/* Ambient Aura Glow */}
      {theme.ambience.showAuraGlow && (
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 750,
            height: 750,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.colors.accentGlow} 0%, transparent 70%)`,
            filter: `blur(${theme.ambience.glassBlurPx * 3}px)`,
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.55,
          }}
        />
      )}

      {/* Ambient 3D perspective floor grid */}
      {theme.ambience.show3DGrid && <Perspective3DGrid theme={theme} />}

      {/* V2: Kinetic Shapes Layer */}
      {kineticShapes?.enabled && kineticShapes.shapes.length > 0 && (
        <KineticShapesLayer
          shapes={kineticShapes.shapes}
          density={kineticShapes.density || 3}
          theme={theme}
        />
      )}

      {/* Cyber Scanlines Overlay */}
      {theme.ambience.showScanlines && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%)',
            backgroundSize: '100% 4px',
            opacity: 0.4,
          }}
        />
      )}

      {/* Camera drift container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${camPanX}px, ${camPanY}px) scale(${camZoom})`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {/* Top Progress Bar */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 50,
            right: 50,
            height: 6,
            borderRadius: 999,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${totalProgress * 100}%`,
              backgroundColor: theme.accent,
              borderRadius: 999,
              boxShadow: `0 0 14px ${theme.accent}`,
            }}
          />
        </div>
      </div>

      {/* V2: Audio Visualizer (replaces old hard-coded bars) */}
      <AudioFrequencyViz
        vizStyle={audioVisualizer?.enabled ? (audioVisualizer.style || 'frequency-bars') : 'frequency-bars'}
        theme={theme}
        numberOfSamples={audioVisualizer?.numberOfSamples || 32}
        opacity={audioVisualizer?.opacity ?? 0.6}
      />

      {/* Render Scenes: TransitionSeries (V2) or plain Sequence (V1 fallback) */}
      {useTransitions ? (
        <TransitionSeries>
          {scenes.map((sc, idx) => {
            const duration = Math.max(1, sc.endFrame - sc.startFrame);
            const presentation = getTransitionPresentation(transition as TransitionType, vibeId, idx, width, height);
            return (
              <React.Fragment key={idx}>
                <TransitionSeries.Sequence durationInFrames={duration}>
                  <AbsoluteFill>
                    <SceneRenderer scene={sc} theme={theme} width={width} height={height} fps={fps} />
                  </AbsoluteFill>
                </TransitionSeries.Sequence>
                {idx < scenes.length - 1 && presentation && (
                  <TransitionSeries.Transition
                    presentation={presentation}
                    timing={linearTiming({ durationInFrames: transitionDurationFrames })}
                  />
                )}
              </React.Fragment>
            );
          })}
        </TransitionSeries>
      ) : (
        scenes.map((sc, idx) => {
          const from = sc.startFrame;
          const duration = Math.max(1, sc.endFrame - sc.startFrame);
          return (
            <Sequence key={idx} from={from} durationInFrames={duration}>
              <SceneRenderer scene={sc} theme={theme} width={width} height={height} fps={fps} />
            </Sequence>
          );
        })
      )}

      {/* Optional Audio Track */}
      {audioUrl ? <Audio src={audioUrl} /> : null}
    </div>
  );
};
