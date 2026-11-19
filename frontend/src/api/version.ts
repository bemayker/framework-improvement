import { API_BASE_URL } from "./notes";

type VersionResponse = {
  version: string;
  commit: string;
};

export type BackendVersionInfo = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Mirrors the sentinel backend/app/services/version_service.py returns when
// its package metadata is missing; it is not a real build version.
const UNKNOWN_BACKEND_VERSION = "unknown";

// Mirrors DEFAULT_BUILD_COMMIT in backend/app/core/config.py, the value the
// backend reports when no build commit was provided.
const UNKNOWN_BACKEND_COMMIT = "unknown";

// The backend sends up to 12 characters; the footer shows the short form.
const COMMIT_DISPLAY_LENGTH = 7;

/** Returns the short commit, or null when the backend has no usable one. */
function normaliseCommit(commit: unknown): string | null {
  if (typeof commit !== "string") {
    return null;
  }

  const trimmed = commit.trim();

  if (trimmed === "" || trimmed === UNKNOWN_BACKEND_COMMIT) {
    return null;
  }

  return trimmed.slice(0, COMMIT_DISPLAY_LENGTH);
}

/** Fetches the backend's version and commit, or null when it has no version to report. */
export async function fetchBackendVersion(): Promise<BackendVersionInfo | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string") {
    throw new Error("Loading the version failed: response carries no version");
  }

  if (body.version === "" || body.version === UNKNOWN_BACKEND_VERSION) {
    return null;
  }

  return { version: body.version, commit: normaliseCommit(body.commit) };
}
