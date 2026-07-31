/**
 * Dedicated API client for the notes endpoints of our own backend.
 * Components never call `fetch` directly (coding_standards.md Section 4).
 */

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const NOTES_PATH = "/api/notes";

const NETWORK_ERROR_MESSAGE = "The notes service could not be reached.";
const REQUEST_FAILED_MESSAGE = "The notes service returned an error.";
const INVALID_RESPONSE_MESSAGE = "The notes service returned an unexpected response.";

/** A note exactly as the backend serialises it (see the plan's API Contract). */
export interface Note {
  id: number;
  text: string;
  created_at: string;
}

/** Every failure of this client surfaces as an ApiError, so callers need no type guards on `unknown`. */
export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function apiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

function isNote(value: unknown): value is Note {
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

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl()}${path}`, init);
  } catch {
    // Network failure, DNS failure, or an aborted/timed-out request: fetch rejects rather than resolving.
    throw new ApiError(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    // Covers 401/403, 429, 4xx validation and 5xx alike; the status travels with the error.
    throw new ApiError(`${REQUEST_FAILED_MESSAGE} (${response.status})`, response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(INVALID_RESPONSE_MESSAGE, response.status);
  }
}

export async function listNotes(): Promise<Note[]> {
  const payload = await requestJson(NOTES_PATH);

  if (!Array.isArray(payload) || !payload.every(isNote)) {
    throw new ApiError(INVALID_RESPONSE_MESSAGE);
  }

  return payload;
}

export async function createNote(text: string): Promise<Note> {
  const payload = await requestJson(NOTES_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!isNote(payload)) {
    throw new ApiError(INVALID_RESPONSE_MESSAGE);
  }

  return payload;
}
