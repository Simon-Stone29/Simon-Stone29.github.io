const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let videoReady = false;

const MAX_POINTS = 10;
const points = [];

// C major whole steps: C D E F# G# A# C
jsconst NOTE_FREQUENCIES = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25];
const NOTE_NAMES = ["C4","D4","E4","F4","G4","A4","B4","C5","D5","E5"]
// ===== AUDIO =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
async function unlockAudio() {
  if (audioCtx.state !== "running") await audioCtx.resume();
}

function playNote(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.6);
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
  if (points.length >= MAX_POINTS) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  const index = points.length;

  points.push({
    x, y,
    referenceColor: { r: pixel[0], g: pixel[1], b: pixel[2] },
    wasMatch: true,
    freq: NOTE_FREQUENCIES[index],
    name: NOTE_NAMES[index],
  });

  console.log(`Point ${index + 1} (${NOTE_NAMES[index]}) set at (${x}, ${y})`);
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

// ===== DRAW DOT =====
function drawDot(x, y, name, isActive) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.75)";
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = isActive ? "black" : "white";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, x, y);
}

// ===== LOOP =====
function drawFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  for (const point of points) {
    const { r, g, b } = getAverageColor(point.x, point.y);
    const match = isColorMatch(r, g, b, point.referenceColor);

    if (point.wasMatch && !match) playNote(point.freq);
    point.wasMatch = match;

    drawDot(point.x, point.y, point.name, !match);
  }

  requestAnimationFrame(drawFrame);
}
