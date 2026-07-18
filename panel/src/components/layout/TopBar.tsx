import Icon from "../ui/Icon";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo-circle">H</div>
        <div className="logo-text"><h1>HADES</h1></div>
      </div>
      <div className="topbar-center">HADES CONTROL CENTER</div>
      <div className="topbar-right">
        <div className="status-online"><span className="status-dot" /> ONLINE</div>
        <span className="heartbeat"><Icon name="pulse" /></span>
        <span className="clock">05:53:21</span>
        <div className="window-btns">
          <button className="window-btn" aria-label="Minimize" type="button"><Icon name="min" /></button>
          <button className="window-btn" aria-label="Maximize" type="button"><Icon name="max" /></button>
          <button className="window-btn close" aria-label="Close" type="button"><Icon name="close" /></button>
        </div>
      </div>
    </header>
  );
}
