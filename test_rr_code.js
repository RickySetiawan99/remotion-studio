
const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(1080, 1920);
const ctx = canvas.getContext('2d');

ctx.save();
ctx.translate(540, 960);
ctx.fillStyle = '#6366f1';
ctx.beginPath();
ctx.roundRect(-475, -576, 950, 1152, 36);
ctx.fill();
ctx.restore();

fs.writeFileSync('/home/ubuntu/remotion-studio/test_rr.png', canvas.toBuffer('image/png'));
