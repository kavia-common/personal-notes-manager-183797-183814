import React from 'react';
import { useAuth } from '../hooks/useAuth';

// PUBLIC_INTERFACE
export default function TopBar({ theme, onToggleTheme, isConnected }) {
  /** Application top bar with theme toggle and auth controls */
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Sign out failed', e);
    }
  };

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
        {user ? (
          <>
            <span className="status" title={user.id} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email || 'Signed in'}
            </span>
            <button className="btn btn-outline" onClick={handleSignOut} aria-label="Sign out">
              ⎋ Sign out
            </button>
          </>
        ) : (
          <span className="status">Guest</span>
        )}
        <button className="btn btn-outline" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
}
