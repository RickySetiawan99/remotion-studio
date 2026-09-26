
const { createCanvas } = require('canvas');
const { spawn } = require('child_process');
const fs = require('fs');

async function testFFmpegPipe(pixFmt) {
  const canvas = createCanvas(1080, 1920);
  const ctx = canvas.getContext('2d');

  const outFile = `/home/ubuntu/remotion-studio/renders/test_${pixFmt}.mp4`;
  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', '1080x1920',
    '-pix_fmt', pixFmt,
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outFile
  ]);

  for (let f = 0; f < 30; f++) {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0,0, 1080, 1920);
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(200, 400 + f * 10, 680, 300);
    ctx.fillStyle = '#ffffff';
    ctx.font = '80px sans-serif';
    ctx.fillText(`Frame ${f}`, 300, 600);

    const buf = canvas.toBuffer('raw');
    ffmpeg.stdin.write(buf);
  }
  ffmpeg.stdin.end();
  await new Promise(r => ffmpeg.on('close', r));
  console.log(`Finished ${pixFmt}, size: ${fs.statSync(outFile).size}`);
}

(async () => {
  await testFFmpegPipe('rgba');
  await testFFmpegPipe('bgra');
  await testFFmpegPipe('argb');
})();
