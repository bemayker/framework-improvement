/**
 * Notes API client.
 *
 * This is the only module in the frontend that performs HTTP calls
 * (`coding_standards.md` Section 4): components and hooks consume the typed
 * functions below instead of calling `fetch` themselves.
 */

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const NOTES_PATH = "/api/notes";
const REQUEST_TIMEOUT_MS = 10_000;

/** User-facing strings, kept together so they can be moved to i18n resources. */
const MESSAGES = {
  networkUnavailable: "Cannot reach the server. Check your connection and try again.",
  timedOut: "The server took too long to respond. Please try again.",
  unexpectedResponse: "The server returned an unexpected response.",
  notAllowed: "You are not allowed to perform this action.",
  rateLimited: "Too many requests. Please wait a moment and try again.",
  serverError: "The server is currently unavailable. Please try again.",
} as const;

/**
 * Longest note text the API accepts, mirroring `MAX_NOTE_LENGTH` in
 * `backend/app/models/note.py`. This module owns the API contract, so UI code
 * reads the limit from here instead of repeating the number.
 */
export const MAX_NOTE_LENGTH = 500;

export interface Note {
  id: number;
  text: string;
  created_at: string;
}

/** Every notes-API failure — transport or HTTP — surfaces as this type. */
export class NotesApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "NotesApiError";
    this.status = status;
  }
}

function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  const baseUrl = configured && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;
  // Trailing slashes would produce "//api/notes" once the path is appended.
  return baseUrl.replace(/\/+$/, "");
}

/**
 * The backend reports its own errors as `{"detail": "..."}`, which is more
 * useful to the user than a generic status message, so prefer it when present.
 */
async function readDetail(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (body !== null && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "string" && detail.length > 0) {
        return detail;
      }
    }
  } catch {
    // A non-JSON error body carries no detail; fall back to the status message.
  }
  return null;
}

function messageForStatus(status: number): string {
  if (status === 401 || status === 403) {
    return MESSAGES.notAllowed;
  }
  if (status === 429) {
    return MESSAGES.rateLimited;
  }
  if (status >= 500) {
    return MESSAGES.serverError;
  }
  return MESSAGES.unexpectedResponse;
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(`${resolveBaseUrl()}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...init?.headers },
      });
    } catch {
      throw new NotesApiError(
        controller.signal.aborted ? MESSAGES.timedOut : MESSAGES.networkUnavailable,
      );
    }

    if (!response.ok) {
      const detail = await readDetail(response);
      throw new NotesApiError(detail ?? messageForStatus(response.status), response.status);
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new NotesApiError(MESSAGES.unexpectedResponse, response.status);
    }
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function parseNote(value: unknown): Note {
  if (value !== null && typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    if (
      typeof candidate.id === "number" &&
      typeof candidate.text === "string" &&
      typeof candidate.created_at === "string"
    ) {
      return { id: candidate.id, text: candidate.text, created_at: candidate.created_at };
    }
  }
  throw new NotesApiError(MESSAGES.unexpectedResponse);
}

/** `GET /api/notes` — all saved notes, newest first (the backend orders them). */
export async function fetchNotes(): Promise<Note[]> {
  const body = await request(NOTES_PATH);
  if (!Array.isArray(body)) {
    throw new NotesApiError(MESSAGES.unexpectedResponse);
  }
  return body.map(parseNote);
}

/** `POST /api/notes` — stores one note and returns it as the backend saved it. */
export async function createNote(text: string): Promise<Note> {
  const body = await request(NOTES_PATH, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return parseNote(body);
}
