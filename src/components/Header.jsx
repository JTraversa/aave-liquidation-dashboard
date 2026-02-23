import { useState } from 'react';
import Settings from './Settings';

export default function Header() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="header">
      <div className="header-left">
        <nav className="header-nav">
          <a href="/" className="nav-link">Home</a>
          <span className="nav-sep">/</span>
          <a href="/tools" className="nav-link">Tools</a>
          <span className="nav-sep">/</span>
          <a href="/rpc" className="nav-link">RPC Benchmark</a>
        </nav>
        <h1>Aave V3 Liquidation Dashboard</h1>
      </div>
      <button
        className="settings-btn"
        onClick={() => setShowSettings(true)}
        title="Settings"
      >
        Settings
      </button>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </header>
  );
}
