import HudCircleWidget from "./HudCircleWidget";

const messages = [["HADES", "All systems are synchronized. How can I assist?"], ["OPERATOR", "Show current intelligence state."]];

export default function RightPanel() {
  return <aside className="right-panel"><section className="hud-panel conversation-panel"><div className="panel-title">CONVERSATION</div><div className="conversation-feed">{messages.map(([role, message]) => <article className={role === "HADES" ? "message hades" : "message operator"} key={role}><span>{role}</span><p>{message}</p></article>)}</div><div className="conversation-input"><span>TYPE COMMAND...</span><button type="button" aria-label="Send command">↑</button></div></section><section className="hud-panel widget-row"><HudCircleWidget label="VOICE" value="ON" detail="VOICE INTERFACE READY" progress={94} /><HudCircleWidget label="MEMORY" value="98%" detail="LONG-TERM MEMORY" progress={98} /></section><section className="hud-panel activity-panel"><div className="panel-title">LIVE ACTIVITY</div><p><i /> MEMORY SYNCHRONIZATION COMPLETE</p><p><i /> MODEL ROUTER STANDING BY</p></section></aside>;
}
