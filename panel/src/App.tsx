import "./App.css";

import TopBar from "./components/layout/TopBar";
import LeftPanel from "./components/layout/LeftPanel";
import CenterPanel from "./components/layout/CenterPanel";
import RightPanel from "./components/layout/RightPanel";

export default function App() {
  return (
    <div className="app">
      <TopBar />

      <main className="dashboard">
        <LeftPanel />

        <CenterPanel />

        <RightPanel />
      </main>
    </div>
  );
}
