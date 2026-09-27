// Samples pixels inside a bounding box and returns the closest matching
// common color name based on average RGB.

const COLOR_REFERENCES = [
  { name: "black", rgb: [20, 20, 20] },
  { name: "white", rgb: [235, 235, 235] },
  { name: "gray", rgb: [128, 128, 128] },
  { name: "red", rgb: [200, 30, 30] },
  { name: "orange", rgb: [230, 130, 30] },
  { name: "yellow", rgb: [220, 210, 40] },
  { name: "green", rgb: [40, 140, 60] },
  { name: "blue", rgb: [30, 80, 200] },
  { name: "purple", rgb: [120, 50, 150] },
  { name: "brown", rgb: [110, 70, 40] },
  { name: "pink", rgb: [230, 140, 170] },
];

function colorDistance(rgbA, rgbB) {
  return Math.sqrt(
    Math.pow(rgbA[0] - rgbB[0], 2) +
      Math.pow(rgbA[1] - rgbB[1], 2) +
      Math.pow(rgbA[2] - rgbB[2], 2)
  );
}

export function detectDominantColor(imageData, box) {
  const { x, y, width, height } = box;
  const data = imageData.data;
  const canvasWidth = imageData.width;

  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(imageData.width, Math.floor(x + width));
  const endY = Math.min(imageData.height, Math.floor(y + height));

  let rTotal = 0;
  let gTotal = 0;
  let bTotal = 0;
  let count = 0;

  // sample every 4th pixel for speed
  for (let py = startY; py < endY; py += 4) {
    for (let px = startX; px < endX; px += 4) {
      const i = (py * canvasWidth + px) * 4;
      rTotal += data[i];
      gTotal += data[i + 1];
      bTotal += data[i + 2];
      count++;
    }
  }

  if (count === 0) return "unknown";

  const avgRgb = [rTotal / count, gTotal / count, bTotal / count];

  let closestColor = "unknown";
  let closestDistance = Infinity;

  for (const ref of COLOR_REFERENCES) {
    const dist = colorDistance(avgRgb, ref.rgb);
    if (dist < closestDistance) {
      closestDistance = dist;
      closestColor = ref.name;
    }
  }

  return closestColor;
}