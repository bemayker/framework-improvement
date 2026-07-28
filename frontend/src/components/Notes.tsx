import { useEffect, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { createNote, listNotes } from "../api/notesClient";
import type { Note } from "../api/notesClient";

/** Kept as constants rather than inline literals so they are ready for i18n. */
const TEXT = {
  sectionLabel: "Notes",
  inputLabel: "Note text",
  inputPlaceholder: "What needs doing?",
  submit: "Add note",
  emptyNote: "Please enter a note before submitting.",
  loadFailed: "Could not load your notes. Please try again.",
  saveFailed: "Could not save your note. Please try again.",
};

const VALIDATION_MESSAGE_ID = "note-validation-message";

const sectionStyle: CSSProperties = {
  marginTop: "1.5rem",
  width: "100%",
  maxWidth: "32rem",
  textAlign: "left",
};

const formStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: "0.5rem 0.75rem",
  fontSize: "1rem",
  fontFamily: "inherit",
  color: "#1a1a1a",
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
  marginTop: "0.5rem",
  marginBottom: 0,
};

const listStyle: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "1rem 0 0",
};

const listItemStyle: CSSProperties = {
  padding: "0.5rem 0",
  fontSize: "1rem",
  color: "#1a1a1a",
  borderBottom: "1px solid #ececec",
};

/**
 * The whole notes slice: the form that adds a note and the list of saved ones.
 * Both halves share the same notes state, so they live in one component.
 */
function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listNotes()
      .then((loaded) => {
        if (active) {
          setNotes(loaded);
          setErrorMessage(null);
        }
      })
      .catch(() => {
        if (active) {
          setErrorMessage(TEXT.loadFailed);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
    if (validationMessage !== null) {
      setValidationMessage(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      setValidationMessage(TEXT.emptyNote);
      return;
    }
    setValidationMessage(null);

    try {
      const savedNote = await createNote(trimmedText);
      setNotes((currentNotes) => [...currentNotes, savedNote]);
      setText("");
      setErrorMessage(null);
    } catch {
      setErrorMessage(TEXT.saveFailed);
    }
  }

  return (
    <section aria-label={TEXT.sectionLabel} style={sectionStyle}>
      <form data-testid="note-form" onSubmit={handleSubmit} style={formStyle} noValidate>
        <input
          data-testid="note-input"
          type="text"
          value={text}
          onChange={handleChange}
          aria-label={TEXT.inputLabel}
          aria-invalid={validationMessage !== null}
          aria-describedby={validationMessage !== null ? VALIDATION_MESSAGE_ID : undefined}
          placeholder={TEXT.inputPlaceholder}
          style={inputStyle}
        />
        <button data-testid="note-submit" type="submit" style={buttonStyle}>
          {TEXT.submit}
        </button>
      </form>

      {validationMessage !== null && (
        <p
          id={VALIDATION_MESSAGE_ID}
          data-testid="note-validation-error"
          role="alert"
          style={errorStyle}
        >
          {validationMessage}
        </p>
      )}

      {errorMessage !== null && (
        <p data-testid="notes-error" role="alert" style={errorStyle}>
          {errorMessage}
        </p>
      )}

      <ul data-testid="note-list" style={listStyle}>
        {notes.map((note) => (
          <li key={note.id} data-testid={`note-item-${note.id}`} style={listItemStyle}>
            {note.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Notes;
