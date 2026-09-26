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

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = (text || '').split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}

const STYLE = {
  bg: ['#1e1b4b', '#0f172a', '#030712'],
  cardBg: '#0f172a',
  cardBorder: '#6366f1',
  text: '#ffffff',
  sub: '#94a3b8',
  accent: '#6366f1',
  spring: { mass: 0.7, stiffness: 140, damping: 11 }
};

const composition = {
  durationInFrames: 1800, // 60s @ 30 FPS
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
    },
    {
      startFrame: 360,
      endFrame: 720,
      type: "step_flow",
      tag: "02 / 3 TAHAP UTAMA",
      headline: "PIPELINE TRANSFORMER",
      subtext: "Dari input mentah menjadi penalaran bahasa",
      metricLabel: "Attention Matrix",
      metricValue: 98,
      points: ["1. Tokenize", "2. Self-Attention", "3. Next-Token Output"]
    },
    {
      startFrame: 720,
      endFrame: 1080,
      type: "comparison_split",
      tag: "03 / PERBANDINGAN",
      headline: "RULE-BASED VS LLM",
      subtext: "Evolusi kecerdasan buatan dalam memproses konteks",
      metricLabel: "Adaptasi Konteks",
      metricValue: 94,
      points: ["Kaku & Rule Manual", "Pemahaman Semantik Fleksibel"]
    },
    {
      startFrame: 1080,
      endFrame: 1440,
      type: "metric_chart",
      tag: "04 / EFISIENSI DATA",
      headline: "CONTEXT WINDOW",
      subtext: "Kapasitas memori mengingat hingga 1 Juta Token",
      metricLabel: "Context Retention",
      metricValue: 99,
      points: ["1M+ Token Active Memory", "Real-Time Inference Speed"]
    },
    {
      startFrame: 1440,
      endFrame: 1800,
      type: "checklist_summary",
      tag: "05 / KESIMPULAN",
      headline: "KEY TAKEAWAYS",
      subtext: "3 Hal penting yang wajib dipahami praktisi",
      metricLabel: "Summary",
      metricValue: 100,
      points: ["AI adalah probabilitas kata", "Kunci ada di Prompt & Konteks", "Tingkatkan produktivitas kerja"]
    }
  ]
};

async function renderVideo() {
  const outDir = path.join(__dirname, 'renders');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outputFile = path.join(outDir, 'edu_transformer_ai_60s.mp4');

  const width = composition.width;
  const height = composition.height;
  const fps = composition.fps;
  const totalFrames = composition.durationInFrames;

  console.log(`Starting High-Dynamic Stream Render: ${totalFrames} frames (60s) -> ${outputFile}`);

  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', `${fps}`,
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'main',
    '-preset', 'ultrafast',
    '-crf', '20',
    '-movflags', '+faststart',
    outputFile
  ]);

  ffmpeg.stderr.on('data', () => {});
  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg completed with exit code ${code}`);
  });

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (let frame = 0; frame < totalFrames; frame++) {
    ctx.save();

    // Deep Dark Navy Radial Background
    const pulseRadius = width * 0.8 + Math.sin(frame * 0.05) * 80;
    const grad = ctx.createRadialGradient(width/2, height/2, 80, width/2, height/2, pulseRadius);
    grad.addColorStop(0, STYLE.bg[0]);
    grad.addColorStop(0.5, STYLE.bg[1]);
    grad.addColorStop(1, STYLE.bg[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Floating Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridOffset = (frame * 0.5) % 60;
    for (let x = -60; x < width + 60; x += 60) {
      ctx.beginPath(); ctx.moveTo(x + gridOffset, 0); ctx.lineTo(x + gridOffset, height); ctx.stroke();
    }
    for (let y = -60; y < height + 60; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y + gridOffset); ctx.lineTo(width, y + gridOffset); ctx.stroke();
    }

    // Top Progress Line
    const totalProgress = Math.min(1, frame / totalFrames);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(60, 60, width - 120, 10, 5);
    ctx.fill();

    ctx.fillStyle = STYLE.accent;
    ctx.beginPath();
    ctx.roundRect(60, 60, (width - 120) * totalProgress, 10, 5);
    ctx.fill();

    const activeScene = composition.scenes.find(s => frame >= s.startFrame && frame < s.endFrame) || composition.scenes[composition.scenes.length - 1];

    if (activeScene) {
      const sceneFrame = frame - activeScene.startFrame;
      const sceneDur = activeScene.endFrame - activeScene.startFrame;

      let translateY = 0;
      let opacity = 1;

      if (sceneFrame < 25) {
        translateY = interpolate(sceneFrame, [0, 20], [120, 0]);
      } else if (sceneFrame > sceneDur - 15) {
        const exitF = sceneFrame - (sceneDur - 15);
        translateY = interpolate(exitF, [0, 15], [0, -100]);
        opacity = interpolate(exitF, [0, 15], [1, 0]);
      } else {
        translateY = Math.sin(sceneFrame * 0.04) * 6;
      }

      const cardX = 60;
      const cardY = 360 + translateY;
      const cardW = width - 120;
      const cardH = 1200;

      ctx.save();
      ctx.globalAlpha = opacity;

      // Card Base
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = STYLE.accent;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 40);
      ctx.fill(); ctx.stroke();

      // Tag Pill Badge
      ctx.fillStyle = STYLE.accent;
      ctx.beginPath();
      ctx.roundRect(cardX + 50, cardY + 50, 220, 50, 25);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activeScene.tag || '01 / HOOK', cardX + 160, cardY + 75);

      // Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(activeScene.headline, width / 2, cardY + 200);

      // Subtext
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 30px sans-serif';
      ctx.fillText(activeScene.subtext, width / 2, cardY + 280);

      const pts = activeScene.points || [];

      if (activeScene.type === 'step_flow') {
        const stepW = (cardW - 100) / Math.max(1, pts.length);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cardX + 80, cardY + 650);
        ctx.lineTo(cardX + cardW - 80, cardY + 650);
        ctx.stroke();

        const laserProgress = (sceneFrame * 0.03) % 1;
        const laserX = cardX + 80 + laserProgress * (cardW - 160);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(laserX, cardY + 650, 10, 0, Math.PI * 2);
        ctx.fill();

        pts.forEach((pt, idx) => {
          const stepX = cardX + 50 + idx * stepW;
          const ptDelay = idx * 12;
          const isAct = sceneFrame > ptDelay + 10;

          ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
          ctx.strokeStyle = isAct ? STYLE.accent : 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(stepX + 10, cardY + 500, stepW - 20, 300, 24);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = STYLE.accent;
          ctx.beginPath();
          ctx.arc(stepX + stepW / 2, cardY + 560, 28, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`0${idx+1}`, stepX + stepW / 2, cardY + 560);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          drawWrappedText(ctx, pt, stepX + stepW / 2, cardY + 650, stepW - 40, 28);
        });
      } else if (activeScene.type === 'comparison_split') {
        const boxW = (cardW - 140) / 2;
        pts.slice(0, 2).forEach((pt, idx) => {
          const boxX = idx === 0 ? cardX + 50 : cardX + cardW / 2 + 20;
          const isTarget = idx === 1;

          ctx.fillStyle = isTarget ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
          ctx.strokeStyle = isTarget ? '#22c55e' : '#ef4444';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(boxX, cardY + 450, boxW, 400, 28);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = isTarget ? '#22c55e' : '#ef4444';
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(isTarget ? '✅ MODERN AI' : '❌ TRADISIONAL', boxX + boxW / 2, cardY + 530);

          ctx.fillStyle = '#ffffff';
          ctx.font = '600 26px sans-serif';
          drawWrappedText(ctx, pt, boxX + boxW / 2, cardY + 640, boxW - 40, 36);
        });
      } else if (activeScene.type === 'metric_chart') {
        const countProgress = Math.min(1, sceneFrame / 35);
        const currentVal = Math.floor(countProgress * (activeScene.metricValue || 99));

        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.strokeStyle = STYLE.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(width / 2 - 250, cardY + 450, 500, 180, 24);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = STYLE.accent;
        ctx.font = 'bold 76px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentVal}%`, width / 2, cardY + 560);

        pts.forEach((pt, idx) => {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 30px sans-serif';
          ctx.fillText(`• ${pt}`, width / 2, cardY + 700 + idx * 60);
        });
      } else if (activeScene.type === 'checklist_summary') {
        pts.forEach((pt, idx) => {
          const rowY = cardY + 440 + idx * 120;
          const checkDelay = idx * 10;
          const isCheck = sceneFrame > checkDelay;

          ctx.fillStyle = isCheck ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)';
          ctx.strokeStyle = isCheck ? '#22c55e' : 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(cardX + 60, rowY, cardW - 120, 90, 20);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = isCheck ? '#22c55e' : '#64748b';
          ctx.beginPath();
          ctx.arc(cardX + 120, rowY + 45, 25, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(isCheck ? '✓' : '•', cardX + 120, rowY + 45);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 30px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(pt, cardX + 170, rowY + 45);
        });
      } else {
        const countProgress = Math.min(1, sceneFrame / 30);
        const currentNum = Math.floor(countProgress * (activeScene.metricValue || 15));

        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.strokeStyle = STYLE.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(width / 2 - 250, cardY + 450, 500, 180, 24);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = STYLE.accent;
        ctx.font = 'bold 76px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`+${currentNum}T Tokens`, width / 2, cardY + 560);

        pts.forEach((pt, idx) => {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 30px sans-serif';
          ctx.fillText(`• ${pt}`, width / 2, cardY + 700 + idx * 60);
        });
      }

      ctx.restore();
    }

    ctx.restore();

    const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.90 });
    const canWrite = ffmpeg.stdin.write(jpegBuffer);
    if (!canWrite) await new Promise(r => ffmpeg.stdin.once('drain', r));
  }

  ffmpeg.stdin.end();
}

renderVideo().catch(err => console.error("Render failed:", err));
