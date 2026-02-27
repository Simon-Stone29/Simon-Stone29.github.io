const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.play();
  });

function drawFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  requestAnimationFrame(drawFrame);
}

video.addEventListener("loadeddata", () => {
  drawFrame();
});

const pixel = ctx.getImageData(100, 100, 1, 1).data;
console.log(pixel);
