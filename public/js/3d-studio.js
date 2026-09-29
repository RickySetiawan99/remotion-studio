/**
 * MotionCraft 3D Animation Studio Controller
 * Powers the interactive client Three.js viewport, OrbitControls, and Remotion 3D render pipeline.
 */

(function () {
  // Studio State
  const state = {
    modelType: 'smartphone',
    customGlbUrl: null,
    motionType: 'spin',
    motionSpeed: 1.0,
    lightingPreset: 'cyber',
    material: {
      color: '#06b6d4',
      metalness: 0.85,
      roughness: 0.2,
      wireframe: false,
    },
    textOverlay: {
      badge: '3D SHOWCASE',
      headline: 'Visualisasi 3D *Masa Depan*',
      subtext: 'Engine video motion 3D berbasis WebGL, Three.js & Remotion.',
      ctaText: 'Explore 3D Studio',
    },
    aspectRatio: 'portrait',
    durationSec: 5,
    audioPreset: 'tech-bright',
    isPlaying: true,
    currentFrame: 0,
  };

  // Three.js Core Variables
  let scene, camera, renderer, controls;
  let currentMeshGroup = null;
  let lightsGroup = null;
  let animationFrameId = null;
  const mountEl = document.getElementById('threeCanvasMount');

  // ==========================================================================
  // INITIALIZE THREE.JS SCENE
  // ==========================================================================
  function initThree() {
    if (!mountEl) return;

    // Scene
    scene = new THREE.Scene();

    // Camera
    const width = mountEl.clientWidth || 360;
    const height = mountEl.clientHeight || 640;
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, state.aspectRatio === 'portrait' ? 5.4 : 4.2);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    // OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.maxDistance = 12;
      controls.minDistance = 2;
    }

    // Lights
    lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    setupLighting(state.lightingPreset);

    // Mesh
    loadModelMesh(state.modelType);

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => onWindowResize());
    resizeObserver.observe(mountEl);

    // Start Loop
    startAnimationLoop();
  }

  function onWindowResize() {
    if (!mountEl || !renderer || !camera) return;
    const w = mountEl.clientWidth;
    const h = mountEl.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // ==========================================================================
  // LIGHTING PRESETS
  // ==========================================================================
  function setupLighting(preset) {
    if (!lightsGroup) return;
    // Clear existing lights
    while (lightsGroup.children.length > 0) {
      lightsGroup.remove(lightsGroup.children[0]);
    }

    if (preset === 'cyber') {
      const ambient = new THREE.AmbientLight(0x06b6d4, 0.4);
      const key = new THREE.DirectionalLight(0xec4899, 2.0);
      key.position.set(5, 8, 5);
      const rim1 = new THREE.PointLight(0x3b82f6, 2.8, 20);
      rim1.position.set(-5, -3, -2);
      const rim2 = new THREE.PointLight(0x06b6d4, 1.5, 20);
      rim2.position.set(0, 4, 3);
      lightsGroup.add(ambient, key, rim1, rim2);
    } else if (preset === 'luxury') {
      const ambient = new THREE.AmbientLight(0xfef3c7, 0.45);
      const key = new THREE.DirectionalLight(0xf59e0b, 2.2);
      key.position.set(4, 8, 4);
      const rim1 = new THREE.PointLight(0xfbbf24, 1.8, 20);
      rim1.position.set(-4, -2, -3);
      const fill = new THREE.PointLight(0xffffff, 1.4, 20);
      fill.position.set(3, 2, 4);
      lightsGroup.add(ambient, key, rim1, fill);
    } else if (preset === 'obsidian') {
      const ambient = new THREE.AmbientLight(0x0f172a, 0.2);
      const spot = new THREE.DirectionalLight(0xffffff, 2.8);
      spot.position.set(0, 9, 3);
      const rim1 = new THREE.PointLight(0x6366f1, 1.8, 20);
      rim1.position.set(-4, -3, -2);
      const fill = new THREE.PointLight(0xa855f7, 1.4, 20);
      fill.position.set(4, 2, 3);
      lightsGroup.add(ambient, spot, rim1, fill);
    } else {
      // Clean
      const ambient = new THREE.AmbientLight(0xffffff, 0.65);
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(5, 8, 5);
      const fill = new THREE.DirectionalLight(0xcbd5e1, 0.9);
      fill.position.set(-5, -4, -3);
      lightsGroup.add(ambient, key, fill);
    }
  }

  // ==========================================================================
  // PROCEDURAL MESH BUILDERS
  // ==========================================================================
  function createMaterial() {
    return new THREE.MeshStandardMaterial({
      color: state.material.color,
      metalness: state.material.metalness,
      roughness: state.material.roughness,
      wireframe: state.material.wireframe,
    });
  }

  function loadModelMesh(type) {
    if (currentMeshGroup) {
      scene.remove(currentMeshGroup);
      currentMeshGroup = null;
    }

    currentMeshGroup = new THREE.Group();

    if (type === 'coin') {
      // Golden Coin Token
      const coinMat = new THREE.MeshStandardMaterial({
        color: state.material.color || '#f59e0b',
        metalness: Math.max(0.75, state.material.metalness),
        roughness: Math.min(0.2, state.material.roughness),
        wireframe: state.material.wireframe,
      });
      const cylGeo = new THREE.CylinderGeometry(1.35, 1.35, 0.16, 64);
      const cyl = new THREE.Mesh(cylGeo, coinMat);
      cyl.rotation.x = Math.PI / 2;
      currentMeshGroup.add(cyl);

      // Outer Bevel Ring (Front & Back)
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 });
      const ringGeo = new THREE.RingGeometry(1.05, 1.28, 64);
      const frontRing = new THREE.Mesh(ringGeo, ringMat);
      frontRing.position.z = 0.082;
      const backRing = new THREE.Mesh(ringGeo, ringMat);
      backRing.position.z = -0.082;
      backRing.rotation.y = Math.PI;
      currentMeshGroup.add(frontRing, backRing);

      // Center Emblem
      const centerMat = new THREE.MeshStandardMaterial({ color: state.material.color, metalness: 0.9, roughness: 0.15 });
      const centerGeo = new THREE.CircleGeometry(0.55, 32);
      const frontCenter = new THREE.Mesh(centerGeo, centerMat);
      frontCenter.position.z = 0.083;
      currentMeshGroup.add(frontCenter);
    } else if (type === 'box') {
      // Product Cube
      const boxMat = createMaterial();
      const boxGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
      const box = new THREE.Mesh(boxGeo, boxMat);
      currentMeshGroup.add(box);

      // Glowing Edges
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.82, 1.82, 1.82));
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
      currentMeshGroup.add(line);
    } else if (type === 'geometric') {
      // Cyber Torus Knot
      const torusMat = createMaterial();
      const torusGeo = new THREE.TorusKnotGeometry(1.05, 0.32, 128, 32);
      const torus = new THREE.Mesh(torusGeo, torusMat);
      currentMeshGroup.add(torus);
    } else if (type === 'custom-glb' && state.customGlbUrl) {
      // Load Custom GLB/GLTF
      if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
          state.customGlbUrl,
          gltf => {
            const root = gltf.scene;
            // Normalize scale and center
            const box = new THREE.Box3().setFromObject(root);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 2.5 / maxDim;
            root.scale.set(scale, scale, scale);
            const center = box.getCenter(new THREE.Vector3());
            root.position.sub(center.multiplyScalar(scale));
            currentMeshGroup.add(root);
          },
          undefined,
          err => console.error('Error loading GLB:', err)
        );
      }
    } else {
      // Default: Smartphone Mockup
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.15,
        wireframe: state.material.wireframe,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.6, 0.16), bodyMat);
      currentMeshGroup.add(body);

      // Rim Bezel Edge
      const rimMat = new THREE.MeshStandardMaterial({
        color: state.material.color,
        metalness: 0.95,
        roughness: 0.1,
      });
      const rim = new THREE.Mesh(new THREE.BoxGeometry(1.84, 3.64, 0.14), rimMat);
      currentMeshGroup.add(rim);

      // Glass Screen
      const screenMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.5, roughness: 0.05 });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 3.48), screenMat);
      screen.position.z = 0.082;
      currentMeshGroup.add(screen);

      // App UI Glow Layer
      const previewMat = new THREE.MeshStandardMaterial({
        color: state.material.color,
        roughness: 0.2,
        metalness: 0.3,
        opacity: 0.85,
        transparent: true,
      });
      const preview = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 3.32), previewMat);
      preview.position.z = 0.084;
      currentMeshGroup.add(preview);

      // Notch
      const notch = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.08), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      notch.position.set(0, 1.55, 0.086);
      currentMeshGroup.add(notch);
    }

    scene.add(currentMeshGroup);
  }

  // ==========================================================================
  // ANIMATION LOOP & TIMELINE
  // ==========================================================================
  function startAnimationLoop() {
    const totalFrames = state.durationSec * 30;

    function renderFrame() {
      animationFrameId = requestAnimationFrame(renderFrame);

      if (controls) controls.update();

      if (state.isPlaying) {
        state.currentFrame = (state.currentFrame + 1) % totalFrames;
        const slider = document.getElementById('timelineSlider');
        if (slider) slider.value = state.currentFrame;
        updateTimeLabels(state.currentFrame, totalFrames);
      }

      // Compute motion transforms for currentFrame
      if (currentMeshGroup) {
        const frame = state.currentFrame;
        const speed = state.motionSpeed || 1;

        if (state.motionType === 'spin') {
          currentMeshGroup.rotation.y = frame * 0.032 * speed;
          currentMeshGroup.rotation.x = Math.sin(frame * 0.02 * speed) * 0.16;
          currentMeshGroup.position.y = Math.sin(frame * 0.04 * speed) * 0.12;
        } else if (state.motionType === 'float') {
          currentMeshGroup.position.y = Math.sin(frame * 0.06 * speed) * 0.25;
          currentMeshGroup.rotation.x = Math.sin(frame * 0.03 * speed) * 0.18;
          currentMeshGroup.rotation.y = Math.cos(frame * 0.025 * speed) * 0.22;
        } else if (state.motionType === 'orbit') {
          currentMeshGroup.rotation.y = frame * 0.045 * speed;
          currentMeshGroup.rotation.x = 0.32 + Math.sin(frame * 0.025 * speed) * 0.12;
          currentMeshGroup.position.y = Math.cos(frame * 0.03 * speed) * 0.14;
        } else if (state.motionType === 'spring-pop') {
          const cycle = frame % 60;
          const pop = Math.sin((cycle / 60) * Math.PI);
          currentMeshGroup.rotation.y = frame * 0.02 * speed + pop * 0.4;
          const s = 1.0 + pop * 0.12;
          currentMeshGroup.scale.set(s, s, s);
        }
      }

      renderer.render(scene, camera);
    }

    renderFrame();
  }

  function updateTimeLabels(current, total) {
    const curSec = (current / 30).toFixed(2);
    const totSec = (total / 30).toFixed(2);
    const curLabel = document.getElementById('timelineCurrentTime');
    const totLabel = document.getElementById('timelineTotalTime');
    if (curLabel) curLabel.textContent = `00:${curSec.padStart(5, '0')}`;
    if (totLabel) totLabel.textContent = `00:${totSec.padStart(5, '0')}`;
  }

  // ==========================================================================
  // UI EVENT HANDLERS & EXPOSURES
  // ==========================================================================
  window.switch3dTab = function (tabName) {
    ['model', 'motion', 'light', 'text'].forEach(t => {
      const btn = document.getElementById(`tab3dBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
      const content = document.getElementById(`tabContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
      if (btn && content) {
        if (t === tabName) {
          btn.className = 'flex-1 h-8 px-2 rounded-md text-xs font-semibold text-zinc-100 bg-zinc-800 border border-zinc-700/60 shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer';
          content.classList.remove('hidden');
        } else {
          btn.className = 'flex-1 h-8 px-2 rounded-md text-xs font-semibold text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition cursor-pointer';
          content.classList.add('hidden');
        }
      }
    });
  };

  window.selectModelPreset = function (type) {
    state.modelType = type;
    const names = {
      smartphone: 'Smartphone Mockup 3D',
      coin: 'Golden Crypto Coin 3D',
      box: 'Product Showcase Box 3D',
      geometric: 'Cyber Torus Knot 3D',
      'custom-glb': 'Custom 3D Model (.GLB)',
    };
    const titleEl = document.getElementById('activeModelName');
    if (titleEl) titleEl.textContent = names[type] || '3D Object';

    ['smartphone', 'coin', 'box', 'geometric'].forEach(m => {
      const el = document.getElementById(`mesh-${m}`);
      if (!el) return;
      if (m === type) {
        el.className = 'p-3 rounded-xl border border-amber-500/80 bg-zinc-800/80 text-white cursor-pointer transition flex flex-col gap-1.5 shadow-sm';
      } else {
        el.className = 'p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 text-zinc-300 cursor-pointer transition flex flex-col gap-1.5';
      }
    });

    loadModelMesh(type);
  };

  window.selectMotion = function (type) {
    state.motionType = type;
    ['spin', 'float', 'orbit', 'spring-pop'].forEach(m => {
      const el = document.getElementById(`motion-${m}`);
      if (!el) return;
      if (m === type) {
        el.className = 'p-2.5 rounded-lg border border-amber-500/80 bg-zinc-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition';
      } else {
        el.className = 'p-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition';
      }
    });
  };

  window.updateMotionSpeed = function (val) {
    state.motionSpeed = parseFloat(val);
    const label = document.getElementById('speedValueLabel');
    if (label) label.textContent = `${state.motionSpeed.toFixed(1)}x`;
  };

  window.selectLighting = function (preset) {
    state.lightingPreset = preset;
    ['cyber', 'luxury', 'obsidian', 'clean'].forEach(l => {
      const el = document.getElementById(`light-${l}`);
      if (!el) return;
      if (l === preset) {
        el.className = 'p-2.5 rounded-lg border border-amber-500/80 bg-zinc-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition';
      } else {
        el.className = 'p-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition';
      }
    });
    setupLighting(preset);
  };

  window.updateMeshColor = function (color) {
    state.material.color = color;
    loadModelMesh(state.modelType);
    updateOverlayText();
  };

  window.updateMaterialProps = function () {
    const metal = parseFloat(document.getElementById('metalnessSlider')?.value || 0.85);
    const rough = parseFloat(document.getElementById('roughnessSlider')?.value || 0.20);
    const wire = Boolean(document.getElementById('wireframeCheck')?.checked);

    state.material.metalness = metal;
    state.material.roughness = rough;
    state.material.wireframe = wire;

    const metalVal = document.getElementById('metalnessVal');
    const roughVal = document.getElementById('roughnessVal');
    if (metalVal) metalVal.textContent = metal.toFixed(2);
    if (roughVal) roughVal.textContent = rough.toFixed(2);

    loadModelMesh(state.modelType);
  };

  window.updateOverlayText = function () {
    const badge = document.getElementById('textBadgeInput')?.value || '';
    const headline = document.getElementById('textHeadlineInput')?.value || '';
    const subtext = document.getElementById('textSubtextInput')?.value || '';
    const cta = document.getElementById('textCtaInput')?.value || '';

    state.textOverlay = { badge, headline, subtext, ctaText: cta };

    // Update Live HTML Preview
    const pBadge = document.getElementById('previewBadge');
    if (pBadge) {
      pBadge.innerHTML = `<span class="w-2 h-2 rounded-full" style="background:${state.material.color}"></span><span>${badge}</span>`;
      pBadge.style.borderColor = `${state.material.color}80`;
    }

    const pHead = document.getElementById('previewHeadline');
    if (pHead) {
      const parts = headline.split(/(\*[^*]+\*)/g);
      pHead.innerHTML = parts
        .map(p => {
          if (p.startsWith('*') && p.endsWith('*')) {
            return `<span class="px-2 py-0.5 rounded-md text-white shadow-lg" style="background:${state.material.color}">${p.slice(1, -1)}</span>`;
          }
          return p;
        })
        .join('');
    }

    const pSub = document.getElementById('previewSubtext');
    if (pSub) pSub.textContent = subtext;

    const pCta = document.getElementById('previewCta');
    if (pCta) {
      pCta.innerHTML = `<span>${cta}</span><span>→</span>`;
      pCta.style.background = `linear-gradient(135deg, ${state.material.color} 0%, #3b82f6 100%)`;
    }
  };

  window.selectAspectRatio = function (ratio) {
    state.aspectRatio = ratio;
    ['portrait', 'landscape', 'square'].forEach(r => {
      const el = document.getElementById(`ratio-${r}`);
      if (!el) return;
      if (r === ratio) {
        el.className = 'py-2 px-1 text-center rounded-lg border border-amber-500/80 bg-zinc-800 text-white font-bold text-xs cursor-pointer';
      } else {
        el.className = 'py-2 px-1 text-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 font-bold text-xs cursor-pointer';
      }
    });

    const wrapper = document.getElementById('canvasViewportWrapper');
    const badge = document.getElementById('activeRatioBadge');
    if (wrapper) {
      if (ratio === 'portrait') {
        wrapper.style.aspectRatio = '9/16';
        if (badge) badge.textContent = '1080 × 1920 (9:16)';
        if (camera) camera.position.z = 5.4;
      } else if (ratio === 'landscape') {
        wrapper.style.aspectRatio = '16/9';
        if (badge) badge.textContent = '1920 × 1080 (16:9)';
        if (camera) camera.position.z = 4.2;
      } else {
        wrapper.style.aspectRatio = '1/1';
        if (badge) badge.textContent = '1080 × 1080 (1:1)';
        if (camera) camera.position.z = 4.8;
      }
      setTimeout(() => onWindowResize(), 50);
    }
  };

  window.selectDuration = function (dur) {
    state.durationSec = dur;
    [5, 10, 15].forEach(d => {
      const el = document.getElementById(`dur-${d}`);
      if (!el) return;
      if (d === dur) {
        el.className = 'py-2 px-1 text-center rounded-lg border border-amber-500/80 bg-zinc-800 text-white font-bold text-xs cursor-pointer';
      } else {
        el.className = 'py-2 px-1 text-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 font-bold text-xs cursor-pointer';
      }
    });

    const totalFrames = dur * 30;
    const slider = document.getElementById('timelineSlider');
    if (slider) slider.max = totalFrames;
    updateTimeLabels(state.currentFrame, totalFrames);
  };

  window.togglePlayback = function () {
    state.isPlaying = !state.isPlaying;
    const icon = document.getElementById('playIcon');
    if (icon) {
      icon.className = state.isPlaying ? 'fa-solid fa-pause text-xs' : 'fa-solid fa-play text-xs';
    }
  };

  window.resetCamera = function () {
    if (camera && controls) {
      camera.position.set(0, 0, state.aspectRatio === 'portrait' ? 5.4 : 4.2);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };

  window.scrubTimeline = function (val) {
    state.isPlaying = false;
    state.currentFrame = parseInt(val, 10);
    const icon = document.getElementById('playIcon');
    if (icon) icon.className = 'fa-solid fa-play text-xs';
    updateTimeLabels(state.currentFrame, state.durationSec * 30);
  };

  window.handleGlbUpload = async function (e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    const statusEl = document.getElementById('uploadStatusText');
    if (statusEl) {
      statusEl.textContent = `Mengupload ${file.name}...`;
      statusEl.classList.remove('hidden');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-asset', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        state.customGlbUrl = data.url;
        state.modelType = 'custom-glb';
        if (statusEl) statusEl.textContent = `Model ${file.name} berhasil di-upload!`;
        const titleEl = document.getElementById('activeModelName');
        if (titleEl) titleEl.textContent = file.name;
        loadModelMesh('custom-glb');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      if (statusEl) statusEl.textContent = `Gagal upload: ${err.message}`;
    }
  };

  // ==========================================================================
  // RENDER 3D VIDEO (REMOTION HEADLESS PIPELINE)
  // ==========================================================================
  window.render3DVideo = async function () {
    const modal = document.getElementById('render3DModal');
    const progressContent = document.getElementById('render3DProgressContent');
    const successContent = document.getElementById('render3DSuccessContent');
    const statusText = document.getElementById('render3DStatusText');
    const pctLabel = document.getElementById('render3DPct');
    const progressBar = document.getElementById('render3DProgressBar');
    const downloadBtn = document.getElementById('download3DVideoBtn');

    if (!modal) return;
    modal.classList.remove('hidden');
    if (progressContent) progressContent.classList.remove('hidden');
    if (successContent) successContent.classList.add('hidden');
    if (statusText) statusText.textContent = 'Menyiapkan WebGL Remotion Engine...';
    if (pctLabel) pctLabel.textContent = '10%';
    if (progressBar) progressBar.style.width = '10%';

    const payload = {
      modelType: state.modelType,
      customGlbUrl: state.customGlbUrl,
      motionType: state.motionType,
      motionSpeed: state.motionSpeed,
      lightingPreset: state.lightingPreset,
      material: state.material,
      textOverlay: state.textOverlay,
      durationSec: state.durationSec,
      aspectRatio: state.aspectRatio,
      audioPreset: state.audioPreset,
    };

    // Simulate steady progress while server renders
    let progressTimer = setInterval(() => {
      const cur = parseInt(progressBar.style.width || '10', 10);
      if (cur < 90) {
        const next = cur + Math.floor(Math.random() * 8) + 2;
        progressBar.style.width = `${next}%`;
        pctLabel.textContent = `${next}%`;
        if (next > 40 && next < 75) statusText.textContent = 'Merender 3D WebGL frame-per-frame...';
        if (next >= 75) statusText.textContent = 'Menggabungkan musik latar & SFX (-14 LUFS)...';
      }
    }, 1200);

    try {
      const res = await fetch('/api/render-3d-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error saat render video 3D');
      }

      const data = await res.json();
      if (data.success && data.url) {
        progressBar.style.width = '100%';
        pctLabel.textContent = '100%';
        statusText.textContent = 'Render Berhasil!';

        setTimeout(() => {
          if (progressContent) progressContent.classList.add('hidden');
          if (successContent) successContent.classList.remove('hidden');
          if (downloadBtn) {
            downloadBtn.href = data.url;
            downloadBtn.download = data.filename;
          }
        }, 500);
      } else {
        throw new Error('Data video tidak valid dari server');
      }
    } catch (err) {
      clearInterval(progressTimer);
      alert(`Gagal merender video 3D: ${err.message}`);
      modal.classList.add('hidden');
    }
  };

  window.closeRenderModal = function () {
    const modal = document.getElementById('render3DModal');
    if (modal) modal.classList.add('hidden');
  };

  // Start on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThree);
  } else {
    initThree();
  }
})();
