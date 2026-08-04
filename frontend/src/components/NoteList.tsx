import type { CSSProperties } from "react";
import type { Note } from "../api/notes";

const LIST_LABEL = "Saved notes";

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: "1.5rem 0 0",
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  textAlign: "left",
};

const itemStyle: CSSProperties = {
  padding: "0.5rem 0.75rem",
  fontSize: "1rem",
  border: "1px solid #e4e4e4",
  borderRadius: "0.375rem",
};

type NoteListProps = {
  notes: Note[];
};

function NoteList({ notes }: NoteListProps) {
  return (
    <ul data-testid="note-list" aria-label={LIST_LABEL} style={listStyle}>
      {notes.map((note) => (
        <li
          key={note.id}
          data-testid={`note-list-item-${note.id}`}
          style={itemStyle}
        >
          {note.text}
        </li>
      ))}
    </ul>
  );
}

export default NoteList;
