// The only module in the frontend that talks HTTP for notes (`coding_standards.md` Section 4):
// components and hooks call these functions instead of calling `fetch` directly.

export interface Note {
  id: number;
  text: string;
  created_at: string;
}

/** Typed error for any notes API failure, network or server-side. */
export class NotesApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "NotesApiError";
    this.status = status;
  }
}

const DEFAULT_BASE_URL = "http://localhost:8000";

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL;
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body !== null &&
      typeof body === "object" &&
      "detail" in body &&
      typeof (body as { detail: unknown }).detail === "string"
    ) {
      return (body as { detail: string }).detail;
    }
  } catch {
    // Response body was not JSON (or was empty); fall through to the generic message.
  }
  return `Request failed with status ${response.status}.`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new NotesApiError("Could not reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new NotesApiError(await readErrorDetail(response), response.status);
  }

  return (await response.json()) as T;
}

export function fetchNotes(): Promise<Note[]> {
  return request<Note[]>("/api/notes");
}

export function createNote(text: string): Promise<Note> {
  return request<Note>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
