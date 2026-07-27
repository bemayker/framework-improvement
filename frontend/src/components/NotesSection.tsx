import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createNote, fetchNotes } from "../api/notesApi";
import type { Note } from "../api/notesApi";
import NoteForm from "./NoteForm";
import NoteList from "./NoteList";

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
  width: "100%",
  marginTop: "1.5rem",
};

const errorStyle: CSSProperties = {
  color: "#b91c1c",
  fontSize: "0.9rem",
  margin: 0,
};

/**
 * Owns the notes state: loads the list once on mount, and appends a newly
 * created note directly to state on submit (AC1 — no refetch, no navigation,
 * so the list updates without a full page reload).
 */
function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchNotes()
      .then((loaded) => {
        if (!cancelled) {
          setNotes(loaded);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load notes.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(content: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createNote(content);
      setNotes((current) => [...current, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the note.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section data-testid="notes-section" style={sectionStyle}>
      <NoteForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      {error && (
        <p data-testid="notes-error" role="alert" style={errorStyle}>
          {error}
        </p>
      )}
      {!isLoading && <NoteList notes={notes} />}
    </section>
  );
}

export default NotesSection;
