    let isGenerated = true;
    let selectedPlatform = '9:16';
    let selectedStyle = 'remotion-light';
    let selectedSec = 60;
    
    const PLATFORM_CONFIGS = {
      '9:16': { width: 1080, height: 1920, aspectClass: 'aspect-[9/16]' },
      '4:5':  { width: 1080, height: 1350, aspectClass: 'aspect-[4/5]' },
      '1:1':  { width: 1080, height: 1080, aspectClass: 'aspect-[1/1]' },
      '16:9': { width: 1920, height: 1080, aspectClass: 'aspect-[16/9]' }
    };

    let videoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 360, durationSec: 12 };

    // DEFAULT DEMO COMPOSITION: Clean MotionCraft Intro (3 scenes)
    const INITIAL_DEMO_COMPOSITION = {
      title: "MotionCraft Studio",
      durationSec: 12,
      fps: 30,
      scenes: [
        {
          tag: "01 / INTRO",
          headline: "Selamat Datang di *MotionCraft*",
          subtext: "Buat video motion graphics programatik dari naskah atau JSON.",
          durationFrames: 120,
          startFrame: 0,
          endFrame: 120
        },
        {
          tag: "02 / FITUR",
          headline: "100% Fleksibel Sesuai *Naskah Kamu*",
          subtext: "Paste naskah bebas atau upload JSON, engine otomatis merender.",
          points: [
            "Tipografi kinetik & highlight dinamis",
            "Musik procedural DSP & efek suara sinkron",
            "Render MP4 akurat via Remotion"
          ],
          durationFrames: 150,
          startFrame: 120,
          endFrame: 270
        },
        {
          tag: "03 / MULAI",
          headline: "Siap *Membuat Video?*",
          subtext: "Klik tombol Naskah ➔ JSON di atas atau upload file komposisimu.",
          ctaText: "Mulai Sekarang",
          durationFrames: 90,
          startFrame: 270,
          endFrame: 360
        }
      ]
    };

    let composition = JSON.parse(JSON.stringify(INITIAL_DEMO_COMPOSITION));
    let currentFrame = 0;
    let isPlaying = false;
    let animationTimer = null;
    let isScrubbing = false;

    // Studio Audio Preview State
    let isAudioPlaying = false;

    const canvas = document.getElementById('remotionCanvas');
    const ctx = canvas.getContext('2d');

    const STYLE_PRESETS = {
      'remotion-light': {
        isLight: true,
        font: "'Figtree', sans-serif",
        monoFont: "'JetBrains Mono', monospace",
        bg: ['#ffffff', '#f0f7ff', '#e0f2fe'],
        cardBg: 'rgba(255, 255, 255, 0.95)',
        cardBorder: 'rgba(2, 132, 199, 0.22)',
        text: '#0f172a',
        sub: '#475569',
        accent: '#0284c7',
        accentGlow: 'rgba(2, 132, 199, 0.25)',
        accent2: '#2563eb'
      },
      'pi-v2-dark': {
        font: "'Figtree', sans-serif",
        monoFont: "'JetBrains Mono', monospace",
        bg: ['#1e1b4b', '#0f172a', '#030712'],
        cardBg: 'rgba(15, 23, 42, 0.94)',
        cardBorder: 'rgba(99, 102, 241, 0.45)',
        text: '#ffffff',
        sub: '#94a3b8',
        accent: '#6366f1',
        accentGlow: 'rgba(99, 102, 241, 0.28)',
        accent2: '#38bdf8'
      },
      'tech-neon-soft': {
        font: "'JetBrains Mono', monospace",
        monoFont: "'JetBrains Mono', monospace",
        bg: ['#042f2e', '#022c22', '#020617'],
        cardBg: 'rgba(4, 47, 46, 0.92)',
        cardBorder: 'rgba(45, 212, 191, 0.45)',
        text: '#2dd4bf',
        sub: '#99f6e4',
        accent: '#14b8a6',
        accentGlow: 'rgba(20, 184, 166, 0.28)',
        accent2: '#10b981'
      },
      'hyper-crypto': {
        font: "'Figtree', sans-serif",
        monoFont: "'JetBrains Mono', monospace",
        bg: ['#3b0764', '#1e1b4b', '#030712'],
        cardBg: 'rgba(24, 9, 43, 0.94)',
        cardBorder: 'rgba(168, 85, 247, 0.45)',
        text: '#ffffff',
        sub: '#d8b4fe',
        accent: '#a855f7',
        accentGlow: 'rgba(168, 85, 247, 0.3)',
        accent2: '#eab308'
      },
      'sunset-creator': {
        font: "'Figtree', sans-serif",
        monoFont: "'JetBrains Mono', monospace",
        bg: ['#450a0a', '#1c1917', '#09090b'],
        cardBg: 'rgba(28, 25, 23, 0.94)',
        cardBorder: 'rgba(249, 115, 22, 0.45)',
        text: '#ffffff',
        sub: '#fdba74',
        accent: '#f97316',
        accentGlow: 'rgba(249, 115, 22, 0.3)',
        accent2: '#ef4444'
      },
      'warm-paper': {
        font: "'Playfair Display', serif",
        monoFont: "'JetBrains Mono', monospace",
        bg: ['#fffbeb', '#fef3c7', '#fde68a'],
        cardBg: 'rgba(255, 255, 255, 0.96)',
        cardBorder: 'rgba(217, 119, 6, 0.35)',
        text: '#451a03',
        sub: '#78350f',
        accent: '#d97706',
        accentGlow: 'rgba(217, 119, 6, 0.22)',
        accent2: '#b45309'
      },
      'mono-editorial': {
        font: "'JetBrains Mono', monospace",
        monoFont: "'JetBrains Mono', monospace",
        bg: ['#18181b', '#09090b', '#000000'],
        cardBg: 'rgba(24, 24, 27, 0.95)',
        cardBorder: 'rgba(255, 255, 255, 0.25)',
        text: '#f4f4f5',
        sub: '#a1a1aa',
        accent: '#e4e4e7',
        accentGlow: 'rgba(255, 255, 255, 0.15)',
        accent2: '#ffffff'
      }
    };

    // INITIALIZATION ON LOAD
    window.addEventListener('DOMContentLoaded', () => {
      videoConfig.durationSec = composition.durationSec || 12;
      videoConfig.durationInFrames = videoConfig.durationSec * (videoConfig.fps || 30);
      const totalTimeText = document.getElementById('totalTimeText');
      if (totalTimeText) totalTimeText.innerText = videoConfig.durationSec.toFixed(2) + 's';
      const durBadge = document.getElementById('durBadge');
      if (durBadge) durBadge.innerText = videoConfig.durationSec + 's';

      enableControls();
      renderTimelineTracks();
      drawFrame(0);
      setupScrubberDrag();
      setupKeyboardControls();
    });

    function setPrompt(text) {
      const input = document.getElementById('promptInput');
      input.value = text;
      input.focus();
    }

    function selectPlatform(plat) {
      selectedPlatform = plat;
      ['9-16', '4-5', '1-1', '16-9'].forEach(k => {
        const el = document.getElementById(`plat-${k}`);
        if (!el) return;
        if (k === plat.replace(':', '-')) {
          el.className = 'h-7 rounded border border-zinc-300 bg-zinc-800 text-white font-mono text-[10px] font-bold cursor-pointer transition';
        } else {
          el.className = 'h-7 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 font-mono text-[10px] hover:text-white cursor-pointer transition';
        }
      });

      const cfg = PLATFORM_CONFIGS[plat];
      videoConfig.width = cfg.width;
      videoConfig.height = cfg.height;
      canvas.width = cfg.width;
      canvas.height = cfg.height;

      const wrapper = document.getElementById('canvasWrapper');
      if (wrapper) {
        wrapper.className = `group relative shadow-2xl rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center w-full max-w-[320px] sm:max-w-[380px] md:max-w-none md:max-h-[72vh] ${cfg.aspectClass} transition-all duration-200 mx-auto cursor-pointer`;
      }

      const platBadge = document.getElementById('platBadge');
      if (platBadge) platBadge.innerText = plat;
      const hudRes = document.getElementById('hudResText');
      if (hudRes) hudRes.innerText = `${cfg.width}×${cfg.height}`;

      drawFrame(currentFrame);

      if (typeof updateMasterPromptPreview === 'function') {
        updateMasterPromptPreview();
      }
    }

    function selectPreset(st) {
      selectedStyle = st;
      document.querySelectorAll('.preset-card').forEach(c => {
        c.className = 'preset-card p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 cursor-pointer transition';
      });
      const act = document.getElementById(`preset-${st}`);
      if (act) act.className = 'preset-card p-2 rounded-lg border border-zinc-300 bg-zinc-800 text-white cursor-pointer transition';
      const styleBadge = document.getElementById('styleBadge');
      if (styleBadge) styleBadge.innerText = st;
      
      drawFrame(currentFrame);

      // If audio is actively playing or synthesizing, switch to new style audio
      if (isAudioPlaying || isAudioLoading) {
        stopAudioPreview();
        setTimeout(() => {
          toggleAudioPreview();
        }, 200);
      }

      if (typeof updateMasterPromptPreview === 'function') {
        updateMasterPromptPreview();
      }
    }

    function selectDuration(sec) {
      selectedSec = sec;
      [30, 60, 90, 120].forEach(k => {
        const el = document.getElementById(`dur-${k}`);
        if (!el) return;
        if (k === Number(sec)) {
          el.className = 'h-7 rounded border border-zinc-300 bg-zinc-800 text-white font-mono text-[10px] font-bold cursor-pointer transition';
        } else {
          el.className = 'h-7 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 font-mono text-[10px] hover:text-white cursor-pointer transition';
        }
      });
      
      videoConfig.durationSec = sec;
      videoConfig.durationInFrames = sec * videoConfig.fps;
      const totalTimeText = document.getElementById('totalTimeText');
      if (totalTimeText) totalTimeText.innerText = sec.toFixed(2) + 's';
      const durBadge = document.getElementById('durBadge');
      if (durBadge) durBadge.innerText = `${sec}s`;

      if (composition.scenes.length) {
        const sceneDur = Math.floor(videoConfig.durationInFrames / composition.scenes.length);
        composition.scenes.forEach((s, i) => {
          s.startFrame = i * sceneDur;
          s.endFrame = (i === composition.scenes.length - 1) ? videoConfig.durationInFrames : (i + 1) * sceneDur;
        });
        renderTimelineTracks();
      }
      if (currentFrame >= videoConfig.durationInFrames) {
        currentFrame = 0;
      }
      drawFrame(currentFrame);
    }

    function enableControls() {
      ['btnPrev', 'playBtn', 'btnNext', 'exportDirectBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.disabled = false;
          el.classList.remove('cursor-not-allowed', 'opacity-50');
        }
      });
      const playBtn = document.getElementById('playBtn');
      if (playBtn) playBtn.className = 'w-7 h-7 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 flex items-center justify-center shadow-xs transition cursor-pointer';
      const btnPrev = document.getElementById('btnPrev');
      if (btnPrev) btnPrev.className = 'w-7 h-7 rounded-md bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 flex items-center justify-center text-xs transition cursor-pointer';
      const btnNext = document.getElementById('btnNext');
      if (btnNext) btnNext.className = 'w-7 h-7 rounded-md bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 flex items-center justify-center text-xs transition cursor-pointer';
      const exportBtn = document.getElementById('exportDirectBtn');
      if (exportBtn) exportBtn.className = 'px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-xs font-semibold text-zinc-950 transition cursor-pointer flex items-center gap-1.5 shadow-xs';
      const currTime = document.getElementById('currentTimeText');
      if (currTime) currTime.className = 'text-zinc-100 font-bold text-xs sm:text-sm';
      const overlay = document.getElementById('videoBadgeOverlay');
      if (overlay) overlay.classList.remove('hidden');
    }

    let isPlayerAudioEnabled = true;
    let studioAudio = null;
    let isAudioLoading = false;
    let audioCacheKey = '';

    function getAudioCacheKey() {
      const compStr = JSON.stringify(composition || {});
      return `${selectedStyle}_${videoConfig.durationSec}_${compStr.length}_${(composition && composition.scenes ? composition.scenes.length : 0)}`;
    }

    function updateAudioStatusUI(enabled, customText) {
      const tlIcon = document.getElementById('timelineAudioIcon');
      const tlText = document.getElementById('timelineAudioText');
      const tlBtn = document.getElementById('btnTimelineAudio');
      const hdrIcon = document.getElementById('audioIcon');
      const hdrText = document.getElementById('audioStatusText');

      if (enabled) {
        if (tlIcon) tlIcon.className = 'fa-solid fa-volume-high text-[11px] text-emerald-400';
        if (tlText) tlText.innerText = customText || 'Audio ON';
        if (tlBtn) tlBtn.className = 'h-8 px-2.5 rounded-md bg-zinc-800/70 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-700/60 flex items-center gap-1.5 text-xs transition cursor-pointer';
        if (hdrIcon) hdrIcon.className = 'fa-solid fa-volume-high text-[11px] text-emerald-400';
        if (hdrText) hdrText.innerText = customText || 'DSP Audio';
      } else {
        if (tlIcon) tlIcon.className = 'fa-solid fa-volume-xmark text-[11px] text-zinc-500';
        if (tlText) tlText.innerText = customText || 'Audio Muted';
        if (tlBtn) tlBtn.className = 'h-8 px-2.5 rounded-md bg-zinc-800/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 border border-zinc-700/60 flex items-center gap-1.5 text-xs transition cursor-pointer';
        if (hdrIcon) hdrIcon.className = 'fa-solid fa-volume-xmark text-[11px] text-zinc-500';
        if (hdrText) hdrText.innerText = 'DSP Muted';
      }
    }

    async function ensureStudioAudio() {
      const key = getAudioCacheKey();
      if (studioAudio && audioCacheKey === key && studioAudio.src) {
        return studioAudio;
      }
      audioCacheKey = key;
      if (!studioAudio) {
        studioAudio = new Audio();
      }

      isAudioLoading = true;
      updateAudioStatusUI(true, 'Synthesizing...');

      try {
        const res = await fetch('/api/preview-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style: selectedStyle,
            duration: videoConfig.durationSec,
            composition: composition
          })
        });
        if (!res.ok) throw new Error('Audio synthesis failed');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        studioAudio.src = blobUrl;
        isAudioLoading = false;
        updateAudioStatusUI(isPlayerAudioEnabled, isPlayerAudioEnabled ? 'Audio ON' : 'Audio Muted');
        return studioAudio;
      } catch (err) {
        console.warn('ensureStudioAudio notice:', err.message);
        studioAudio.src = `/api/preview-audio?style=${selectedStyle}&duration=${videoConfig.durationSec}&t=${Date.now()}`;
        isAudioLoading = false;
        updateAudioStatusUI(isPlayerAudioEnabled, isPlayerAudioEnabled ? 'Audio ON' : 'Audio Muted');
        return studioAudio;
      }
    }

    function togglePlayerAudio() {
      isPlayerAudioEnabled = !isPlayerAudioEnabled;
      updateAudioStatusUI(isPlayerAudioEnabled);
      if (!isPlayerAudioEnabled) {
        if (studioAudio) studioAudio.pause();
      } else {
        if (isPlaying) {
          ensureStudioAudio().then(aud => {
            if (aud && isPlaying && isPlayerAudioEnabled) {
              aud.currentTime = currentFrame / (videoConfig.fps || 30);
              aud.play().catch(() => {});
            }
          });
        }
      }
    }

    function syncAudioPlayback(playing) {
      if (!isPlayerAudioEnabled) {
        if (studioAudio) studioAudio.pause();
        return;
      }
      if (playing) {
        ensureStudioAudio().then(aud => {
          if (aud && isPlaying && isPlayerAudioEnabled) {
            aud.currentTime = currentFrame / (videoConfig.fps || 30);
            aud.play().catch(e => console.warn('Audio play notice:', e.message));
          }
        });
      } else {
        if (studioAudio) studioAudio.pause();
      }
    }

    function syncAudioSeek(frame) {
      if (studioAudio) {
        studioAudio.currentTime = Math.max(0, frame / (videoConfig.fps || 30));
      }
    }

    function stopAudioPreview() {
      if (studioAudio) studioAudio.pause();
    }

    function toggleAudioPreview() {
      togglePlayerAudio();
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

    function interpolate(frame, inRange, outRange) {
      const [inMin, inMax] = inRange;
      const [outMin, outMax] = outRange;
      if (frame <= inMin) return outMin;
      if (frame >= inMax) return outMax;
      return outMin + ((frame - inMin) / (inMax - inMin)) * (outMax - outMin);
    }

    // =========================================================================
    // =========================================================================
    // HIGH-TASTE 2D / 3D MOTION GRAPHIC PRIMITIVES
    // =========================================================================

    /**
     * Sleek, high-taste highlight ribbon (translucent glass pill + animated underline sweep)
     * Renders strictly BEHIND the text to preserve 100% typography legibility.
     */
    function drawCleanHighlightRibbon(ctx, x, y, w, h, progress, color, glow, isLight) {
      if (progress <= 0.05) return;
      ctx.save();

      const pillProg = Math.min(1, progress * 1.3);
      const sweepProg = Math.min(1, Math.max(0, (progress - 0.15) * 1.4));

      // 1. Frosted Glass Backdrop Pill (Behind text)
      ctx.globalAlpha = pillProg;
      ctx.fillStyle = isLight ? 'rgba(2, 132, 199, 0.10)' : 'rgba(99, 102, 241, 0.18)';
      ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.35)' : 'rgba(99, 102, 241, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = glow || color;
      ctx.shadowBlur = 18;

      const padX = 14;
      const pillX = x - padX;
      const pillY = y - (h * 0.58);
      const pillW = w + (padX * 2);
      const pillH = h * 1.16;

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 14);
      ctx.fill();
      ctx.stroke();

      // 2. Kinetic Accent Underline Sweep (Below baseline)
      if (sweepProg > 0.05) {
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = color;
        const lineY = pillY + pillH + 4;
        const maxLineW = pillW;
        const curLineW = maxLineW * sweepProg;
        ctx.beginPath();
        ctx.roundRect(pillX, lineY, curLineW, 4, 2);
        ctx.fill();
      }

      ctx.restore();
    }

    /**
     * Authentic 3D Isometric Studio Preview Device (for Intro/Hero scenes)
     * Features real perspective tilt, glass specular lighting, concentric audio rings, and player mockup
     */
    function draw3DIsometricStudioMockup(ctx, cx, cy, w, h, sceneFrame, st) {
      const enterProg = Math.min(1, sceneFrame / 20);
      if (enterProg <= 0.02) return;

      ctx.save();
      ctx.translate(cx, cy + (1 - enterProg) * 45);
      ctx.globalAlpha = enterProg;

      // Gentle floating 3D hover drift
      const floatY = Math.sin(sceneFrame * 0.06) * 6;
      ctx.translate(0, floatY);

      // Subtle 3D perspective slant
      ctx.transform(1, -0.025, 0.035, 0.99, 0, 0);

      const cardW = w;
      const cardH = h;
      const halfW = cardW / 2;
      const halfH = cardH / 2;

      // 1. Ambient 3D Depth Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 42;
      ctx.shadowOffsetY = 24;
      ctx.fillStyle = st.isLight ? 'rgba(240, 249, 255, 0.92)' : 'rgba(15, 23, 42, 0.90)';
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, cardW, cardH, 24);
      ctx.fill();

      // 2. Glass Rim Specular Border
      ctx.shadowColor = st.accentGlow;
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = st.cardBorder || st.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowColor = 'transparent';

      // 3. Header Window Bar with macOS traffic dots
      const barH = 46;
      ctx.fillStyle = st.isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, cardW, barH, [24, 24, 0, 0]);
      ctx.fill();

      // Traffic dots
      const dotY = -halfH + barH / 2;
      const colors = ['#ef4444', '#eab308', '#22c55e'];
      colors.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(-halfW + 28 + idx * 16, dotY, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Monospace File Badge
      ctx.font = `600 13px ${st.monoFont || 'monospace'}`;
      ctx.fillStyle = st.sub || '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦ MotionCraft Studio — 60 FPS Engine', 0, dotY);

      // 4. Viewport Preview (Remotion Animated Playhead & Kinetic Concentric Rings)
      const vpY = -halfH + barH + 18;
      const vpH = cardH - barH - 85;
      const vpW = cardW - 36;
      ctx.fillStyle = st.isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(3, 7, 18, 0.65)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-halfW + 18, vpY, vpW, vpH, 16);
      ctx.fill();
      ctx.stroke();

      // Kinetic 2D/3D Concentric Motion Rings in Viewport
      const centerVx = 0;
      const centerVy = vpY + vpH / 2;
      for (let r = 1; r <= 3; r++) {
        const ringRad = 36 * r + Math.sin(sceneFrame * 0.08 + r) * 6;
        ctx.strokeStyle = st.accent;
        ctx.globalAlpha = 0.22 / r;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(centerVx, centerVy, ringRad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = enterProg;

      // Centered Glowing Play Icon Badge
      ctx.fillStyle = st.accent;
      ctx.shadowColor = st.accentGlow;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(centerVx, centerVy, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Play Triangle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(centerVx - 6, centerVy - 10);
      ctx.lineTo(centerVx + 10, centerVy);
      ctx.lineTo(centerVx - 6, centerVy + 10);
      ctx.closePath();
      ctx.fill();

      // 5. Bottom Timeline Bar with Scrubber & Timecode
      const botY = -halfH + cardH - 42;
      ctx.font = `bold 12px ${st.monoFont || 'monospace'}`;
      ctx.fillStyle = st.accent;
      ctx.textAlign = 'left';
      ctx.fillText('00:01:24', -halfW + 24, botY);

      // Scrubber Track
      const trackX = -halfW + 90;
      const trackW = cardW - 190;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(trackX, botY - 4, trackW, 6, 3);
      ctx.fill();

      // Active Track & Playhead
      const scrubProg = ((sceneFrame * 0.8) % 100) / 100;
      ctx.fillStyle = st.accent;
      ctx.beginPath();
      ctx.roundRect(trackX, botY - 4, trackW * scrubProg, 6, 3);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(trackX + trackW * scrubProg, botY - 1, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'right';
      ctx.fillStyle = st.sub || '#94a3b8';
      ctx.fillText('00:04:00', halfW - 24, botY);

      ctx.restore();
    }

    /**
     * Subtle 3D Perspective Horizon Grid for cinematic spatial depth
     */
    function drawPerspectiveHorizonGrid(ctx, width, height, frame, st) {
      ctx.save();
      const horizonY = height * 0.45;
      const floorH = height - horizonY;
      const centerX = width / 2;

      ctx.strokeStyle = st.isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(99, 102, 241, 0.12)';
      ctx.lineWidth = 1;

      // 1. Radiating Perspective Rays
      const numRays = 16;
      for (let i = -numRays; i <= numRays; i++) {
        const spreadX = centerX + i * 95;
        ctx.beginPath();
        ctx.moveTo(centerX + (i * 12), horizonY);
        ctx.lineTo(spreadX * 1.6, height);
        ctx.stroke();
      }

      // 2. Exponential Horizontal Grid Rings
      for (let j = 1; j <= 8; j++) {
        const ratio = Math.pow(j / 8, 2.2);
        const lineY = horizonY + floorH * ratio;
        ctx.globalAlpha = ratio * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(width, lineY);
        ctx.stroke();
      }

      ctx.restore();
    }

    /**
     * High-taste kinetic headline renderer
     * Groups continuous highlight phrases into unified, elegant glass ribbons with underline sweeps
     */
    function drawKineticHeadline(ctx, headline, x, y, maxWidth, sceneFrame, accentColor, fontSize = 48, fontFam = "'Figtree', sans-serif", textColor = '#ffffff', accentGlow = 'rgba(99, 102, 241, 0.4)', isLight = false) {
      const words = (headline || '').split(' ').filter(Boolean);
      ctx.font = `bold ${fontSize}px ${fontFam}`;
      ctx.textBaseline = 'middle';

      const spaceW = ctx.measureText(' ').width;
      const lineHeight = fontSize * 1.28;

      // 1. Parse highlight spans (*word* or *multi word*)
      let inStarHighlight = false;
      const parsedWords = words.map((w, globalIdx) => {
        let isAcc = false;
        if (w.startsWith('*')) {
          inStarHighlight = true;
          isAcc = true;
        } else if (inStarHighlight) {
          isAcc = true;
        } else if (w.includes('*')) {
          isAcc = true;
        }
        if (w.endsWith('*')) {
          inStarHighlight = false;
        }
        const cleanW = w.replace(/\*/g, '');
        const wWidth = ctx.measureText(cleanW).width;
        return {
          cleanW,
          wWidth,
          isAcc,
          globalIdx,
        };
      });

      // 2. Wrap words into lines based on maxWidth
      const lines = [];
      let currentLine = [];
      let currentLineWidth = 0;

      parsedWords.forEach(pw => {
        const testWidth = currentLineWidth === 0 ? pw.wWidth : currentLineWidth + spaceW + pw.wWidth;
        if (testWidth > maxWidth && currentLine.length > 0) {
          lines.push({ words: currentLine, width: currentLineWidth });
          currentLine = [pw];
          currentLineWidth = pw.wWidth;
        } else {
          currentLine.push(pw);
          currentLineWidth = testWidth;
        }
      });
      if (currentLine.length > 0) {
        lines.push({ words: currentLine, width: currentLineWidth });
      }

      const totalH = lines.length * lineHeight;
      const startLineY = y - (totalH / 2) + (lineHeight / 2);

      lines.forEach((lineObj, lineIdx) => {
        const lineY = startLineY + lineIdx * lineHeight;
        let curX = x - lineObj.width / 2;

        // Group consecutive highlighted words on this line to draw a SINGLE clean backdrop ribbon!
        const highlightGroups = [];
        let activeGroup = null;

        lineObj.words.forEach((pw) => {
          pw.lineX = curX;
          pw.lineY = lineY;
          if (pw.isAcc) {
            if (!activeGroup) {
              activeGroup = { startX: curX, endX: curX + pw.wWidth, words: [pw] };
            } else {
              activeGroup.endX = curX + pw.wWidth;
              activeGroup.words.push(pw);
            }
          } else {
            if (activeGroup) {
              highlightGroups.push(activeGroup);
              activeGroup = null;
            }
          }
          curX += pw.wWidth + spaceW;
        });
        if (activeGroup) highlightGroups.push(activeGroup);

        // PASS 1: Draw Clean Backdrop Pills & Underlines strictly BEHIND the text
        highlightGroups.forEach(grp => {
          const firstWord = grp.words[0];
          const groupDelay = firstWord.globalIdx * 2.5;
          const groupProgress = Math.max(0, Math.min(1, (sceneFrame - groupDelay) / 8));
          if (groupProgress > 0.05) {
            const grpW = grp.endX - grp.startX;
            drawCleanHighlightRibbon(ctx, grp.startX, lineY, grpW, fontSize, groupProgress, accentColor, accentGlow, isLight);
          }
        });

        // PASS 2: Draw Text Words (100% Crisp, Untouched, Legible)
        lineObj.words.forEach(pw => {
          const wordDelay = pw.globalIdx * 2.5;
          const wordProgress = Math.max(0, Math.min(1, (sceneFrame - wordDelay) / 7));
          const wordY = lineY + (1 - wordProgress) * 14;

          ctx.save();
          ctx.globalAlpha = wordProgress;
          ctx.fillStyle = pw.isAcc ? accentColor : textColor;
          if (pw.isAcc) {
            ctx.shadowColor = accentGlow;
            ctx.shadowBlur = 14;
          }
          ctx.textAlign = 'left';
          ctx.fillText(pw.cleanW, pw.lineX, wordY);
          ctx.restore();
        });
      });

      return totalH;
    }

    function drawRemotionLogo(ctx, cx, cy, size) {
      ctx.save();
      ctx.translate(cx - size/2, cy - size/2);
      const scale = size / 100;
      ctx.scale(scale, scale);

      const grad = ctx.createLinearGradient(15, 10, 85, 90);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#0ea5e9');
      grad.addColorStop(1, '#38bdf8');

      ctx.shadowColor = 'rgba(2, 132, 199, 0.4)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;

      ctx.beginPath();
      ctx.moveTo(37, 13);
      ctx.lineTo(80, 44);
      ctx.quadraticCurveTo(84, 47, 84, 50);
      ctx.quadraticCurveTo(84, 53, 80, 56);
      ctx.lineTo(37, 87);
      ctx.quadraticCurveTo(28, 89, 28, 82);
      ctx.lineTo(28, 18);
      ctx.quadraticCurveTo(28, 11, 37, 13);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.moveTo(32, 23);
      ctx.lineTo(72, 48);
      ctx.lineTo(32, 58);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fill();

      ctx.restore();
    }

    function drawMochiMascot(ctx, cx, cy, size, bounce = 0) {
      ctx.save();
      ctx.translate(cx, cy - Math.abs(bounce));
      const scale = size / 100;
      ctx.scale(scale, scale);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 12;

      const grad = ctx.createRadialGradient(-10, -15, 10, 0, 0, 60);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#f8eee0');
      grad.addColorStop(1, '#ecd4ba');

      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.bezierCurveTo(35, -42, 45, -20, 45, 12);
      ctx.bezierCurveTo(45, 42, 28, 46, 0, 46);
      ctx.bezierCurveTo(-28, 46, -45, 42, -45, 12);
      ctx.bezierCurveTo(-45, -20, -35, -42, 0, -42);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowColor = 'transparent';

      ctx.fillStyle = '#2d2013';
      ctx.beginPath(); ctx.arc(-14, 2, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(14, 2, 3.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.beginPath(); ctx.ellipse(-23, 11, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(23, 11, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#2d2013';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 8, 4.5, 0.2, Math.PI - 0.2);
      ctx.stroke();

      ctx.restore();
    }

    function drawFrame(frame) {
      const width = canvas.width;
      const height = canvas.height;

      const st = STYLE_PRESETS[selectedStyle] || STYLE_PRESETS['pi-v2-dark'];
      ctx.save();

      // Camera Drift
      const camZoom = 1.0 + Math.sin(frame * 0.02) * 0.016;
      const camPanX = Math.cos(frame * 0.015) * 8;
      const camPanY = Math.sin(frame * 0.015) * 8;

      ctx.translate(width / 2 + camPanX, height / 2 + camPanY);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-width / 2, -height / 2);

      // Deep Atmosphere Background with Spotlight Glow
      const spotX = width * 0.5 + Math.cos(frame * 0.03) * 150;
      const spotY = height * 0.35 + Math.sin(frame * 0.03) * 150;
      const grad = ctx.createRadialGradient(spotX, spotY, 50, width/2, height/2, width * 0.9);
      grad.addColorStop(0, st.bg[0]);
      grad.addColorStop(0.6, st.bg[1]);
      grad.addColorStop(1, st.bg[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Particle Stars
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      for (let p = 0; p < 25; p++) {
        const px = ((p * 137.5 + frame * 0.4 * (1 + (p % 3))) % width);
        const py = ((p * 229.3 + frame * 0.6 * (1 + (p % 2))) % height);
        const pSize = 1.5 + (p % 3);
        ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2); ctx.fill();
      }

      // High-Taste 3D Perspective Horizon Grid (replaces tacky unicode clutter)
      drawPerspectiveHorizonGrid(ctx, width, height, frame, st);

      // Top Progress Capsule
      const totalProgress = Math.min(1, frame / videoConfig.durationInFrames);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.roundRect(45, 45, width - 90, 8, 4);
      ctx.fill();

      ctx.fillStyle = st.accent;
      ctx.beginPath();
      ctx.roundRect(45, 45, (width - 90) * totalProgress, 8, 4);
      ctx.fill();

      // Bottom Audio Equalizer Waveform
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

      const activeScene = (composition.scenes && composition.scenes.length) 
        ? (composition.scenes.find(s => frame >= s.startFrame && frame < s.endFrame) || composition.scenes[composition.scenes.length - 1])
        : null;

      if (activeScene) {
        const sceneFrame = frame - activeScene.startFrame;
        const sceneDur = activeScene.endFrame - activeScene.startFrame;

        // Emil Kowalski Spring Physics Transition (Fixed single declaration)
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

        // =====================================================================
        // UNIVERSAL DATA-DRIVEN SCENE RENDERER (100% Dynamic from JSON)
        // =====================================================================
        const hasComparison = (activeScene.itemsBad && activeScene.itemsBad.length > 0) || (activeScene.itemsGood && activeScene.itemsGood.length > 0);
        const hasMetric = activeScene.metricValue != null && activeScene.metricValue !== '';
        const hasCode = Boolean(activeScene.codeSnippet);
        const hasPoints = (activeScene.points && activeScene.points.length > 0) || (activeScene.items && activeScene.items.length > 0);
        const hasCta = Boolean(activeScene.ctaText);

        // 1. Tag Pill at top (always rendered if tag exists)
        let tagBottomY = height * 0.22;
        if (activeScene.tag) {
          const tagY = height * 0.20;
          ctx.font = `bold 18px ${st.font}`;
          const tagW = Math.max(160, ctx.measureText(activeScene.tag).width + 52);
          
          ctx.fillStyle = st.isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(99, 102, 241, 0.22)';
          ctx.strokeStyle = st.cardBorder || st.accent;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(width / 2 - tagW / 2, tagY, tagW, 44, 22);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = st.accent;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(activeScene.tag, width / 2, tagY + 22);
          tagBottomY = tagY + 44;
        }

        // 2. Kinetic Headline with Unified High-Taste Highlight Ribbon
        const headY = activeScene.tag ? tagBottomY + 54 : height * 0.28;
        const headSize = (hasComparison || hasCode) ? 50 : (hasPoints || hasMetric || hasCta ? 58 : 72);
        const headlineHeight = drawKineticHeadline(
          ctx,
          activeScene.headline || '',
          width / 2,
          headY,
          width - 120,
          sceneFrame,
          st.accent,
          headSize,
          st.font,
          st.text || '#ffffff',
          st.accentGlow || 'rgba(99, 102, 241, 0.4)',
          st.isLight
        );

        // 3. Subtext Narration (safely below the headline)
        let contentStartY = headY + (headlineHeight / 2) + 32;
        if (activeScene.subtext) {
          ctx.fillStyle = st.sub;
          ctx.font = `600 24px ${st.font}`;
          ctx.textAlign = 'center';
          drawWrappedText(ctx, activeScene.subtext, width / 2, contentStartY, width - 160, 36, 'center');
          contentStartY += 65;
        } else {
          contentStartY += 20;
        }

        // 4. Dynamic Visual Block based on scene data
        if (hasComparison) {
          const splitY = contentStartY + 10;
          const halfW = width - 120;
          const cardH = 150;

          // Bad Card
          ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(60, splitY, halfW, cardH, 20);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.font = `bold 20px ${st.font}`;
          ctx.textAlign = 'left';
          ctx.fillText('❌ CARA LAMA / MASALAH', 85, splitY + 36);

          const badText = (activeScene.itemsBad || ['Proses lambat & manual']).join(' • ');
          ctx.fillStyle = '#fca5a5';
          ctx.font = `500 18px ${st.font}`;
          drawWrappedText(ctx, badText, 85, splitY + 75, halfW - 50, 26, 'left');

          // Good Card
          const goodY = splitY + cardH + 18;
          ctx.fillStyle = 'rgba(34, 197, 94, 0.14)';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(60, goodY, halfW, cardH, 20);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#22c55e';
          ctx.font = `bold 20px ${st.font}`;
          ctx.textAlign = 'left';
          ctx.fillText('✅ CARA BARU / SOLUSI', 85, goodY + 36);

          const goodText = (activeScene.itemsGood || ['Solusi otomatis & instan']).join(' • ');
          ctx.fillStyle = '#86efac';
          ctx.font = `500 18px ${st.font}`;
          drawWrappedText(ctx, goodText, 85, goodY + 75, halfW - 50, 26, 'left');

        } else if (hasMetric) {
          const countProgress = Math.min(1, sceneFrame / 24);
          const rawVal = Number(activeScene.metricValue);
          const displayVal = !isNaN(rawVal) ? Math.floor(countProgress * rawVal) : activeScene.metricValue;
          const metricY = contentStartY + 75;

          // Shockwave Rings
          for (let r = 1; r <= 3; r++) {
            ctx.strokeStyle = st.accentGlow;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(width / 2, metricY, 70 * r + (sceneFrame * 2) % 40, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Giant Metric Value
          ctx.fillStyle = st.accent;
          ctx.font = `bold 120px ${st.monoFont || 'monospace'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(typeof displayVal === 'number' ? `${displayVal}%` : `${displayVal}`, width / 2, metricY);

          // Metric Label Pill
          if (activeScene.metricLabel) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.roundRect(width / 2 - 180, metricY + 80, 360, 48, 24);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 22px ${st.font}`;
            ctx.fillText(activeScene.metricLabel, width / 2, metricY + 104);
          }

        } else if (hasCode) {
          const termX = 60;
          const termY = contentStartY + 10;
          const termW = width - 120;
          const termH = height * 0.36;

          ctx.fillStyle = '#090d16';
          ctx.strokeStyle = 'rgba(255,255,255,0.18)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(termX, termY, termW, termH, 20);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(termX, termY, termW, 44, [20, 20, 0, 0]);
          ctx.fill();

          ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(termX + 24, termY + 22, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.arc(termX + 44, termY + 22, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(termX + 64, termY + 22, 6, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.font = `bold 14px ${st.monoFont || 'monospace'}`;
          ctx.textAlign = 'center';
          ctx.fillText(activeScene.language ? `code.${activeScene.language}` : 'script.ts', termX + termW / 2, termY + 22);

          const codeLines = (activeScene.codeSnippet || '').split('\\n').slice(0, 7);
          codeLines.forEach((cl, idx) => {
            const lineY = termY + 75 + idx * 34;
            ctx.fillStyle = '#475569';
            ctx.font = `16px ${st.monoFont || 'monospace'}`;
            ctx.textAlign = 'left';
            ctx.fillText(`0${idx + 1}`, termX + 24, lineY);

            ctx.fillStyle = idx === 0 ? '#38bdf8' : (idx % 2 === 1 ? '#a855f7' : '#34d399');
            ctx.fillText(cl, termX + 65, lineY);
          });

        } else if (hasPoints) {
          const pts = (activeScene.points || activeScene.items || []).slice(0, 4);
          const startPointsY = contentStartY + 15;
          pts.forEach((pt, idx) => {
            const rowY = startPointsY + idx * 95;
            const slideProgress = Math.min(1, Math.max(0, (sceneFrame - idx * 4) / 8));
            const rowX = 60 + (1 - slideProgress) * 35;

            ctx.save();
            ctx.globalAlpha = slideProgress;
            ctx.fillStyle = st.isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.88)';
            ctx.strokeStyle = st.cardBorder || st.accent;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.roundRect(rowX, rowY, width - 120, 76, 18);
            ctx.fill(); ctx.stroke();

            // Number / Icon Circle
            ctx.fillStyle = st.accent;
            ctx.beginPath();
            ctx.arc(rowX + 42, rowY + 38, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 15px ${st.monoFont || 'monospace'}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`0${idx + 1}`, rowX + 42, rowY + 38);

            // Point Text
            ctx.fillStyle = st.text || '#ffffff';
            ctx.font = `bold 21px ${st.font}`;
            ctx.textAlign = 'left';
            ctx.fillText(pt, rowX + 78, rowY + 38);
            ctx.restore();
          });

        } else if (hasCta) {
          const ctaY = contentStartY + 50;
          const pulse = Math.sin(sceneFrame * 0.12) * 5;
          
          ctx.fillStyle = st.accent;
          ctx.shadowColor = st.accentGlow;
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.roundRect(width / 2 - 200 - pulse/2, ctaY, 400 + pulse, 68, 34);
          ctx.fill();
          ctx.shadowColor = 'transparent';

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold 26px ${st.font}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(activeScene.ctaText, width / 2, ctaY + 34);

          if (activeScene.badges && activeScene.badges.length > 0) {
            const badgeText = activeScene.badges.join('  •  ');
            ctx.fillStyle = st.sub;
            ctx.font = `600 20px ${st.font}`;
            ctx.fillText(badgeText, width / 2, ctaY + 100);
          }

        } else if (activeScene.badges && activeScene.badges.length > 0) {
          // Teaser / Hook Badges for Intro Scene
          const badges = activeScene.badges.slice(0, 4);
          ctx.font = `bold 16px ${st.font}`;
          const badgeMeasurements = badges.map(b => ({
            text: b,
            w: Math.max(110, ctx.measureText(`✦ ${b}`).width + 36)
          }));
          const totalBadgeW = badgeMeasurements.reduce((acc, m) => acc + m.w, 0) + (badges.length - 1) * 12;
          let curBx = Math.max(60, width / 2 - totalBadgeW / 2);
          const badgeY = contentStartY + 35;

          badgeMeasurements.forEach((m, idx) => {
            const floatOffset = Math.sin((sceneFrame + idx * 15) * 0.08) * 3;
            ctx.save();
            ctx.fillStyle = st.isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.92)';
            ctx.strokeStyle = st.cardBorder || st.accent;
            ctx.lineWidth = 1.8;
            ctx.shadowColor = st.accentGlow;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.roundRect(curBx, badgeY + floatOffset, m.w, 44, 22);
            ctx.fill(); ctx.stroke();

            ctx.shadowColor = 'transparent';
            ctx.fillStyle = st.accent;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`✦ ${m.text}`, curBx + m.w / 2, badgeY + floatOffset + 22);
            ctx.restore();

            curBx += m.w + 12;
          });
        } else {
          // Cinematic 3D Isometric Studio Device Mockup (Hero visual anchor)
          const mockupW = Math.min(width - 160, 780);
          const mockupH = 290;
          const mockupY = contentStartY + (mockupH / 2) + 25;
          draw3DIsometricStudioMockup(ctx, width / 2, mockupY, mockupW, mockupH, sceneFrame, st);
        }

        ctx.restore();
      }

      ctx.restore();

      const currentTimeText = document.getElementById('currentTimeText');
      if (currentTimeText) currentTimeText.innerText = (frame / videoConfig.fps).toFixed(2) + 's';
      const playhead = document.getElementById('playhead');
      if (playhead) playhead.style.left = `${(frame / videoConfig.durationInFrames) * 100}%`;
      const fc = document.getElementById('frameCounterText');
      if (fc) fc.innerText = `(F${frame} / ${videoConfig.durationInFrames})`;
    }