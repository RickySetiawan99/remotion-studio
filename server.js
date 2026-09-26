const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createCanvas } = require('canvas');

const app = express();
const PORT = 3005;

app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'video/webm', limit: '200mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/renders', express.static(path.join(__dirname, 'renders')));

const API_KEY = process.env.ROUTER_API_KEY || "sk-7c2aef2c551a9489-u62smz-02ba0afd";

// MotionCraft Analytical Spring
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

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, align = 'center') {
  const words = (text || '').split(' ');
  let line = '';
  const lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  let curY = y;
  const oldAlign = ctx.textAlign;
  ctx.textAlign = align;
  for (const l of lines) {
    ctx.fillText(l, x, curY);
    curY += lineHeight;
  }
  ctx.textAlign = oldAlign;
}

// Draw Kinetic Staggered Words
function drawKineticHeadline(ctx, headline, x, y, maxWidth, sceneFrame, accentColor, fontSize = 64, fontFamily = 'sans-serif') {
  const words = (headline || '').split(' ');
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const spaceW = ctx.measureText(' ').width;
  const wordMetrics = words.map(w => ({
    text: w.replace(/\*/g, ''),
    width: ctx.measureText(w.replace(/\*/g, '')).width,
    isAccent: w.startsWith('*') || w.endsWith('*') || w.includes('*')
  }));
  const totalW = wordMetrics.reduce((sum, w) => sum + w.width, 0) + (words.length - 1) * spaceW;

  if (totalW < maxWidth) {
    let curX = x - totalW / 2;
    words.forEach((w, i) => {
      const wordDelay = i * 3;
      const wordProgress = Math.max(0, Math.min(1, (sceneFrame - wordDelay) / 7));
      const wordY = y + (1 - wordProgress) * 20;
      const cleanW = w.replace(/\*/g, '');
      const isAcc = w.includes('*') || i === words.length - 1;

      ctx.save();
      ctx.globalAlpha = wordProgress;
      ctx.fillStyle = isAcc ? accentColor : '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(cleanW, curX, wordY);
      ctx.restore();

      curX += ctx.measureText(cleanW).width + spaceW;
    });
  } else {
    drawWrappedText(ctx, headline.replace(/\*/g, ''), x, y, maxWidth, fontSize + 16, 'center');
  }
}

// 6 Expanded Dynamic Style Tokens
const STYLE_PRESETS = {
  'pi-v2-dark': {
    name: 'Pro Explainer',
    font: 'sans-serif',
    bg: ['#1e1b4b', '#0f172a', '#030712'],
    cardBg: 'rgba(15, 23, 42, 0.85)',
    cardBorder: 'rgba(99, 102, 241, 0.45)',
    text: '#ffffff',
    sub: '#94a3b8',
    accent: '#6366f1',
    accentGlow: 'rgba(99, 102, 241, 0.32)',
    accent2: '#38bdf8'
  },
  'tech-neon-soft': {
    name: 'Cyber Tech',
    font: 'monospace',
    bg: ['#042f2e', '#022c22', '#020617'],
    cardBg: 'rgba(4, 47, 46, 0.85)',
    cardBorder: 'rgba(45, 212, 191, 0.45)',
    text: '#2dd4bf',
    sub: '#99f6e4',
    accent: '#14b8a6',
    accentGlow: 'rgba(20, 184, 166, 0.32)',
    accent2: '#10b981'
  },
  'hyper-crypto': {
    name: 'Fintech Purple',
    font: 'sans-serif',
    bg: ['#3b0764', '#1e1b4b', '#030712'],
    cardBg: 'rgba(24, 9, 43, 0.85)',
    cardBorder: 'rgba(168, 85, 247, 0.45)',
    text: '#ffffff',
    sub: '#d8b4fe',
    accent: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.32)',
    accent2: '#eab308'
  },
  'sunset-creator': {
    name: 'Creator Flame',
    font: 'sans-serif',
    bg: ['#450a0a', '#1c1917', '#09090b'],
    cardBg: 'rgba(28, 25, 23, 0.85)',
    cardBorder: 'rgba(249, 115, 22, 0.45)',
    text: '#ffffff',
    sub: '#fdba74',
    accent: '#f97316',
    accentGlow: 'rgba(249, 115, 22, 0.32)',
    accent2: '#ef4444'
  },
  'warm-paper': {
    name: 'Editorial Paper',
    font: 'serif',
    bg: ['#fffbeb', '#fef3c7', '#fde68a'],
    cardBg: 'rgba(255, 255, 255, 0.92)',
    cardBorder: 'rgba(217, 119, 6, 0.35)',
    text: '#451a03',
    sub: '#78350f',
    accent: '#d97706',
    accentGlow: 'rgba(217, 119, 6, 0.22)',
    accent2: '#b45309'
  },
  'mono-editorial': {
    name: 'Minimal Mono',
    font: 'sans-serif',
    bg: ['#18181b', '#09090b', '#000000'],
    cardBg: 'rgba(24, 24, 27, 0.90)',
    cardBorder: 'rgba(255, 255, 255, 0.25)',
    text: '#f4f4f5',
    sub: '#a1a1aa',
    accent: '#e4e4e7',
    accentGlow: 'rgba(255, 255, 255, 0.15)',
    accent2: '#ffffff'
  }
};

// AUTO-CLEANUP
setInterval(() => {
  const rendersDir = path.join(__dirname, 'renders');
  if (!fs.existsSync(rendersDir)) return;
  const now = Date.now();
  fs.readdirSync(rendersDir).forEach(file => {
    const filePath = path.join(rendersDir, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 3600 * 1000) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}
  });
}, 30 * 60 * 1000);

// GALLERY ENDPOINTS
app.get('/api/renders', (req, res) => {
  const rendersDir = path.join(__dirname, 'renders');
  if (!fs.existsSync(rendersDir)) return res.json({ files: [] });
  try {
    const files = fs.readdirSync(rendersDir)
      .filter(f => f.endsWith('.mp4'))
      .map(f => {
        const stat = fs.statSync(path.join(rendersDir, f));
        return {
          filename: f,
          url: `/renders/${f}`,
          sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
          mtime: stat.mtime
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/renders/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, 'renders', filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ success: true, message: `Deleted ${filename}` });
  }
  res.status(404).json({ error: 'File not found' });
});

app.delete('/api/renders', (req, res) => {
  const rendersDir = path.join(__dirname, 'renders');
  if (!fs.existsSync(rendersDir)) return res.json({ success: true });
  fs.readdirSync(rendersDir).forEach(f => {
    if (f.endsWith('.mp4')) fs.unlinkSync(path.join(rendersDir, f));
  });
  res.json({ success: true, message: 'All renders cleared' });
});

// AI DYNAMIC ART DIRECTOR (Freedom of Canvas Geometry)
app.post('/api/generate-script', async (req, res) => {
  const { topic, duration = 60, style = "pi-v2-dark", platform = "9:16" } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  const durationSec = parseInt(duration) || 60;
  const fps = 30;
  const totalFrames = durationSec * fps;
  const numScenes = Math.max(3, Math.min(6, Math.floor(durationSec / 12)));
  const sceneDur = Math.floor(totalFrames / numScenes);

  const prompt = `System: Anda adalah Master Motion Graphics Director.
Rancang skrip video ${numScenes} scene berdurasi total ${durationSec} detik tentang topik: "${topic}".

PENTING - HINDARI SEMUA SCENE BERBENTUK GRID KOTAK!
Gunakan tipe tata letak visual bebas yang sangat variatif:
1. "hero_typography" (Teks kinetik tipografi raksasa full-screen tanpa kotak)
2. "stat_focus" (Angka statistik hero raksasa di tengah dengan aura radial menyala)
3. "cinematic_quote" (Kutipan dramatis full-bleed dengan watermark tanda petik besar)
4. "split_screen" (Layar terbelah 2 sisi dengan garis laser pemisah ❌ vs ✅)
5. "timeline_flow" (Alur vertikal sambung menyambung dengan laser path)
6. "terminal_ide" (Jendela terminal IDE khusus bahasan kode/software)
7. "kinetic_checklist" (Pil/kapsul poin mengambang dinamis dari tepi layar)

Format JSON murni tanpa markdown:
{
  "title": "Judul Kreatif Sesuai Topik",
  "scenes": [
    {
      "startFrame": 0,
      "endFrame": ${sceneDur},
      "type": "hero_typography",
      "tag": "01 / HOOK",
      "headline": "KATA KUNCI *TERTEGASKAN*",
      "subtext": "Satu kalimat penjelas tajam.",
      "metricLabel": "Persentase / Metrik",
      "metricValue": 94,
      "quoteText": "Kutipan jika type cinematic_quote",
      "quoteAuthor": "Nama Tokoh",
      "codeSnippet": "console.log('test');",
      "points": ["Poin 1", "Poin 2", "Poin 3"]
    }
  ]
}`;

  try {
    const fetchRes = await fetch('http://localhost:20128/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "my-combo",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        temperature: 0.75
      })
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      throw new Error(`9Router API Error: ${errText}`);
    }

    const aiData = await fetchRes.json();
    let text = aiData.choices?.[0]?.message?.content || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }
    const scriptJson = JSON.parse(text);

    if (scriptJson.scenes) {
      scriptJson.scenes.forEach((s, idx) => {
        s.startFrame = idx * sceneDur;
        s.endFrame = (idx === scriptJson.scenes.length - 1) ? totalFrames : (idx + 1) * sceneDur;
      });
    }

    res.json({ success: true, composition: scriptJson });
  } catch (err) {
    console.error("AI Script error:", err);
    res.status(500).json({ error: err.message });
  }
});

// MOTIONCRAFT FULL-FRAME FREE-GEOMETRY RENDER ENGINE
app.post('/api/render-edu-video', async (req, res) => {
  const { composition, style = 'pi-v2-dark' } = req.body;
  if (!composition || !composition.scenes) return res.status(400).json({ error: 'Composition data is required' });

  const durationSec = composition.durationSec || 60;
  const fps = composition.fps || 30;
  const totalFrames = durationSec * fps;
  const width = composition.width || 1080;
  const height = composition.height || 1920;

  const rendersDir = path.join(__dirname, 'renders');
  if (!fs.existsSync(rendersDir)) fs.mkdirSync(rendersDir, { recursive: true });

  const timestamp = Date.now();
  const filename = `motioncraft_free_${timestamp}.mp4`;
  const outputFile = path.join(rendersDir, filename);

  const st = STYLE_PRESETS[style] || STYLE_PRESETS['pi-v2-dark'];

  try {
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
      '-crf', '19',
      '-movflags', '+faststart',
      outputFile
    ]);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    for (let frame = 0; frame < totalFrames; frame++) {
      ctx.save();

      // Dynamic Camera Breathing & Ambient Drift
      const camZoom = 1.0 + Math.sin(frame * 0.02) * 0.016;
      const camPanX = Math.cos(frame * 0.015) * 8;
      const camPanY = Math.sin(frame * 0.015) * 8;

      ctx.translate(width / 2 + camPanX, height / 2 + camPanY);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-width / 2, -height / 2);

      // Deep Atmospheric Background
      const spotX = width * 0.5 + Math.cos(frame * 0.03) * 160;
      const spotY = height * 0.35 + Math.sin(frame * 0.03) * 160;
      const grad = ctx.createRadialGradient(spotX, spotY, 50, width/2, height/2, width * 0.95);
      grad.addColorStop(0, st.bg[0]);
      grad.addColorStop(0.6, st.bg[1]);
      grad.addColorStop(1, st.bg[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Parallax Particle Stars
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let p = 0; p < 25; p++) {
        const px = ((p * 137.5 + frame * 0.4 * (1 + (p % 3))) % width);
        const py = ((p * 229.3 + frame * 0.6 * (1 + (p % 2))) % height);
        const pSize = 1.5 + (p % 3);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Top Progress Capsule
      const totalProgress = Math.min(1, frame / totalFrames);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.roundRect(45, 45, width - 90, 8, 4);
      ctx.fill();

      ctx.fillStyle = st.accent;
      ctx.beginPath();
      ctx.roundRect(45, 45, (width - 90) * totalProgress, 8, 4);
      ctx.fill();

      // Audio Spectrum Waveform Equalizer (Bottom)
      const numBars = 28;
      const barW = (width - 120) / numBars;
      for (let b = 0; b < numBars; b++) {
        const barH = 12 + Math.abs(Math.sin(frame * 0.12 + b * 0.35) * Math.cos(frame * 0.06 + b * 0.2)) * 36;
        const bx = 60 + b * barW;
        const by = height - 60 - barH;
        ctx.fillStyle = b % 2 === 0 ? st.accent : st.accent2 || '#38bdf8';
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.roundRect(bx + 2, by, barW - 4, barH, 4);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      const activeScene = composition.scenes.find(s => frame >= s.startFrame && frame < s.endFrame) || composition.scenes[composition.scenes.length - 1];

      if (activeScene) {
        const sceneFrame = frame - activeScene.startFrame;
        const sceneDur = activeScene.endFrame - activeScene.startFrame;

        // Emil Kowalski Spring Physics Transition
        let translateY = 0;
        let opacity = 1;
        let scale = 1;

        if (sceneFrame < 22) {
          translateY = interpolate(sceneFrame, [0, 20], [80, 0]);
          opacity = interpolate(sceneFrame, [0, 15], [0, 1]);
          scale = interpolate(sceneFrame, [0, 20], [0.94, 1]);
        } else if (sceneFrame > sceneDur - 15) {
          const exitF = sceneFrame - (sceneDur - 15);
          translateY = interpolate(exitF, [0, 15], [0, -80]);
          opacity = interpolate(exitF, [0, 15], [1, 0]);
        } else {
          translateY = Math.sin(sceneFrame * 0.035) * 4;
        }

        ctx.save();
        ctx.translate(width / 2, height / 2 + translateY);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -(height / 2 + translateY));
        ctx.globalAlpha = opacity;

        const pts = (activeScene.points && activeScene.points.length > 0) ? activeScene.points : [
          "Optimasi proses otomatis",
          "Eksekusi instan berkecepatan tinggi",
          "Akurasi presisi data real-time"
        ];

        // --- FULL-FRAME DIVERSE SCENE GEOMETRIES (NO MANDATORY CARD BOX!) ---

        if (activeScene.type === 'hero_typography' || activeScene.type === 'hook') {
          // 1. Full-Screen Cinematic Typography (Pure text power, zero bounding boxes)
          const tagY = height * 0.28;
          ctx.fillStyle = st.accent;
          ctx.beginPath();
          ctx.roundRect(width / 2 - 110, tagY, 220, 48, 24);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(activeScene.tag || "01 / FOCUS", width / 2, tagY + 24);

          // Giant Hero Typography (84px font)
          drawKineticHeadline(ctx, activeScene.headline, width / 2, height * 0.44, width - 120, sceneFrame, st.accent, 84, st.font);

          // Hero Subtext (Light Glow Background Line)
          ctx.fillStyle = st.sub;
          ctx.font = `600 ${Math.round(width * 0.032)}px ${st.font}`;
          ctx.textAlign = 'center';
          drawWrappedText(ctx, activeScene.subtext || '', width / 2, height * 0.58, width - 180, 42, 'center');

          // Pulsing Floating Aura Rings around text
          ctx.strokeStyle = st.accentGlow;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(width / 2, height * 0.44, 280 + Math.sin(sceneFrame * 0.1) * 15, 0, Math.PI * 2);
          ctx.stroke();

        } else if (activeScene.type === 'stat_focus' || activeScene.type === 'stat_callout') {
          // 2. Full-Bleed Centered Hero Stat Numeral
          const countProgress = Math.min(1, sceneFrame / 26);
          const currentVal = Math.floor(countProgress * (activeScene.metricValue || 99));

          // Shockwave Rings
          for (let r = 1; r <= 3; r++) {
            ctx.strokeStyle = st.accentGlow;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(width / 2, height * 0.44, 110 * r + (sceneFrame * 2) % 60, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Giant Hero Number
          ctx.fillStyle = st.accent;
          ctx.font = `bold 160px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${currentVal}%`, width / 2, height * 0.44);

          // Label Pill
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.roundRect(width / 2 - 200, height * 0.57, 400, 52, 26);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(activeScene.metricLabel || 'Tingkat Pertumbuhan', width / 2, height * 0.57 + 26);

          // Sub headline
          ctx.fillStyle = st.sub;
          ctx.font = '600 22px sans-serif';
          ctx.fillText(activeScene.headline.replace(/\*/g, ''), width / 2, height * 0.68);

        } else if (activeScene.type === 'cinematic_quote' || activeScene.type === 'giant_quote') {
          // 3. Cinematic Full-Bleed Editorial Quote
          ctx.fillStyle = st.accentGlow;
          ctx.font = 'bold 320px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('“', width / 2, height * 0.38);

          // Quote Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'italic 600 38px serif';
          const quoteBody = activeScene.quoteText || activeScene.subtext || pts[0];
          drawWrappedText(ctx, `"${quoteBody}"`, width / 2, height * 0.46, width - 180, 56, 'center');

          // Floating Author Pill
          ctx.fillStyle = st.accent;
          ctx.beginPath();
          ctx.roundRect(width / 2 - 160, height * 0.68, 320, 50, 25);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`— ${activeScene.quoteAuthor || 'Refleksi Kunci'}`, width / 2, height * 0.68 + 25);

        } else if (activeScene.type === 'split_screen' || activeScene.type === 'comparison_split') {
          // 4. Full-Screen Dual Split (Top / Bottom or Left / Right)
          const splitY = height * 0.25;
          const halfH = height * 0.32;
          const halfW = width - 120;

          // Top Half (Traditional / Red)
          ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(60, splitY, halfW, halfH, 24);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('❌ CARA LAMA / MITOS', width / 2, splitY + 50);

          ctx.fillStyle = '#ffffff';
          ctx.font = '600 24px sans-serif';
          drawWrappedText(ctx, pts[0] || "Proses manual yang lambat & rentan eror", width / 2, splitY + 110, halfW - 60, 36, 'center');

          // Bottom Half (Modern / Green)
          const botY = splitY + halfH + 30;
          ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(60, botY, halfW, halfH, 24);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✅ CARA BARU / FAKTA', width / 2, botY + 50);

          ctx.fillStyle = '#ffffff';
          ctx.font = '600 24px sans-serif';
          drawWrappedText(ctx, pts[1] || "Automasi instan presisi tinggi berbasis AI", width / 2, botY + 110, halfW - 60, 36, 'center');

        } else if (activeScene.type === 'timeline_flow' || activeScene.type === 'step_flow') {
          // 5. Full-Height Vertical Connecting Pipeline
          const steps = pts.length >= 3 ? pts.slice(0, 3) : [...pts, "Hasil Optimal"].slice(0, 3);
          const startY = height * 0.28;
          const gapY = 170;

          // Vertical Laser Beam
          const beamProgress = Math.min(1, sceneFrame / 24);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(140, startY);
          ctx.lineTo(140, startY + (steps.length - 1) * gapY);
          ctx.stroke();

          ctx.strokeStyle = st.accent;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(140, startY);
          ctx.lineTo(140, startY + ((steps.length - 1) * gapY) * beamProgress);
          ctx.stroke();

          steps.forEach((stText, idx) => {
            const stepY = startY + idx * gapY;
            const isAct = sceneFrame > idx * 8;

            ctx.fillStyle = isAct ? st.accent : '#334155';
            ctx.beginPath();
            ctx.arc(140, stepY, 32, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`0${idx+1}`, 140, stepY);

            // Text capsule
            ctx.fillStyle = isAct ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.7)';
            ctx.strokeStyle = isAct ? st.accent : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(200, stepY - 45, width - 260, 90, 20);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(stText, 230, stepY);
          });

        } else if (activeScene.type === 'terminal_ide') {
          // 6. Floating macOS IDE Terminal Window
          const termX = 60;
          const termY = height * 0.26;
          const termW = width - 120;
          const termH = height * 0.48;

          ctx.fillStyle = '#090d16';
          ctx.strokeStyle = 'rgba(255,255,255,0.18)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(termX, termY, termW, termH, 24);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(termX, termY, termW, 50, [24, 24, 0, 0]);
          ctx.fill();

          ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(termX + 30, termY + 25, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.arc(termX + 54, termY + 25, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(termX + 78, termY + 25, 7, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 15px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('engine.terminal.sh', termX + termW / 2, termY + 25);

          const codeSnippet = activeScene.codeSnippet || `// Auto-Execute AI Pipeline\nconst result = await agent.runWorkflow();\nconsole.log("Status: 100% Verified");`;
          const codeLines = codeSnippet.split('\n');
          
          codeLines.forEach((cl, idx) => {
            const lineY = termY + 95 + idx * 44;
            ctx.fillStyle = '#475569';
            ctx.font = '18px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`0${idx+1}`, termX + 30, lineY);

            ctx.fillStyle = idx === 0 ? '#38bdf8' : (idx === 1 ? '#a855f7' : '#22c55e');
            ctx.fillText(cl, termX + 75, lineY);
          });

        } else {
          // 7. Staggered Kinetic Floating Capsules
          const startY = height * 0.28;
          pts.slice(0, 4).forEach((pt, idx) => {
            const rowY = startY + idx * 115;
            const slideProgress = Math.min(1, Math.max(0, (sceneFrame - idx * 6) / 10));
            const rowX = 60 + (1 - slideProgress) * 60;

            ctx.save();
            ctx.globalAlpha = slideProgress;
            ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
            ctx.strokeStyle = st.accent;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(rowX, rowY, width - 120, 85, 20);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = st.accent;
            ctx.beginPath();
            ctx.arc(rowX + 50, rowY + 42, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', rowX + 50, rowY + 42);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(pt, rowX + 95, rowY + 42);
            ctx.restore();
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
    await new Promise(r => ffmpeg.on('close', r));

    const stat = fs.statSync(outputFile);
    res.json({
      success: true,
      filename,
      url: `/renders/${filename}`,
      sizeMB: (stat.size / (1024 * 1024)).toFixed(2)
    });
  } catch (err) {
    console.error("Render error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Remotion Studio running on port ${PORT}`);
});
