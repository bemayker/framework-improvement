import { useState, type CSSProperties, type FormEvent } from "react";
import { createNote, type Note } from "../api/notes";

const FIELD_LABEL = "New note";
const FIELD_PLACEHOLDER = "What needs doing?";
const SUBMIT_LABEL = "Save note";
const EMPTY_NOTE_MESSAGE = "Enter a note before saving.";
const SAVE_FAILED_MESSAGE = "The note could not be saved. Please try again.";

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "0.5rem",
  marginTop: "1.5rem",
  textAlign: "left",
};

const labelStyle: CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
};

const inputStyle: CSSProperties = {
  flex: "1 1 14rem",
  padding: "0.5rem 0.75rem",
  fontSize: "1rem",
  fontFamily: "inherit",
  color: "inherit",
  border: "1px solid #c7c7c7",
  borderRadius: "0.375rem",
};

const buttonStyle: CSSProperties = {
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  fontFamily: "inherit",
  fontWeight: 600,
  color: "#ffffff",
  backgroundColor: "#1a1a1a",
  border: "none",
  borderRadius: "0.375rem",
  cursor: "pointer",
};

const errorStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#b3261e",
  margin: 0,
};

type NoteFormProps = {
  /** Called with the stored note once the backend has accepted it. */
  onCreated: (note: Note) => void;
};

function NoteForm({ onCreated }: NoteFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // A whitespace-only note counts as empty, and is rejected here so no
    // request is sent at all.
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      setError(EMPTY_NOTE_MESSAGE);
      return;
    }

    try {
      const savedNote = await createNote(trimmedText);
      setError(null);
      setText("");
      onCreated(savedNote);
    } catch {
      setError(SAVE_FAILED_MESSAGE);
    }
  }

  return (
    <form data-testid="note-form" style={formStyle} onSubmit={handleSubmit}>
      <label htmlFor="note-text" style={labelStyle}>
        {FIELD_LABEL}
      </label>
      <div style={rowStyle}>
        <input
          id="note-text"
          data-testid="note-input"
          type="text"
          value={text}
          placeholder={FIELD_PLACEHOLDER}
          style={inputStyle}
          onChange={(event) => setText(event.target.value)}
        />
        <button data-testid="note-submit" type="submit" style={buttonStyle}>
          {SUBMIT_LABEL}
        </button>
      </div>
      {error !== null && (
        <p data-testid="note-form-error" role="alert" style={errorStyle}>
          {error}
        </p>
      )}
    </form>
  );
}

export default NoteForm;
