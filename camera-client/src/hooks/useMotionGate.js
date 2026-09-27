import { useRef } from "react";

export function useMotionGate() {
  const lastFrameRef = useRef(null);

  const diffFrames = (frameA, frameB) => {
    const dataA = frameA.data;
    const dataB = frameB.data;
    let changedPixels = 0;
    const totalPixels = dataA.length / 4;
    const threshold = 30;

    for (let i = 0; i < dataA.length; i += 4) {
      const brightnessA = (dataA[i] + dataA[i + 1] + dataA[i + 2]) / 3;
      const brightnessB = (dataB[i] + dataB[i + 1] + dataB[i + 2]) / 3;
      if (Math.abs(brightnessA - brightnessB) > threshold) changedPixels++;
    }

    return changedPixels / totalPixels;
  };

  const checkMotion = (currentFrame) => {
    if (!lastFrameRef.current) {
      lastFrameRef.current = currentFrame;
      return { motionDetected: false, changeRatio: 0 };
    }

    const changeRatio = diffFrames(lastFrameRef.current, currentFrame);
    lastFrameRef.current = currentFrame;

    const motionDetected = changeRatio > 0.01;
    if (motionDetected) {
      console.log(
        `[MotionGate] Motion detected! changeRatio: ${(changeRatio * 100).toFixed(2)}%`
      );
    }

    return { motionDetected, changeRatio };
  };

  return { checkMotion };
}