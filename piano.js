const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let videoReady = false;

const points = [
  { x: null, y: null, referenceColor: null, wasMatch: true, type: "snare" },
  { x: null, y: null, referenceColor: null, wasMatch: true, type: "hihat" },
];
let nextPoint = 0; // 0 = placing snare, 1 = placing hihat

// ===== AUDIO =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
async function unlockAudio() {
  if (audioCtx.state !== "running") await audioCtx.resume();
}

function playSnare() {
  const bufferSize = audioCtx.sampleRate * 0.2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  source.connect(filter);
  filter.connect(audioCtx.destination);
  source.start();
}

function playHihat() {
  const bufferSize = audioCtx.sampleRate * 0.08;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 8000;
  source.connect(filter);
  filter.connect(audioCtx.destination);
  source.start();
}

// ===== CAMERA =====
navigator.mediaDevices.getUserMedia({ video: true })
  .then(async (stream) => {
    video.srcObject = stream;
    await video.play();
    videoReady = true;
    drawFrame();
  })
  .catch(err => console.error(err));

// ===== CALIBRATION =====
canvas.addEventListener("click", async (event) => {
  await unlockAudio();
  if (!videoReady) return;
  if (nextPoint > 1) return; // both points already set

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const pixel = ctx.getImageData(x, y, 1, 1).data;

  points[nextPoint].x = x;
  points[nextPoint].y = y;
  points[nextPoint].referenceColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
  console.log(`Set ${points[nextPoint].type} at (${x}, ${y}):`, points[nextPoint].referenceColor);
  nextPoint++;
});

// ===== COLOR MATCH =====
function getAverageColor(x, y) {
  const radius = 10;
  const size = radius * 2 + 1;
  const imageData = ctx.getImageData(x - radius, y - radius, size, size).data;
  let rSum = 0, gSum = 0, bSum = 0;
  const pixelCount = size * size;
  for (let i = 0; i < pixelCount; i++) {
    rSum += imageData[i * 4];
    gSum += imageData[i * 4 + 1];
    bSum += imageData[i * 4 + 2];
  }
  return { r: rSum / pixelCount, g: gSum / pixelCount, b: bSum / pixelCount };
}

function isColorMatch(r, g, b, ref) {
  const distance = Math.abs(r - ref.r) + Math.abs(g - ref.g) + Math.abs(b - ref.b);
  return distance < 80;
}

// ===== DRAW DOTS =====
function drawDot(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ===== LOOP =====
function drawFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  for (const point of points) {
    if (point.x === null || point.referenceColor === null) continue;

    const { r, g, b } = getAverageColor(point.x, point.y);
    const match = isColorMatch(r, g, b, point.referenceColor);

    if (point.wasMatch && !match) {
      if (point.type === "snare") playSnare();
      else playHihat();
    }
    point.wasMatch = match;

    // dot: red for snare, yellow for hihat
    drawDot(point.x, point.y, point.type === "snare" ? "rgba(255,50,50,0.8)" : "rgba(255,220,0,0.8)");
  }

  requestAnimationFrame(drawFrame);
}
