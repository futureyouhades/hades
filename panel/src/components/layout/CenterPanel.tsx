import BrainCore from "../core/BrainCore";
import Icon from "../ui/Icon";

const readouts = [
  { pos: "top-left", label: "NEURAL NETWORK", lines: ["Synapses Active", "12.5B"] },
  { pos: "top-right", label: "DATA FLOW", lines: ["2.48 TB/s"] },
  { pos: "bottom-left", label: "LEARNING MODE", lines: ["Continuous"] },
  { pos: "bottom-right", label: "THINKING DEPTH", lines: ["Maximum"] },
] as const;

const messages = [
  { role: "M", name: "Michał", text: "Hej Hades", time: "05:52", cls: "user" },
  { role: "H", name: "HADES", text: "Dzień dobry Michał. W czym mogę pomóc?", time: "05:53", cls: "hades" },
] as const;

export default function CenterPanel() {
  return (
    <section className="center-panel" aria-label="Hades AI core">
      <div className="brain-wrapper">
        <BrainCore />
        {readouts.map((r) => (
          <div className={`floating-readout ${r.pos}`} key={r.label}>
            <span>{r.label}</span>
            {r.lines.map((line) => <strong key={line}>{line}</strong>)}
          </div>
        ))}
      </div>

      <section className="conversation">
        <div className="panel-title">CONVERSATION<span className="panel-dots">•••</span></div>
        <div className="conversation-feed">
          {messages.map((m) => (
            <article className={`message ${m.cls}`} key={m.name}>
              <span className={`avatar ${m.cls}`}>{m.role}</span>
              <div className="bubble">
                <div className="bubble-head"><b>{m.name}</b><time>{m.time}</time></div>
                <p>{m.text}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="conversation-input">
          <input type="text" placeholder="Napisz wiadomość..." aria-label="Message" />
          <button type="button" aria-label="Send message"><Icon name="send" /></button>
        </div>
      </section>
    </section>
  );
}
