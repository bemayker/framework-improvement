import type { CSSProperties } from "react";
import type { Note } from "../api/notes";

interface NoteListProps {
  notes: Note[];
}

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const itemStyle: CSSProperties = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #e0e0e0",
  borderRadius: "0.375rem",
  textAlign: "left",
  wordBreak: "break-word",
};

const emptyStyle: CSSProperties = {
  color: "#5f5f5f",
  fontSize: "0.9rem",
};

/** Notes list, newest first (the caller supplies that order); renders an empty-state line otherwise. */
function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p data-testid="note-list-empty" style={emptyStyle}>
        No notes yet. Add one above to get started.
      </p>
    );
  }

  return (
    <ul data-testid="note-list" style={listStyle}>
      {notes.map((note) => (
        <li key={note.id} data-testid={`note-item-${note.id}`} style={itemStyle}>
          {note.text}
        </li>
      ))}
    </ul>
  );
}

export default NoteList;
