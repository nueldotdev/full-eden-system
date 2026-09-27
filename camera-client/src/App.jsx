import CameraView from "./components/CameraView";
import { useActiveRule } from "./hooks/useActiveRule";

export default function App() {
  const { rule, loading, error } = useActiveRule();

  const handleMatch = (frame, match) => {
    console.log("MATCH:", match.label, match.confidence);
    // TODO: replace with Dev B's real handoff once confirmed
  };

  if (loading) {
    return <div style={{ color: "#00e5ff", padding: 20 }}>Loading rule...</div>;
  }

  if (error || !rule) {
    return (
      <div style={{ color: "#ff4444", padding: 20 }}>
        {error || "No active rule"} — set one via the admin webapp.
      </div>
    );
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: "20px" }}>
      <CameraView rule={rule} onMatch={handleMatch} />
    </div>
  );
}