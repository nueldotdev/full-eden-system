/**
 * faceModels.ts
 * Loads the modern-face-api models needed for the Identity Layer.
 *
 * Host the model weight files (from the modern-face-api repo's /weights
 * folder) at /public/models so loadFromUri('/models') can fetch them.
 *
 * We only load tinyFaceDetector (fast enough for a per-frame or
 * sampling-clock loop) + landmarks + recognition. Skip ssdMobilenetv1
 * here — it's too slow for a live camera loop; that's for one-off,
 * high-accuracy detection if you ever need it elsewhere.
 */

import faceapi from "./faceApi";
const MODEL_URL = "/models";

let modelsLoadedPromise: Promise<void> | null = null;

/**
 * Idempotent model loader. Safe to call from multiple places (e.g. both
 * the identity layer and Dev C's enrollment upload flow) — the models
 * only get fetched once.
 */
export function loadFaceModels(): Promise<void> {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
      .then(() => {
        console.log("Eden face models loaded successfully");
      })
      .catch((error) => {
        console.error("Eden face model loading failed:", error);
        modelsLoadedPromise = null;
        throw error;
      });
  }

  return modelsLoadedPromise;
}
export function areModelsLoaded(): boolean {
  return (
    faceapi.nets.tinyFaceDetector.isLoaded &&
    faceapi.nets.faceLandmark68Net.isLoaded &&
    faceapi.nets.faceRecognitionNet.isLoaded
  );
}

/** Shared detector options — tune inputSize down further if mobile perf matters. */
export const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.3,
});
