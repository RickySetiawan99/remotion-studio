    function togglePlay() {
      isPlaying = !isPlaying;
      const playIcon = document.getElementById('playIcon');
      if (playIcon) playIcon.className = isPlaying ? 'fa-solid fa-pause text-xs' : 'fa-solid fa-play ml-0.5 text-xs';
      const overlayIcon = document.getElementById('canvasPlayOverlayIcon');
      if (overlayIcon) overlayIcon.className = isPlaying ? 'fa-solid fa-pause text-base text-zinc-300' : 'fa-solid fa-play ml-0.5 text-base text-zinc-300';
      if (isPlaying) {
        if (typeof pauseAllGalleryVideos === 'function') pauseAllGalleryVideos();
        if (typeof syncAudioPlayback === 'function') syncAudioPlayback(true);
        runAnimation();
      } else {
        cancelAnimationFrame(animationTimer);
        if (typeof syncAudioPlayback === 'function') syncAudioPlayback(false);
      }
    }

    function runAnimation() {
      if (!isPlaying) return;
      currentFrame++;
      if (currentFrame >= videoConfig.durationInFrames) {
        currentFrame = 0;
        if (typeof syncAudioSeek === 'function') syncAudioSeek(0);
      }
      drawFrame(currentFrame);
      animationTimer = requestAnimationFrame(runAnimation);
    }

    function stepFrame(d) {
      if (isPlaying) togglePlay();
      currentFrame = Math.max(0, Math.min(videoConfig.durationInFrames - 1, currentFrame + d));
      if (typeof syncAudioSeek === 'function') syncAudioSeek(currentFrame);
      drawFrame(currentFrame);
    }

    function jumpToScene(startFrame, event) {
      if (event) event.stopPropagation();
      currentFrame = startFrame;
      if (typeof syncAudioSeek === 'function') syncAudioSeek(currentFrame);
      drawFrame(currentFrame);
    }

    function handleScrub(e) {
      const bar = document.getElementById('timelineBar');
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      currentFrame = Math.floor(ratio * videoConfig.durationInFrames);
      if (typeof syncAudioSeek === 'function') syncAudioSeek(currentFrame);
      drawFrame(currentFrame);
    }

    function scrubTimeline(e) {
      handleScrub(e);
    }

    function scrubTouch(e) {
      handleScrub(e);
    }

    function setupScrubberDrag() {
      const timelineBar = document.getElementById('timelineBar');
      if (!timelineBar) return;
      
      timelineBar.addEventListener('mousedown', (e) => {
        isScrubbing = true;
        handleScrub(e);
      });

      window.addEventListener('mousemove', (e) => {
        if (isScrubbing) handleScrub(e);
      });

      window.addEventListener('mouseup', () => {
        isScrubbing = false;
      });
    }

    function setupKeyboardControls() {
      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlay();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          stepFrame(e.shiftKey ? -10 : -30);
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          stepFrame(e.shiftKey ? 10 : 30);
        } else if (e.code === 'Escape') {
          const gm = document.getElementById('galleryModal');
          const sm = document.getElementById('settingsModal');
          if (gm && !gm.classList.contains('hidden')) toggleGallery();
          if (sm && !sm.classList.contains('hidden')) toggleSettings();
          stopAudioPreview();
        }
      });

      // Pause media automatically when tab is hidden / user switches tabs
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (typeof pauseAllGalleryVideos === 'function') pauseAllGalleryVideos();
          stopAudioPreview();
          if (isPlaying) togglePlay();
        }
      });
    }

    function renderTimelineTracks() {
      const totalF = videoConfig.durationInFrames;
      const container = document.getElementById('timelineTracks');
      if (!container || !composition.scenes) return;
      const trackStyles = [
        'bg-zinc-800 border-zinc-700/70 text-zinc-200',
        'bg-zinc-800/80 border-zinc-700/50 text-zinc-300',
        'bg-zinc-900 border-zinc-800 text-zinc-400',
        'bg-zinc-800 border-zinc-700/70 text-zinc-200'
      ];
      container.innerHTML = composition.scenes.map((s, i) => {
        const cls = trackStyles[i % trackStyles.length];
        const durSec = Math.round((s.endFrame - s.startFrame) / videoConfig.fps);
        return `
          <div onclick="jumpToScene(${s.startFrame}, event)" title="Scene ${i+1}: ${s.tag || ''} (Klik untuk lompat)" class="h-full rounded ${cls} hover:brightness-125 border flex items-center justify-between px-1.5 text-[9px] font-mono truncate cursor-pointer transition select-none group" style="width:${((s.endFrame-s.startFrame)/totalF)*100}%;">
            <span class="truncate font-semibold tracking-tight">${s.tag || 'S'+(i+1)}</span>
            <span class="text-[8px] text-zinc-400 ml-1 hidden sm:inline font-mono">${durSec}s</span>
          </div>
        `;
      }).join('');

      renderSceneInspectorList();
    }

    function switchWorkbenchTab(tabName) {
      const genTab = document.getElementById('pipelineGeneratorTabContent') || document.getElementById('aiDirectorTabContent');
      const inspTab = document.getElementById('sceneInspectorTabContent');
      const genBtn = document.getElementById('tabBtnGenerator') || document.getElementById('tabBtnDirector');
      const inspBtn = document.getElementById('tabBtnInspector');

      if (tabName === 'generator' || tabName === 'director') {
        if (genTab) genTab.classList.remove('hidden');
        if (inspTab) inspTab.classList.add('hidden');
        if (genBtn) {
          genBtn.className = 'px-2.5 py-1 rounded text-xs font-semibold bg-zinc-800 text-white transition cursor-pointer';
        }
        if (inspBtn) {
          inspBtn.className = 'px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer flex items-center gap-1.5';
        }
      } else {
        if (genTab) genTab.classList.add('hidden');
        if (inspTab) inspTab.classList.remove('hidden');
        if (inspBtn) {
          inspBtn.className = 'px-2.5 py-1 rounded text-xs font-semibold bg-zinc-800 text-white transition cursor-pointer flex items-center gap-1.5';
        }
        if (genBtn) {
          genBtn.className = 'px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer';
        }
        renderSceneInspectorList();
      }
    }
    const switchSidebarTab = switchWorkbenchTab;

    function renderSceneInspectorList() {
      const container = document.getElementById('sceneInspectorList');
      const badge = document.getElementById('sceneCountBadge') || document.getElementById('inspectorSceneCountBadge');
      if (badge && composition.scenes) badge.innerText = composition.scenes.length;
      if (!container || !composition.scenes) return;

      container.innerHTML = composition.scenes.map((s, idx) => {
        const durSec = ((s.endFrame - s.startFrame) / videoConfig.fps).toFixed(1);
        const isCurrent = currentFrame >= s.startFrame && currentFrame < s.endFrame;
        return `
          <div onclick="jumpToScene(${s.startFrame}, event)" class="p-2.5 rounded-lg border ${isCurrent ? 'border-zinc-400 bg-zinc-800/90 text-white shadow-xs' : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300'} transition cursor-pointer space-y-1">
            <div class="flex items-center justify-between text-[11px] font-mono">
              <span class="font-semibold text-zinc-200 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-emerald-500' : 'bg-zinc-600'}"></span>
                ${s.tag || `SCENE 0${idx+1}`}
              </span>
              <span class="text-[10px] text-zinc-500">${durSec}s (F${s.startFrame}-${s.endFrame})</span>
            </div>
            <div class="text-xs font-medium text-zinc-100 truncate">
              ${(s.headline || '').replace(/\\*/g, '')}
            </div>
            ${s.subtext ? `<div class="text-[10px] text-zinc-500 line-clamp-1">${s.subtext}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    function toggleSettings() {
      const m = document.getElementById('settingsModal');
      m.classList.toggle('hidden');
      if (!m.classList.contains('hidden')) {
        document.getElementById('cfgApiBase').value = localStorage.getItem('mc_api_base') || '';
        document.getElementById('cfgApiKey').value = localStorage.getItem('mc_api_key') || '';
        document.getElementById('cfgModel').value = localStorage.getItem('mc_api_model') || '';
      }
    }

    function saveAiSettings() {
      localStorage.setItem('mc_api_base', document.getElementById('cfgApiBase').value.trim());
      localStorage.setItem('mc_api_key', document.getElementById('cfgApiKey').value.trim());
      localStorage.setItem('mc_api_model', document.getElementById('cfgModel').value.trim());
      toggleSettings();
      alert('Pengaturan AI tersimpan!');
    }

    function loadRemotionShowcaseTemplate() {
      const demoComp = {
        title: "Kenapa Developers Butuh Remotion?",
        style: "pi-v2-dark",
        fps: 30,
        scenes: [
          {
            tag: "01 / HOOK",
            headline: "Bikin Video Programatik Pakai *React*",
            subtext: "Bukan Premiere Pro atau After Effects, tapi fungsi React murni.",
            durationFrames: 120
          },
          {
            tag: "02 / CODING",
            headline: "Satu Frame = *Satu Render*",
            subtext: "Tiap frame dianimasikan dengan fisika spring deterministik tanpa jank.",
            codeSnippet: "const frame = useCurrentFrame();\nconst scale = spring({ frame, fps: 30 });\nreturn <Scene style={{ transform: `scale(${scale})` }} />;",
            language: "typescript",
            durationFrames: 150
          },
          {
            tag: "03 / FITUR UNGGULAN",
            headline: "Kekuatan Penuh *Web & AI Engine*",
            subtext: "Rendering MP4 headless via Chromium dan audio DSP otomatis.",
            points: [
              "Headless rendering di cloud server",
              "Audio procedural DSP terintegrasi",
              "100% data-driven dari input JSON"
            ],
            durationFrames: 150
          },
          {
            tag: "04 / CALL TO ACTION",
            headline: "Coba Buat *Videomu Sendiri*",
            subtext: "Gunakan tombol Naskah ➔ JSON di atas untuk topik apa pun.",
            ctaText: "Mulai Sekarang",
            badges: ["Open Source", "TypeScript", "Fast Render"],
            durationFrames: 120
          }
        ]
      };
      applyJsonString(JSON.stringify(demoComp), '🎬 Template Explainer');
    }

    async function generateAndRenderVideo() {
      const prompt = document.getElementById('promptInput').value.trim();
      if (!prompt) return alert('Masukkan prompt video terlebih dahulu');

      const btn = document.getElementById('generateBtn');
      const statusLog = document.getElementById('aiStatusLog');
      const statusText = document.getElementById('aiStatusText');

      btn.disabled = true;
      statusLog.classList.remove('hidden');
      statusText.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-blue-400 mr-1.5"></i> 1/3 MotionCraft Director merancang alur cerita & animasi...';

      try {
        const apiBase = localStorage.getItem('mc_api_base') || '';
        const apiKey = localStorage.getItem('mc_api_key') || '';
        const model = localStorage.getItem('mc_api_model') || '';

        const res = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: prompt,
            duration: selectedSec,
            style: selectedStyle,
            platform: selectedPlatform,
            apiBase: apiBase || undefined,
            apiKey: apiKey || undefined,
            model: model || undefined
          })
        });
        const data = await res.json();
        if (data.success && data.composition.scenes) {
          applyJsonString(JSON.stringify(data.composition), '🤖 AI Director');
          
          statusText.innerHTML = '<i class="fa-solid fa-music fa-bounce text-emerald-400 mr-1.5"></i> 2/3 Mensintesis musik latar procedural MotionCraft DSP...';
          await new Promise(r => setTimeout(r, 600));

          statusText.innerHTML = '<i class="fa-solid fa-film fa-spin text-sky-400 mr-1.5"></i> 3/3 FFmpeg encoding MP4 (+faststart audio-video sync)...';
          await renderVideoMP4();
        } else {
          alert('AI Error: ' + (data.error || 'Gagal merancang skrip'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        btn.disabled = false;
        statusLog.classList.add('hidden');
      }
    }

    function showRenderProgressModal(title, desc) {
      let modal = document.getElementById('renderProgressModal');
      if (modal) modal.style.display = 'flex';
      updateRenderProgressText(title, desc);
    }

    function hideRenderProgressModal() {
      let modal = document.getElementById('renderProgressModal');
      if (modal) modal.style.display = 'none';
    }

    function updateRenderProgressText(title, desc) {
      const t = document.getElementById('renderProgressTitle');
      if (t && title) t.textContent = title;
      const d = document.getElementById('renderProgressDesc');
      if (d && desc) d.textContent = desc;
    }

    async function renderVideoMP4() {
      const exportBtn = document.getElementById('exportDirectBtn');
      const originalHtml = exportBtn ? exportBtn.innerHTML : '';
      if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Rendering...';
      }
      
      const effectiveComposition = window._currentComposition || {
        ...composition,
        durationSec: videoConfig.durationSec,
        fps: videoConfig.fps,
        width: videoConfig.width,
        height: videoConfig.height
      };

      showRenderProgressModal(
        `Sedang Merender "${effectiveComposition.title || 'Video'}"...`,
        `Remotion Engine sedang mengompilasi ${effectiveComposition.scenes?.length || 0} scene (${effectiveComposition.durationSec || 12}s) dan audio procedural DSP. Mohon tunggu beberapa detik...`
      );

      try {
        const res = await fetch('/api/render-edu-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            composition: {
              ...effectiveComposition,
              width: videoConfig.width,
              height: videoConfig.height,
            },
            vibe: currentVibe,
            persona: selectedPersona,
            activeVisualElements: Array.from(activeVisualElements),
            style: effectiveComposition.style || selectedStyle
          })
        });

        const data = await res.json();
        hideRenderProgressModal();

        if (data.success) {
          showJsonToast('🎉 Render MP4 selesai! Membuka galeri video...');
          toggleGallery();
          fetchRenders();
        } else {
          alert('Render Error: ' + (data.error || 'Gagal render video'));
        }
      } catch (e) {
        hideRenderProgressModal();
        alert('Exception saat Render: ' + e.message);
      } finally {
        if (exportBtn) {
          exportBtn.disabled = false;
          exportBtn.innerHTML = originalHtml;
        }
      }
    }

    function pauseAllGalleryVideos() {
      const container = document.getElementById('galleryList');
      if (!container) return;
      const videos = container.querySelectorAll('video');
      videos.forEach(v => {
        try {
          if (!v.paused) {
            v.pause();
          }
        } catch (e) {}
      });
    }

    function onGalleryVideoPlay(playingVideo) {
      // 1. Pause any other video in gallery list
      const container = document.getElementById('galleryList');
      if (container) {
        const videos = container.querySelectorAll('video');
        videos.forEach(v => {
          if (v !== playingVideo && !v.paused) {
            try { v.pause(); } catch (e) {}
          }
        });
      }
      // 2. Stop DSP procedural preview audio
      stopAudioPreview();
      // 3. Stop canvas timeline playback
      if (isPlaying) {
        togglePlay();
      }
    }

    function toggleGallery() {
      const g = document.getElementById('galleryModal');
      if (!g) return;
      const isClosing = !g.classList.contains('hidden');
      if (isClosing) {
        pauseAllGalleryVideos();
      } else {
        stopAudioPreview();
        if (isPlaying) togglePlay();
        fetchRenders();
      }
      g.classList.toggle('hidden');
    }

    async function fetchRenders() {
      const container = document.getElementById('galleryList');
      try {
        const res = await fetch('/api/renders');
        const data = await res.json();
        if (!data.files || data.files.length === 0) {
          container.innerHTML = `<div class="p-6 text-center text-zinc-500 text-xs">Belum ada video yang dirender.</div>`;
          return;
        }
        container.innerHTML = data.files.map((f, idx) => `
          <div class="p-3.5 rounded-lg border border-zinc-800 bg-[#0c0d12] space-y-2.5 text-xs shadow-md hover:border-zinc-700 transition">
            <div class="flex justify-between items-center font-mono text-[11px] text-zinc-300">
              <span class="truncate font-semibold max-w-[240px] text-zinc-100" title="${f.filename}">${f.filename}</span>
              <div class="flex items-center gap-2">
                <span class="text-zinc-300 font-mono text-[10px] bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/60">${f.sizeMB} MB</span>
                <button onclick="deleteRenderItem('${f.filename}')" title="Hapus Video" class="text-rose-400 hover:text-rose-300 p-1 cursor-pointer transition active:scale-95">
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
            </div>
            <video id="galleryVideo_${idx}" onplay="onGalleryVideoPlay(this)" src="${f.url}" controls preload="metadata" class="w-full rounded-md bg-black object-contain max-h-56 border border-zinc-800/80 shadow-inner"></video>
            <div class="flex gap-2">
              <a href="${f.url}" download class="flex-1 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold text-center transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs">
                <i class="fa-solid fa-download text-[11px]"></i> Download MP4
              </a>
              <button onclick="copyVideoLink('${f.url}')" class="py-1.5 px-3 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-95 border border-zinc-700/60">
                <i class="fa-solid fa-link text-[11px]"></i> Salin Link
              </button>
            </div>
          </div>
        `).join('');
      } catch (e) {
        container.innerHTML = `<p class="text-xs text-red-400">Gagal memuat galeri: ${e.message}</p>`;
      }
    }

    async function deleteRenderItem(filename) {
      if (!confirm(`Hapus video ${filename}?`)) return;
      pauseAllGalleryVideos();
      try {
        const res = await fetch(`/api/renders/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) fetchRenders();
      } catch (e) { alert('Gagal menghapus: ' + e.message); }
    }

    function copyVideoLink(url) {
      const fullUrl = window.location.origin + url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl).then(() => {
          showJsonToast('Link video disalin ke clipboard: ' + fullUrl);
        });
      } else {
        prompt('Salin link video:', fullUrl);
      }
    }

    async function deleteAllRenders() {
      if (!confirm('Yakin ingin menghapus SEMUA hasil render video di server?')) return;
      pauseAllGalleryVideos();
      try {
        const res = await fetch('/api/renders', { method: 'DELETE' });
        const data = await res.json();
        if (data.success) fetchRenders();
      } catch (e) { alert('Error: ' + e.message); }
    }

    // ============================================================
    // JSON UPLOAD & EDITOR — User-provided composition.json support
    // ============================================================

    function handleJsonFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showJsonError('File JSON terlalu besar (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        applyJsonString(e.target.result, `📁 ${file.name}`);
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    function cleanAndParseJson(rawStr) {
      if (!rawStr || typeof rawStr !== 'string') {
        throw new Error('Input JSON kosong.');
      }
      let s = rawStr.trim();
      
      // 1. Remove markdown code fences if present: ```json ... ``` or ``` ... ```
      if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      
      // 2. Try direct JSON.parse
      try {
        return JSON.parse(s);
      } catch (err1) {
        // 3. Fallback: Search for outer curly brackets { ... }
        const firstBrace = s.indexOf('{');
        const lastBrace = s.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const candidate = s.slice(firstBrace, lastBrace + 1);
          try {
            return JSON.parse(candidate);
          } catch (err2) {
            throw new Error('Format JSON tidak valid: ' + err2.message);
          }
        }
        throw new Error('Format JSON tidak valid: ' + err1.message);
      }
    }

    function applyJsonString(jsonStr, source) {
      try {
        const parsed = cleanAndParseJson(jsonStr);
        if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
          throw new Error('JSON harus memiliki field "scenes" berupa array (minimal 1 scene).');
        }
        // Normalize: resolve startFrame/endFrame from durationFrames
        let currentFrameIdx = 0;
        const fps = Number(parsed.fps) || 30;
        parsed.scenes = parsed.scenes.map((sc, idx) => {
          const dur = Number(sc.durationFrames) ||
            (sc.endFrame != null && sc.startFrame != null ? (sc.endFrame - sc.startFrame) : 120);
          const start = currentFrameIdx;
          const end = start + dur;
          currentFrameIdx = end;
          return {
            ...sc,
            tag: sc.tag || `0${idx + 1} / SCENE`,
            headline: sc.headline || `Scene ${idx + 1}`,
            subtext: sc.subtext || '',
            durationFrames: dur,
            startFrame: start,
            endFrame: end
          };
        });
        parsed.durationSec = Math.ceil(currentFrameIdx / fps);
        parsed.fps = fps;

        // 1. UPDATE COMPOSITION IN MEMORY
        composition = parsed;
        window._currentComposition = parsed;

        // 2. UPDATE VIDEO CONFIG
        videoConfig.fps = fps;
        videoConfig.durationSec = parsed.durationSec;
        videoConfig.durationInFrames = currentFrameIdx;
        if (parsed.style) {
          selectPreset(parsed.style);
        }

        // 3. RESET PLAYBACK TO SCENE 1
        currentFrame = 0;
        isPlaying = false;
        cancelAnimationFrame(animationTimer);
        const playIcon = document.getElementById('playIcon');
        if (playIcon) playIcon.className = 'fa-solid fa-play ml-0.5 text-xs';
        const overlayIcon = document.getElementById('canvasPlayOverlayIcon');
        if (overlayIcon) overlayIcon.className = 'fa-solid fa-play ml-0.5 text-sm';

        // 4. RENDER TIMELINE TRACKS WITH USER'S SCENES
        renderTimelineTracks();
        const totalTimeText = document.getElementById('totalTimeText');
        if (totalTimeText) totalTimeText.innerText = parsed.durationSec.toFixed(2) + 's';
        const currentTimeText = document.getElementById('currentTimeText');
        if (currentTimeText) currentTimeText.innerText = '0.00s';
        const playhead = document.getElementById('playhead');
        if (playhead) playhead.style.left = '0%';
        const durBadge = document.getElementById('durBadge');
        if (durBadge) durBadge.innerText = parsed.durationSec + 's';
        const mobileDur = document.getElementById('mobileCompDurationBadge');
        if (mobileDur) mobileDur.innerText = parsed.durationSec + 's';

        // 5. REDRAW CANVAS IMMEDIATELY
        drawFrame(0);

        // 6. UPDATE ACTIVE COMPOSITION BANNER IN UI
        showActiveCompositionUI(parsed);

        // 7. PRE-WARM SYNCED DSP AUDIO & SFX
        if (typeof ensureStudioAudio === 'function') {
          ensureStudioAudio();
        }

        showJsonToast(`✅ Komposisi "${parsed.title || 'Baru'}" aktif: ${parsed.scenes.length} scene (${parsed.durationSec}s)`);
        return true;
      } catch (err) {
        showJsonError(err.message);
        alert('❌ Gagal memuat JSON: ' + err.message);
        return false;
      }
    }

    function showActiveCompositionUI(comp) {
      let banner = document.getElementById('activeCompBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'activeCompBanner';
        banner.className = 'p-3 bg-zinc-900 border border-zinc-800 rounded-lg mb-3 flex items-center justify-between';
        const aside = document.querySelector('aside');
        if (aside) {
          const target = document.getElementById('aiDirectorTabContent') || aside.firstChild;
          aside.insertBefore(banner, target);
        }
      }
      banner.innerHTML = `
        <div class="flex-1 min-w-0 pr-2">
          <div class="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active Composition
          </div>
          <div class="text-xs font-bold text-white truncate mt-0.5">
            ${comp.title || 'Untitled Video'}
          </div>
          <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
            ${comp.scenes.length} Scenes • ${comp.durationSec}s • ${comp.fps || 30}fps
          </div>
        </div>
        <button onclick="renderVideoMP4()" class="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-md transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs">
          Render MP4
        </button>
      `;

      // Update the main generate button on the left panel
      const mainBtn = document.getElementById('generateBtn');
      if (mainBtn) {
        mainBtn.innerHTML = '<span>Render Video (MP4)</span>';
        mainBtn.onclick = renderVideoMP4;
      }

      const headerTitle = document.getElementById('headerCompTitle');
      if (headerTitle) headerTitle.innerText = comp.title || 'Untitled Video';
      renderSceneInspectorList();
    }

    function showJsonError(msg) {
      const el = document.getElementById('jsonEditorError');
      if (el) el.textContent = msg;
      console.warn('[JSON Loader]', msg);
    }

    function showJsonToast(msg) {
      let toast = document.getElementById('jsonToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'jsonToast';
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#181a20;border:1px solid rgba(255,255,255,0.12);color:#f4f4f5;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:500;z-index:9999;max-width:440px;text-align:center;box-shadow:0 12px 30px rgba(0,0,0,0.6);transition:opacity 0.2s;';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.opacity = '1';
      clearTimeout(toast._t);
      toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
    }

    // Asset upload for media_spotlight scenes
    async function uploadAssetFile(file, sceneIndex) {
      if (!file) return;
      const MAX = 50 * 1024 * 1024;
      if (file.size > MAX) {
        showJsonToast('❌ File terlalu besar (max 50MB)');
        return;
      }
      const form = new FormData();
      form.append('file', file);
      showJsonToast('⏳ Mengupload asset...');
      try {
        const res = await fetch('/api/upload-asset', { method: 'POST', body: form });
        const json = await res.json();
        if (json.success) {
          // Inject mediaUrl into the composition scene
          if (window._currentComposition && window._currentComposition.scenes[sceneIndex]) {
            window._currentComposition.scenes[sceneIndex].mediaUrl = json.url;
            showJsonToast(`✅ Asset diupload: ${json.url}`);
            if (typeof renderPreviewFrame === 'function') renderPreviewFrame(0);
          } else {
            showJsonToast(`✅ Asset URL: ${json.url} (salin ke mediaUrl scene kamu)`);
          }
        } else {
          showJsonToast('❌ Upload gagal: ' + (json.error || 'Unknown error'));
        }
      } catch (err) {
        showJsonToast('❌ Upload error: ' + err.message);
      }
    }

    // =========================================================================
    // =========================================================================
    // 4-STEP LINEAR PIPELINE: PERSONA, VISUAL ELEMENTS, & MASTER PROMPT BUILDER
    // =========================================================================
    const activeVisualElements = new Set(['intro-hook', 'doodle', 'comparison', 'metric', 'points', 'cta']);

    function toggleVisualElement(key) {
      if (activeVisualElements.has(key)) {
        if (activeVisualElements.size > 1) {
          activeVisualElements.delete(key);
        }
      } else {
        activeVisualElements.add(key);
      }
      updateVisualElementsUI();
      updateMasterPromptPreview();
    }

    function updateVisualElementsUI() {
      const elements = ['intro-hook', 'doodle', 'comparison', 'metric', 'code', 'points', 'cta'];
      elements.forEach(id => {
        const btn = document.getElementById(`elem-${id}`);
        if (!btn) return;
        if (activeVisualElements.has(id)) {
          btn.className = 'elem-toggle-btn h-6 px-1.5 rounded border border-zinc-400 bg-zinc-800 text-white font-mono text-[9px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-xs';
        } else {
          btn.className = 'elem-toggle-btn h-6 px-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-500 font-mono text-[9px] hover:text-white flex items-center justify-center gap-1 cursor-pointer transition active:scale-95';
        }
      });
      const countBadge = document.getElementById('activeVisualCount');
      if (countBadge) {
        countBadge.textContent = `${activeVisualElements.size} Aktif`;
      }
    }

    const PERSONA_CONFIGS = {
      'tech-code': {
        name: 'Tech & Code',
        tone: 'Analitis, tajam, developer-centric, logis, struktur bersih tanpa basa-basi.',
        style: 'tech-neon-soft',
        music: 'tech-bright',
        introHook: '🚨 Bug / Bottleneck Kritis yang sering dialami Developer',
        archetypes: ['hero_typography', 'terminal_cli_render', 'comparison_split', 'stat_focus', 'outro_cta'],
        fewShotScenes: [
          {
            tag: "⚡ 01 / TECH HOOK",
            headline: "Stop Bikin Kode *Spaghetti!*",
            subtext: "Arsitektur buruk memperlambat tim hingga 80%. Ini solusi modernnya.",
            durationFrames: 120,
            badges: ["💻 DEV FIRST", "⚡ REACT 19", "🚀 ZERO CONFIG"]
          },
          {
            tag: "02 / MASALAH VS SOLUSI",
            headline: "Cara Lama vs *MotionCraft*",
            subtext: "Tinggalkan konfigurasi manual yang memakan waktu berhari-hari.",
            durationFrames: 150,
            leftTitle: "Cara Manual",
            itemsBad: ["1000 Baris Boilerplate", "Render Sering Crash", "Sulit Di-maintain"],
            rightTitle: "Solusi Otomatis",
            itemsGood: ["1-Klik AI Generator", "Render 60fps Deterministik", "Modular & Scalable"]
          },
          {
            tag: "03 / LIVE DEMO",
            headline: "Eksekusi Programatik *Instan*",
            subtext: "Cukup satu baris script untuk merender video berkualitas siaran.",
            durationFrames: 180,
            language: "bash",
            codeSnippet: "$ npm install -g motioncraft-engine\n$ npx motioncraft render Composition.tsx --out final.mp4\n✓ 1800 frames rendered in 4.2s (60 FPS)\n✓ Audio-video DSP faststart synced!"
          },
          {
            tag: "04 / PERFORMA",
            headline: "Kecepatan *Tanpa Kompromi*",
            subtext: "Hemat ratusan jam kerja tim engineering setiap minggunya.",
            durationFrames: 150,
            metricValue: "10x",
            metricLabel: "Performa Build & Render Lebih Cepat"
          },
          {
            tag: "05 / ACTION",
            headline: "Mulai Bangun *Sekarang*",
            subtext: "Open source, gratis, dan siap diintegrasikan ke CI/CD pipeline.",
            durationFrames: 120,
            ctaText: "Fork di GitHub & Coba Gratis!",
            badges: ["⭐ Star on GitHub", "npm i motioncraft", "MIT License"]
          }
        ]
      },
      'fintech-data': {
        name: 'Fintech & Data',
        tone: 'Kredibel, analitis, fokus pada metrik persentase, perbandingan performa, dan dampak finansial terukur.',
        style: 'pi-v2-dark',
        music: 'calm-punch',
        introHook: '💰 Kebocoran Finansial / ROI yang sering diabaikan',
        archetypes: ['hero_typography', 'stat_focus', 'comparison_split', 'kinetic_checklist', 'outro_cta'],
        fewShotScenes: [
          {
            tag: "📈 01 / FINTECH ALERT",
            headline: "Biaya Operasional Kamu *Bocor 40%?*",
            subtext: "Banyak bisnis kehilangan profit karena sistem kalkulasi yang usang.",
            durationFrames: 120,
            badges: ["💰 FINANSIAL 2026", "📊 AUDIT DATA", "⚡ PROFIT BOOST"]
          },
          {
            tag: "02 / DAMPAK METRIK",
            headline: "Efisiensi *Terdongkrak Nyata*",
            subtext: "Tingkatkan margin laba bersih dengan otomatisasi analisis berbasis data.",
            durationFrames: 150,
            metricValue: 85,
            metricLabel: "Penurunan Biaya Operasional Perusahaan"
          },
          {
            tag: "03 / PERBANDINGAN",
            headline: "Audit Manual vs *Otomatis AI*",
            subtext: "Eliminasi human-error dalam pembukuan dan analisis risiko.",
            durationFrames: 150,
            leftTitle: "Sistem Konvensional",
            itemsBad: ["Rekonsiliasi Lambat", "Rentan Kesalahan Input", "Laporan Telat Bulanan"],
            rightTitle: "Fintech Engine",
            itemsGood: ["Real-time Sync Data", "Akurasi Finansial 99.9%", "Dashboard Prediktif"]
          },
          {
            tag: "04 / PILAR KUNCI",
            headline: "3 Langkah *Proteksi Cuan*",
            subtext: "Terapkan langkah terukur ini untuk menjaga arus kas tetap sehat.",
            durationFrames: 180,
            points: ["Otomatisasi Laporan Arus Kas Harian", "Deteksi Anomali Biaya Secara Dini", "Alokasi Modal Berbasis Machine Learning"]
          },
          {
            tag: "05 / KLAIM AKSES",
            headline: "Amankan *Pertumbuhan Bisnismu*",
            subtext: "Jadwalkan konsultasi dan audit gratis bersama konsultan keuangan kami.",
            durationFrames: 120,
            ctaText: "Mulai Audit Finansial Gratis!",
            badges: ["100% Aman Terenkripsi", "Laporan Instan", "Free Trial 14 Hari"]
          }
        ]
      },
      'creator-story': {
        name: 'Content Creator',
        tone: 'Enerjik, hook 3 detik punchy, viral highlight, tempo cepat, bahasa santai to-the-point.',
        style: 'sunset-creator',
        music: 'warm-major',
        introHook: '🔥 Hook 3 Detik yang Menghentikan Jari Scroll di TikTok / Reels',
        archetypes: ['hero_typography', 'comparison_split', 'kinetic_checklist', 'stat_focus', 'outro_cta'],
        fewShotScenes: [
          {
            tag: "🔥 01 / VIRAL HOOK",
            headline: "Jangan Pernah Bikin Video *Kayak Gini!*",
            subtext: "90% kreator gagal di 3 detik pertama karena intro yang lambat.",
            durationFrames: 120,
            badges: ["🚨 JANGAN DI-SKIP", "⏱️ HANYA 30 DETIK", "💡 RAHASIA VIRAL"]
          },
          {
            tag: "02 / REALITA VS EKSPEKTASI",
            headline: "Kenapa Penonton *Langsung Kabur?*",
            subtext: "Bedakan konten membosankan dengan konten yang bikin nagih.",
            durationFrames: 150,
            leftTitle: "Konten Membosankan",
            itemsBad: ["Teks Diam Kayak Presentasi", "Transisi Lambat", "Audio Datar"],
            rightTitle: "Konten Kinetik",
            itemsGood: ["Visual Aktif Tiap 2 Detik", "Sound Effect Punchy", "Highlight Kata Kunci"]
          },
          {
            tag: "03 / FORMULA RAHASIA",
            headline: "3 Trik Bikin Video *Meledak*",
            subtext: "Gunakan formula ini pada setiap konten yang kamu upload.",
            durationFrames: 180,
            points: ["Hook Keras di 3 Detik Pertama", "Gunakan Elemen Visual Pendukung (Grafik & Checklist)", "Beri Ajakan Aksi yang Menjawab 'Kenapa Harus Follow'"]
          },
          {
            tag: "04 / BUKTI NYATA",
            headline: "Retensi Penonton *Naik Drastis*",
            subtext: "Algoritma akan merekomendasikan videomu ke jutaan orang baru.",
            durationFrames: 150,
            metricValue: "1.2M",
            metricLabel: "Total Impresi & Lonjakan Retensi"
          },
          {
            tag: "05 / VIRAL CTA",
            headline: "Simpan & Coba *Di Videomu!*",
            subtext: "Follow akun ini untuk update tips motion graphic dan konten viral harian.",
            durationFrames: 120,
            ctaText: "Follow Untuk Trik Konten Lainnya!",
            badges: ["📌 Simpan Video Ini", "❤️ Like & Share", "🔔 Aktifkan Notif"]
          }
        ]
      },
      'edu-business': {
        name: 'Edukasi & Bisnis',
        tone: 'Edukatif, terstruktur dengan poin checklist, perbandingan masalah vs solusi, CTA profesional.',
        style: 'remotion-light',
        music: 'dreamy',
        introHook: '🎓 Masalah Nyata di Industri & Solusi Praktis',
        archetypes: ['hero_typography', 'comparison_split', 'kinetic_checklist', 'stat_focus', 'outro_cta'],
        fewShotScenes: [
          {
            tag: "🎓 01 / EDUKASI STRATEGIS",
            headline: "Pernah Merasa Usaha *Jalan di Tempat?*",
            subtext: "Inilah framework yang membedakan bisnis pemula dengan bisnis berskala.",
            durationFrames: 120,
            badges: ["📚 STUDI KASUS", "🎯 SOLUSI PRAKTIS", "💡 BISNIS 2026"]
          },
          {
            tag: "02 / ANALISIS MASALAH",
            headline: "Cara Lama vs *Framework Baru*",
            subtext: "Jangan habiskan waktu pada aktivitas yang tidak berdampak pada hasil.",
            durationFrames: 150,
            leftTitle: "Pola Kerja Usang",
            itemsBad: ["Bekerja Tanpa Sistem", "Biaya Operasional Tak Terkendali", "Tergantung Satu Individu"],
            rightTitle: "Sistem Terstruktur",
            itemsGood: ["SOP Otomatis & Terukur", "Skalabilitas Teruji", "Pertumbuhan Berkelanjutan"]
          },
          {
            tag: "03 / 3 PILAR STRATEGIS",
            headline: "Langkah Eksekusi *Terarah*",
            subtext: "Penerapan 3 pilar utama untuk membangun pondasi yang kokoh.",
            durationFrames: 180,
            points: ["Validasi Kebutuhan Nyata Pasar", "Bangun Model Bisnis Berulang", "Skala Penjualan Melalui Otomatisasi"]
          },
          {
            tag: "04 / HASIL TERUKUR",
            headline: "Pertumbuhan yang *Bisa Dihitung*",
            subtext: "Hasil rata-rata klien setelah mengimplementasikan framework ini.",
            durationFrames: 150,
            metricValue: "4.5x",
            metricLabel: "Peningkatan Efisiensi & Pendapatan Bersih"
          },
          {
            tag: "05 / LANGKAH SELANJUTNYA",
            headline: "Dapatkan *Blueprint Gratis*",
            subtext: "Unduh panduan PDF langkah demi langkah dan mulai bertumbuh hari ini.",
            durationFrames: 120,
            ctaText: "Download Blueprint Lengkap!",
            badges: ["📄 Ebook Gratis", "🔗 Link di Deskripsi", "⭐ Rating 4.9/5"]
          }
        ]
      }
    };

    let currentVibe = 'ramai';
    const VIBE_CONFIGS = {
      ramai: {
        id: 'ramai',
        name: '🔥 Ramai & Viral',
        tag: 'High Energy, Bouncy Spring & Punchy Beats',
        recommendedElements: ['intro-hook', 'doodle', 'comparison', 'metric', 'points', 'cta'],
        style: 'sunset-creator'
      },
      eksklusif: {
        id: 'eksklusif',
        name: '✨ Eksklusif & Luxury',
        tag: 'Editorial Glassmorphism, Silky Damped Motion & Ambient Jazz',
        recommendedElements: ['doodle', 'points', 'cta'],
        style: 'mono-editorial'
      },
      cyber: {
        id: 'cyber',
        name: '💻 Cyber Tech',
        tag: 'Terminal IDE, Matrix Grid & Electronic Synthwave',
        recommendedElements: ['intro-hook', 'code', 'points', 'metric', 'cta'],
        style: 'tech-neon-soft'
      },
      corporate: {
        id: 'corporate',
        name: '📊 Corporate Data',
        tag: 'Clean Slate, Metric Shockwaves & Modern Tech Chime',
        recommendedElements: ['intro-hook', 'comparison', 'metric', 'points', 'cta'],
        style: 'pi-v2-dark'
      }
    };

    function selectVibe(key) {
      if (!VIBE_CONFIGS[key]) return;
      currentVibe = key;
      window.currentVibe = key;
      const cfg = VIBE_CONFIGS[key];

      ['ramai', 'eksklusif', 'cyber', 'corporate'].forEach(id => {
        const el = document.getElementById(`vibe-${id}`);
        if (!el) return;
        if (id === key) {
          el.className = 'vibe-card p-2 rounded-lg border border-amber-500/80 bg-zinc-800 text-white cursor-pointer transition flex items-center gap-2 shadow-xs';
          const t = el.querySelector('.text-\\[11px\\]');
          if (t) t.className = 'text-[11px] font-bold text-white truncate';
        } else {
          el.className = 'vibe-card p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 cursor-pointer transition flex items-center gap-2 text-zinc-300';
          const t = el.querySelector('.text-\\[11px\\]');
          if (t) t.className = 'text-[11px] font-bold text-zinc-200 truncate';
        }
      });

      const badge = document.getElementById('selectedVibeBadge');
      if (badge) badge.textContent = cfg.name;

      // Auto-toggle recommended elements
      activeVisualElements.clear();
      cfg.recommendedElements.forEach(e => activeVisualElements.add(e));
      updateVisualElementsUI();

      if (typeof selectPreset === 'function') {
        selectPreset(cfg.style);
      }

      // Trigger instant canvas frame redraw with new vibe styling
      if (typeof window.drawFrame === 'function') {
        window.drawFrame(typeof currentFrame !== 'undefined' ? currentFrame : 0);
      }

      updateMasterPromptPreview();
    }

    let selectedPersona = 'creator-story';

    function selectPersona(key) {
      if (!PERSONA_CONFIGS[key]) return;
      selectedPersona = key;
      const cfg = PERSONA_CONFIGS[key];

      ['tech-code', 'fintech-data', 'creator-story', 'edu-business'].forEach(id => {
        const el = document.getElementById(`persona-${id}`);
        if (!el) return;
        if (id === key) {
          el.className = 'persona-card p-2.5 rounded-lg border border-zinc-300 bg-zinc-800 text-white cursor-pointer transition flex flex-col justify-between shadow-xs';
          const heading = el.querySelector('span');
          if (heading) heading.className = 'font-semibold text-xs text-white';
          const p = el.querySelector('p');
          if (p) p.className = 'text-[9px] text-zinc-300 leading-tight mb-1.5';
        } else {
          el.className = 'persona-card p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 cursor-pointer transition flex flex-col justify-between';
          const heading = el.querySelector('span');
          if (heading) heading.className = 'font-semibold text-xs text-zinc-200';
          const p = el.querySelector('p');
          if (p) p.className = 'text-[9px] text-zinc-400 leading-tight mb-1.5';
        }
      });

      const badge = document.getElementById('selectedPersonaBadge');
      if (badge) badge.textContent = cfg.name;

      if (key === 'tech-code') {
        activeVisualElements.add('code');
      }

      updateVisualElementsUI();

      if (typeof selectPreset === 'function') {
        selectPreset(cfg.style);
      }

      updateMasterPromptPreview();
    }

    function generateMasterPrompt() {
      const rawInput = (document.getElementById('promptInput')?.value || '').trim();
      const scriptContent = rawInput || '[MASUKKAN TOPIK ATAU OUTLINE VIDEO DI SINI]';
      const cfg = PERSONA_CONFIGS[selectedPersona] || PERSONA_CONFIGS['creator-story'];
      const vibeCfg = VIBE_CONFIGS[currentVibe] || VIBE_CONFIGS['ramai'];
      const plat = typeof selectedPlatform !== 'undefined' ? selectedPlatform : '9:16';
      const durationSec = typeof selectedSec !== 'undefined' ? selectedSec : 60;
      const targetFrames = durationSec * 30;

      const activeList = Array.from(activeVisualElements);
      const fewShotJson = JSON.stringify({
        title: `Video ${cfg.name}: ${scriptContent.slice(0, 30)}...`,
        vibe: currentVibe,
        style: cfg.style,
        fps: 30,
        scenes: cfg.fewShotScenes
      }, null, 2);

      return `Kamu adalah MotionCraft Senior Motion Graphics Director & Remotion Code Architect kelas dunia.
Tugasmu adalah merancang file JSON animasi \`composition.json\` berenergi tinggi untuk MotionCraft Studio engine (berbasis React Remotion).

=== BRIEF PROYEK ===
- TOPIK / MATERI / NASKAH PENGGUNA:
"""
${scriptContent}
"""
- SUASANA VIDEO (VIBE): "${vibeCfg.name}" (${vibeCfg.tag})
- PERSONA TEMPLATE: "${cfg.name}"
- TONE & STYLE KOMUNIKASI: ${cfg.tone}
- VISUAL PRESET STYLE: "${cfg.style}"
- ASPECT RATIO: ${plat}
- TARGET DURASI TOTAL: ~${durationSec} detik (~${targetFrames} frames pada 30 FPS)
- KOMPONEN VISUAL AKTIF YANG HARUS DIGUNAKAN: ${activeList.join(', ')}

=== 4 ATURAN EMAS MOTION DESIGN & DOODLE SHAPES (WAJIB DIIKUTI) ===

1. ATURAN INTRO (SCENE 1 WAJIB RAME & MEMIKAT PENONTON):
   - Scene 1 adalah "3-Detik Penentu". DILARANG KERAS membuat intro yang datar atau cuma teks polos!
   - Tag Scene 1 WAJIB menggunakan label emosional bertanda khusus (contoh: "⚡ 01 / HOOK", "🚨 01 / PERHATIAN", "🔥 01 / RAHASIA").
   - Headline Scene 1 WAJIB pendek & punchy (maksimal 4-6 kata) dan WAJIB membubuhi tanda *bintang* pada 1-2 kata penting untuk aksen neon glow & loop doodle (contoh: "Stop Bikin Video *Membosankan!*").
   - Subtext Scene 1: 1 kalimat tajam yang memicu rasa ingin tahu.
   - WAJIB MENYERTAKAN "badges" PADA SCENE 1: Array 3 badge pendek huruf kapital pemancing rasa penasaran (contoh: ["🔥 VIRAL 2026", "⏱️ HANYA 30 DETIK", "💡 3 TRIK RAHASIA"]). Elemen ini akan dirender melayang dengan aura neon!

2. ATURAN DOODLE & BENTUK DINAMIS (HAND-DRAWN ACCENTS & SHAPES):
   - Tanda *bintang* pada kata memicu Doodle Circling Loop otomatis (lingkaran spidol organik ganda yang melingkari teks secara kinetik).
   - Pada Scene 1 (atau scene berproperti "doodle": "arrow"), panah melengkung tangan (Curved Doodle Arrow) dengan tag "LOOK!" akan meluncur menunjuk kata kunci hook.
   - Bintang kilau (Sparkle Burst Stars ✦) dan Corner Reticles [ ⌜ ⌝ ⌞ ⌟ ] otomatis membingkai kartu untuk visual premium & kinetik.

3. ATURAN VARIASI VISUAL (DILARANG 2 SCENE BERTURUT-TURUT BERISI HANYA TEKS):
   Setiap scene dalam video WAJIB memiliki SATU elemen visual hero pendukung berikut:
   - Elemen Perbandingan (Split VS):
     Field wajib: "leftTitle": "Cara Lama", "itemsBad": ["Masalah 1", "Masalah 2"], "rightTitle": "Solusi Baru", "itemsGood": ["Solusi 1", "Solusi 2"]
   - Elemen Data / Metric Counter:
     Field wajib: "metricValue": 85 (atau "10x", "+340%"), "metricLabel": "Peningkatan Efisiensi / Dampak"
   - Elemen Coding / Terminal CLI (khusus Tech / Dev):
     Field wajib: "language": "bash" atau "tsx", "codeSnippet": "baris 1\\nbaris 2\\nbaris 3"
   - Elemen Checklist Kinetik:
     Field wajib: "points": ["Poin Langkah 1", "Poin Langkah 2", "Poin Langkah 3"]
   - Elemen Outro Call-To-Action (CTA):
     Field wajib: "ctaText": "Ajakan Aksi!", "badges": ["Gratis", "Follow Sekarang", "Link di Bio"]

4. ATURAN KINETIK & WAKTU (30 FRAMES = 1 DETIK):
   - Scene 1 (Hook Pembuka): 90 - 120 frames (3 - 4 detik)
   - Scene 2 (Masalah / Perbandingan): 120 - 150 frames (4 - 5 detik)
   - Scene 3 & 4 (Demo / Data / Poin Checklist): 150 - 180 frames (5 - 6 detik)
   - Scene Terakhir (Outro CTA): 90 - 120 frames (3 - 4 detik)
   Total seluruh durationFrames harus mendekati ${targetFrames} frames.

=== CONTOH OUTPUT LENGKAP YANG WAJIB DICONTOH (FEW-SHOT JSON) ===
Keluarkan HANYA RAW JSON murni valid tanpa markdown (\`\`\`json) dan tanpa teks pengantar:

${fewShotJson}`;
    }

    function updateMasterPromptPreview() {
      const preview = document.getElementById('masterPromptPreview');
      if (preview) {
        preview.value = generateMasterPrompt();
      }
    }

    function togglePromptPreview() {
      const container = document.getElementById('masterPromptContainer');
      const text = document.getElementById('togglePromptPreviewText');
      if (!container) return;
      const isHidden = container.classList.contains('hidden');
      if (isHidden) {
        updateMasterPromptPreview();
        container.classList.remove('hidden');
        if (text) text.textContent = 'Tutup Prompt';
      } else {
        container.classList.add('hidden');
        if (text) text.textContent = 'Intip Prompt';
      }
    }

    function copyMasterPromptToClipboard() {
      const promptText = generateMasterPrompt();
      navigator.clipboard.writeText(promptText).then(() => {
        const btnText = document.getElementById('copyAiPromptText');
        const btnIcon = document.getElementById('copyAiPromptIcon');
        if (btnText) {
          const orig = btnText.textContent;
          btnText.textContent = '✅ Prompt Tersalin! Paste ke ChatGPT / Claude';
          if (btnIcon) btnIcon.className = 'fa-solid fa-check text-xs text-emerald-600';
          setTimeout(() => {
            btnText.textContent = orig;
            if (btnIcon) btnIcon.className = 'fa-regular fa-copy text-xs';
          }, 3000);
        }
        showJsonToast('📋 Prompt berhasil disalin! Buka ChatGPT / Claude lalu paste.');
      }).catch(err => {
        const container = document.getElementById('masterPromptContainer');
        if (container) container.classList.remove('hidden');
        const preview = document.getElementById('masterPromptPreview');
        if (preview) {
          preview.value = promptText;
          preview.select();
          document.execCommand('copy');
          showJsonToast('📋 Prompt berhasil disalin!');
        } else {
          alert('Gagal menyalin ke clipboard: ' + err.message);
        }
      });
    }

    function applyStep4JsonPreview() {
      const errBox = document.getElementById('step4JsonError');
      if (errBox) {
        errBox.classList.add('hidden');
        errBox.textContent = '';
      }

      const rawJson = (document.getElementById('step4JsonInput')?.value || '').trim();
      if (!rawJson) {
        if (errBox) {
          errBox.textContent = 'Tempel output JSON dari AI terlebih dahulu ke kotak ini.';
          errBox.classList.remove('hidden');
        } else {
          alert('Tempel output JSON dari AI terlebih dahulu!');
        }
        return false;
      }

      try {
        const ok = applyJsonString(rawJson, '📋 Tempel JSON');
        if (ok) {
          showJsonToast('✅ JSON berhasil diterapkan ke canvas preview!');
          if (window.innerWidth < 768 && typeof window.setMobileStudioTab === 'function') {
            window.setMobileStudioTab('preview');
          }
          return true;
        }
        return false;
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message;
          errBox.classList.remove('hidden');
        } else {
          alert('Error JSON: ' + err.message);
        }
        return false;
      }
    }

    async function applyStep4JsonAndRender() {
      const ok = applyStep4JsonPreview();
      if (ok) {
        await renderVideoMP4();
      }
    }

    function handleStep4FileUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('File JSON terlalu besar (maksimal 5MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const input = document.getElementById('step4JsonInput');
        if (input) input.value = content;
        applyStep4JsonPreview();
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    // Mobile Studio Viewport Switching (antislop-layoutmobile & mobile-native)
    function setMobileStudioTab(tab) {
      const aside = document.getElementById('studioWorkbenchAside');
      const main = document.getElementById('studioPreviewMain');
      const tabEditor = document.getElementById('mobileTabEditor');
      const tabPreview = document.getElementById('mobileTabPreview');
      if (!aside || !main) return;

      if (tab === 'preview') {
        aside.classList.add('hidden');
        aside.classList.remove('flex');
        main.classList.remove('hidden');
        main.classList.add('flex');
        if (tabEditor) {
          tabEditor.className = 'h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer text-zinc-400 hover:text-white';
        }
        if (tabPreview) {
          tabPreview.className = 'h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer bg-zinc-800 text-white shadow-xs';
        }
        if (typeof window.renderFrame === 'function') {
          setTimeout(window.renderFrame, 30);
        }
      } else {
        aside.classList.remove('hidden');
        aside.classList.add('flex');
        main.classList.add('hidden');
        main.classList.remove('flex');
        if (tabEditor) {
          tabEditor.className = 'h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer bg-zinc-800 text-white shadow-xs';
        }
        if (tabPreview) {
          tabPreview.className = 'h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer text-zinc-400 hover:text-white';
        }
      }
    }
    window.setMobileStudioTab = setMobileStudioTab;

    window.addEventListener('resize', () => {
      const aside = document.getElementById('studioWorkbenchAside');
      const main = document.getElementById('studioPreviewMain');
      if (window.innerWidth >= 768) {
        if (aside) { aside.classList.remove('hidden'); aside.classList.add('flex'); }
        if (main) { main.classList.remove('hidden'); main.classList.add('flex'); }
      }
    });

    // Expose pipeline functions to window for DOM onclick attributes
    window.selectVibe = selectVibe;
    window.currentVibe = currentVibe;
    window.selectPersona = selectPersona;
    window.toggleVisualElement = toggleVisualElement;
    window.updateVisualElementsUI = updateVisualElementsUI;
    window.generateMasterPrompt = generateMasterPrompt;
    window.updateMasterPromptPreview = updateMasterPromptPreview;
    window.togglePromptPreview = togglePromptPreview;
    window.copyMasterPromptToClipboard = copyMasterPromptToClipboard;
    window.applyStep4JsonPreview = applyStep4JsonPreview;
    window.applyStep4JsonAndRender = applyStep4JsonAndRender;
    window.handleStep4FileUpload = handleStep4FileUpload;
    window.switchWorkbenchTab = switchWorkbenchTab;
    window.switchSidebarTab = switchWorkbenchTab;

    // Attach live update listener on promptInput
    document.addEventListener('DOMContentLoaded', () => {
      const pIn = document.getElementById('promptInput');
      if (pIn) {
        pIn.addEventListener('input', () => {
          const c = document.getElementById('masterPromptContainer');
          if (c && !c.classList.contains('hidden')) {
            updateMasterPromptPreview();
          }
        });
      }
    });
    const _origRender = typeof window.startOfficialRender === 'function' ? window.startOfficialRender : null;