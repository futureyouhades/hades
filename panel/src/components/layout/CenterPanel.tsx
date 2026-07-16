import BrainCore from "../core/BrainCore";

export default function CenterPanel() {
  return (
    <section className="center-panel">
      <div className="center-header">
        <div className="center-title">
          HADES AI CORE
        </div>

        <div className="center-status">
          ● ACTIVE
        </div>
      </div>

      <div className="brain-wrapper">
        <BrainCore />
      </div>

      <div className="center-footer">
        <div className="footer-box">
          <span>AI</span>
          <strong>ONLINE</strong>
        </div>

        <div className="footer-box">
          <span>MEMORY</span>
          <strong>SYNC</strong>
        </div>

        <div className="footer-box">
          <span>VOICE</span>
          <strong>READY</strong>
        </div>

        <div className="footer-box">
          <span>NETWORK</span>
          <strong>CONNECTED</strong>
        </div>
      </div>
    </section>
  );
}
