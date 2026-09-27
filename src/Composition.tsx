import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Audio,
} from 'remotion';

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

  // Computed timeline frames
  startFrame: number;
  endFrame: number;
}

export interface VideoProps {
  [key: string]: unknown;
  composition: {
    title: string;
    scenes: Scene[];
  };
  style?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  audioUrl?: string;
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
  style: 'pi-v2-dark',
  durationSec: 4,
};

// ============================================================================
// 7 CURATED HIGH-TASTE DESIGN THEMES
// ============================================================================
export const THEMES: Record<string, {
  isLight?: boolean;
  bg: string[];
  cardBg: string;
  cardBorder: string;
  text: string;
  sub: string;
  accent: string;
  accentGlow: string;
  accent2: string;
  font: string;
}> = {
  'pi-v2-dark': {
    isLight: false,
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
  'remotion-light': {
    isLight: true,
    bg: ['#ffffff', '#f0f9ff', '#e0f2fe'],
    cardBg: 'rgba(255, 255, 255, 0.95)',
    cardBorder: 'rgba(2, 132, 199, 0.22)',
    text: '#0f172a',
    sub: '#475569',
    accent: '#0284c7',
    accentGlow: 'rgba(2, 132, 199, 0.35)',
    accent2: '#0ea5e9',
    font: 'system-ui, -apple-system, sans-serif',
  },
  'tech-neon-soft': {
    isLight: false,
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
  'hyper-crypto': {
    isLight: false,
    bg: ['#3b0764', '#1e1b4b', '#030712'],
    cardBg: 'rgba(24, 9, 43, 0.94)',
    cardBorder: 'rgba(168, 85, 247, 0.45)',
    text: '#ffffff',
    sub: '#d8b4fe',
    accent: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.35)',
    accent2: '#eab308',
    font: 'system-ui, sans-serif',
  },
  'sunset-creator': {
    isLight: false,
    bg: ['#450a0a', '#1c1917', '#09090b'],
    cardBg: 'rgba(28, 25, 23, 0.94)',
    cardBorder: 'rgba(249, 115, 22, 0.45)',
    text: '#ffffff',
    sub: '#fdba74',
    accent: '#f97316',
    accentGlow: 'rgba(249, 115, 22, 0.35)',
    accent2: '#ef4444',
    font: 'system-ui, sans-serif',
  },
  'warm-paper': {
    isLight: true,
    bg: ['#fffbeb', '#fef3c7', '#fde68a'],
    cardBg: 'rgba(255, 255, 255, 0.96)',
    cardBorder: 'rgba(217, 119, 6, 0.35)',
    text: '#451a03',
    sub: '#78350f',
    accent: '#d97706',
    accentGlow: 'rgba(217, 119, 6, 0.22)',
    accent2: '#b45309',
    font: 'Georgia, serif',
  },
  'mono-editorial': {
    isLight: false,
    bg: ['#18181b', '#09090b', '#000000'],
    cardBg: 'rgba(24, 24, 27, 0.95)',
    cardBorder: 'rgba(255, 255, 255, 0.25)',
    text: '#f4f4f5',
    sub: '#a1a1aa',
    accent: '#e4e4e7',
    accentGlow: 'rgba(255, 255, 255, 0.18)',
    accent2: '#ffffff',
    font: 'ui-monospace, monospace',
  },
};

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
  theme: typeof THEMES['pi-v2-dark'];
  width: number;
  height: number;
  fps: number;
}> = ({ scene, theme, width, height, fps }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Snappy enter spring with soft settle
  const enterSpring = spr(frame, 0, fps, { damping: 14, stiffness: 100, mass: 0.6 });

  // Fast exit blur + fade
  const exitProgress = ramp(frame, durationInFrames - 14, 14);
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
              {typeof scene.metricValue === 'number'
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

        {/* H. Authentic 3D Isometric Studio Card (Hero / Intro scene when no other visual block is present) */}
        {!hasComparison && !hasMetric && !hasCode && !hasPoints && !hasCta && (!scene.badges || scene.badges.length === 0) && (
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
  style = 'pi-v2-dark',
  audioUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const theme = THEMES[style] || THEMES['pi-v2-dark'];

  // Smooth continuous camera drift
  const camZoom = 1.0 + Math.sin(frame * 0.02) * 0.015;
  const camPanX = Math.cos(frame * 0.018) * 6;
  const camPanY = Math.sin(frame * 0.015) * 6;

  // Timeline progress (0 to 1)
  const totalProgress = Math.min(1, frame / durationInFrames);
  const scenes = composition?.scenes || defaultVideoProps.composition.scenes;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.font,
        background: `radial-gradient(circle at 50% 35%, ${theme.bg[0]} 0%, ${theme.bg[1]} 65%, ${theme.bg[2]} 100%)`,
        color: theme.text,
      }}
    >
      {/* Ambient 3D perspective floor grid */}
      <Perspective3DGrid theme={theme} />

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

        {/* Bottom Audio Frequency Visualizer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 50,
            right: 50,
            height: 30,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 4,
            opacity: 0.6,
          }}
        >
          {Array.from({ length: 32 }).map((_, i) => {
            const h = Math.abs(Math.sin(frame * 0.12 + i * 0.35) * 22) + 4;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  backgroundColor: i % 2 === 0 ? theme.accent : theme.accent2,
                  borderRadius: 4,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Render All User Scenes Sequentially */}
      {scenes.map((sc, idx) => {
        const from = sc.startFrame;
        const duration = Math.max(1, sc.endFrame - sc.startFrame);
        return (
          <Sequence key={idx} from={from} durationInFrames={duration}>
            <SceneRenderer scene={sc} theme={theme} width={width} height={height} fps={fps} />
          </Sequence>
        );
      })}

      {/* Optional Audio Track */}
      {audioUrl ? <Audio src={audioUrl} /> : null}
    </div>
  );
};
