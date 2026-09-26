
const fs = require('fs');
const { createCanvas } = require('canvas');

function emilSpring(frame, fps = 30, params = { mass: 0.7, stiffness: 140, damping: 11 }) {
  const t = Math.max(0, frame) / fps;
  const w0 = Math.sqrt(params.stiffness / params.mass);
  const zeta = params.damping / (2 * Math.sqrt(params.stiffness * params.mass));
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
}

function interpolate(frame, inRange, outRange) {
  const [inMin, inMax] = inRange;
  const [outMin, outMax] = outRange;
  if (frame <= inMin) return outMin;
  if (frame >= inMax) return outMax;
  return outMin + ((frame - inMin) / (inMax - inMin)) * (outMax - outMin);
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

const activeScene = {
  startFrame: 0,
  endFrame: 360,
  type: "concept_card",
  tag: "01 / HOOK",
  headline: "BAGAIMANA AI BERPIKIR?",
  subtext: "Bukan sihir, melainkan kalkulasi probabilitas kata",
  metricLabel: "Tokens Analyzed",
  metricValue: 15,
  points: ["15 Triliun Token Teks", "Pola Distribusi Probabilitas"]
};

const frame = 60;
const width = 1080;
const height = 1920;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

const camZoom = 1.0 + Math.sin(frame * 0.02) * 0.015;
const camPanX = Math.cos(frame * 0.015) * 8;
const camPanY = Math.sin(frame * 0.015) * 8;

ctx.save();
ctx.translate(width / 2 + camPanX, height / 2 + camPanY);
ctx.scale(camZoom, camZoom);
ctx.translate(-width / 2, -height / 2);

const pulseRadius = width * 0.8 + Math.sin(frame * 0.05) * 80;
const grad = ctx.createRadialGradient(width/2, height/2, 80, width/2, height/2, pulseRadius);
grad.addColorStop(0, STYLE.bg[0]);
grad.addColorStop(0.5, STYLE.bg[1]);
grad.addColorStop(1, STYLE.bg[2]);
ctx.fillStyle = grad;
ctx.fillRect(0, 0, width, height);

const sceneFrame = frame - activeScene.startFrame;
const sceneDur = activeScene.endFrame - activeScene.startFrame;

let scale = 1;
let translateY = 0;
let rotation = 0;
let opacity = 1;

if (sceneFrame < 25) {
  scale = emilSpring(sceneFrame, 20, STYLE.spring);
  translateY = interpolate(sceneFrame, [0, 20], [80, 0]);
  rotation = interpolate(sceneFrame, [0, 20], [-0.03, 0]);
} else if (sceneFrame > sceneDur - 15) {
  const exitF = sceneFrame - (sceneDur - 15);
  translateY = interpolate(exitF, [0, 15], [0, -60]);
  scale = interpolate(exitF, [0, 15], [1, 0.94]);
  opacity = interpolate(exitF, [0, 15], [1, 0]);
} else {
  translateY = Math.sin(sceneFrame * 0.04) * 4;
}

const cardW = width * 0.88;
const cardH = height * 0.60;

ctx.save();
ctx.translate(width / 2, height / 2 + translateY);
ctx.rotate(rotation);
ctx.scale(scale, scale);
ctx.globalAlpha = opacity;

ctx.fillStyle = STYLE.cardBg;
ctx.strokeStyle = STYLE.cardBorder;
ctx.lineWidth = 4;
ctx.beginPath();
ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 36);
ctx.fill(); ctx.stroke();

// Tag Pill Badge
const tagText = activeScene.tag || "01 / CONCEPT";
ctx.strokeStyle = STYLE.accent + '66';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.roundRect(-cardW / 2 + 50 - 4, -cardH / 2 + 50 - 4, 180 + 8, 44 + 8, 26);
ctx.stroke();

ctx.fillStyle = STYLE.accent;
ctx.beginPath();
ctx.roundRect(-cardW / 2 + 50, -cardH / 2 + 50, 180, 44, 22);
ctx.fill();

ctx.fillStyle = '#ffffff';
ctx.font = '800 18px sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(tagText, -cardW / 2 + 140, -cardH / 2 + 72);

// Headline
ctx.fillStyle = STYLE.text;
ctx.font = `900 ${width * 0.055}px sans-serif`;
ctx.textAlign = 'center';
ctx.fillText(activeScene.headline, 0, -90);

// Subtext
ctx.fillStyle = STYLE.sub;
ctx.font = `500 ${width * 0.028}px sans-serif`;
ctx.fillText(activeScene.subtext, 0, -25);

ctx.restore();
ctx.restore();

fs.writeFileSync('/home/ubuntu/remotion-studio/test_f60.png', canvas.toBuffer('image/png'));
