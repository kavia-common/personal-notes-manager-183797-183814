import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * PUBLIC_INTERFACE
 * Wrap children and require authentication; shows sign-in UI when unauthenticated.
 */
export default function AuthGate({ children, optional = false }) {
  /**
   * When optional is true, unauthenticated users can pass through.
   * Otherwise, render a small sign-in UI.
   */
  const { initializing, user, signInWithEmail, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  if (initializing) {
    return <div className="loader" style={{ padding: 24 }}>Initializing…</div>;
  }

  if (optional || user) {
    return children;
  }

  const handleEmail = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await signInWithEmail(email);
      setStatus('Check your email for a sign-in link.');
    } catch (err) {
      setStatus(err.message || 'Failed to send sign-in link');
    }
  };

  const handleOAuth = async (provider) => {
    setStatus('');
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setStatus(err.message || 'Sign-in failed');
    }
  };

  return (
    <div className="main" style={{ margin: 16 }}>
      <div style={{ maxWidth: 520, margin: '40px auto' }}>
        <h2>Sign in to Personal Notes</h2>
        <p className="muted">Use a magic link sent to your email or sign in with an OAuth provider.</p>
        {status && <div className="status" style={{ margin: '10px 0' }}>{status}</div>}

        <form onSubmit={handleEmail} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email address"
          />
          <button className="btn btn-primary" type="submit">Send Link</button>
        </form>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" type="button" onClick={() => handleOAuth('github')}>Continue with GitHub</button>
          <button className="btn btn-outline" type="button" onClick={() => handleOAuth('google')}>Continue with Google</button>
        </div>
      </div>
    </div>
  );
}
