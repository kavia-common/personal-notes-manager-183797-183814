import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import TopBar from './components/TopBar';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import EmptyState from './components/EmptyState';
import { useNotes } from './hooks/useNotes';
import { isSupabaseReady } from './supabaseClient';

// PUBLIC_INTERFACE
function App() {
  /** Main application layout */
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // For now, auth-agnostic; pass optional userId if/when added
  const userId = null;
  const { notes, loading, error, selectedId, selectedNote, setSelectedId, addNote, saveNote, removeNote, setArchived } =
    useNotes({ userId });

  const handleCreate = async () => {
    const created = await addNote({
      title: 'Untitled',
      content: '',
      tags: [],
    });
    if (created?.id) setSelectedId(created.id);
  };

  const isConnected = useMemo(() => isSupabaseReady(), []);

  return (
    <div className="app-shell">
      <TopBar theme={theme} onToggleTheme={toggleTheme} isConnected={isConnected} />
      <div className="content">
        <NotesList
          notes={notes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={handleCreate}
        />
        <main className="main">
          {loading ? (
            <div className="loader">Loading notes…</div>
          ) : notes.length === 0 ? (
            <EmptyState onCreate={handleCreate} />
          ) : (
            <>
              {error && <div className="error-banner">{error}</div>}
              <NoteEditor
                note={selectedNote}
                onSave={saveNote}
                onDelete={removeNote}
                onArchive={setArchived}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
