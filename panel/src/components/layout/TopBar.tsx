const navigation = ["OVERVIEW", "AGENTS", "MEMORY", "SYSTEM"];

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-left"><div className="logo-circle">H</div><div className="logo-text"><h1>HADES</h1><span>AI OPERATING SYSTEM</span></div></div>
      <nav className="primary-nav" aria-label="Primary navigation">
        {navigation.map((item, index) => <button key={item} className={index === 0 ? "nav-item is-active" : "nav-item"} type="button">{item}</button>)}
      </nav>
      <div className="topbar-right">
        <div className="status-online"><span className="status-dot" /> CORE ONLINE</div>
        <div className="heartbeat">╲╱╲╱╲╱</div>
        <div className="clock">20:48:31 UTC</div>
        <button className="window-btn" aria-label="Open control menu" type="button">⌘</button>
      </div>
    </header>
  );
}
