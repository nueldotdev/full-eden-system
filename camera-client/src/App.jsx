import CameraFoundation from "./components/CameraFoundation";
import { mockRule } from "./config/mockRule";

export default function App() {
  const handleMatch = (frame, match) => {
    console.log("MATCH:", match.label, match.confidence);
    // swap this for Dev B's real function once you have it
  };

  return (
    <div>
      <h1>Project Eden — Camera Foundation</h1>
      <CameraFoundation rule={mockRule} onMatch={handleMatch} />
    </div>
  );
}