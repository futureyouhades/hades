const status = ["NETWORK // CONNECTED", "MODEL // CLAUDE", "MEMORY // SYNCHRONIZED", "ENCRYPTION // ACTIVE"];

export default function BottomStatusBar() {
  return <footer className="bottom-status"><div className="status-stream"><span className="live-pulse" />{status.map((item) => <span key={item}>{item}</span>)}</div><div className="status-coordinates">HADES // CONTROL CENTER <span>v0.1.0</span></div></footer>;
}
