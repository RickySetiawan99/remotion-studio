
const fs = require('fs');
const { createCanvas } = require('canvas');
const { spawn } = require('child_process');

async function testJpegPipe() {
  const t0 = Date.now();
  const canvas = createCanvas(1080, 1920);
  const ctx = canvas.getContext('2d');

  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-movflags', '+faststart',
    '/home/ubuntu/remotion-studio/renders/test_jpeg_speed.mp4'
  ]);

  for (let f = 0; f < 300; f++) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(100, 100, 880, 500);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText(`Frame ${f}`, 300, 300);

    const buf = canvas.toBuffer('image/jpeg', { quality: 0.85 });
    const ok = ffmpeg.stdin.write(buf);
    if (!ok) await new Promise(r => ffmpeg.stdin.once('drain', r));
  }

  ffmpeg.stdin.end();
  await new Promise(r => ffmpeg.on('close', r));
  console.log(`300 frames JPEG rendered in ${Date.now() - t0}ms`);
}

testJpegPipe();
