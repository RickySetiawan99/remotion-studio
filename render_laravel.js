const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FPS = 30;
const DURATION = 20; // seconds
const TOTAL_FRAMES = FPS * DURATION;
const W = 1080;
const H = 1920;

const scenes = [
  { start: 0, end: 90, tag: "HOOK", headline: "LARAVEL", subtext: "The PHP Framework for Web Artisans", accent: "#ff2d20", countVal: 13 },
  { start: 90, end: 180, tag: "ELOQUENT", headline: "ORM MAGIC", subtext: "Active Record that just makes sense", accent: "#f97316", countVal: 50 },
  { start: 180, end: 270, tag: "BLADE", headline: "TEMPLATING", subtext: "Elegant syntax, zero overhead", accent: "#eab308", countVal: 100 },
  { start: 270, end: 360, tag: "ARTISAN", headline: "CLI POWER", subtext: "Generate anything with one command", accent: "#22c55e", countVal: 200 },
  { start: 360, end: 450, tag: "ECOSYSTEM", headline: "LIVEWIRE", subtext: "Full-stack reactivity without JavaScript", accent: "#3b82f6", countVal: 350 },
  { start: 450, end: 540, tag: "SCALE", headline: "QUEUE & JOBS", subtext: "Background processing at any scale", accent: "#8b5cf6", countVal: 500 },
  { start: 540, end: 600, tag: "2026", headline: "LARAVEL 13", subtext: "The future is here. Build faster.", accent: "#ff2d20", countVal: 2026 }
];

function spring(frame, fps = 30) {
  const t = Math.max(0, frame) / fps;
  return 1 - Math.exp(-7 * t) * Math.cos(14 * t);
}

function interpolate(frame, inRange, outRange) {
  const [inMin, inMax] = inRange;
  const [outMin, outMax] = outRange;
  if (frame <= inMin) return outMin;
  if (frame >= inMax) return outMax;
  return outMin + ((frame - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFrame(ctx, frame) {
  // BG
  const grad = ctx.createRadialGradient(W/2, H/2, 80, W/2, H/2, W*0.9);
  grad.addColorStop(0, '#1e1b4b');
  grad.addColorStop(0.5, '#0f172a');
  grad.addColorStop(1, '#030712');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Particles
  for (let i = 0; i < 20; i++) {
    const pX = (Math.sin(i * 99 + frame * 0.02) * 0.5 + 0.5) * W;
    const pY = ((i * 80 + frame * 1.5) % H);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 45, 32, 0.25)' : 'rgba(99, 102, 241, 0.25)';
    ctx.beginPath(); ctx.arc(pX, pY, 4, 0, Math.PI * 2); ctx.fill();
  }

  const scene = scenes.find(s => frame >= s.start && frame < s.end) || scenes[scenes.length - 1];
  const sf = frame - scene.start;
  const scale = spring(sf, 20);
  const translateY = interpolate(sf, [0, 15], [60, 0]);

  const cardW = W * 0.88;
  const cardH = H * 0.52;

  ctx.save();
  ctx.translate(W / 2, H / 2 + translateY);
  ctx.scale(scale, scale);

  // Card BG
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 4;
  roundRect(ctx, -cardW/2, -cardH/2, cardW, cardH, 36);
  ctx.fill();
  ctx.stroke();

  // Tag Badge
  roundRect(ctx, -cardW/2 + 50, -cardH/2 + 50, 180, 44, 22);
  ctx.fillStyle = scene.accent;
  ctx.fill();

  ctx.fillStyle = '#030712';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(scene.tag, -cardW/2 + 140, -cardH/2 + 72);

  // Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  let headText = scene.headline;
  const charCount = Math.floor(interpolate(sf, [0, 15], [0, headText.length]));
  headText = headText.substring(0, charCount);
  ctx.fillText(headText, 0, -50);

  // Subtext
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 32px sans-serif';
  ctx.fillText(scene.subtext, 0, 30);

  // Counter box
  const countProgress = Math.min(1, sf / 25);
  const currentNum = Math.floor(countProgress * (scene.countVal || 100));
  roundRect(ctx, -160, cardH/2 - 140, 320, 80, 20);
  ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
  ctx.fill();

  ctx.fillStyle = scene.accent;
  ctx.font = 'bold 42px monospace';
  ctx.fillText('+' + currentNum, 0, cardH/2 - 100);

  // Frequency bars
  const bars = 14;
  const barW = 8;
  const gap = 10;
  const totalBarsW = bars * (barW + gap);
  ctx.fillStyle = scene.accent;
  for (let b = 0; b < bars; b++) {
    const hVal = Math.abs(Math.sin(frame * 0.15 + b * 0.5)) * 36 + 8;
    ctx.fillRect(-totalBarsW/2 + b * (barW + gap), cardH/2 - 50 - hVal/2, barW, hVal);
  }

  ctx.restore();
}

console.log(`Rendering ${TOTAL_FRAMES} frames...`);

const tmpDir = path.join(__dirname, 'renders', 'tmp_laravel_render');
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

for (let f = 0; f < TOTAL_FRAMES; f++) {
  drawFrame(ctx, f);
  const buf = canvas.toBuffer('image/png');
  const framePath = path.join(tmpDir, `frame_${String(f).padStart(5, '0')}.png`);
  fs.writeFileSync(framePath, buf);
}

console.log('Frames generated. Encoding MP4 with faststart...');

const outFile = path.join(__dirname, 'renders', 'laravel_framework_20s.mp4');
const cmd = `ffmpeg -y -framerate 30 -i "${tmpDir}/frame_%05d.png" -c:v libx264 -preset fast -pix_fmt yuv420p -profile:v main -level 4.0 -movflags +faststart "${outFile}"`;
execSync(cmd, { stdio: 'inherit' });

fs.rmSync(tmpDir, { recursive: true });

const stats = fs.statSync(outFile);
console.log('✅ RENDER SUCCESS: ' + outFile + ' (' + (stats.size / (1024*1024)).toFixed(2) + ' MB)');
