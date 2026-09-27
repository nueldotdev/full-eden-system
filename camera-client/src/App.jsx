import CameraView from "./components/CameraView";
import { mockRule } from "./config/mockrule";

export default function App() {
  const handleMatch = (frame, match) => {
    console.log("MATCH:", match.label, match.confidence);
    // TODO: replace with Dev B's real handoff once confirmed
  };

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: "20px" }}>
      <CameraView rule={mockRule} onMatch={handleMatch} />
    </div>
  );
}