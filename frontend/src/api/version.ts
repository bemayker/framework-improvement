// Client for the backend's own version, so the footer shows the build it is
// really talking to (coding_standards.md: dedicated client layer).
import { API_BASE_URL } from "./baseUrl";

// The sentinel backend/app/services/version_service.py returns when package
// metadata is missing. It is not a version, so it is treated as unresolved.
const UNRESOLVED_BACKEND_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

function hasVersionString(body: unknown): body is { version: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string"
  );
}

/** Resolves the backend version, or null when the backend has none to report. */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!hasVersionString(body)) {
    throw new Error("Loading the version failed: unexpected response");
  }

  if (body.version === "" || body.version === UNRESOLVED_BACKEND_VERSION) {
    return null;
  }

  return body.version;
}
