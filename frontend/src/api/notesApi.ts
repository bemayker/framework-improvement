/**
 * Notes API client. The single place that talks HTTP for the notes resource
 * (`coding_standards.md` §4): components never call `fetch` directly.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface Note {
  id: number;
  content: string;
  created_at: string;
}

/**
 * Extracts a human-readable message from a non-2xx JSON error response,
 * falling back to the status text when the body is not the expected shape.
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "detail" in body &&
      typeof (body as { detail: unknown }).detail === "string"
    ) {
      return (body as { detail: string }).detail;
    }
  } catch {
    // Response body was not JSON; fall through to the generic message.
  }
  return `Request failed with status ${response.status}`;
}

/**
 * Issues a `fetch` against the notes API and returns the parsed JSON body.
 *
 * Shared by every endpoint call so the network-error and non-2xx handling
 * (identical for GET and POST) lives in exactly one place.
 */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return (await response.json()) as T;
}

/** Fetches all saved notes, oldest first. */
export async function fetchNotes(): Promise<Note[]> {
  return requestJson<Note[]>("/api/notes", { method: "GET" });
}

/** Creates a note with the given content and returns the stored note. */
export async function createNote(content: string): Promise<Note> {
  return requestJson<Note>("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}
