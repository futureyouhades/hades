export default function TopBar() {
  const now = new Date();

  const time = now.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo-circle">H</div>

        <div className="logo-text">
          <h1>HADES</h1>
        </div>
      </div>

      <div className="topbar-center">
        <span>HADES CONTROL CENTER</span>
      </div>

      <div className="topbar-right">
        <div className="status-online">
          <span className="status-dot"></span>
          ONLINE
        </div>

        <div className="heartbeat">
          ═╤═╱╲══╱╲══
        </div>

        <div className="clock">
          {time}
        </div>

        <button className="window-btn">─</button>
        <button className="window-btn">□</button>
        <button className="window-btn close">✕</button>
      </div>
    </header>
  );
}
