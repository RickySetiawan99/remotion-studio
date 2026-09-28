/**
 * Centralized VIBE_PRESETS catalog for MotionCraft Studio.
 * Shared across server rendering, procedural audio generator, and UI clients.
 */

export const VIBE_PRESETS = {
  ramai: {
    id: 'ramai',
    label: 'Ramai & Viral',
    tag: 'High Energy & Punchy',
    icon: 'fa-fire',
    colors: {
      accent: '#f59e0b', // Amber / Gold
      accentGlow: 'rgba(245, 158, 11, 0.4)',
      secondary: '#ef4444', // Red-Orange
      bgGradient: ['#09090b', '#18181b'],
      surface: 'rgba(24, 24, 27, 0.85)',
      surfaceBorder: 'rgba(245, 158, 11, 0.3)',
      textPrimary: '#ffffff',
      textMuted: '#a1a1aa',
      highlightRibbon: 'rgba(245, 158, 11, 0.28)'
    },
    motion: {
      springDamping: 11,
      springStiffness: 175,
      springMass: 0.8,
      transitionFrames: 14,
      bounceIntensity: 0.8
    },
    ambience: {
      show3DGrid: true,
      showParticles: true,
      showScanlines: false,
      showAuraGlow: true,
      glassBlurPx: 16
    },
    audio: {
      musicPreset: 'tech-bright',
      targetBpm: 120,
      sfxPack: 'digital-soft',
      sfxGainMultiplier: 1.6
    },
    recommendedElements: ['intro-hook', 'doodle', 'comparison', 'metric', 'points', 'cta']
  },
  eksklusif: {
    id: 'eksklusif',
    label: 'Eksklusif & Minimalis',
    tag: 'Luxury & Editorial',
    icon: 'fa-gem',
    colors: {
      accent: '#e2e8f0', // Crisp Platinum / Silver
      accentGlow: 'rgba(226, 232, 240, 0.25)',
      secondary: '#94a3b8',
      bgGradient: ['#050608', '#0b0f17'],
      surface: 'rgba(15, 23, 42, 0.75)',
      surfaceBorder: 'rgba(255, 255, 255, 0.15)',
      textPrimary: '#f8fafc',
      textMuted: '#94a3b8',
      highlightRibbon: 'rgba(255, 255, 255, 0.15)'
    },
    motion: {
      springDamping: 24,
      springStiffness: 85,
      springMass: 1.2,
      transitionFrames: 22,
      bounceIntensity: 0.1
    },
    ambience: {
      show3DGrid: false,
      showParticles: false,
      showScanlines: false,
      showAuraGlow: true,
      glassBlurPx: 24
    },
    audio: {
      musicPreset: 'dark-minimal',
      targetBpm: 92,
      sfxPack: 'paper',
      sfxGainMultiplier: 1.0
    },
    recommendedElements: ['doodle', 'points', 'cta']
  },
  cyber: {
    id: 'cyber',
    label: 'Cyber Tech',
    tag: 'Developer & Terminal',
    icon: 'fa-terminal',
    colors: {
      accent: '#06b6d4', // Cyan
      accentGlow: 'rgba(6, 182, 212, 0.4)',
      secondary: '#10b981', // Emerald
      bgGradient: ['#040711', '#081120'],
      surface: 'rgba(8, 17, 32, 0.9)',
      surfaceBorder: 'rgba(6, 182, 212, 0.35)',
      textPrimary: '#ecfeff',
      textMuted: '#67e8f9',
      highlightRibbon: 'rgba(6, 182, 212, 0.24)'
    },
    motion: {
      springDamping: 14,
      springStiffness: 140,
      springMass: 0.9,
      transitionFrames: 16,
      bounceIntensity: 0.4
    },
    ambience: {
      show3DGrid: true,
      showParticles: true,
      showScanlines: true,
      showAuraGlow: true,
      glassBlurPx: 12
    },
    audio: {
      musicPreset: 'tech-bright',
      targetBpm: 116,
      sfxPack: 'digital-soft',
      sfxGainMultiplier: 1.4
    },
    recommendedElements: ['intro-hook', 'code', 'points', 'metric', 'cta']
  },
  corporate: {
    id: 'corporate',
    label: 'Clean Corporate',
    tag: 'Enterprise & Data',
    icon: 'fa-chart-simple',
    colors: {
      accent: '#3b82f6', // Corporate Blue
      accentGlow: 'rgba(59, 130, 246, 0.35)',
      secondary: '#6366f1', // Indigo
      bgGradient: ['#080e1a', '#0f172a'],
      surface: 'rgba(15, 23, 42, 0.85)',
      surfaceBorder: 'rgba(59, 130, 246, 0.28)',
      textPrimary: '#ffffff',
      textMuted: '#94a3b8',
      highlightRibbon: 'rgba(59, 130, 246, 0.25)'
    },
    motion: {
      springDamping: 18,
      springStiffness: 110,
      springMass: 1.0,
      transitionFrames: 18,
      bounceIntensity: 0.2
    },
    ambience: {
      show3DGrid: false,
      showParticles: false,
      showScanlines: false,
      showAuraGlow: true,
      glassBlurPx: 20
    },
    audio: {
      musicPreset: 'calm-punch',
      targetBpm: 106,
      sfxPack: 'digital-soft',
      sfxGainMultiplier: 1.2
    },
    recommendedElements: ['intro-hook', 'comparison', 'metric', 'points', 'cta']
  }
};

/**
 * Resolves a safe Vibe preset by ID with fallback to 'ramai'
 */
export function getVibePreset(id) {
  if (!id) return VIBE_PRESETS.ramai;
  const key = String(id).toLowerCase().trim();
  return VIBE_PRESETS[key] || VIBE_PRESETS.ramai;
}
