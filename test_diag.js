
const { createCanvas } = require('canvas');
const fs = require('fs');

function emilSpring(frame, fps = 30, params = { mass: 0.7, stiffness: 140, damping: 11 }) {
  const t = Math.max(0, frame) / fps;
  const w0 = Math.sqrt(params.stiffness / params.mass);
  const zeta = params.damping / (2 * Math.sqrt(params.stiffness * params.mass));
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
}

const STYLE = {
  bg: ['#1e1b4b', '#0f172a', '#030712'],
  cardBg: 'rgba(15, 23, 42, 0.95)',
  cardBorder: 'rgba(255, 255, 255, 0.18)',
  text: '#ffffff',
  sub: '#94a3b8',
  accent: '#6366f1',
  spring: { mass: 0.7, stiffness: 140, damping: 11 }
};

const composition = {
  durationInFrames: 1800,
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      startFrame: 0,
      endFrame: 360,
      type: "concept_card",
      tag: "01 / HOOK",
      headline: "BAGAIMANA AI BERPIKIR?",
      subtext: "Bukan sihir, melainkan kalkulasi probabilitas kata",
      metricLabel: "Tokens Analyzed",
      metricValue: 15,
      points: ["15 Triliun Token Teks", "Pola Distribusi Probabilitas"]
    }
  ]
};

const frame = 60;
const width = 1080;
const height = 1920;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

const activeScene = composition.scenes[0];
const sceneFrame = frame - activeScene.startFrame;
const sceneDur = activeScene.endFrame - activeScene.startFrame;

let scale = 1;
let translateY = 0;
let rotation = 0;
let opacity = 1;

if (sceneFrame < 25) {
  scale = emilSpring(sceneFrame, 20, STYLE.spring);
} else {
  translateY = Math.sin(sceneFrame * 0.04) * 4;
}

console.log({ sceneFrame, scale, translateY, rotation, opacity });

const cardW = width * 0.88;
const cardH = height * 0.60;

ctx.save();
ctx.translate(width / 2, height / 2 + translateY);
ctx.rotate(rotation);
ctx.scale(scale, scale);
ctx.globalAlpha = opacity;

console.log('Drawing card at:', -cardW/2, -cardH/2, cardW, cardH);
ctx.fillStyle = '#ff0000';
ctx.fillRect(-cardW/2, -cardH/2, cardW, cardH);

ctx.restore();

fs.writeFileSync('/home/ubuntu/remotion-studio/diag_frame.png', canvas.toBuffer('image/png'));
console.log('Saved diag_frame.png');
