import Icon from "../ui/Icon";
import HudCircleWidget from "./HudCircleWidget";

const feed = [
  ["memory", "Memory Update", "2s ago", ""],
  ["globe", "Web Search", "5s ago", ""],
  ["brain", "AI Thinking", "3s ago", "purple"],
  ["processing", "Data Processing", "1s ago", ""],
  ["shield", "System Check", "OK", "green"],
] as const;

const actions = [
  ["mic", "Voice", ""],
  ["globe", "Browser", ""],
  ["email", "Email", ""],
  ["memory", "Memory", "purple"],
  ["tasks", "Tasks", ""],
  ["settings", "Settings", ""],
] as const;

export default function RightPanel() {
  return (
    <aside className="side-panel right-panel">
      <section className="hud-panel">
        <div className="panel-title">ACTIVITY FEED<span className="panel-dots">•••</span></div>
        <div className="panel-body feed-list">
          {feed.map(([icon, label, time, tone]) => (
            <div className="feed-row" key={label}>
              <span className={`feed-icon ${tone}`}><Icon name={icon} /></span>
              <span className="feed-label">{label}</span>
              <span className={`feed-time ${time === "OK" ? "green" : ""}`}>{time}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="hud-panel">
        <div className="panel-title">QUICK ACTIONS<span className="panel-dots">•••</span></div>
        <div className="panel-body action-grid">
          {actions.map(([icon, label, tone]) => (
            <button type="button" className="action-tile" key={label}>
              <span className={`action-icon ${tone}`}><Icon name={icon} /></span>
              <span className="action-label">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="hud-panel">
        <div className="panel-title">MEMORY USAGE<span className="panel-dots">•••</span></div>
        <div className="panel-body memory-body">
          <HudCircleWidget label="" value="72%" detail="" progress={72} />
          <div className="memory-info">
            <div className="mem-row"><span>Used</span><strong>7.2 GB</strong></div>
            <div className="mem-row"><span>Total</span><strong>10 GB</strong></div>
            <div className="mem-row"><span>Vector DB</span><strong className="tag-purple">Qdrant</strong></div>
          </div>
        </div>
      </section>
    </aside>
  );
}
