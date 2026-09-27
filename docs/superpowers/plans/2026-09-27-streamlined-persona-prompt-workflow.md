# Streamlined 4-Step Persona & Prompt Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize MotionCraft Studio UI into a streamlined 4-step linear pipeline (Topic ➔ Persona Template ➔ Copy AI Prompt ➔ Paste JSON & Render), clean up scattered header buttons, and eliminate obsolete modals.

**Architecture:** 
- The Left Sidebar (`workbench.html`) becomes a single-column, 4-step vertical pipeline without popup modal friction.
- Top Header (`header.html`) is simplified to brand, active composition status, and 3 utility buttons (Audio DSP, Galeri, Settings).
- Client controller (`studio.js`) provides dynamic master prompt compilation targeting external LLMs (ChatGPT/Claude) and handles 1-click clipboard copying and direct Step 4 JSON application.
- `server.js` auto-composes sections into `public/index.html`.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, TailwindCSS (CDN), FontAwesome 6, Express.js (Node.js runtime), Remotion 4.0.

## Global Constraints
- Preserve all active DOM element IDs referenced by core engine: `remotionCanvas`, `canvasWrapper`, `playBtn`, `playhead`, `currentTimeText`, `totalTimeText`, `btnAudioPreview`, `galleryModal`, `settingsModal`, `renderProgressModal`.
- No new npm packages (pure vanilla JS + stdlib).
- Maintain 8px design system tokens (buttons: `h-8` or `h-10`, cards: `p-2.5`, padding: `px-6 py-4`).

---

### Task 1: Clean Header Toolbar & Remove Redundant Popups

**Files:**
- Modify: `public/sections/header.html:98-137`
- Modify: `public/sections/modals.html:1-216`

**Interfaces:**
- Consumes: Existing IDs (`btnAudioPreview`, `galleryModal`, `settingsModal`).
- Produces: Clean header action bar with 3 utilities (`btnAudioPreview`, `Galeri`, `Settings`) and streamlined `modals.html` containing only `galleryModal`, `settingsModal`, and `renderProgressModal`.

- [ ] **Step 1: Update `public/sections/header.html`**
Remove `Script to JSON`, `Upload`, and `Editor` buttons from header. Keep `btnAudioPreview`, `Galeri`, and `Settings`:

```html
    <!-- Right: Studio Action Bar -->
    <div class="flex items-center gap-2">
      
      <!-- AUDIO PROCEDURAL DSP PREVIEW -->
      <button id="btnAudioPreview" onclick="toggleAudioPreview()" title="Preview Musik Procedural DSP" class="h-8 flex items-center gap-1.5 px-3 rounded-md bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs font-mono transition cursor-pointer">
        <i id="audioIcon" class="fa-solid fa-volume-high text-[11px] text-zinc-400"></i>
        <span id="audioStatusText" class="hidden sm:inline">DSP Audio</span>
      </button>

      <!-- GALLERY BUTTON -->
      <button onclick="toggleGallery()" title="Buka Galeri Video Hasil Render" class="h-8 text-xs px-3 rounded-md bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium flex items-center gap-1.5 border border-zinc-700/60 transition cursor-pointer">
        <i class="fa-solid fa-photo-film text-zinc-400 text-[11px]"></i>
        <span class="hidden sm:inline text-xs">Galeri</span>
      </button>

      <!-- SETTINGS BUTTON -->
      <button onclick="toggleSettings()" title="Pengaturan AI Director" class="h-8 w-8 rounded-md bg-zinc-800/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 flex items-center justify-center transition cursor-pointer">
        <i class="fa-solid fa-gear text-xs"></i>
      </button>

    </div>
```

- [ ] **Step 2: Update `public/sections/modals.html`**
Remove `jsonEditorModal` and `promptGenModal` markup; preserve `galleryModal`, `settingsModal`, and `renderProgressModal`.

- [ ] **Step 3: Verification**
Verify `modals.html` contains exactly 3 modals:
```bash
node -e "
const fs = require('fs');
const m = fs.readFileSync('public/sections/modals.html', 'utf8');
const ids = ['galleryModal', 'settingsModal', 'renderProgressModal'];
ids.forEach(id => { if (!m.includes('id=\"' + id + '\"')) throw new Error('Missing ' + id); });
if (m.includes('promptGenModal') || m.includes('jsonEditorModal')) throw new Error('Old modals still present');
console.log('Task 1 verified: Modals cleaned!');
"
```

---

### Task 2: Reconstruct Workbench into 4-Step Linear Pipeline

**Files:**
- Modify: `public/sections/workbench.html:1-207`

**Interfaces:**
- Produces: 
  - Step 1: `promptInput` (textarea for topic/script) + sample chips
  - Step 2: 4 Persona cards (`persona-tech-code`, `persona-fintech-data`, `persona-creator-story`, `persona-edu-business`) + aspect ratio grid + duration buttons
  - Step 3: Copy AI prompt button (`btnCopyAiPrompt`, `copyAiPromptStatus`)
  - Step 4: `step4JsonInput` (textarea) + file upload trigger + `btnApplyAndRender` + `btnApplyPreview`
  - Tab switcher between `Pipeline` and `Scene Inspector`

- [ ] **Step 1: Write the new `public/sections/workbench.html`**
Structure with:
1. Tab Header: `Studio Pipeline` vs `Scene Inspector`
2. **Langkah 1: Deskripsi & Topik Video** (`promptInput` + chips)
3. **Langkah 2: Persona Template & Format**
   - Grid 2x2 for 4 personas:
     - `tech-code`: Tech & Code
     - `fintech-data`: Fintech & Data
     - `creator-story`: Content Creator
     - `edu-business`: Edukasi & Bisnis
   - Aspect ratio cards (9:16, 4:5, 1:1, 16:9)
   - Duration buttons (30s, 60s, 90s, 120s)
4. **Langkah 3: Prompt Generator AI**
   - Action box: `Salin Prompt untuk ChatGPT / Claude` (`btnCopyAiPrompt`) with one-click copy feedback.
5. **Langkah 4: Tempel Hasil JSON & Eksekusi**
   - JSON Textarea (`step4JsonInput`)
   - Shortcut Upload file JSON (`step4FileInput`)
   - Tombol `⚡ Terapkan & Render MP4` (`btnStep4Render`)
   - Tombol `👁️ Preview Saja` (`btnStep4Preview`)

- [ ] **Step 2: Verification**
Verify all required step element IDs exist in `workbench.html`:
```bash
node -e "
const fs = require('fs');
const wb = fs.readFileSync('public/sections/workbench.html', 'utf8');
const ids = ['promptInput', 'btnCopyAiPrompt', 'step4JsonInput', 'btnStep4Render', 'btnStep4Preview'];
ids.forEach(id => { if (!wb.includes(id)) throw new Error('Missing ' + id); });
console.log('Task 2 verified: Workbench 4-step pipeline ready!');
"
```

---

### Task 3: Implement Studio Controller Logic & Master Prompt Builder

**Files:**
- Modify: `public/js/studio.js:1-869`

**Interfaces:**
- Produces:
  - `selectedPersona`: string (default `'creator-story'`)
  - `selectPersona(personaKey)`: updates UI state and active persona card styling
  - `generateMasterPrompt()`: generates complete structured Remotion prompt for external LLM
  - `copyMasterPromptToClipboard()`: writes prompt to navigator.clipboard, gives visual checkmark feedback
  - `applyStep4Json(renderAfter)`: validates JSON from `step4JsonInput`, applies to composition, updates canvas and timeline, triggers render if requested
  - Cleans up deprecated modal functions (`openJsonEditor`, `openPromptGeneratorModal`, etc.)

- [ ] **Step 1: Add Persona Definitions & State**
Define persona configurations:
```javascript
const PERSONA_CONFIGS = {
  'tech-code': {
    name: 'Tech & Code',
    tone: 'Analitis, tajam, developer-centric, logis.',
    style: 'tech-neon-soft',
    music: 'tech-bright',
    archetypes: ['code_window_react', 'terminal_cli_render', 'timeline_flow']
  },
  'fintech-data': {
    name: 'Fintech & Data',
    tone: 'Kredibel, analitis, fokus pada metrik persentase dan dampak terukur.',
    style: 'pi-v2-dark',
    music: 'calm-punch',
    archetypes: ['stat_focus', 'metric_counter', 'split_screen']
  },
  'creator-story': {
    name: 'Content Creator',
    tone: 'Enerjik, hook 3 detik punchy, viral, bahasa casual to-the-point.',
    style: 'sunset-creator',
    music: 'warm-major',
    archetypes: ['hero_typography', 'hook_kinetic', 'kinetic_checklist']
  },
  'edu-business': {
    name: 'Edukasi & Bisnis',
    tone: 'Edukatif, terstruktur dengan poin checklist, perbandingan masalah-solusi, CTA jelas.',
    style: 'remotion-light',
    music: 'dreamy',
    archetypes: ['kinetic_checklist', 'split_screen', 'cinematic_quote']
  }
};
let selectedPersona = 'creator-story';
```

- [ ] **Step 2: Implement `selectPersona(key)`**
Highlight selected persona card and update default style preset.

- [ ] **Step 3: Implement `generateMasterPrompt()` & `copyMasterPromptToClipboard()`**
Assemble master prompt with topic, persona instructions, duration, archetypes, and exact Remotion JSON contract. Copy to clipboard and change button text to `✅ Prompt Tersalin!` for 2.5 seconds.

- [ ] **Step 4: Implement `applyStep4Json(renderAfter)`**
Read text from `document.getElementById('step4JsonInput')`, parse via `applyJsonString()`, and call `renderVideoMP4()` if `renderAfter === true`.

- [ ] **Step 5: Verification**
Verify JS syntax:
```bash
node -c public/js/studio.js
```

---

### Task 4: Auto-Composition & End-to-End Verification

**Files:**
- Modify: `server.js` (re-trigger auto-compose)
- Inspect: `public/index.html`

- [ ] **Step 1: Compose `public/index.html`**
Run `node -e "require('./server.js')"` or auto-composer helper to re-generate `public/index.html`.

- [ ] **Step 2: Verify All DOM IDs Match**
Run check script to verify all 69 DOM IDs referenced in JS exist in `public/index.html`.

- [ ] **Step 3: Restart Dev Server & Test HTTP Status**
Restart daemon task and verify `http://localhost:3005` returns HTTP 200 OK.
Verify static assets (`/css/style.css`, `/js/canvas-renderer.js`, `/js/studio.js`) return 200.

---

## Verification Checklist
- [ ] Header toolbar has only `Audio DSP`, `Galeri`, and `Settings`.
- [ ] Left sidebar clearly displays Langkah 1, 2, 3, and 4.
- [ ] Clicking a Persona card highlights it and updates the selected persona.
- [ ] Clicking `Salin Prompt` copies the generated prompt to clipboard and shows visual confirmation.
- [ ] Pasting a valid JSON into Step 4 and clicking `Terapkan & Render MP4` triggers Remotion render cleanly.
- [ ] `node -c public/js/studio.js` exits with code 0.
- [ ] Server running at `http://localhost:3005` returns 200.
