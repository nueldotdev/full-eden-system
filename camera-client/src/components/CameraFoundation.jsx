// import { useEffect, useRef } from "react";
// import { useMotionGate } from "../hooks/useMotionGate";
// import { useObjectGate } from "../hooks/useObjectGate";
// import { canFire } from "../utils/cooldown";

// export default function CameraFoundation({ rule, onMatch }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   const { checkMotion } = useMotionGate();
//   const { ready, detectAndMatch } = useObjectGate(rule);

//   useEffect(() => {
//     navigator.mediaDevices
//       .getUserMedia({ video: true })
//       .then((stream) => {
//         videoRef.current.srcObject = stream;
//       })
//       .catch((err) => console.error("Camera access failed:", err));
//   }, []);

//   const captureFrame = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     if (!video || !canvas || video.videoWidth === 0) return null;

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//     return ctx.getImageData(0, 0, canvas.width, canvas.height);
//   };

//   const drawBox = (match) => {
//   const canvas = canvasRef.current;
//   const ctx = canvas.getContext("2d");

//   const { x, y, width, height, label, confidence } = match;

//   ctx.strokeStyle = "#00ff00";
//   ctx.lineWidth = 3;
//   ctx.strokeRect(x, y, width, height);

//   ctx.fillStyle = "#00ff00";
//   ctx.font = "16px sans-serif";
//   ctx.fillText(
//     `${label} (${(confidence * 100).toFixed(0)}%)`,
//     x,
//     y > 20 ? y - 8 : y + 20
//   );
// };

//   useEffect(() => {
//     const interval = setInterval(async () => {
//       if (!ready) return;

//       const frame = captureFrame(); // this also redraws the plain video frame each cycle
//       if (!frame) return;

//       const { motionDetected } = checkMotion(frame);
//       if (!motionDetected) return;

//       const match = await detectAndMatch(videoRef.current);
//       if (!match) return;

//       drawBox(match); // draw the box regardless of cooldown, so it's visually live

//       if (!canFire(match.label)) return;

//       onMatch(frame, match); // handoff to Dev B
//     }, 400);

//     return () => clearInterval(interval);
//   }, [ready]);

//   return (
//     <div>
//       <video ref={videoRef} autoPlay muted playsInline style={{ display: "none" }} />
//       <canvas
//         ref={canvasRef}
//         style={{ width: "480px", border: "2px solid black" }}
//       />
//       <p>{ready ? "Model ready" : "Loading model..."}</p>
//     </div>
//   );
// }

import { useEffect, useRef } from "react";
import { useMotionGate } from "../hooks/useMotionGate";
import { useObjectGate } from "../hooks/useObjectGate";
import { canFire } from "../utils/cooldown";

export default function CameraFoundation({ rule, onMatch }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { checkMotion } = useMotionGate();
  const { ready, detectAndMatch } = useObjectGate(rule);

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

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!ready) return;

      const frame = captureFrame();
      if (!frame) return;

      const { motionDetected } = checkMotion(frame);
      if (!motionDetected) return;

      const match = await detectAndMatch(videoRef.current);
      if (!match) return;

      if (!canFire(match.label)) return;

      onMatch(frame, match); // handoff to Dev B
    }, 400);

    return () => clearInterval(interval);
  }, [ready]);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "480px", border: "2px solid black" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <p>{ready ? "Model ready" : "Loading model..."}</p>
    </div>
  );
}