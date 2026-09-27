import { useCallback, useEffect, useRef, useState } from "react";
import { useIdentityLayer } from "./useIdentityLayer";
import { photoToDescriptor } from "./faceDescriptor";
import type { EnrolledPerson } from "./faceDescriptor";

const STORAGE_KEY = "eden-local-enrollment";

function loadLocalEnrollment(): EnrolledPerson[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as EnrolledPerson[];
  } catch (error) {
    console.error("Eden: failed to load local enrollment", error);
    return [];
  }
}

async function saveLocalEnrollment(person: EnrolledPerson) {
  const existing = loadLocalEnrollment();
  const merged = [...existing.filter((item) => item.id !== person.id), person];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function IdentityLayerExample() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [enrolled, setEnrolled] =
    useState<EnrolledPerson[]>(loadLocalEnrollment);
  const [enrolling, setEnrolling] = useState(false);
  const [personName, setPersonName] = useState("Local User");
  const [message, setMessage] = useState("");

  const fetchControlPlane = useCallback(async (): Promise<{
    ruleVersion: string;
    enrolled: EnrolledPerson[];
  }> => {
    return {
      ruleVersion: `local-${enrolled.length}`,
      enrolled,
    };
  }, [enrolled]);

  async function sendToBackend(payload: {
    descriptor: number[];
    matchedPersonId: string | null;
    distance: number | null;
    timestamp: number;
  }) {
    console.log("Identity result:", {
      matchedPersonId: payload.matchedPersonId,
      distance: payload.distance,
      timestamp: payload.timestamp,
      descriptorLength: payload.descriptor.length,
    });

    if (payload.matchedPersonId) {
      setMessage(
        `Identity matched: ${payload.matchedPersonId} (distance: ${payload.distance?.toFixed(3)})`,
      );
    } else {
      setMessage("No enrolled identity matched this face.");
    }
  }

  const { ready, paused, runIdentityCheck } = useIdentityLayer({
    videoRef,
    fetchControlPlane,
    onIdentifiedFrame: sendToBackend,
  });

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        const video = videoRef.current;

        if (!video) {
          return;
        }

        video.srcObject = stream;

        await video.play();

        if (video.readyState >= 2 && video.videoWidth > 0) {
          setCameraReady(true);
        } else {
          video.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
      } catch (error) {
        console.error("Camera access failed:", error);
        setMessage("Camera access failed.");
      }
    }

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function enrollCurrentFace() {
    const video = videoRef.current;

    if (!video) {
      setMessage("Camera is not available.");
      return;
    }

    if (!cameraReady) {
      setMessage("Camera is not ready yet.");
      return;
    }

    if (!ready) {
      setMessage("Face models are still loading.");
      return;
    }

    try {
      setEnrolling(true);
      setMessage("Scanning face...");

      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not create canvas context");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const safeName = personName.trim() || "Local User";
      const descriptor = await photoToDescriptor(canvas);
      const person: EnrolledPerson = {
        id: `${safeName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        name: safeName,
        descriptors: [descriptor],
      };

      const nextEnrollment = await saveLocalEnrollment(person);

      setEnrolled(nextEnrollment);

      setMessage(`Face enrolled successfully as ${safeName}.`);

      console.log("Eden: face enrolled successfully", {
        id: person.id,
        name: person.name,
        descriptorLength: descriptor.length,
      });
    } catch (error) {
      console.error("Eden: enrollment failed", error);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Face enrollment failed.");
      }
    } finally {
      setEnrolling(false);
    }
  }

  function clearEnrollment() {
    localStorage.removeItem(STORAGE_KEY);
    setEnrolled([]);
    setMessage("Local enrollment cleared.");

    console.log("Eden: local enrollment cleared");
  }

  const hasEnrollment = enrolled.length > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Eden Identity Layer</h1>

      <p>Model status: {ready ? "Ready" : "Loading face models..."}</p>

      <p>Camera status: {cameraReady ? "Ready" : "Starting camera..."}</p>

      <p>
        Enrollment status:{" "}
        {hasEnrollment ? "Face enrolled" : "No face enrolled"}
      </p>

      <div style={{ marginBottom: "16px", display: "grid", gap: "8px" }}>
        <label htmlFor="person-name" style={{ fontWeight: 600 }}>
          Enroll name
        </label>
        <input
          id="person-name"
          type="text"
          value={personName}
          onChange={(event) => setPersonName(event.target.value)}
          placeholder="Enter a name"
          style={{
            width: "100%",
            maxWidth: "320px",
            padding: "10px 12px",
            fontSize: "16px",
          }}
        />
      </div>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          maxWidth: "640px",
          borderRadius: "12px",
          background: "#111",
          display: "block",
        }}
      />

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          disabled={!ready || !cameraReady || paused || enrolling}
          onClick={enrollCurrentFace}
          style={{
            padding: "12px 20px",
            cursor: "pointer",
          }}
        >
          {enrolling ? "Enrolling..." : "Enroll Me"}
        </button>

        <button
          disabled={!ready || !cameraReady || paused || !hasEnrollment}
          onClick={() => runIdentityCheck()}
          style={{
            padding: "12px 20px",
            cursor: "pointer",
          }}
        >
          Run Identity Check
        </button>

        <button
          disabled={!hasEnrollment || enrolling}
          onClick={clearEnrollment}
          style={{
            padding: "12px 20px",
            cursor: "pointer",
          }}
        >
          Clear Enrollment
        </button>
      </div>

      {message && (
        <p
          style={{
            marginTop: "20px",
            padding: "12px",
            background: "#f3f3f3",
            borderRadius: "8px",
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}
