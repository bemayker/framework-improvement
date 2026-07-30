const DEFAULT_API_BASE_URL = "http://localhost:8000";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export interface Note {
  id: number;
  content: string;
  created_at: string;
}

/**
 * Single error type for every notes API failure, so callers can handle a failed
 * call without inspecting fetch internals or response bodies themselves.
 */
export class NotesApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "NotesApiError";
    this.status = status;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new NotesApiError(`Could not reach the notes API at ${API_BASE_URL}.`);
  }

  if (!response.ok) {
    throw new NotesApiError(
      `The notes API responded with status ${response.status}.`,
      response.status,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new NotesApiError("The notes API returned a malformed response.", response.status);
  }
}

export async function fetchNotes(): Promise<Note[]> {
  const notes = await requestJson<Note[]>("/api/notes");

  if (!Array.isArray(notes)) {
    throw new NotesApiError("The notes API returned an unexpected payload for the note list.");
  }

  return notes;
}

export async function createNote(content: string): Promise<Note> {
  return requestJson<Note>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
