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