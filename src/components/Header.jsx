import { useState } from 'react';
import Settings from './Settings';
import ThemeToggle from './ThemeToggle';

const menuLinks = [
  { label: 'Home', href: 'https://traversa.dev' },
  { label: 'About', href: 'https://traversa.dev/about' },
  { label: 'Investments', href: 'https://traversa.dev/investments' },
  { label: 'Photography', href: 'https://traversa.dev/photography' },
  { label: 'Research', href: 'https://traversa.dev/research' },
];

const toolLinks = [
  { label: 'Tools', href: 'https://tools.traversa.dev' },
  { label: 'Aave Liquidation Search', href: '/', indent: true },
  { label: 'RPC Benchmarking', href: 'https://tools.traversa.dev/rpc', indent: true },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    document.body.classList.toggle('ovhidden');
  };

  return (
    <>
      <header className="site-header">
        <div className="header-left">
          <ThemeToggle />
          <button className="menu-toggle" onClick={toggleMenu}>
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          )}
        </button>
        </div>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          Settings
        </button>
      </header>

      <div className={`site-nav${menuOpen ? ' nav-open' : ''}`}>
        <div className="nav-bg">
          <div className="nav-wrapper">
            <div className="nav-container">
              <ul className="nav-menu">
                {menuLinks.map(({ label, href }) => (
                  <li key={href} className="nav-menu-item">
                    <a href={href} onClick={toggleMenu}>{label}</a>
                  </li>
                ))}
                <li className="nav-menu-divider" />
                {toolLinks.map(({ label, href, indent }) => (
                  <li key={label} className={`nav-menu-item${indent ? ' nav-tool-item' : ''}`}>
                    <a href={href} onClick={toggleMenu}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="nav-footer">
            <div className="nav-footer-links">
              <a href="https://github.com/jtraversa">Github</a>
              <a href="https://www.linkedin.com/in/juliant94/">LinkedIn</a>
              <a href="https://twitter.com/TraversaJulian">Twitter</a>
            </div>
          </div>
        </div>
      </div>

      <div className="br-top" />
      <div className="br-bottom" />
      <div className="br-left" />
      <div className="br-right" />

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </>
  );
}
