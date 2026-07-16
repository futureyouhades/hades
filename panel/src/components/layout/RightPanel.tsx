const logs = [
  "Kernel initialized",
  "Memory synchronized",
  "Voice engine ready",
  "AI routing active",
  "Browser connected",
  "Automation online",
  "Security check OK",
];

export default function RightPanel() {
  return (
    <aside className="right-panel">
      <div className="panel-title">
        ACTIVITY
      </div>

      {logs.map((log, index) => (
        <div
          className="log-row"
          key={index}
        >
          <span className="log-dot"></span>
          {log}
        </div>
      ))}

      <div className="panel-title">
        PERFORMANCE
      </div>

      <div className="hud-card">
        <div className="hud-label">CPU LOAD</div>
        <div className="progress">
          <div
            className="progress-bar"
            style={{ width: "24%" }}
          />
        </div>
      </div>

      <div className="hud-card">
        <div className="hud-label">MEMORY</div>
        <div className="progress">
          <div
            className="progress-bar"
            style={{ width: "68%" }}
          />
        </div>
      </div>

      <div className="hud-card">
        <div className="hud-label">GPU</div>
        <div className="progress">
          <div
            className="progress-bar"
            style={{ width: "41%" }}
          />
        </div>
      </div>

      <div className="hud-card">
        <div className="hud-label">NETWORK</div>
        <div className="progress">
          <div
            className="progress-bar"
            style={{ width: "92%" }}
          />
        </div>
      </div>
    </aside>
  );
}
