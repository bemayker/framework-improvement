// Client for the backend's own version, so the footer shows the build it is
// really talking to (coding_standards.md: dedicated client layer).
import { API_BASE_URL } from "./baseUrl";

// The sentinel backend/app/services/version_service.py returns when package
// metadata is missing. It is not a version, so it is treated as unresolved.
const UNRESOLVED_BACKEND_VERSION = "unknown";

// The sentinel the backend returns when BUILD_COMMIT is unset or blank.
const UNRESOLVED_BACKEND_COMMIT = "unknown";

// The backend sends up to 12 characters; the footer shows the first 7.
const SHORT_COMMIT_LENGTH = 7;

const VERSION_URL = `${API_BASE_URL}/api/version`;

export interface BackendVersion {
  version: string | null;
  commit: string | null;
}

function shortCommit(body: { version: string; commit?: unknown }): string | null {
  const { commit } = body;

  if (typeof commit !== "string" || commit === "" || commit === UNRESOLVED_BACKEND_COMMIT) {
    return null;
  }

  return commit.slice(0, SHORT_COMMIT_LENGTH);
}

function hasVersionString(body: unknown): body is { version: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string"
  );
}

/** Resolves the backend version and short commit, each null when the backend has none to report. */
export async function fetchBackendVersion(): Promise<BackendVersion> {
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

  const commit = shortCommit(body);

  if (body.version === "" || body.version === UNRESOLVED_BACKEND_VERSION) {
    return { version: null, commit };
  }

  return { version: body.version, commit };
}
