import Icon from "../ui/Icon";

const systemStats = [
  ["core", "Core", 100],
  ["memory", "Memory", 87],
  ["cpu", "CPU", 62],
  ["network", "Network", 98],
  ["aiengine", "AI Engine", 100],
] as const;

const bars = Array.from({ length: 28 }, (_, i) => 6 + Math.abs(Math.sin(i * 1.7)) * 26);

export default function LeftPanel() {
  return (
    <aside className="side-panel left-panel">
      <section className="hud-panel">
        <div className="panel-title">SYSTEM STATUS<span className="panel-dots">•••</span></div>
        <div className="panel-body stat-list">
          {systemStats.map(([icon, label, value]) => (
            <div className="stat-row" key={label}>
              <span className="stat-icon"><Icon name={icon} /></span>
              <span className="stat-label">{label}</span>
              <span className="stat-track"><span className="stat-fill" style={{ width: `${value}%` }} /></span>
              <span className="stat-value">{value}%</span>
            </div>
          ))}
          <div className="stat-ok"><Icon name="shield" className="ok-icon" /> All systems operational</div>
        </div>
      </section>

      <section className="hud-panel">
        <div className="panel-title">AI MODEL<span className="panel-dots">•••</span></div>
        <div className="panel-body model-body">
          <div className="model-orb"><span className="orb-node" /></div>
          <div className="model-info">
            <div className="model-row"><b>Claude 3.5 Sonnet <i className="dot-green" /></b><span className="tag-cyan">Active</span></div>
            <div className="model-row"><b>Qwen 2.5 Code</b><span className="tag-purple">Ready</span></div>
            <div className="model-row"><b>Model Router</b><span className="tag-cyan">Optimal</span></div>
            <button type="button" className="switch-btn">Switch Model</button>
          </div>
        </div>
      </section>

      <section className="hud-panel">
        <div className="panel-title">VOICE STATUS<span className="panel-dots">•••</span></div>
        <div className="panel-body voice-body">
          <div className="voice-mic"><Icon name="mic" /></div>
          <div className="voice-wave">{bars.map((h, i) => <span key={i} style={{ height: `${h}px` }} />)}</div>
          <div className="voice-caption">Listening...</div>
        </div>
      </section>
    </aside>
  );
}
