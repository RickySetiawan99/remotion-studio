
const { createCanvas } = require('canvas');
const fs = require('fs');

function emilSpring(frame, fps = 30, params = { mass: 0.7, stiffness: 140, damping: 11 }) {
  const t = Math.max(0, frame) / fps;
  const w0 = Math.sqrt(params.stiffness / params.mass);
  const zeta = params.damping / (2 * Math.sqrt(params.stiffness * params.mass));
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
}

const canvas = createCanvas(1080, 1920);
const ctx = canvas.getContext('2d');

const frame = 100;
const sceneFrame = 100;
const st = {
  bg: ['#1e1b4b', '#0f172a', '#030712'],
  cardBg: 'rgba(15, 23, 42, 0.92)',
  cardBorder: 'rgba(255, 255, 255, 0.15)',
  text: '#ffffff',
  sub: '#94a3b8',
  accent: '#6366f1',
  spring: { mass: 0.7, stiffness: 140, damping: 11 }
};

const w = 1080;
const h = 1920;

// Draw bg
const grad = ctx.createRadialGradient(w/2, h/2, 80, w/2, h/2, w*0.8);
grad.addColorStop(0, st.bg[0]);
grad.addColorStop(0.5, st.bg[1]);
grad.addColorStop(1, st.bg[2]);
ctx.fillStyle = grad;
ctx.fillRect(0, 0, w, h);

const scale = emilSpring(sceneFrame, 20, st.spring);
console.log('Scale at frame 100:', scale);

const cardW = w * 0.88;
const cardH = h * 0.60;

ctx.save();
ctx.translate(w / 2, h / 2);
ctx.scale(scale, scale);

ctx.fillStyle = st.cardBg;
ctx.strokeStyle = st.cardBorder;
ctx.lineWidth = 4;
ctx.beginPath();
ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 36);
ctx.fill(); ctx.stroke();

// White test text
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 60px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('TESTING TEXT', 0, 0);

ctx.restore();

const buf = canvas.toBuffer('image/png');
fs.writeFileSync('/home/ubuntu/remotion-studio/debug_frame_100.png', buf);
console.log('Saved debug_frame_100.png, length:', buf.length);
