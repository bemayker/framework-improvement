import { useCallback, useEffect, useState } from "react";
import { createNote, fetchNotes, NotesApiError, type Note } from "../api/notes";

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

export interface UseNotesResult {
  notes: Note[];
  /** Resolves `true` when the note was stored, `false` when the request failed. */
  addNote: (text: string) => Promise<boolean>;
  isLoading: boolean;
  loadError: string | null;
  submitError: string | null;
}

function toMessage(error: unknown): string {
  return error instanceof NotesApiError ? error.message : FALLBACK_ERROR_MESSAGE;
}

/**
 * Owns the notes state: the initial load on mount and the create call.
 * Native React state only, no state library (`coding_standards.md` Section 3.3).
 */
export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // Guards against writing state after the component unmounted mid-request.
    let isActive = true;

    fetchNotes()
      .then((loaded) => {
        if (isActive) {
          setNotes(loaded);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(toMessage(error));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const addNote = useCallback(async (text: string): Promise<boolean> => {
    try {
      const created = await createNote(text);
      // Prepending the created note keeps the list newest-first and avoids both
      // a refetch and a page reload (acceptance criterion 1).
      setNotes((current) => [created, ...current]);
      setSubmitError(null);
      return true;
    } catch (error: unknown) {
      setSubmitError(toMessage(error));
      return false;
    }
  }, []);

  return { notes, addNote, isLoading, loadError, submitError };
}
