import Icon from "../ui/Icon";

const items = [
  ["uptime", "UPTIME", "02:14:37", ""],
  ["connection", "CONNECTION", "SECURE", ""],
  ["dataflow", "DATA FLOW", "ACTIVE", "cyan"],
  ["mic", "VOICE", "READY", ""],
  ["settings", "AI STATUS", "OPTIMAL", "green"],
] as const;

export default function BottomStatusBar() {
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
