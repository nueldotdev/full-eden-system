import { useEffect, useRef, useState } from "react";
import * as ml5 from "ml5";
import { detectDominantColor } from "../utils/colorDetect";

// COCO-SSD's fixed 80-class label set — anything in watchFor that isn't
// close to one of these will never match, no matter how we normalize it.
const COCO_LABELS = [
  "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
  "truck", "boat", "traffic light", "fire hydrant", "stop sign",
  "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
  "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
  "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
  "sports ball", "kite", "baseball bat", "baseball glove", "skateboard",
  "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
  "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
  "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
  "couch", "potted plant", "bed", "dining table", "toilet", "tv",
  "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
  "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
  "scissors", "teddy bear", "hair drier", "toothbrush",
];

const normalize = (s) => s.toLowerCase().trim();

// Maps a rule's free-form condition string to the closest COCO label,
// if any. Handles exact matches, substring matches ("a backpack" ->
// "backpack"), and simple plural/singular differences.
function resolveToCocoLabel(condition) {
  const norm = normalize(condition);

  // exact match
  const exact = COCO_LABELS.find((label) => label === norm);
  if (exact) return exact;

  // condition contains the label as a whole word, e.g. "a red backpack"
  const contains = COCO_LABELS.find((label) => {
    const re = new RegExp(`\\b${label}\\b`);
    return re.test(norm);
  });
  if (contains) return contains;

  // strip trailing "s" for a naive plural check ("backpacks" -> "backpack")
  const singular = norm.endsWith("s") ? norm.slice(0, -1) : norm;
  const pluralMatch = COCO_LABELS.find((label) => label === singular);
  if (pluralMatch) return pluralMatch;

  return null; // no confident match — will be dropped, logged for visibility
}

export function useObjectGate(rule) {
  const detectorRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    detectorRef.current = ml5.objectDetector("cocossd", () => {
      setReady(true);
    });
  }, []);

  const detectAndMatch = (videoEl, frameImageData) => {
    return new Promise((resolve) => {
      if (!ready || !videoEl) return resolve(null);

      detectorRef.current.detect(videoEl, (err, results) => {
        if (err) {
          console.error("Detection error:", err);
          return resolve(null);
        }

        const rawWatchFor = rule?.objectLane?.watchFor || [];
        const minConfidence = rule?.objectLane?.minConfidence || 0.5;

        // Resolve each rule condition to a real COCO label once per call.
        // Anything that doesn't resolve gets logged so it's visible instead
        // of silently never firing.
        const resolvedLabels = rawWatchFor
          .map((cond) => {
            const resolved = resolveToCocoLabel(cond);
            if (!resolved) {
              console.warn(
                `[useObjectGate] rule condition "${cond}" has no matching COCO-SSD label — it will never fire.`
              );
            }
            return resolved;
          })
          .filter(Boolean);

        const match = results.find(
          (r) =>
            resolvedLabels.includes(normalize(r.label)) &&
            r.confidence >= minConfidence
        );

        if (!match) return resolve(null);

        const color = frameImageData
          ? detectDominantColor(frameImageData, match)
          : "unknown";

        resolve({ ...match, color });
      });
    });
  };

  return { ready, detectAndMatch };
}