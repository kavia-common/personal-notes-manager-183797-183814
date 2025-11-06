import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange, signInWithEmail as svcSignInWithEmail, signOut as svcSignOut, signInWithOAuth as svcSignInWithOAuth } from '../services/authService';

/**
 * PUBLIC_INTERFACE
 * Hook exposing auth state and helpers.
 */
export function useAuth() {
  /** Manages Supabase session and user state with helpers */
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const s = await getSession();
      setSession(s);
      setInitializing(false);
      unsub = onAuthStateChange((next) => setSession(next));
    })();
    return () => unsub();
  }, []);

  const user = session?.user || null;

  const signInWithEmail = async (email, opts) => {
    await svcSignInWithEmail(email, opts);
  };

  const signInWithOAuth = async (provider, opts) => {
    await svcSignInWithOAuth(provider, opts);
  };

  const signOut = async () => {
    await svcSignOut();
  };

  return {
    initializing,
    session,
    user,
    signInWithEmail,
    signInWithOAuth,
    signOut,
  };
}
