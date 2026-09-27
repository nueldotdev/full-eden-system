/**
 * useIdentityLayer.ts
 * Dev B's Identity Layer: detects + matches faces against the cached
 * enrolled set in one step, polls for rule/enrollment changes, handles
 * pause-and-resume during control-plane updates, and packages
 * Gate-2-matched frames for the Backend dev's evaluate_frame route.
 *
 * This hook assumes Dev A's capture loop is already feeding frames via
 * a <video> ref, and that Gate 1 (motion) + Gate 2 (ml5 object match)
 * upstream logic decides *when* to call runIdentityCheck — this hook
 * doesn't re-implement those gates, it just does face ID + packaging
 * once told a frame is worth looking at.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import faceapi from "./faceApi";
import { loadFaceModels, detectorOptions } from "./faceModels";
import { buildMatcher, type EnrolledPerson } from "./faceDescriptor";
interface UseIdentityLayerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** How often (ms) to poll the backend for the full rule + enrolled set. */
  pollIntervalMs?: number;
  /** Fetches the current rule + enrolled set from the backend (get_active_rule, get_enrolled_people). */
  fetchControlPlane: () => Promise<{
    ruleVersion: string;
    enrolled: EnrolledPerson[];
  }>;
  /** Called once identity is resolved for a Gate-2-matched frame — hands off to the backend's evaluate_frame route. */
  onIdentifiedFrame: (payload: {
    imageBlob: Blob;
    matchedPersonId: string | null; // stable internal ID for the matched person
    matchedPersonName: string | null; // user-facing display name for the matched person
    distance: number | null;
    timestamp: number;
  }) => void;
}

export function useIdentityLayer({
  videoRef,
  pollIntervalMs = 5000,
  fetchControlPlane,
  onIdentifiedFrame,
}: UseIdentityLayerOptions) {
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  const matcherRef = useRef<faceapi.FaceMatcher | null>(null);
  const ruleVersionRef = useRef<string | null>(null);
  const enrolledCacheRef = useRef<EnrolledPerson[]>([]);
  const cooldownRef = useRef<Map<string, number>>(new Map()); // personId -> last-fired timestamp

  // --- Model loading -------------------------------------------------
  useEffect(() => {
    loadFaceModels().then(() => setReady(true));
  }, []);

  // --- Polling for rule + enrolled set, diffed locally ----------------
  // --- Polling for rule + enrolled set, diffed locally ----------------
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const { ruleVersion, enrolled } = await fetchControlPlane();

        const changed =
          ruleVersion !== ruleVersionRef.current ||
          JSON.stringify(enrolled) !== JSON.stringify(enrolledCacheRef.current);

        if (changed && !cancelled) {
          console.log("Eden: control plane changed", {
            ruleVersion,
            enrolledCount: enrolled.length,
          });

          // Pause identity checks while the matcher is updated.
          setPaused(true);

          ruleVersionRef.current = ruleVersion;
          enrolledCacheRef.current = enrolled;

          const matcher = buildMatcher(enrolled);
          matcherRef.current = matcher;

          console.log("Eden: matcher rebuilt", {
            hasMatcher: matcher !== null,
            enrolledCount: enrolled.length,
          });

          setPaused(false);
        }
      } catch (err) {
        console.error("Control-plane poll failed", err);
      }
    }

    // Run immediately.
    poll();

    // Then check for changes periodically.
    const interval = setInterval(poll, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchControlPlane, pollIntervalMs]);

  /**
   * Call this once Gate 1 + Gate 2 upstream have decided a frame is
   * worth identifying. Detects the face, matches it against the cached
   * enrolled set, applies a per-match cooldown, and — if it fires —
   * packages the frame for the backend.
   */
  const runIdentityCheck = useCallback(
    async (cooldownMs = 10000) => {
      if (paused || !ready) return;
      const video = videoRef.current;

      if (!video) {
        console.log("Eden: video element not available");
        return;
      }

      console.log("Eden: video state", {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        paused: video.paused,
      });

      console.log("Eden: running detector with options", detectorOptions);

      const result = await faceapi
        .detectSingleFace(video, detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!result) {
        console.log("Eden: no face detected in current frame");
        return;
      }

      console.log("Eden: face detected successfully");

      // Convert the detected live face into a numeric embedding (descriptor).
      // This is not a raw image comparison; it is a face-vector comparison.
      // face-api.js then checks this descriptor against the enrolled person's
      // stored descriptors using FaceMatcher.findBestMatch().
      const matcher = matcherRef.current;
      const match = matcher ? matcher.findBestMatch(result.descriptor) : null;
      console.log("Eden: face descriptor generated");
      console.log("Eden: matcher result:", match);

      // match.label is the enrolled person ID when the distance is close enough.
      // If the nearest match is beyond the configured threshold, face-api.js
      // labels it as "unknown" and we treat it as no match.
      const matchedPersonId =
        match && match.label !== "unknown" ? match.label : null;

      const matchedPersonName =
        matchedPersonId !== null
          ? enrolledCacheRef.current.find((person) => person.id === matchedPersonId)
              ?.name ?? matchedPersonId
          : null;

      // Lower distance means the live face is closer to that enrolled face.
      // For face-api.js, this is effectively the similarity/difference score
      // used by the matcher, so we send it to the backend for auditing.
      const distance = match ? match.distance : null;

      // Per-match cooldown so the same person doesn't re-fire every cycle.
      const cooldownKey = matchedPersonId ?? "unknown";
      const lastFired = cooldownRef.current.get(cooldownKey) ?? 0;
      const now = Date.now();
      if (now - lastFired < cooldownMs) return;
      cooldownRef.current.set(cooldownKey, now);

      const imageBlob = await captureFrameAsBlob(video);
      onIdentifiedFrame({
        imageBlob,
        matchedPersonId,
        matchedPersonName,
        distance,
        timestamp: now,
      });
    },
    [paused, ready, videoRef, onIdentifiedFrame],
  );

  return { ready, paused, runIdentityCheck };
}

/** Grabs the current video frame as a JPEG blob for the backend upload. */
function captureFrameAsBlob(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.85,
    );
  });
}
