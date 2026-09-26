
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { spawn } = require('child_process');

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
  cardBorder: 'rgba(255, 255, 255, 0.2)',
  text: '#ffffff',
  sub: '#94a3b8',
  accent: '#6366f1',
  spring: { mass: 0.7, stiffness: 140, damping: 11 }
};

const composition = {
  durationInFrames: 300, // 10s test
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      startFrame: 0,
      endFrame: 300,
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

async function renderTest() {
  const outFile = '/home/ubuntu/remotion-studio/renders/test_visible_10s.mp4';
  const width = 1080;
  const height = 1920;

  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', `${width}x${height}`,
    '-pix_fmt', 'bgra', // Cairo raw buffer is BGRA!
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'main',
    '-preset', 'ultrafast',
    '-movflags', '+faststart',
    outFile
  ]);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (let frame = 0; frame < 300; frame++) {
    ctx.save();
    
    // Fill deep dark blue bg
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw active card
    const scale = emilSpring(frame, 30, STYLE.spring);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(-400, -500, 800, 1000, 40);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BAGAIMANA AI BERPIKIR?', 0, -200);

    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 70px monospace';
    ctx.fillText(`FRAME ${frame}`, 0, 0);

    ctx.restore();
    ctx.restore();

    const buf = canvas.toBuffer('raw');
    const ok = ffmpeg.stdin.write(buf);
    if (!ok) await new Promise(r => ffmpeg.stdin.once('drain', r));
  }

  ffmpeg.stdin.end();
  await new Promise(r => ffmpeg.on('close', r));
  console.log('Finished test_visible_10s.mp4');
}

renderTest();
