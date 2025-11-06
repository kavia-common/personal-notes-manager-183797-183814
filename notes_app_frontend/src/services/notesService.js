import { supabase, isSupabaseReady } from '../supabaseClient';

const TABLE = 'notes';

/**
 * Build query filters respecting optional userId and soft delete flags.
 */
function applyCommonFilters(query, { userId, includeArchived = false, includeDeleted = false } = {}) {
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }
  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }
  return query;
}

function ensureClient() {
  if (!isSupabaseReady()) {
    throw new Error('Supabase is not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.');
  }
}

// PUBLIC_INTERFACE
export async function listNotes(options = {}) {
  /** Fetch list of notes with filters */
  ensureClient();
  let query = supabase.from(TABLE).select('*');
  query = applyCommonFilters(query, options).order('updated_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// PUBLIC_INTERFACE
export async function getNote(id, options = {}) {
  /** Fetch a single note by id */
  ensureClient();
  let query = supabase.from(TABLE).select('*').eq('id', id).single();
  query = applyCommonFilters(query, options);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function createNote(payload, options = {}) {
  /** Create a new note. Returns created row. */
  ensureClient();
  const now = new Date().toISOString();
  const row = {
    title: payload.title || '',
    content: payload.content || '',
    tags: payload.tags || [],
    // Important: RLS requires user_id = auth.uid(). We set user_id from caller if provided.
    // If omitted or null, the insert will fail due to WITH CHECK policy.
    user_id: options.userId || null,
    is_archived: !!payload.is_archived,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  };
  const { data, error } = await supabase.from(TABLE).insert(row).select('*').single();
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function updateNote(id, updates) {
  /** Update a note by id. Returns updated row. */
  ensureClient();
  const now = new Date().toISOString();
  const patch = { ...updates, updated_at: now };
  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function archiveNote(id, archived = true) {
  /** Archive/unarchive a note. */
  return updateNote(id, { is_archived: archived });
}

// PUBLIC_INTERFACE
export async function softDeleteNote(id) {
  /** Soft delete a note. */
  return updateNote(id, { is_deleted: true });
}
