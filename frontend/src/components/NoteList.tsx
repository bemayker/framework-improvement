import type { CSSProperties } from "react";
import type { Note } from "../api/notes";

const LIST_LABEL = "Saved notes";

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  width: "100%",
  textAlign: "left",
};

const itemStyle: CSSProperties = {
  padding: "0.625rem 0.75rem",
  fontSize: "1rem",
  border: "1px solid #e4e4e4",
  borderRadius: "0.375rem",
  background: "#fafafa",
};

interface NoteListProps {
  notes: Note[];
}

function NoteList({ notes }: NoteListProps) {
  return (
    <ul data-testid="note-list" aria-label={LIST_LABEL} style={listStyle}>
      {notes.map((note) => (
        <li key={note.id} data-testid={`note-list-item-${note.id}`} style={itemStyle}>
          {note.content}
        </li>
      ))}
    </ul>
  );
}

export default NoteList;
