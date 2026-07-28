import { useCallback, useEffect, useState } from "react";
import { createNote, fetchNotes, NotesApiError, type Note } from "../api/notes";

interface UseNotesResult {
  notes: Note[];
  isLoading: boolean;
  loadError: string | null;
  submitError: string | null;
  addNote: (text: string) => Promise<void>;
}

/** Owns notes state: initial load on mount and creating a new note (`coding_standards.md` Section 3.3). */
export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchNotes()
      .then((loaded) => {
        if (!cancelled) {
          setNotes(loaded);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof NotesApiError ? error.message : "Could not load notes.");
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

  const addNote = useCallback(async (text: string) => {
    setSubmitError(null);
    try {
      const created = await createNote(text);
      // Newest first, matching `GET /api/notes` ordering, with no refetch (acceptance criterion 1).
      setNotes((current) => [created, ...current]);
    } catch (error) {
      setSubmitError(error instanceof NotesApiError ? error.message : "Could not save the note.");
    }
  }, []);

  return { notes, isLoading, loadError, submitError, addNote };
}
