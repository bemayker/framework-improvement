/// <reference types="vite/client" />

/**
 * Typed client for the notes API. Every component talks to the backend through
 * this module so HTTP concerns stay out of the UI (coding_standards.md Section 4).
 */

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const NOTES_PATH = "/api/notes";

const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export interface Note {
  id: number;
  text: string;
  createdAt: string;
}

/** Wire shape of a note as returned by the backend (snake_case). */
interface NotePayload {
  id: number;
  text: string;
  created_at: string;
}

/** Raised for every failure mode of the notes API: network, non-2xx, malformed body. */
export class NotesApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "NotesApiError";
    this.status = status;
  }
}

function isNotePayload(value: unknown): value is NotePayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.text === "string" &&
    typeof candidate.created_at === "string"
  );
}

function toNote(payload: NotePayload): Note {
  return { id: payload.id, text: payload.text, createdAt: payload.created_at };
}

/**
 * Reads the backend's `{"detail": "..."}` error body when present. A body that is
 * missing or unparsable is not itself an error worth surfacing: the status is.
 */
async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      const detail = (body as Record<string, unknown>).detail;
      if (typeof detail === "string" && detail.length > 0) {
        return detail;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, init);
  } catch {
    throw new NotesApiError(`Could not reach the notes API at ${apiBaseUrl}.`);
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new NotesApiError(
      detail ?? `The notes API responded with status ${response.status}.`,
      response.status,
    );
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new NotesApiError("The notes API returned an unreadable response.", response.status);
  }
}

/** Fetches every saved note, oldest first (server-side ordering). */
export async function listNotes(): Promise<Note[]> {
  const payload = await requestJson(NOTES_PATH);
  if (!Array.isArray(payload) || !payload.every(isNotePayload)) {
    throw new NotesApiError("The notes API returned an unexpected note list.");
  }
  return payload.map(toNote);
}

/** Stores a note and returns it as persisted (with its id and creation time). */
export async function createNote(text: string): Promise<Note> {
  const payload = await requestJson(NOTES_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!isNotePayload(payload)) {
    throw new NotesApiError("The notes API returned an unexpected note.");
  }
  return toNote(payload);
}
