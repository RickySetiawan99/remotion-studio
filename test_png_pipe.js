
const fs = require('fs');
const { createCanvas } = require('canvas');
const { spawn } = require('child_process');

async function testPngPipe() {
  const outFile = '/home/ubuntu/remotion-studio/renders/test_png_pipe.mp4';
  const width = 1080;
  const height = 1920;

  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'png',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'main',
    '-preset', 'ultrafast',
    '-movflags', '+faststart',
    outFile
  ]);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (let frame = 0; frame < 30; frame++) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(140, 460, 800, 1000, 40);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BAGAIMANA AI BERPIKIR?', 540, 700);

    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 70px monospace';
    ctx.fillText(`FRAME ${frame}`, 540, 900);
    ctx.restore();

    const buf = canvas.toBuffer('image/png');
    const ok = ffmpeg.stdin.write(buf);
    if (!ok) await new Promise(r => ffmpeg.stdin.once('drain', r));
  }

  ffmpeg.stdin.end();
  await new Promise(r => ffmpeg.on('close', r));
  console.log('Finished test_png_pipe.mp4');
}

testPngPipe();
