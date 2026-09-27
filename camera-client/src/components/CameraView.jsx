import { useEffect, useRef, useState } from "react";
import { useMotionGate } from "../hooks/useMotionGate";
import { useObjectGate } from "../hooks/useObjectGate";
import { canFire } from "../utils/cooldown";

export default function CameraView({ rule, onMatch }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { checkMotion } = useMotionGate();
  const { ready, detectAndMatch } = useObjectGate(rule);

  const [statusText, setStatusText] = useState("Standby");
  const [lastDetection, setLastDetection] = useState(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Camera access failed:", err));
  }, []);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const drawBox = (match) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y, width, height, label, confidence, color } = match;

    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    const text = `OBJECT DETECTED: ${label} (${color}) [${(confidence * 100).toFixed(1)}% MATCH]`;
    ctx.font = "13px monospace";
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = "rgba(0, 20, 25, 0.85)";
    ctx.fillRect(x, y - 20, textWidth + 10, 18);

    ctx.fillStyle = "#00e5ff";
    ctx.fillText(text, x + 5, y - 6);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      console.log("CameraView interval tick — ready:");
      if (!ready) {
        console.log("CameraView interval tick — ready: -2")
        setStatusText("Loading model...");
        return;
      }

      const frame = captureFrame();
      console.log("CameraView interval tick — ready: -3")
      if (!frame) return;

      const { motionDetected } = checkMotion(frame);
      setStatusText(
        motionDetected ? "ANALYZING FEED • MOTION" : "MONITORING • NO MOTION"
      );

      if (!motionDetected) return;

      const match = await detectAndMatch(videoRef.current, frame);
      console.log("CameraView interval tick — ready: -4")
      if (!match) return;

      drawBox(match);
      setLastDetection(match);

      if (!canFire(match.label)) console.log("CameraView interval tick — ready: FAIL");

      onMatch(frame, match); // handoff to Dev B
    }, 400);

    return () => clearInterval(interval);
  }, [ready]);

  return (
    <div style={styles.container}>
      <video ref={videoRef} autoPlay muted playsInline style={{ display: "none" }} />

      <div style={styles.topbar}>
        <span style={styles.recDot}>● REC</span>
        <span>CAM 01 — LIVE FEED</span>
        <span style={styles.statusText}>{statusText}</span>
      </div>

      <canvas ref={canvasRef} style={styles.canvas} />

      {lastDetection && (
        <div style={styles.footer}>
          {lastDetection.label} ({lastDetection.color}) — POS: X:
          {lastDetection.x.toFixed(0)} Y:{lastDetection.y.toFixed(0)}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    width: "640px",
    maxWidth: "100%",
    background: "#05080a",
    border: "1px solid #1c2b2f",
    borderRadius: "4px",
    overflow: "hidden",
    fontFamily: "monospace",
    color: "#00e5ff",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 10px",
    background: "#0a1114",
    fontSize: "12px",
    borderBottom: "1px solid #1c2b2f",
  },
  recDot: {
    color: "#ff4444",
  },
  statusText: {
    color: "#00e5ff",
    opacity: 0.85,
  },
  canvas: {
    display: "block",
    width: "100%",
    height: "auto",
  },
  footer: {
    padding: "4px 10px",
    fontSize: "11px",
    background: "#0a1114",
    borderTop: "1px solid #1c2b2f",
    opacity: 0.8,
  },
};