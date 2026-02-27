// ====== ELEMENTS ======
const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// ====== AUDIO ======
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playNote() {
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 440;
  osc.connect(audioCtx.destination);
  osc.start();
  setTimeout(() => osc.stop(), 200);
}

document.body.addEventListener("click", () => {
  audioCtx.resume();
});

// ====== CAMERA ======
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  });

// ====== CALIBRATION STATE ======
let sampleX = null;
let sampleY = null;
let referenceColor = null;
let wasMatch = true;

// ====== CLICK TO CALIBRATE PICK ======
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  sampleX = event.clientX - rect.left;
  sampleY = event.clientY - rect.top;

  const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;

  referenceColor = {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2]
  };

  console.log("Calibrated at:", sampleX, sampleY);
  console.log("Reference color:", referenceColor);
});

// ====== COLOR DISTANCE CHECK ======
function isColorMatch(r, g, b) {
  if (!referenceColor) return false;

  const distance =
    Math.abs(r - referenceColor.r) +
    Math.abs(g - referenceColor.g) +
    Math.abs(b - referenceColor.b);

  return distance < 80; // tolerance (adjust if needed)
}

// ====== MAIN LOOP ======
function drawFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (sampleX !== null && referenceColor !== null) {
    const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const currentlyMatch = isColorMatch(r, g, b);

    if (wasMatch && !currentlyMatch) {
      console.log("PLAY NOTE");
      playNote();
    }

    wasMatch = currentlyMatch;
  }

  requestAnimationFrame(drawFrame);
}

video.addEventListener("loadeddata", () => {
  drawFrame();
});