
const fs = require('fs');
const { createCanvas } = require('canvas');

const canvas = createCanvas(1080, 1920);
const ctx = canvas.getContext('2d');

const width = 1080;
const height = 1920;
const frame = 150; // 5s

// Run exact render_edu_60s.js loop body for frame 150
const STYLE = {
  bg: ['#1e1b4b', '#0f172a', '#030712'],
  cardBg: '#0f172a',
  cardBorder: '#6366f1',
  text: '#ffffff',
  sub: '#94a3b8',
  accent: '#6366f1'
};

const activeScene = {
  startFrame: 0,
  endFrame: 360,
  type: "concept_card",
  tag: "01 / HOOK",
  headline: "BAGAIMANA AI BERPIKIR?",
  subtext: "Bukan sihir, melainkan kalkulasi probabilitas kata"
};

// 1. Draw Background
ctx.fillStyle = '#0a0f1d';
ctx.fillRect(0, 0, width, height);

// 2. Draw Card directly in absolute coordinates (No fragile matrix translations!)
const cardX = 60;
const cardY = 380;
const cardW = width - 120;
const cardH = 1160;

ctx.fillStyle = '#0f172a';
ctx.strokeStyle = '#6366f1';
ctx.lineWidth = 6;
ctx.beginPath();
ctx.roundRect(cardX, cardY, cardW, cardH, 36);
ctx.fill();
ctx.stroke();

// 3. Draw Badge Tag
ctx.fillStyle = '#6366f1';
ctx.beginPath();
ctx.roundRect(cardX + 50, cardY + 60, 200, 50, 25);
ctx.fill();

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 22px sans-serif';
ctx.textAlign = 'center';
ctx.fillText(activeScene.tag, cardX + 150, cardY + 92);

// 4. Draw Headline
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 64px sans-serif';
ctx.fillText(activeScene.headline, width / 2, cardY + 220);

// 5. Draw Subtext
ctx.fillStyle = '#94a3b8';
ctx.font = '32px sans-serif';
ctx.fillText(activeScene.subtext, width / 2, cardY + 300);

// 6. Draw Big Metric Card
ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
ctx.strokeStyle = '#6366f1';
ctx.lineWidth = 3;
ctx.beginPath();
ctx.roundRect(width/2 - 250, cardY + 400, 500, 200, 24);
ctx.fill();
ctx.stroke();

ctx.fillStyle = '#6366f1';
ctx.font = 'bold 72px monospace';
ctx.fillText('+15T Tokens', width/2, cardY + 520);

fs.writeFileSync('/home/ubuntu/remotion-studio/renders/test_direct_5s.png', canvas.toBuffer('image/png'));
console.log('Saved test_direct_5s.png');
