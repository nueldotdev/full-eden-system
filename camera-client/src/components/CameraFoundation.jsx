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