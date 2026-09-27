/**
 * faceDescriptor.ts
 * The reusable "photo in, descriptor out" function Dev C calls from the
 * enrollment upload flow (Admin Webapp -> upload a photo -> get back a
 * descriptor to store against that person).
 *
 * Also exports the enrolled-set cache types/helpers used by the identity
 * layer, so the descriptor shape is defined in exactly one place.
 */

import faceapi from "./faceApi";
import { loadFaceModels, detectorOptions } from "./faceModels";

/** A descriptor as it travels over the wire / sits in the cache — plain, JSON-safe. */
export type SerializedDescriptor = number[];

export interface EnrolledPerson {
  id: string;
  name: string;
  descriptors: SerializedDescriptor[]; // one person can have >1 reference photo
}

/**
 * Takes a single photo (an HTMLImageElement, HTMLCanvasElement, or a
 * File/Blob you've already turned into an image) and returns the face
 * descriptor for the most prominent face in it.
 *
 * Throws if no face is found — Dev C's upload UI should catch this and
 * surface a "no face detected in this photo" message rather than
 * silently enrolling nothing.
 */
export async function photoToDescriptor(
  input: HTMLImageElement | HTMLCanvasElement,
): Promise<SerializedDescriptor> {
  await loadFaceModels();

  const result = await faceapi
    .detectSingleFace(input, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result) {
    throw new Error("No face detected in photo");
  }

  return Array.from(result.descriptor);
}
/** Convenience: load an image from a File (e.g. straight from an <input type="file">). */
// faceDescriptor.ts
export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        await img.decode(); // ensures pixel data is fully ready
        URL.revokeObjectURL(url);
        resolve(img);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
/**
 * Builds a FaceMatcher from the enrolled set (as cached locally by the
 * identity layer). Rebuild this whenever the cache is diffed and
 * changes — it's cheap.
 *
 * We do NOT compare raw pixels. Each stored photo is converted into a
 * face embedding (descriptor) and each person can have multiple reference
 * embeddings. The matcher compares the live frame's embedding against all
 * enrolled embeddings and returns the closest label/distance.
 *
 * For local demo matching, the threshold needs to be a little more forgiving
 * than the very strict default. A same-person capture can easily land around
 * 0.65-0.7 in face-api.js depending on lighting, head angle, and camera
 * noise, so values above the default 0.6 will be reported as "unknown" even
 * though the face was detected successfully.
 */
export function buildMatcher(
  enrolled: EnrolledPerson[],
  threshold = 0.7,
): faceapi.FaceMatcher | null {
  if (enrolled.length === 0) return null;

  const labeled = enrolled.map(
    (person) =>
      new faceapi.LabeledFaceDescriptors(
        person.id,
        person.descriptors.map((d) => new Float32Array(d)),
      ),
  );

  return new faceapi.FaceMatcher(labeled, threshold);
}
