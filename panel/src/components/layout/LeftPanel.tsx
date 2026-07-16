import HudCircleWidget from "./HudCircleWidget";

const actions = ["NEW CONVERSATION", "VOICE COMMAND", "SCAN MEMORY", "RUN AUTOMATION"];

export default function LeftPanel() {
  return <aside className="left-panel"><section className="hud-panel quick-actions"><div className="panel-title">QUICK ACTIONS</div>{actions.map((action, index) => <button type="button" className="quick-action" key={action}><b>0{index + 1}</b>{action}<span>›</span></button>)}</section><section className="hud-panel widget-group"><div className="panel-title">AI MODEL</div><HudCircleWidget label="MODEL" value="CLAUDE" detail="SONNET 4.5 / OPTIMAL" progress={82} /></section><section className="hud-panel system-grid"><div className="panel-title">SYSTEM STATUS</div><div><span>CPU LOAD</span><strong>24%</strong></div><div><span>MEMORY</span><strong>8.4 GB</strong></div><div><span>NETWORK</span><strong>ONLINE</strong></div></section></aside>;
}
