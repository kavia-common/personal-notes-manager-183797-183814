import React, { useMemo, useState } from 'react';

// PUBLIC_INTERFACE
export default function NotesList({ notes, selectedId, onSelect, onCreate }) {
  /** Sidebar list of notes with simple search */
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return notes;
    return notes.filter((n) => {
      return (
        (n.title || '').toLowerCase().includes(needle) ||
        (n.content || '').toLowerCase().includes(needle) ||
        (Array.isArray(n.tags) ? n.tags.join(' ') : '').toLowerCase().includes(needle)
      );
    });
  }, [q, notes]);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <input
          className="input"
          placeholder="Search notes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search notes"
        />
        <button className="btn btn-primary" onClick={onCreate} aria-label="Create note">
          + New
        </button>
      </div>
      <div className="list">
        {filtered.length === 0 ? (
          <div className="muted">No notes found</div>
        ) : (
          filtered.map((n) => (
            <button
              key={n.id}
              className={`list-item ${selectedId === n.id ? 'active' : ''}`}
              onClick={() => onSelect(n.id)}
              title={n.title}
            >
              <div className="list-item-title">{n.title || 'Untitled'}</div>
              <div className="list-item-sub">
                {new Date(n.updated_at || n.created_at).toLocaleString()}
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
