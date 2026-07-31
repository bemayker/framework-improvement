import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";

const LABEL_TEXT = "Note";
const PLACEHOLDER_TEXT = "What needs doing?";
const SUBMIT_TEXT = "Save note";
const EMPTY_NOTE_MESSAGE = "Enter some text before saving a note.";

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  textAlign: "left",
};

const labelStyle: CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#3f3f3f",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.625rem 0.75rem",
  fontSize: "1rem",
  fontFamily: "inherit",
  color: "#1a1a1a",
  border: "1px solid #c9c9c9",
  borderRadius: "0.375rem",
};

const buttonStyle: CSSProperties = {
  padding: "0.625rem 1rem",
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

interface NoteFormProps {
  /** Called with the trimmed note text on a valid submit. Rejecting keeps the text for a retry. */
  onSubmit: (text: string) => Promise<void> | void;
}

function NoteForm({ onSubmit }: NoteFormProps) {
  const [text, setText] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      setValidationMessage(EMPTY_NOTE_MESSAGE);
      return;
    }

    setValidationMessage(null);

    try {
      await onSubmit(trimmed);
      setText("");
    } catch {
      // The parent owns the API error surface, so keep the typed text for a retry instead of clearing it.
    }
  };

  return (
    <form data-testid="note-form" style={formStyle} onSubmit={handleSubmit} noValidate>
      <label htmlFor="note-form-input" style={labelStyle}>
        {LABEL_TEXT}
      </label>
      <input
        id="note-form-input"
        data-testid="note-form-input"
        type="text"
        style={inputStyle}
        placeholder={PLACEHOLDER_TEXT}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button type="submit" data-testid="note-form-submit" style={buttonStyle}>
        {SUBMIT_TEXT}
      </button>
      {validationMessage !== null && (
        <p data-testid="note-form-error" role="alert" style={errorStyle}>
          {validationMessage}
        </p>
      )}
    </form>
  );
}

export default NoteForm;
