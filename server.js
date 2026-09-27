const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const busboy = require('busboy');

const app = express();
const PORT = 3005;

// COMPOSE INDEX.HTML FROM SECTIONS
function composeIndexHtml() {
  const secDir = path.join(__dirname, 'public', 'sections');
  if (!fs.existsSync(secDir)) return;
  try {
    const head = fs.readFileSync(path.join(secDir, 'head.html'), 'utf8');
    const header = fs.readFileSync(path.join(secDir, 'header.html'), 'utf8');
    const workbench = fs.readFileSync(path.join(secDir, 'workbench.html'), 'utf8');
    const preview = fs.readFileSync(path.join(secDir, 'preview-timeline.html'), 'utf8');
    const modals = fs.readFileSync(path.join(secDir, 'modals.html'), 'utf8');
    const foot = fs.readFileSync(path.join(secDir, 'foot.html'), 'utf8');

    const assembled = [
      head,
      '',
      '  <!-- ======================================================== -->',
      '  <!-- SECTION 1: HEADER                                        -->',
      '  <!-- ======================================================== -->',
      header,
      '',
      '  <!-- ======================================================== -->',
      '  <!-- SECTION 2: WORKSPACE (WORKBENCH + PREVIEW & TIMELINE)    -->',
      '  <!-- ======================================================== -->',
      '  <div class="flex-1 flex flex-col md:flex-row min-h-0 md:overflow-hidden relative">',
      workbench,
      preview,
      '  </div>',
      '',
      '  <!-- ======================================================== -->',
      '  <!-- SECTION 3: ALL STUDIO MODALS                             -->',
      '  <!-- ======================================================== -->',
      modals,
      '',
      '  <!-- ======================================================== -->',
      '  <!-- SECTION 4: STUDIO SCRIPTS                                -->',
      '  <!-- ======================================================== -->',
      foot
    ].join('\n');
    fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), assembled, 'utf8');
  } catch (e) {
    console.warn('Auto-compose index.html notice:', e.message);
  }
}
composeIndexHtml();

app.get('/', (req, res) => {
  composeIndexHtml();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/renders', express.static(path.join(__dirname, 'renders')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const API_KEY = process.env.ROUTER_API_KEY || "sk-7c2aef2c551a9489-u62smz-02ba0afd";

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

// ASSET UPLOAD ENDPOINT — POST /api/upload-asset
// Accepts: .png, .jpg, .jpeg, .webp, .gif, .mp3, .wav (max 50MB)
// Returns: { success: true, url: '/uploads/<filename>', filename, size }
app.post('/api/upload-asset', (req, res) => {
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp3', '.wav']);
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB

  let bb;
  try {
    bb = busboy({ headers: req.headers, limits: { fileSize: MAX_SIZE } });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid multipart request' });
  }

  let saved = false;
  bb.on('file', (fieldname, stream, info) => {
    const ext = path.extname(info.filename || '').toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      stream.resume();
      return res.status(400).json({ error: `File type ${ext} not allowed` });
    }
    const safeName = Date.now() + '_' + path.basename(info.filename || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    const destPath = path.join(uploadsDir, safeName);
    const ws = fs.createWriteStream(destPath);
    let size = 0;
    stream.on('data', chunk => { size += chunk.length; });
    stream.on('limit', () => {
      ws.destroy();
      fs.unlink(destPath, () => {});
      if (!res.headersSent) res.status(413).json({ error: 'File exceeds 50MB limit' });
    });
    stream.pipe(ws);
    ws.on('finish', () => {
      saved = true;
      if (!res.headersSent) res.json({ success: true, url: `/uploads/${safeName}`, filename: safeName, size });
    });
    ws.on('error', err => {
      if (!res.headersSent) res.status(500).json({ error: err.message });
    });
  });
  bb.on('error', err => {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });
  bb.on('finish', () => {
    if (!saved && !res.headersSent) res.status(400).json({ error: 'No file uploaded' });
  });
  req.pipe(bb);
});



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

const STYLE_TO_MUSIC = {
  'remotion-light': 'tech-bright',
  'pi-v2-dark': 'calm-punch',
  'tech-neon-soft': 'tech-bright',
  'hyper-crypto': 'tech-bright',
  'sunset-creator': 'warm-major',
  'warm-paper': 'dreamy',
  'mono-editorial': 'dark-minimal'
};

// DYNAMIC COMPOSITION SCRIPT GENERATOR (Directly adapts to user topic with vibrant multi-element visual scenes)
function generateDynamicScript(rawTopic, durationSec) {
  const text = (rawTopic || "Untitled Video").trim();
  const fps = 30;
  const totalFrames = durationSec * fps;

  // Split user text by newlines to detect if user pasted outline / points
  const rawLines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  let title = rawLines[0] ? rawLines[0].replace(/^(judul|title|topik)\s*:\s*/i, '') : text;
  if (title.length > 50) title = title.slice(0, 47) + '...';

  const words = text.split(/\s+/);
  const highlightWord = words.length > 2 ? `*${words[words.length - 1]}*` : `*${text}*`;
  const leadWords = words.slice(0, Math.max(1, words.length - 1)).join(' ');

  // 5-Stage Storyboard: Vibrant Intro + Split VS + Metric Shockwave + Checklist + Outro CTA
  const sceneItems = [
    {
      tag: "⚡ 01 / HOOK UTAMA",
      headline: `${leadWords} ${highlightWord}`.trim(),
      subtext: `Fakta krusial yang mengubah cara pandangmu seputar ${text}.`,
      doodle: "arrow",
      badges: ["🔥 TRENDING 2026", "⚡ 30 DETIK", "💡 INSIGHT BARU"]
    },
    {
      tag: "02 / MASALAH VS SOLUSI",
      headline: "Cara Lama vs *Pendekatan Baru*",
      subtext: "Tinggalkan metode konvensional yang memakan waktu dan biaya berlebih.",
      leftTitle: "Cara Lama",
      itemsBad: ["Proses Manual & Lambat", "Biaya Operasional Membengkak", "Rentan Kesalahan Input"],
      rightTitle: "Solusi Cerdas",
      itemsGood: ["Otomatisasi 1-Klik", "Efisiensi Meningkat Pesat", "Hasil Terukur & Presisi"]
    },
    {
      tag: "03 / DATA BUKTI",
      headline: "Dampak Efisiensi *Terukur*",
      subtext: "Performa nyata yang dirasakan setelah mengadopsi sistem modern.",
      metricValue: 88,
      metricLabel: "Peningkatan Kecepatan & Produktivitas"
    },
    {
      tag: "04 / LANGKAH KUNCI",
      headline: "3 Pilar *Eksekusi Cepat*",
      subtext: "Fokus pada langkah praktis yang memberikan hasil paling maksimal.",
      points: [
        `Validasi Kebutuhan ${words.slice(0, 2).join(' ') || 'Utama'}`,
        "Otomatisasi Alur Kerja Berulang",
        "Evaluasi & Skala Pertumbuhan"
      ]
    },
    {
      tag: "05 / AKSI NYATA",
      headline: "Mulai Sekarang & *Buktikan!*",
      subtext: "Ambil langkah awal hari ini dan jadilah yang terdepan.",
      ctaText: "Mulai Sekarang Juga!",
      badges: ["100% Praktis", "Simpan Video Ini", "Share ke Teman"]
    }
  ];

  const numScenes = sceneItems.length;
  const sceneDur = Math.floor(totalFrames / numScenes);

  const scenes = sceneItems.map((item, idx) => ({
    ...item,
    startFrame: idx * sceneDur,
    endFrame: (idx === numScenes - 1) ? totalFrames : (idx + 1) * sceneDur,
    durationFrames: sceneDur
  }));

  return { title, durationSec, fps, scenes };
}

// AI DYNAMIC ART DIRECTOR (Freedom of Canvas Geometry)
app.post('/api/generate-script', async (req, res) => {
  const { topic, duration = 60, style = "pi-v2-dark", platform = "9:16", apiKey, apiBase, model } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  const durationSec = parseInt(duration) || 60;
  const fps = 30;
  const totalFrames = durationSec * fps;
  const numScenes = Math.max(3, Math.min(6, Math.floor(durationSec / 12)));
  const sceneDur = Math.floor(totalFrames / numScenes);

  const effectiveKey = apiKey || process.env.OPENAI_API_KEY || process.env.ROUTER_API_KEY || API_KEY;
  const effectiveBase = apiBase || process.env.OPENAI_API_BASE || process.env.AI_BASE_URL;

  // If an external LLM endpoint is explicitly provided or configured
  if (effectiveBase && effectiveBase.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const prompt = `System: Anda adalah Master Motion Graphics Director.
Rancang skrip video ${numScenes} scene berdurasi total ${durationSec} detik tentang topik: "${topic}".
Format JSON murni:
{
  "title": "Judul Singkat",
  "scenes": [
    {
      "startFrame": 0,
      "endFrame": ${sceneDur},
      "type": "hero_typography",
      "tag": "01 / HOOK",
      "headline": "KATA KUNCI *TERTEGASKAN*",
      "subtext": "Satu kalimat penjelas tajam.",
      "metricLabel": "Persentase",
      "metricValue": 94,
      "points": ["Poin 1", "Poin 2", "Poin 3"]
    }
  ]
}`;

      const fetchRes = await fetch(`${effectiveBase.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveKey}`
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (fetchRes.ok) {
        const aiData = await fetchRes.json();
        let text = aiData.choices?.[0]?.message?.content || "";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          text = text.slice(jsonStart, jsonEnd + 1);
        }
        const scriptJson = JSON.parse(text);
        if (scriptJson.scenes && scriptJson.scenes.length > 0) {
          scriptJson.scenes.forEach((s, idx) => {
            s.startFrame = idx * sceneDur;
            s.endFrame = (idx === scriptJson.scenes.length - 1) ? totalFrames : (idx + 1) * sceneDur;
          });
          return res.json({ success: true, composition: scriptJson, source: "external_ai" });
        }
      }
    } catch (e) {
      console.warn("External AI call failed, falling back to MotionCraft Director:", e.message);
    }
  }

  // Dynamic fallback generator (Directly adapts to user prompt/outline)
  const scriptJson = generateDynamicScript(topic, durationSec);
  res.json({ success: true, composition: scriptJson, source: "dynamic_generator" });
});

// PREVIEW PROCEDURAL AUDIO WITH SYNCED SFX
app.all('/api/preview-audio', async (req, res) => {
  const isPost = req.method === 'POST';
  const data = isPost ? (req.body || {}) : req.query;
  const style = data.style || 'pi-v2-dark';
  let composition = null;
  if (data.composition) {
    try {
      composition = typeof data.composition === 'string' ? JSON.parse(data.composition) : data.composition;
    } catch (e) {
      console.warn('Composition parse warning in preview-audio:', e.message);
    }
  }

  const durSec = Math.min(120, Math.max(3, parseInt(data.duration || (composition && composition.durationSec)) || 12));
  try {
    const M = await import('./lib/music.mjs');
    const D = await import('./lib/dsp.mjs');
    const S = await import('./lib/sfx.mjs');
    const preset = STYLE_TO_MUSIC[style] || 'calm-punch';
    const spec = M.resolveSpec({ preset, duration: durSec });
    const r = M.renderMusic(spec);

    let cues = [];
    if (composition && composition.scenes && composition.scenes.length > 0) {
      cues = S.generateAutoSfxCues(composition, composition.fps || 30);
    } else {
      cues = [
        { type: 'impact', t: 0.1, gain: 0 },
        { type: 'whoosh_in', t: 0.15, gain: -1 },
        { type: 'logo_sting', t: 0.6, gain: 4 },
        { type: 'type', t: 1.4, gain: 4 },
        { type: 'type', t: 1.7, gain: 4 },
        { type: 'word_pop', t: 2.1, gain: 3 },
        { type: 'bubble', t: 2.8, gain: 3 },
        { type: 'slot_tick', t: 3.5, gain: 3 },
        { type: 'button', t: 4.2, gain: 3 },
        { type: 'success', t: 5.0, gain: 4 }
      ];
    }

    const sfxRes = S.renderSfx(cues, durSec, {
      bpm: spec.bpm || 112,
      pack: style === 'mono-editorial' ? 'paper' : 'digital-soft',
      density: 1.0,
    });
    D.mixInto(r.mix, sfxRes.buf, 1.5);

    const m = D.master(r.mix, -14, -1);
    const tmpFile = path.join(__dirname, 'renders', `preview_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
    D.writeWav(tmpFile, m.buf, 16, fs);
    res.sendFile(tmpFile, () => {
      if (fs.existsSync(tmpFile)) {
        try { fs.unlinkSync(tmpFile); } catch (e) {}
      }
    });
  } catch (err) {
    console.error('Audio synthesis preview error:', err);
    res.status(500).json({ error: err.message });
  }
});

// REMOTION OFFICIAL BUNDLER CACHE
let remotionBundleLocation = null;
async function getRemotionBundle() {
  if (remotionBundleLocation && fs.existsSync(remotionBundleLocation)) {
    return remotionBundleLocation;
  }
  const { bundle } = await import('@remotion/bundler');
  const entryPoint = path.join(__dirname, 'src', 'index.ts');
  remotionBundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });
  return remotionBundleLocation;
}

// OFFICIAL REMOTION RENDER ENGINE (With Procedural Music & SFX Synchronization)
app.post('/api/render-edu-video', async (req, res) => {
  const { composition: rawComposition, style = 'pi-v2-dark' } = req.body;
  if (!rawComposition || !rawComposition.scenes) return res.status(400).json({ error: 'Composition data is required' });

  // Normalize: resolve startFrame/endFrame from durationFrames if needed
  function normalizeComposition(comp, defaultFps = 30) {
    const fps = comp?.fps || defaultFps;
    let currentFrame = 0;
    const scenes = (comp?.scenes || []).map((sc) => {
      const dur = sc.durationFrames ||
        (sc.endFrame != null && sc.startFrame != null ? sc.endFrame - sc.startFrame : 150);
      const start = sc.startFrame != null ? sc.startFrame : currentFrame;
      const end = sc.endFrame != null ? sc.endFrame : start + dur;
      currentFrame = end;
      return { ...sc, durationFrames: dur, startFrame: start, endFrame: end };
    });
    const totalFrames = currentFrame > 0 ? currentFrame : 1800;
    return { ...comp, fps, durationInFrames: totalFrames, durationSec: Math.ceil(totalFrames / fps), scenes };
  }

  const composition = normalizeComposition(rawComposition);

  const durationSec = composition.durationSec || 60;
  const fps = composition.fps || 30;
  const width = composition.width || 1080;
  const height = composition.height || 1920;


  const rendersDir = path.join(__dirname, 'renders');
  if (!fs.existsSync(rendersDir)) fs.mkdirSync(rendersDir, { recursive: true });

  const timestamp = Date.now();
  const filename = `remotion_official_${timestamp}.mp4`;
  const outputFile = path.join(rendersDir, filename);
  const audioFile = path.join(rendersDir, `audio_${timestamp}.wav`);

  // Synthesize procedural MotionCraft audio + High-Fidelity Punchy SFX
  let hasAudio = false;
  try {
    const M = await import('./lib/music.mjs');
    const D = await import('./lib/dsp.mjs');
    const S = await import('./lib/sfx.mjs');
    const preset = STYLE_TO_MUSIC[style] || 'calm-punch';
    const spec = M.resolveSpec({ preset, duration: durationSec });
    const r = M.renderMusic(spec);

    // Generate comprehensive auto-cues for every scene transition, code typing, buttons, and logos
    const cues = S.generateAutoSfxCues(composition, fps);
    const sfxRes = S.renderSfx(cues, durationSec, {
      bpm: spec.bpm || 112,
      pack: style === 'mono-editorial' ? 'paper' : 'digital-soft',
      density: 1.0,
    });

    // Layer punchy SFX (+3.5 dB gain) into the background instrumental mix
    D.mixInto(r.mix, sfxRes.buf, 1.5);

    // Master full mix to streaming standards (-14 LUFS, -1 dB True Peak)
    const m = D.master(r.mix, -14, -1);
    D.writeWav(audioFile, m.buf, 16, fs);
    hasAudio = true;
  } catch (audioErr) {
    console.warn("Audio synthesis warning:", audioErr.message);
  }

  try {
    const { selectComposition, renderMedia } = await import('@remotion/renderer');
    const bundleLocation = await getRemotionBundle();

    const inputProps = {
      composition,
      style,
      durationSec,
      width,
      height
    };

    const comp = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MotionCraftVideo',
      inputProps,
    });

    const tempVideoFile = hasAudio ? path.join(rendersDir, `temp_video_${timestamp}.mp4`) : outputFile;

    await renderMedia({
      composition: comp,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: tempVideoFile,
      inputProps,
      chromiumOptions: {
        enableMultiProcessOnLinux: true,
      }
    });

    if (hasAudio && fs.existsSync(audioFile)) {
      // Fast mux audio + video without re-encoding video (-c:v copy)
      await new Promise((resolve, reject) => {
        const ff = spawn('ffmpeg', [
          '-y',
          '-i', tempVideoFile,
          '-i', audioFile,
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest',
          '-movflags', '+faststart',
          outputFile
        ]);
        ff.on('close', code => {
          if (code === 0) resolve();
          else reject(new Error(`FFmpeg audio mux exited with code ${code}`));
        });
        ff.on('error', reject);
      });

      try { if (fs.existsSync(tempVideoFile)) fs.unlinkSync(tempVideoFile); } catch (e) {}
      try { if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile); } catch (e) {}
    }

    const stat = fs.statSync(outputFile);
    res.json({
      success: true,
      filename,
      url: `/renders/${filename}`,
      sizeMB: (stat.size / (1024 * 1024)).toFixed(2)
    });
  } catch (err) {
    console.error("Remotion render error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Remotion Studio running on port ${PORT}`);
});
