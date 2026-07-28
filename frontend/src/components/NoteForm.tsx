import { useState, type CSSProperties, type FormEvent } from "react";
import { MAX_NOTE_LENGTH } from "../api/notes";

/** User-facing strings, kept together so they can be moved to i18n resources. */
const LABELS = {
  field: "New note",
  placeholder: "What needs doing?",
  submit: "Add note",
  submitting: "Adding…",
  required: "Note text is required",
} as const;

const INPUT_ID = "note-text";
const ERROR_ID = "note-text-error";

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  textAlign: "left",
  width: "100%",
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
  fontSize: "0.875rem",
  color: "#b3261e",
  margin: 0,
};

interface NoteFormProps {
  onSubmit: (text: string) => Promise<boolean>;
  /** A failure reported by the caller's save request, rendered like validation. */
  submitError?: string | null;
}

function NoteForm({ onSubmit, submitError = null }: NoteFormProps) {
  const [text, setText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      // Acceptance criterion 2: reject locally, so no request is made at all.
      setValidationError(LABELS.required);
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    try {
      const wasSaved = await onSubmit(trimmed);
      if (wasSaved) {
        setText("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorMessage = validationError ?? submitError;

  return (
    <form data-testid="note-form" style={formStyle} onSubmit={handleSubmit} noValidate>
      <label htmlFor={INPUT_ID} style={labelStyle}>
        {LABELS.field}
      </label>
      <div style={rowStyle}>
        <input
          id={INPUT_ID}
          data-testid="note-input"
          style={inputStyle}
          type="text"
          value={text}
          placeholder={LABELS.placeholder}
          maxLength={MAX_NOTE_LENGTH}
          aria-invalid={errorMessage !== null}
          aria-describedby={errorMessage !== null ? ERROR_ID : undefined}
          onChange={(event) => setText(event.target.value)}
        />
        <button data-testid="note-submit" style={buttonStyle} type="submit" disabled={isSubmitting}>
          {isSubmitting ? LABELS.submitting : LABELS.submit}
        </button>
      </div>
      {errorMessage !== null && (
        <p id={ERROR_ID} data-testid="note-error" style={errorStyle} role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

export default NoteForm;
