
const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(1080, 1920);
const ctx = canvas.getContext('2d');

console.log('roundRect exists?', typeof ctx.roundRect);

// Test drawing a frame
ctx.fillStyle = '#0f172a';
ctx.fillRect(0,0, 1080, 1920);

ctx.fillStyle = '#6366f1';
if (typeof ctx.roundRect === 'function') {
  ctx.beginPath();
  ctx.roundRect(100, 100, 800, 400, 20);
  ctx.fill();
} else {
  ctx.fillRect(100, 100, 800, 400);
}

const buf = canvas.toBuffer('image/png');
fs.writeFileSync('/home/ubuntu/remotion-studio/test_frame.png', buf);
console.log('Saved test_frame.png size:', buf.length);
