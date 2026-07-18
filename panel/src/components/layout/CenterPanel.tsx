import BrainCore from "../core/BrainCore";
import Icon from "../ui/Icon";
import { useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessage, VoiceState } from "../../types/voice";

const readouts = [
  { pos: "top-left", label: "NEURAL NETWORK", lines: ["Synapses Active", "12.5B"] },
  { pos: "top-right", label: "DATA FLOW", lines: ["2.48 TB/s"] },
  { pos: "bottom-left", label: "LEARNING MODE", lines: ["Continuous"] },
  { pos: "bottom-right", label: "THINKING DEPTH", lines: ["Maximum"] },
] as const;

interface Props {
  voiceState: VoiceState;
  voiceLevel: number;
  transcript: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
}

export default function CenterPanel({ voiceState, voiceLevel, transcript, messages, onSendMessage }: Props) {
  const [input, setInput] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    void onSendMessage(text);
  };

  return (
    <section className="center-panel" aria-label="Hades AI core">
      <div className="brain-wrapper">
        <BrainCore voiceState={voiceState} voiceLevel={voiceLevel} />
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
          {messages.slice(-4).map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <span className={`avatar ${message.role}`}>{message.role === "user" ? "M" : "H"}</span>
              <div className="bubble">
                <div className="bubble-head"><b>{message.name}</b><time>{message.time}</time></div>
                <p>{message.text}</p>
              </div>
            </article>
          ))}
          {transcript && <div className="live-transcript">„{transcript}”</div>}
        </div>
        <form className="conversation-input" onSubmit={submit}>
          <input value={input} onChange={(event) => setInput(event.target.value)} type="text" placeholder="Napisz wiadomość..." aria-label="Wiadomość" disabled={voiceState === "thinking"} />
          <button type="submit" aria-label="Wyślij wiadomość" disabled={!input.trim() || voiceState === "thinking"}><Icon name="send" /></button>
        </form>
      </section>
    </section>
  );
}
