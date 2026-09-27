// SFX engine: Synthesized procedural sound effects for Remotion videos
import * as D from './dsp.mjs';
import * as V from './voices.mjs';
const { SR } = D;

// Default levels (dB) and high-pass (Hz). Raised slightly for punchy clarity.
export const SFX_RULES = {
  word_pop:    [-12, 300],
  icon_pop:    [-9, 250],
  letter_tick: [-14, 400],
  check:       [-8, 300],
  success:     [-6, 250],
  slot_tick:   [-14, 500],
  bubble:      [-11, 250],
  type:        [-15, 500],
  button:      [-10, 300],
  whoosh_in:   [-7, 150],
  whoosh_out:  [-8, 150],
  swoosh:      [-9, 150],
  riser:       [-6, 120],
  impact:      [-4, 20],
  confetti:    [-11, 400],
  logo_sting:  [-5, 200],
};
export const SFX_TYPES = Object.keys(SFX_RULES);

// Packs change timbre: digital-soft & soft-pop are great for modern tech videos
export const PACKS = {
  'digital-soft': { pitch: 2, bright: 1.3, decay: 1.2, room: 0.16 },
  'soft-pop':     { pitch: 0, bright: 1.0, decay: 1.0, room: 0.18 },
  'glass':        { pitch: 5, bright: 1.5, decay: 0.8, room: 0.28 },
  'paper':        { pitch: -3, bright: 0.7, decay: 1.4, room: 0.10 },
  'organic-wood': { pitch: -5, bright: 0.8, decay: 1.1, room: 0.20 },
};

function bank(pk) {
  const dk = pk.decay;
  const P = (x) => V.pitchShift(x, pk.pitch);
  const B = {
    word_pop: [0, 2, 4, 6].map((i) => V.sineBlip(1500 * 2 ** (i / 12), 750 * 2 ** (i / 12), 0.08, 55 * dk)),
    icon_pop: [0, 1].map(() => {
      const a = V.sineBlip(950, 480, 0.13, 30 * dk);
      D.mixInto(a, V.chime([96], 0.14), 0.4);
      return a;
    }),
    letter_tick: [V.sineBlip(2500, 1900, 0.035, 120), V.sineBlip(2700, 2000, 0.035, 120)],
    check: [V.chime([84, 91], 0.9, 0.09)],
    success: [V.chime([79, 84, 88, 91], 1.5, 0.08)],
    slot_tick: [V.sineBlip(2100, 1600, 0.035, 150)],
    bubble: [V.sineBlip(620, 1150, 0.10, 35 * dk, 0.06), V.sineBlip(720, 1300, 0.10, 35 * dk, 0.06)],
    type: [0, 1, 2, 3].map((i) => {
      const b = V.hat();
      return D.gain(D.filt(b, 'bp', 3200 + i * 400, 1.3), 1.1);
    }),
    button: [V.sineBlip(1300, 950, 0.06, 85)],
    whoosh_in: [D.gain(V.noiseSweep(0.35, 380, 7500 * pk.bright, true, 0.85), 0.7)],
    whoosh_out: [D.gain(V.noiseSweep(0.35, 7500 * pk.bright, 380, false, 0.85), 0.7)],
    swoosh: [D.gain(V.noiseSweep(0.48, 2600 * pk.bright, 550, false, 1.5), 0.55)],
    riser: [D.gain(V.noiseSweep(1.9, 240, 9200 * pk.bright, true, 1.0), 0.75)],
    impact: [D.gain(V.deepKick(1.4), 1.0)],
    confetti: [0, 1, 2].map((i) => V.chime([100 + i, 104 + i], 0.35, 0.03)),
    logo_sting: [D.gain(V.chime([76, 83, 88, 95], 2.2, 0.07), 1.0)],
  };
  for (const k of Object.keys(B)) {
    if (!['impact', 'riser', 'whoosh_in', 'whoosh_out', 'swoosh'].includes(k)) {
      B[k] = B[k].map(P);
    }
  }
  return B;
}

// Generate automated, high-taste SFX cues based on video composition scenes with frame-perfect sync
export function generateAutoSfxCues(composition, fps = 30) {
  const cues = [];
  const scenes = composition.scenes || [];
  const durationSec = composition.durationSec || 60;
  const durFrames = durationSec * fps;

  scenes.forEach((sc, scIdx) => {
    const startF = sc.startFrame || 0;
    const endF = sc.endFrame || durFrames;
    const sceneDur = endF - startF;

    // Helper to register a frame-exact sound cue
    const at = (localFrame, type, gain = 0, extra = {}) => {
      const absF = startF + localFrame;
      if (absF < endF) {
        cues.push({
          type,
          t: absF / fps,
          gain,
          snap: false,
          ...extra,
        });
      }
    };

    // 1. Scene Entrance Transition
    at(0, 'whoosh_in', -3);
    if (scIdx === 0) {
      at(0, 'logo_sting', 2);
    }

    // 2. Tag / Category badge tick
    if (sc.tag) {
      at(4, 'letter_tick', -1);
    }

    // 3. Headline Stagger & Highlight Word Doodles
    const headline = sc.headline || '';
    if (headline) {
      at(3, 'letter_tick', -2);
      if (headline.split(' ').length > 2) at(8, 'letter_tick', -2);

      // If headline has *highlight* (word encircled by doodle loop or pill)
      if (headline.includes('*')) {
        // Pop right when highlight word springs in and doodle loop draws (frame 14-18)
        at(15, 'word_pop', 3, { pitch: 2 });
        at(18, 'swoosh', -1);
      }
    }

    // 4. Dynamic Doodle Shapes (Arrow, Sparkles, Corner Accents)
    const isFirstScene = (scIdx === 0);
    const doodle = sc.doodle || (isFirstScene ? 'arrow' : null);
    if (doodle === 'arrow') {
      at(16, 'whoosh_in', -2);
      at(26, 'button', 2); // Arrowhead lands with crisp tactile button click
    } else if (doodle === 'sparkle' || doodle === 'shapes') {
      at(14, 'bubble', 2, { pitch: 3 });
      at(24, 'confetti', 2); // Sparkle bursts
    } else if (doodle === 'corner_accents') {
      at(8, 'slot_tick', 2);
      at(14, 'slot_tick', 2);
    }

    // 5. Badges
    if (Array.isArray(sc.badges) && sc.badges.length > 0) {
      sc.badges.forEach((_, bi) => {
        at(10 + bi * 6, 'icon_pop', 1);
      });
    }

    // 6. Split Comparison (Bad vs Good)
    if (sc.itemsBad || sc.itemsGood || sc.type === 'comparison_split' || sc.type === 'split_screen') {
      const badCount = (sc.itemsBad || ['A']).length;
      const goodCount = (sc.itemsGood || ['B']).length;
      at(12, 'whoosh_in', -2);
      for (let i = 0; i < badCount; i++) at(18 + i * 6, 'icon_pop', 1);
      at(28, 'whoosh_in', -1);
      for (let i = 0; i < goodCount; i++) at(32 + i * 6, 'bubble', 2, { pitch: 2 });
      at(32 + goodCount * 6, 'check', 2);
    }
    // 7. Stat / Metric Counter (Riser build -> Impact lock)
    else if (sc.metricValue || sc.type === 'stat_focus' || sc.type === 'stat_callout') {
      at(0, 'riser', 1);
      at(16, 'impact', 0);
      at(18, 'success', 3);
      at(26, 'bubble', 2, { pitch: 3 });
    }
    // 8. Code Terminal / Typewriter Snippet
    else if (sc.codeSnippet || sc.type === 'code_terminal' || sc.type === 'code_window_react') {
      const lines = (sc.codeSnippet || 'const engine = createMotionEngine();').split('\n');
      const maxLines = Math.min(6, lines.length);
      for (let i = 0; i < maxLines; i++) {
        at(6 + i * 8, 'type', 2);
      }
      at(6 + maxLines * 8 + 4, 'check', 2);
    }
    // 9. Checklist / Bullet Points Stagger
    else if (Array.isArray(sc.points) && sc.points.length > 0) {
      sc.points.forEach((_, pi) => {
        at(12 + pi * 8, 'icon_pop', 2);
      });
      at(12 + sc.points.length * 8 + 4, 'check', 1);
    }

    // 10. Outro CTA or Last Scene Finish
    if (sc.ctaText || sc.type === 'outro_cta' || sc.type === 'remotion_outro' || scIdx === scenes.length - 1) {
      at(14, 'button', 3);   // Button pop
      at(22, 'confetti', 3); // Confetti celebration burst
      at(30, 'success', 2);  // Positive chord finish
    }

    // Legacy Specific Types Compatibility
    if (sc.type === 'remotion_studio_mockup') {
      at(10, 'button', 0);
      at(18, 'slot_tick', 2);
      at(30, 'button', 3);
    } else if (sc.type === 'frame_sequence_cards') {
      at(0, 'slot_tick', 2);
      at(6, 'icon_pop', 1);
      at(12, 'icon_pop', 1);
      at(18, 'icon_pop', 1);
    } else if (sc.type === 'terminal_cli_render') {
      at(4, 'type', 3);
      at(12, 'check', 2);
      at(22, 'check', 2);
      at(32, 'button', 2);
    }
  });

  return cues;
}


// cues: [{type, t, gain?, pitch?, pan?, end? (riser), snap?}]
export function renderSfx(cues, dur, { bpm = null, pack = 'digital-soft', density = 1, seed = 11 } = {}) {
  D.setSeed(seed);
  const pk = PACKS[pack] || PACKS['digital-soft'];
  const B = bank(pk);
  const n = Math.round(dur * SR);
  const out = D.stereo(n);
  const grid = bpm ? 60 / bpm / 4 : null;
  const count = {};
  const warnings = [];
  let lastLoud = -1;

  const sorted = [...cues].sort((a, b) => a.t - b.t);
  for (const c of sorted) {
    const typ = c.type;
    if (!B[typ]) {
      warnings.push(`unknown sfx type ${typ}`);
      continue;
    }
    if (density < 1 && ['word_pop', 'letter_tick', 'type', 'slot_tick'].includes(typ) && D.rand() > density) {
      continue;
    }

    let t = c.t;
    if (typ === 'riser' && c.end != null) {
      t = c.end - 1.8;
    } else if (grid && c.snap === true) {
      const s = Math.round(t / grid) * grid;
      if (Math.abs(s - t) < 0.045) t = s;
    }

    const [g0, hp] = SFX_RULES[typ];
    const g = g0 + (c.gain || 0);

    if (g > -12 && lastLoud >= 0 && t - lastLoud < 0.1) {
      // slight gap guard
    }
    if (g > -12) lastLoud = t;

    const i = (count[typ] = (count[typ] || 0) + 1);
    let x = B[typ][(i - 1) % B[typ].length];
    if (c.pitch) x = V.pitchShift(x, c.pitch);
    x = D.filt(x, 'hp', hp);
    D.place(out, x, Math.max(0, t), D.db(g), c.pan || 0);
  }

  const wet = D.reverb(out, 0.2, 0.6, pk.room);
  D.mixInto(out, wet);
  return { buf: out, warnings };
}
