import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  width: "100%",
  maxWidth: "28rem",
};

const rowStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: "0.5rem 0.75rem",
  fontSize: "1rem",
  border: "1px solid #c7c7c7",
  borderRadius: "0.375rem",
};

const buttonStyle: CSSProperties = {
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  fontWeight: 600,
  color: "#ffffff",
  backgroundColor: "#1a1a1a",
  border: "none",
  borderRadius: "0.375rem",
  cursor: "pointer",
};

const errorStyle: CSSProperties = {
  color: "#b91c1c",
  fontSize: "0.875rem",
  margin: 0,
};

interface NoteFormProps {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
}

/**
 * Labelled text input plus submit button for creating a note.
 *
 * Client-side validation (AC2): a blank or whitespace-only value shows a
 * visible error and never calls `onSubmit`, so no API call is made for it.
 */
function NoteForm({ onSubmit, isSubmitting = false }: NoteFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Note text cannot be empty.");
      return;
    }
    setError(null);
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <form
      data-testid="note-form"
      style={formStyle}
      onSubmit={handleSubmit}
      noValidate
    >
      <div style={rowStyle}>
        <input
          data-testid="note-form-input"
          style={inputStyle}
          type="text"
          aria-label="Note text"
          aria-describedby={error ? "note-form-error" : undefined}
          aria-invalid={error ? true : undefined}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={isSubmitting}
        />
        <button
          data-testid="note-form-submit"
          style={buttonStyle}
          type="submit"
          disabled={isSubmitting}
        >
          Save
        </button>
      </div>
      {error && (
        <p
          data-testid="note-form-error"
          id="note-form-error"
          role="alert"
          style={errorStyle}
        >
          {error}
        </p>
      )}
    </form>
  );
}

export default NoteForm;
