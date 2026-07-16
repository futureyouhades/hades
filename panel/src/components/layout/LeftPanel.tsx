const modules = [
  {
    title: "SYSTEM",
    value: "ONLINE",
  },
  {
    title: "CPU",
    value: "24%",
  },
  {
    title: "MEMORY",
    value: "8.4 GB",
  },
  {
    title: "AI CORE",
    value: "ACTIVE",
  },
  {
    title: "VOICE",
    value: "READY",
  },
  {
    title: "NETWORK",
    value: "CONNECTED",
  },
];

export default function LeftPanel() {
  return (
    <aside className="left-panel">
      <div className="panel-title">
        SYSTEM STATUS
      </div>

      {modules.map((item) => (
        <div
          className="hud-card"
          key={item.title}
        >
          <div className="hud-label">
            {item.title}
          </div>

          <div className="hud-value">
            {item.value}
          </div>
        </div>
      ))}

      <div className="panel-title">
        SERVICES
      </div>

      <div className="hud-card">
        Browser Agent
      </div>

      <div className="hud-card">
        Memory Engine
      </div>

      <div className="hud-card">
        Email Agent
      </div>

      <div className="hud-card">
        Vision Module
      </div>

      <div className="hud-card">
        Automation
      </div>
    </aside>
  );
}
