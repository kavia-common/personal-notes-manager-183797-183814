import { supabase, isSupabaseReady } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * Returns the current Supabase session if available.
 */
export async function getSession() {
  if (!isSupabaseReady()) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('getSession error', error);
    return null;
  }
  return data?.session ?? null;
}

/**
 * PUBLIC_INTERFACE
 * Subscribe to auth state changes. Returns unsubscribe function.
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseReady()) {
    // return a noop unsubscriber
    return () => {};
  }
  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session || null);
  });
  return () => {
    try {
      subscription.subscription?.unsubscribe?.();
    } catch {
      // ignore
    }
  };
}

/**
 * PUBLIC_INTERFACE
 * Sign in with email magic-link. Requires REACT_APP_FRONTEND_URL for redirect.
 */
export async function signInWithEmail(email, { redirectTo } = {}) {
  if (!isSupabaseReady()) throw new Error('Supabase not configured');
  const url = redirectTo || process.env.REACT_APP_FRONTEND_URL || window.location.origin;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: url,
    },
  });
  if (error) throw error;
  return true;
}

/**
 * PUBLIC_INTERFACE
 * Sign in using GitHub OAuth (example). Add other providers as needed.
 */
export async function signInWithOAuth(provider = 'github', { redirectTo } = {}) {
  if (!isSupabaseReady()) throw new Error('Supabase not configured');
  const url = redirectTo || process.env.REACT_APP_FRONTEND_URL || window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: url,
    },
  });
  if (error) throw error;
  return true;
}

/**
 * PUBLIC_INTERFACE
 * Signs out the current user.
 */
export async function signOut() {
  if (!isSupabaseReady()) return true;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}
