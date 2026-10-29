import { useRef, useState, type CSSProperties, type FormEvent } from "react";
import { createNote, type Note } from "../api/notes";

const FIELD_LABEL = "New note";
const FIELD_PLACEHOLDER = "What needs doing?";
const SUBMIT_LABEL = "Save note";
const EMPTY_NOTE_MESSAGE = "Enter a note before saving.";
const SAVE_FAILED_MESSAGE = "The note could not be saved. Please try again.";
// Mirrors NOTE_TEXT_MAX_LENGTH in backend/app/schemas/note.py, so the field
// stops at the bound the API enforces instead of letting the user type past it
// and collecting a 422.
const NOTE_TEXT_MAX_LENGTH = 500;

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

const savingButtonStyle: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
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
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Checked on the ref, not the state: two submits can be dispatched before
    // React re-renders, and both would still see isSaving as false.
    if (isSavingRef.current) {
      return;
    }

    // A whitespace-only note counts as empty, and is rejected here so no
    // request is sent at all. This stays ahead of the guard flag so a rejected
    // empty submit never locks the form.
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      setError(EMPTY_NOTE_MESSAGE);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const savedNote = await createNote(trimmedText);
      setError(null);
      setText("");
      onCreated(savedNote);
    } catch {
      setError(SAVE_FAILED_MESSAGE);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
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
          maxLength={NOTE_TEXT_MAX_LENGTH}
          placeholder={FIELD_PLACEHOLDER}
          style={inputStyle}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          data-testid="note-submit"
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          style={isSaving ? { ...buttonStyle, ...savingButtonStyle } : buttonStyle}
        >
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
