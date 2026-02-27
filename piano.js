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
    console.log("Audio unlocked");
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

// ===== CAMERA =====
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => console.error(err));

video.addEventListener("loadeddata", () => {
  videoReady = true;
  drawFrame();
});

// ===== CALIBRATION =====
canvas.addEventListener("click", async (event) => {
  await unlockAudio();

  if (!videoReady) {
    console.log("Video not ready yet");
    return;
  }

  const rect = canvas.getBoundingClientRect();

  sampleX = event.clientX - rect.left;
  sampleY = event.clientY - rect.top;

  const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;

  referenceColor = {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2]
  };

  console.log("Calibrated:", referenceColor);
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
  if (!videoReady) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (sampleX !== null && referenceColor !== null) {
    const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const match = isColorMatch(r, g, b);

    if (wasMatch && !match) {
      playNote();
    }

    wasMatch = match;
  }

  requestAnimationFrame(drawFrame);
}
