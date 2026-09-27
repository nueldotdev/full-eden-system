// import { useEffect, useRef, useState } from "react";
// import { useMotionGate } from "../hooks/useMotionGate";
// import { useObjectGate } from "../hooks/useObjectGate";
// import { canFire } from "../utils/cooldown";

// export default function CameraView({ rule, onMatch }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   const { checkMotion } = useMotionGate();
//   const { ready, detectAndMatch } = useObjectGate(rule);

//   const [cameraError, setCameraError] = useState(null);

//   const startCamera = () => {
//     setCameraError(null);
//     console.log("[CameraView] Requesting webcam stream via getUserMedia...");
//     navigator.mediaDevices
//       .getUserMedia({
//         video: {
//           width: { ideal: 640 },
//           height: { ideal: 480 },
//         },
//       })
//       .then((stream) => {
//         console.log(
//           "[CameraView] ✅ Webcam access granted! Tracks:",
//           stream.getVideoTracks().map((t) => t.label)
//         );
//         const video = videoRef.current;
//         if (video) {
//           video.srcObject = stream;
//           video.onloadedmetadata = () => {
//             console.log(
//               `[CameraView] ✅ Video stream ready: ${video.videoWidth}x${video.videoHeight}`
//             );
//             video.play().catch((e) => console.warn("[CameraView] video.play() error:", e));
//           };
//         }
//       })
//       .catch((err) => {
//         console.error("[CameraView] ❌ Camera access failed:", err);
//         setCameraError(
//           err.name === "NotReadableError"
//             ? "Camera is in use by another tab or application. Please close other camera tabs/apps and click Retry."
//             : `Camera error: ${err.message}`
//         );
//       });
//   };

//   useEffect(() => {
//     startCamera();
//   }, []);

//   const captureFrame = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     if (!video || !canvas) return null;

//     if (video.videoWidth === 0 || video.videoHeight === 0) {
//       return null;
//     }

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//     return ctx.getImageData(0, 0, canvas.width, canvas.height);
//   };

//   const drawBox = (match) => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     const { x, y, width, height, label, confidence, color } = match;

//     ctx.strokeStyle = "#00e5ff";
//     ctx.lineWidth = 3;
//     ctx.strokeRect(x, y, width, height);

//     const text = `DETECTED: ${label.toUpperCase()} (${color}) [${(confidence * 100).toFixed(0)}%]`;
//     ctx.font = "bold 13px monospace";
//     const textWidth = ctx.measureText(text).width;

//     ctx.fillStyle = "rgba(0, 20, 25, 0.9)";
//     ctx.fillRect(x, Math.max(0, y - 22), textWidth + 10, 20);

//     ctx.fillStyle = "#00e5ff";
//     ctx.fillText(text, x + 5, Math.max(14, y - 7));
//   };

//   const detectRef = useRef(detectAndMatch);
//   detectRef.current = detectAndMatch;

//   const onMatchRef = useRef(onMatch);
//   onMatchRef.current = onMatch;

//   const checkMotionRef = useRef(checkMotion);
//   checkMotionRef.current = checkMotion;

//   useEffect(() => {
//     console.log("[CameraView] Starting detection loop (interval: 400ms)");
//     const interval = setInterval(async () => {
//       if (!ready) {
//         setStatusText("Loading model...");
//         return;
//       }

//       const frame = captureFrame();
//       if (!frame) {
//         setStatusText(cameraError ? "CAMERA LOCKED / IN USE" : "Waiting for camera...");
//         return;
//       }

//       // Check motion for status feed
//       const { motionDetected } = checkMotionRef.current(frame);
//       setStatusText(
//         motionDetected ? "ANALYZING FEED • MOTION" : "LIVE FEED • MONITORING"
//       );

//       // ALWAYS RUN OBJECT DETECTION ON THE CANVAS FRAME!
//       const match = await detectRef.current(canvasRef.current, frame);
//       if (!match) return;

//       console.log("[CameraView] 🎯 Drawing box for:", match.label);
//       drawBox(match);
//       setLastDetection(match);

//       if (!canFire(match.label)) return;

//       console.log(`[CameraView] Handing off match to onMatch():`, match.label);
//       onMatchRef.current?.(frame, match);
//     }, 400);

//     return () => clearInterval(interval);
//   }, [ready, cameraError]);

//   return (
//     <div style={styles.container}>
//       {cameraError && (
//         <div style={styles.errorBanner}>
//           <span>⚠️ {cameraError}</span>
//           <button onClick={startCamera} style={styles.retryBtn}>
//             Retry Camera
//           </button>
//         </div>
//       )}

//       <video
//         ref={videoRef}
//         autoPlay
//         muted
//         playsInline
//         style={{
//           position: "fixed",
//           top: -9999,
//           left: -9999,
//           width: 640,
//           height: 480,
//           opacity: 0,
//           pointerEvents: "none",
//         }}
//       />

//       <div style={styles.topbar}>
//         <span style={styles.recDot}>● REC</span>
//         <span>CAM 01 — LIVE FEED</span>
//         <span style={styles.statusText}>{statusText}</span>
//       </div>

//       <canvas ref={canvasRef} style={styles.canvas} />

//       {lastDetection && (
//         <div style={styles.footer}>
//           {lastDetection.label} ({lastDetection.color}) — POS: X:
//           {lastDetection.x.toFixed(0)} Y:{lastDetection.y.toFixed(0)}
//         </div>
//       )}
//     </div>
//   );
// }

// const styles = {
//   container: {
//     position: "relative",
//     width: "640px",
//     maxWidth: "100%",
//     background: "#05080a",
//     border: "1px solid #1c2b2f",
//     borderRadius: "4px",
//     overflow: "hidden",
//     fontFamily: "monospace",
//     color: "#00e5ff",
//   },
//   topbar: {
//     display: "flex",
//     justifyContent: "space-between",
//     padding: "6px 10px",
//     background: "#0a1114",
//     fontSize: "12px",
//     borderBottom: "1px solid #1c2b2f",
//   },
//   recDot: {
//     color: "#ff4444",
//   },
//   statusText: {
//     color: "#00e5ff",
//     opacity: 0.85,
//   },
//   canvas: {
//     display: "block",
//     width: "100%",
//     height: "auto",
//   },
//   footer: {
//     padding: "4px 10px",
//     fontSize: "11px",
//     background: "#0a1114",
//     borderTop: "1px solid #1c2b2f",
//     opacity: 0.8,
//   },
//   errorBanner: {
//     background: "#ff2244",
//     color: "#fff",
//     padding: "8px 12px",
//     fontSize: "12px",
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   retryBtn: {
//     background: "#fff",
//     color: "#000",
//     border: "none",
//     borderRadius: "3px",
//     padding: "3px 8px",
//     cursor: "pointer",
//     fontWeight: "bold",
//     fontFamily: "monospace",
//   },
// };

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
      if (!ready) {
        setStatusText("Loading model...");
        return;
      }

      const frame = captureFrame();
      if (!frame) return;

      const { motionDetected } = checkMotion(frame);
      setStatusText(
        motionDetected ? "ANALYZING FEED • MOTION DETECTED" : "MONITORING • NO MOTION"
      );

      if (!motionDetected) return;

      const match = await detectAndMatch(videoRef.current, frame);
      if (!match) return;

      drawBox(match);
      setLastDetection(match);

      if (!canFire(match.label)) return;

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