import BrainCore from "../core/BrainCore";

const telemetry = [["NEURAL NETWORK", "12,984 NODES", "top-left"], ["DATA FLOW", "98.4 TB/S", "top-right"], ["LEARNING MODE", "ADAPTIVE", "bottom-left"], ["THINKING DEPTH", "LEVEL 08", "bottom-right"]] as const;

export default function CenterPanel() {
  return (
    <section className="center-panel" aria-label="Hades AI core">
      <div className="center-header"><div><span className="core-kicker">CENTRAL INTELLIGENCE / NODE 01</span><div className="center-title">HADES AI CORE</div></div><div className="center-status">● SYNCHRONIZED</div></div>
      <div className="brain-wrapper">
        <BrainCore />
        <div className="core-crosshair" aria-hidden="true" />
        {telemetry.map(([label, value, position]) => <div className={`floating-readout ${position}`} key={label}><span>{label}</span><strong>{value}</strong><i /></div>)}
      </div>
      <div className="center-footer"><div className="footer-box"><span>AI</span><strong>ONLINE</strong></div><div className="footer-box"><span>MEMORY</span><strong>SYNC</strong></div><div className="footer-box"><span>VOICE</span><strong>READY</strong></div><div className="footer-box"><span>NETWORK</span><strong>CONNECTED</strong></div></div>
    </section>
  );
}
