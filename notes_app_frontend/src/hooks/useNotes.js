import { useCallback, useEffect, useMemo, useState } from 'react';
import { archiveNote, createNote, listNotes, softDeleteNote, updateNote } from '../services/notesService';

const emptyNote = {
  id: null,
  title: '',
  content: '',
  tags: [],
  is_archived: false,
  is_deleted: false,
};

// PUBLIC_INTERFACE
export function useNotes({ userId } = {}) {
  /** Manage notes collection and selected item with optimistic UI */
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listNotes({ userId, includeArchived: false, includeDeleted: false });
      setNotes(data);
      if (data.length && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (e) {
      setError(e.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const validate = (note) => {
    if (!note.title || !note.title.trim()) return 'Title is required';
    return '';
  };

  const addNote = useCallback(async (draft) => {
    const err = validate(draft);
    if (err) {
      setError(err);
      return null;
    }
    // optimistic
    const tempId = `temp-${Date.now()}`;
    const temp = { ...emptyNote, ...draft, id: tempId, updated_at: new Date().toISOString(), created_at: new Date().toISOString() };
    setNotes((prev) => [temp, ...prev]);
    setSelectedId(tempId);
    try {
      const created = await createNote(draft, { userId });
      setNotes((prev) => [created, ...prev.filter((n) => n.id !== tempId)]);
      setSelectedId(created.id);
      return created;
    } catch (e) {
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      setError(e.message || 'Failed to create note');
      return null;
    }
  }, [userId]);

  const saveNote = useCallback(async (id, patch) => {
    const err = validate({ ...patch, title: patch.title ?? (notes.find(n => n.id === id)?.title || '') });
    if (err) {
      setError(err);
      return null;
    }
    const prev = notes;
    const optimistic = prev.map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n));
    setNotes(optimistic);
    try {
      const updated = await updateNote(id, patch);
      setNotes((cur) => cur.map((n) => (n.id === id ? updated : n)));
      return updated;
    } catch (e) {
      setNotes(prev);
      setError(e.message || 'Failed to save note');
      return null;
    }
  }, [notes]);

  const removeNote = useCallback(async (id) => {
    const prev = notes;
    const optimistic = prev.filter((n) => n.id !== id);
    setNotes(optimistic);
    if (selectedId === id) {
      setSelectedId(optimistic[0]?.id || null);
    }
    try {
      await softDeleteNote(id);
      return true;
    } catch (e) {
      setNotes(prev);
      setError(e.message || 'Failed to delete note');
      return false;
    }
  }, [notes, selectedId]);

  const setArchived = useCallback(async (id, archived = true) => {
    const prev = notes;
    const optimistic = prev.map((n) => (n.id === id ? { ...n, is_archived: archived } : n));
    setNotes(optimistic);
    try {
      await archiveNote(id, archived);
      setNotes((cur) => cur.filter((n) => !n.is_archived)); // hide archived from list
      if (selectedId === id) {
        setSelectedId((cur) => (cur === id ? null : cur));
      }
      return true;
    } catch (e) {
      setNotes(prev);
      setError(e.message || 'Failed to archive note');
      return false;
    }
  }, [notes, selectedId]);

  return {
    notes,
    loading,
    error,
    selectedId,
    selectedNote,
    setSelectedId,
    addNote,
    saveNote,
    removeNote,
    setArchived,
    refresh,
  };
}
