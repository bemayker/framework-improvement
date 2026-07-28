import type { CSSProperties } from "react";
import type { Note } from "../api/notes";

/** User-facing strings, kept together so they can be moved to i18n resources. */
const LABELS = {
  empty: "No notes yet.",
  listLabel: "Saved notes",
} as const;

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  textAlign: "left",
  width: "100%",
};

const itemStyle: CSSProperties = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #e2e2e2",
  borderRadius: "0.375rem",
  backgroundColor: "#fafafa",
  overflowWrap: "anywhere",
};

const emptyStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  textAlign: "left",
  margin: 0,
};

interface NoteListProps {
  /** Already ordered newest-first by the backend and by `useNotes`. */
  notes: Note[];
}

function NoteList({ notes }: NoteListProps) {
  return (
    // The list element stays mounted while empty so its test id is a stable
    // anchor for E2E and UAT assertions.
    <ul data-testid="note-list" style={listStyle} aria-label={LABELS.listLabel}>
      {notes.length === 0 ? (
        <li data-testid="note-list-empty" style={emptyStyle}>
          {LABELS.empty}
        </li>
      ) : (
        notes.map((note) => (
          <li key={note.id} data-testid={`note-item-${note.id}`} style={itemStyle}>
            {note.text}
          </li>
        ))
      )}
    </ul>
  );
}

export default NoteList;
