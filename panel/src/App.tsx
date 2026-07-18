import "./App.css";

import BottomStatusBar from "./components/layout/BottomStatusBar";
import CenterPanel from "./components/layout/CenterPanel";
import LeftPanel from "./components/layout/LeftPanel";
import RightPanel from "./components/layout/RightPanel";
import TopBar from "./components/layout/TopBar";
import { useHadesVoice } from "./hooks/useHadesVoice";

export default function App() {
  const voice = useHadesVoice();

  return (
    <div className="control-center">
      <div className="hud-noise" aria-hidden="true" />
      <TopBar />
      <main className="dashboard" aria-label="Hades Control Center">
        <LeftPanel voiceState={voice.voiceState} voiceLevel={voice.voiceLevel} error={voice.error} onToggleVoice={voice.toggleListening} />
        <CenterPanel voiceState={voice.voiceState} voiceLevel={voice.voiceLevel} transcript={voice.transcript} messages={voice.messages} onSendMessage={voice.sendMessage} />
        <RightPanel />
      </main>
      <BottomStatusBar voiceState={voice.voiceState} />
    </div>
  );
}
