import "./App.css";
import BrainCore from "./components/core/BrainCore";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          HADES
          <span> CONTROL CENTER</span>
        </div>

        <div className="status">
          <span className="dot"></span>
          ONLINE
        </div>
      </header>

      <main className="main">

        <section className="brain">

          <BrainCore />

        </section>

        <section className="statusPanel">

          <h1>HADES</h1>

          <h2>Listening...</h2>

          <p>
            Witaj Michale.
            Wszystkie systemy są gotowe.
          </p>

        </section>

        <section className="modules">

          <div className="module">
            🎤
            <span>VOICE</span>
          </div>

          <div className="module">
            🌐
            <span>BROWSER</span>
          </div>

          <div className="module">
            📧
            <span>EMAIL</span>
          </div>

          <div className="module">
            💾
            <span>MEMORY</span>
          </div>

          <div className="module">
            🤖
            <span>AI</span>
          </div>

          <div className="module">
            📷
            <span>CAMERA</span>
          </div>

        </section>

      </main>
    </div>
  );
}
