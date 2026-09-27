import { useEffect, useRef, useState } from "react";
import * as ml5 from "ml5";

export function useObjectGate(rule) {
  const detectorRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    detectorRef.current = ml5.objectDetector("cocossd", () => {
      setReady(true);
    });
  }, []);

  const detectAndMatch = (videoEl) => {
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