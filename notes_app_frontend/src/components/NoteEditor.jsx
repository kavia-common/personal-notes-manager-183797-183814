import React, { useEffect, useState } from 'react';

// PUBLIC_INTERFACE
export default function NoteEditor({ note, onSave, onDelete, onArchive }) {
  /** Rich-ish editor with basic fields and actions */
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState(Array.isArray(note?.tags) ? note.tags.join(', ') : '');

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setTags(Array.isArray(note?.tags) ? note.tags.join(', ') : '');
  }, [note?.id]);

  if (!note) {
    return (
      <div className="editor empty">
        <div className="muted">Select a note from the sidebar or create a new one.</div>
      </div>
    );
  }

  const onSubmit = (e) => {
    e.preventDefault();
    const normalizedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSave(note.id, { title, content, tags: normalizedTags });
  };

  return (
    <div className="editor">
      <form onSubmit={onSubmit} className="editor-form">
        <input
          className="title-input"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="content-textarea"
          placeholder="Write your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
        />
        <input
          className="input"
          placeholder="tags, comma,separated"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <div className="actions">
          <button type="submit" className="btn btn-primary">
            Save
          </button>
          <button type="button" className="btn btn-amber" onClick={() => onArchive(note.id, true)}>
            Archive
          </button>
          <button type="button" className="btn btn-danger" onClick={() => onDelete(note.id)}>
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
