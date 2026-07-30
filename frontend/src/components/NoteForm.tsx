import { useState, type CSSProperties, type FormEvent } from "react";

const INPUT_LABEL = "Note";
const INPUT_PLACEHOLDER = "What needs doing?";
const SUBMIT_LABEL = "Add note";
const EMPTY_NOTE_MESSAGE = "Enter a note before adding it.";
const SAVE_FAILED_MESSAGE = "The note could not be saved. Please try again.";

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  width: "100%",
  textAlign: "left",
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: "0.625rem 0.75rem",
  fontSize: "1rem",
  fontFamily: "inherit",
  color: "inherit",
  border: "1px solid #c9c9c9",
  borderRadius: "0.375rem",
  background: "#ffffff",
};

const submitStyle: CSSProperties = {
  padding: "0.625rem 1rem",
  fontSize: "1rem",
  fontFamily: "inherit",
  fontWeight: 600,
  color: "#ffffff",
  background: "#1a1a1a",
  border: "none",
  borderRadius: "0.375rem",
  cursor: "pointer",
};

const errorStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.875rem",
  color: "#b3261e",
};

interface NoteFormProps {
  /** Persists the trimmed note. Rejecting keeps the typed text so it is not lost. */
  onSubmit: (content: string) => Promise<void>;
}

function NoteForm({ onSubmit }: NoteFormProps) {
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();
    if (trimmedContent === "") {
      setErrorMessage(EMPTY_NOTE_MESSAGE);
      return;
    }

    setErrorMessage(null);

    try {
      await onSubmit(trimmedContent);
      setContent("");
    } catch {
      setErrorMessage(SAVE_FAILED_MESSAGE);
    }
  }

  return (
    <form data-testid="note-form" style={formStyle} onSubmit={handleSubmit}>
      <div style={rowStyle}>
        <input
          data-testid="note-input"
          type="text"
          aria-label={INPUT_LABEL}
          placeholder={INPUT_PLACEHOLDER}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          style={inputStyle}
        />
        <button data-testid="note-submit" type="submit" style={submitStyle}>
          {SUBMIT_LABEL}
        </button>
      </div>
      {errorMessage !== null && (
        <p data-testid="note-validation-error" role="alert" style={errorStyle}>
          {errorMessage}
        </p>
      )}
    </form>
  );
}

export default NoteForm;
