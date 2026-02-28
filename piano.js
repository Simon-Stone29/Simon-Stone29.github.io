const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let videoReady = false;
let sampleX = null;
let sampleY = null;
let referenceColor = null;
let wasMatch = true;

// ===== AUDIO =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
async function unlockAudio() {
  if (audioCtx.state !== "running") {
    await audioCtx.resume();
  }
}
function playNote() {
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 440;
  osc.connect(audioCtx.destination);
  osc.start();
  setTimeout(() => osc.stop(), 200);
}

// ===== CAMERA (single call) =====
navigator.mediaDevices.getUserMedia({ video: true })
  .then(async (stream) => {
    video.srcObject = stream;
    await video.play();
    videoReady = true;   // 👈 THIS was missing entirely
    drawFrame();
  })
  .catch(err => console.error(err));

// ===== CALIBRATION =====
canvas.addEventListener("click", async (event) => {
  await unlockAudio();
  if (!videoReady) return;
  const rect = canvas.getBoundingClientRect();
  sampleX = event.clientX - rect.left;
  sampleY = event.clientY - rect.top;
  const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
  referenceColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
});

// ===== COLOR MATCH =====
function isColorMatch(r, g, b) {
  if (!referenceColor) return false;
  const distance =
    Math.abs(r - referenceColor.r) +
    Math.abs(g - referenceColor.g) +
    Math.abs(b - referenceColor.b);
  return distance < 80;
}

// ===== LOOP =====
function drawFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  if (sampleX !== null && referenceColor !== null) {
    const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
    const match = isColorMatch(pixel[0], pixel[1], pixel[2]);
    if (wasMatch && !match) playNote();
    wasMatch = match;
  }
  requestAnimationFrame(drawFrame);
}
