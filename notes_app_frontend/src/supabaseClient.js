import { createClient } from '@supabase/supabase-js';
import { getEnv, requireEnv } from './utils/env';

// Validate presence (warn only - app remains usable for demo without Supabase)
requireEnv(['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_KEY']);

const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL', '');
const supabaseKey = getEnv('REACT_APP_SUPABASE_KEY', '');

// PUBLIC_INTERFACE
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * PUBLIC_INTERFACE
 * Returns whether Supabase is configured. Useful for feature flagging UI.
 */
export const isSupabaseReady = () => !!supabase;
