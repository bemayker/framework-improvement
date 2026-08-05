// Single client layer for the notes API: components never call fetch directly
// (coding_standards.md Section 4, applied to this project's own backend).

export type Note = {
  id: number;
  text: string;
};

const DEFAULT_API_BASE_URL = "http://localhost:8000";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const NOTES_URL = `${API_BASE_URL}/api/notes`;

function requestFailed(operation: string, response: Response): Error {
  return new Error(
    `${operation} failed: ${response.status} ${response.statusText}`,
  );
}

/** Fetches every saved note, oldest first, as returned by the backend. */
export async function listNotes(): Promise<Note[]> {
  const response = await fetch(NOTES_URL);

  if (!response.ok) {
    throw requestFailed("Loading notes", response);
  }

  return (await response.json()) as Note[];
}

/** Stores one note and returns it with the id the backend assigned. */
export async function createNote(text: string): Promise<Note> {
  const response = await fetch(NOTES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw requestFailed("Saving the note", response);
  }

  return (await response.json()) as Note;
}
