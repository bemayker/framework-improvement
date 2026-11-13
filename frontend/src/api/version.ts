// Client for the backend's version endpoint: components never call fetch directly
// (coding_standards.md Section 4, applied to this project's own backend).
import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers with this marker when its package metadata is not installed
// (version) or when it was built without BUILD_COMMIT (commit).
const UNKNOWN_MARKER = "unknown";

export interface BackendVersion {
  version: string;
  commit: string | null;
}

/**
 * Resolves to the backend's version and build commit. Rejects whenever no usable
 * version exists: network error, non-OK status, malformed body or the backend's
 * own `unknown` marker. An unusable commit never rejects: it resolves to `null`
 * because the version is still worth showing.
 */
export async function fetchBackendVersion(): Promise<BackendVersion> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const fields =
    typeof body === "object" && body !== null
      ? (body as { version?: unknown; commit?: unknown })
      : {};
  const { version, commit } = fields;

  if (typeof version !== "string" || version === "" || version === UNKNOWN_MARKER) {
    throw new Error("Loading the version failed: no usable version in the response");
  }

  const usableCommit =
    typeof commit === "string" && commit !== "" && commit !== UNKNOWN_MARKER
      ? commit
      : null;

  return { version, commit: usableCommit };
}
