// import { useEffect, useRef, useState } from "react";
// import * as ml5 from "ml5";
// import { detectDominantColor } from "../utils/colorDetect";

// // COCO-SSD's fixed 80-class label set
// const COCO_LABELS = [
//   "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
//   "truck", "boat", "traffic light", "fire hydrant", "stop sign",
//   "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
//   "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
//   "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
//   "sports ball", "kite", "baseball bat", "baseball glove", "skateboard",
//   "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
//   "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
//   "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
//   "couch", "potted plant", "bed", "dining table", "toilet", "tv",
//   "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
//   "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
//   "scissors", "teddy bear", "hair drier", "toothbrush",
// ];

// const SYNONYMS = {
//   phone: "cell phone",
//   smartphone: "cell phone",
//   cellphone: "cell phone",
//   mobile: "cell phone",
//   iphone: "cell phone",
//   computer: "laptop",
//   macbook: "laptop",
//   pc: "laptop",
//   bag: "backpack",
//   schoolbag: "backpack",
//   knapsack: "backpack",
//   purse: "handbag",
//   tote: "handbag",
//   mug: "cup",
//   someone: "person",
//   anyone: "person",
//   human: "person",
//   intruder: "person",
//   individual: "person",
//   people: "person",
//   man: "person",
//   woman: "person",
// };

// const normalize = (s) => (s ? s.toLowerCase().trim() : "");

// // Maps a rule's free-form condition string to the closest COCO label
// function resolveToCocoLabel(condition) {
//   if (!condition) return null;
//   const norm = normalize(condition);

//   // Exact match
//   const exact = COCO_LABELS.find((label) => label === norm);
//   if (exact) return exact;

//   // Synonyms check
//   for (const [synonym, cocoLabel] of Object.entries(SYNONYMS)) {
//     const re = new RegExp(`\\b${synonym}\\b`, "i");
//     if (re.test(norm)) return cocoLabel;
//   }

//   // Substring / word match, e.g. "a red backpack" -> "backpack"
//   const contains = COCO_LABELS.find((label) => {
//     const re = new RegExp(`\\b${label}\\b`, "i");
//     return re.test(norm);
//   });
//   if (contains) return contains;

//   // Simple plural check ("backpacks" -> "backpack")
//   const singular = norm.endsWith("s") ? norm.slice(0, -1) : norm;
//   const pluralMatch = COCO_LABELS.find((label) => label === singular);
//   if (pluralMatch) return pluralMatch;

//   return null;
// }

// export function useObjectGate(rule) {
//   const detectorRef = useRef(null);
//   const [ready, setReady] = useState(false);
//   const ruleRef = useRef(rule);

//   useEffect(() => {
//     ruleRef.current = rule;
//   }, [rule]);

//   useEffect(() => {
//     console.log("[ObjectGate] Loading COCO-SSD model via ml5.objectDetector...");
//     try {
//       detectorRef.current = ml5.objectDetector("cocossd", (err) => {
//         if (err) {
//           console.error("[ObjectGate] ❌ Error loading COCO-SSD model:", err);
//           return;
//         }
//         console.log("[ObjectGate] ✅ COCO-SSD model loaded and ready!");
//         setReady(true);
//       });
//     } catch (e) {
//       console.error("[ObjectGate] ❌ Exception initializing objectDetector:", e);
//     }
//   }, []);

//   const detectAndMatch = (videoEl, frameImageData) => {
//     return new Promise((resolve) => {
//       if (!ready || !videoEl || !detectorRef.current) {
//         if (!ready) console.log("[ObjectGate] detectAndMatch skipped: Model not ready");
//         if (!videoEl) console.warn("[ObjectGate] detectAndMatch skipped: videoEl is null");
//         return resolve(null);
//       }

//       detectorRef.current.detect(videoEl, (err, results) => {
//         if (err || !results || !Array.isArray(results)) {
//           if (err) console.error("[ObjectGate] Detection error:", err);
//           return resolve(null);
//         }

//         const currentRule = ruleRef.current;
//         const rawWatchFor = currentRule?.objectLane?.watchFor || [];
//         const minConfidence = currentRule?.objectLane?.minConfidence || 0.4;

//         // Resolve each rule condition to a real COCO label
//         let resolvedLabels = rawWatchFor
//           .map((cond) => resolveToCocoLabel(cond))
//           .filter(Boolean);

//         // Deduplicate labels
//         resolvedLabels = [...new Set(resolvedLabels)];

//         // If no specific COCO labels resolved, watch for common objects including person
//         if (resolvedLabels.length === 0) {
//           resolvedLabels = ["person", "cell phone", "laptop", "backpack", "bottle", "cup", "chair"];
//         }

//         console.log(
//           `[ObjectGate] COCO-SSD raw detections (${results.length}):`,
//           results.map((r) => `${r.label} (${(r.confidence * 100).toFixed(0)}%)`),
//           `| Targets: [${resolvedLabels.join(", ")}]`
//         );

//         const match = results.find(
//           (r) =>
//             r &&
//             resolvedLabels.includes(normalize(r.label)) &&
//             r.confidence >= minConfidence
//         );

//         if (!match) return resolve(null);

//         const color = frameImageData
//           ? detectDominantColor(frameImageData, match)
//           : "unknown";

//         console.log(
//           `[ObjectGate] 🎯 MATCH CONFIRMED: ${match.label} (${(match.confidence * 100).toFixed(0)}%) - Color: ${color}`
//         );

//         resolve({ ...match, color });
//       });
//     });
//   };

//   return { ready, detectAndMatch };
// }


import { useEffect, useRef, useState } from "react";
import * as ml5 from "ml5";
import { detectDominantColor } from "../utils/colorDetect";

export function useObjectGate(rule) {
  const detectorRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    detectorRef.current = ml5.objectDetector("cocossd", () => {
      setReady(true);
    });
  }, []);

  // now also takes the current frame's ImageData, so we can sample color
  const detectAndMatch = (videoEl, frameImageData) => {
    return new Promise((resolve) => {
      if (!ready || !videoEl) return resolve(null);

      detectorRef.current.detect(videoEl, (err, results) => {
        if (err) {
          console.error("Detection error:", err);
          return resolve(null);
        }

        const watchFor = rule?.objectLane?.watchFor || [];
        const minConfidence = rule?.objectLane?.minConfidence || 0.5;

        const match = results.find(
          (r) => watchFor.includes(r.label) && r.confidence >= minConfidence
        );

        resolve(match || null);
      });
    });
  };

  return { ready, detectAndMatch };
}