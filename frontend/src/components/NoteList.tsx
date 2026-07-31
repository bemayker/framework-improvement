import type { CSSProperties } from "react";
import type { Note } from "../api/notes";

const EMPTY_STATE_TEXT = "No notes saved yet.";

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  textAlign: "left",
};

const itemStyle: CSSProperties = {
  padding: "0.625rem 0.75rem",
  fontSize: "1rem",
  color: "#1a1a1a",
  backgroundColor: "#f4f4f4",
  borderRadius: "0.375rem",
  overflowWrap: "anywhere",
};

const emptyStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  margin: 0,
};

interface NoteListProps {
  notes: Note[];
}

function NoteList({ notes }: NoteListProps) {
  return (
    <>
      <ul data-testid="note-list" style={listStyle}>
        {notes.map((note) => (
          <li key={note.id} data-testid={`note-list-item-${note.id}`} style={itemStyle}>
            {note.text}
          </li>
        ))}
      </ul>
      {notes.length === 0 && (
        <p data-testid="note-list-empty" style={emptyStyle}>
          {EMPTY_STATE_TEXT}
        </p>
      )}
    </>
  );
}

export default NoteList;
