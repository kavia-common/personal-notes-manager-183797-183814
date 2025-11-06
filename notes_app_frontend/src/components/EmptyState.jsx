import React from 'react';

// PUBLIC_INTERFACE
export default function EmptyState({ onCreate }) {
  /** Shown when there are no notes yet */
  return (
    <div className="empty-state">
      <h2>Welcome to Personal Notes</h2>
      <p>Create your first note to get started.</p>
      <button className="btn btn-primary btn-large" onClick={onCreate}>
        + Create Note
      </button>
    </div>
  );
}
