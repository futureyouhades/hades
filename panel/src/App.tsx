import "./App.css";

import BottomStatusBar from "./components/layout/BottomStatusBar";
import CenterPanel from "./components/layout/CenterPanel";
import LeftPanel from "./components/layout/LeftPanel";
import RightPanel from "./components/layout/RightPanel";
import TopBar from "./components/layout/TopBar";

export default function App() {
  return (
    <div className="control-center">
      <div className="hud-noise" aria-hidden="true" />
      <TopBar />
      <main className="dashboard" aria-label="Hades Control Center"><LeftPanel /><CenterPanel /><RightPanel /></main>
      <BottomStatusBar />
    </div>
  );
}
