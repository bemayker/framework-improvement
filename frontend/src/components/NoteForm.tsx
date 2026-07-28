import { useState, type CSSProperties, type FormEvent } from "react";

interface NoteFormProps {
  onSubmit: (text: string) => void;
}

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  width: "100%",
};

const controlsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
};

const labelStyle: CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  flex: "1 1 12rem",
  minWidth: 0,
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
  color: "#b3261e",
  fontSize: "0.875rem",
  margin: 0,
};

/** Controlled note input plus submit button; blocks empty/whitespace-only submissions client-side. */
function NoteForm({ onSubmit }: NoteFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      setError("Note text is required.");
      return;
    }

    setError(null);
    onSubmit(trimmed);
    setText("");
  };

  return (
    <form data-testid="note-form" style={formStyle} onSubmit={handleSubmit} noValidate>
      <label htmlFor="note-input" style={labelStyle}>
        New note
      </label>
      <div style={controlsStyle}>
        <input
          id="note-input"
          data-testid="note-input"
          type="text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) {
              setError(null);
            }
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? "note-error" : undefined}
          style={inputStyle}
        />
        <button type="submit" data-testid="note-submit" style={buttonStyle}>
          Add note
        </button>
      </div>
      {error && (
        <p id="note-error" data-testid="note-error" role="alert" style={errorStyle}>
          {error}
        </p>
      )}
    </form>
  );
}

export default NoteForm;
