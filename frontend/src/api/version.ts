// Client for the backend's version endpoint (TEST-05). Components never call
// fetch directly (coding_standards.md Section 4, applied to this project's own
// backend).

const DEFAULT_API_BASE_URL = "http://localhost:8010";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const VERSION_URL = `${API_BASE_URL}/api/version`;

// backend/app/services/version_service.py answers this sentinel (UNKNOWN_VERSION)
// when its package metadata is missing. It is a version string only in form, so
// the client reports "not resolved" instead of letting the footer display it.
const BACKEND_UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version.
 *
 * Resolves to the version string, or `null` when the backend reports its
 * `unknown` sentinel. Rejects on a network error, a non-OK status, or a body
 * without a non-empty string `version`.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const version =
    typeof body === "object" && body !== null
      ? (body as { version?: unknown }).version
      : undefined;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: unexpected response");
  }

  return version === BACKEND_UNKNOWN_VERSION ? null : version;
}
