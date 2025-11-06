import React from 'react';

// PUBLIC_INTERFACE
export default function TopBar({ theme, onToggleTheme, isConnected }) {
  /** Application top bar with theme toggle */
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-dot" />
        <span className="brand-title">Personal Notes</span>
      </div>
      <div className="topbar-actions">
        <span className={`status ${isConnected ? 'ok' : 'warn'}`}>
          {isConnected ? 'Connected' : 'Offline'}
        </span>
        <button className="btn btn-outline" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
}
