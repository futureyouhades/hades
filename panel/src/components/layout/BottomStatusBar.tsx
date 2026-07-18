import Icon from "../ui/Icon";
import type { VoiceState } from "../../types/voice";

const baseItems = [
  ["uptime", "UPTIME", "02:14:37", ""],
  ["connection", "CONNECTION", "SECURE", ""],
  ["dataflow", "DATA FLOW", "ACTIVE", "cyan"],
  ["settings", "AI STATUS", "OPTIMAL", "green"],
] as const;

const voiceLabels: Record<VoiceState, string> = { idle: "READY", listening: "LISTENING", thinking: "THINKING", speaking: "SPEAKING", error: "ERROR" };

export default function BottomStatusBar({ voiceState }: { voiceState: VoiceState }) {
  const items = [...baseItems.slice(0, 3), ["mic", "VOICE", voiceLabels[voiceState], voiceState === "error" ? "red" : "cyan"] as const, baseItems[3]];
  return (
    <footer className="bottom-status">
      <div className="status-brand"><Icon name="kernel" className="brand-icon" /> HADES AI KERNEL <span>v0.1.0</span></div>
      <div className="status-stream">
        {items.map(([icon, label, value, tone]) => (
          <span className="status-item" key={label}>
            <Icon name={icon} className={`status-ico ${tone}`} /> {label} <b className={tone}>{value}</b>
          </span>
        ))}
      </div>
    </footer>
  );
}
