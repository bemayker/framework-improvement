import type { CSSProperties } from "react";
import type { Note } from "../api/notesApi";

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  width: "100%",
  maxWidth: "28rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const itemStyle: CSSProperties = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #e5e5e5",
  borderRadius: "0.375rem",
  textAlign: "left",
};

const emptyStyle: CSSProperties = {
  color: "#5f5f5f",
  fontSize: "0.9rem",
};

interface NoteListProps {
  notes: Note[];
}

/** Renders the saved notes, newest last (insertion order), or an empty state. */
function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p data-testid="note-list-empty" style={emptyStyle}>
        No notes yet. Add one above.
      </p>
    );
  }

  return (
    <ul data-testid="note-list" style={listStyle}>
      {notes.map((note) => (
        <li key={note.id} data-testid={`note-list-item-${note.id}`} style={itemStyle}>
          {note.content}
        </li>
      ))}
    </ul>
  );
}

export default NoteList;
