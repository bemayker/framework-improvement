// Client for the backend's own version, so the footer shows what is actually
// running rather than a value baked into the frontend bundle (TEST-08).
import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers this literal when its package metadata is missing.
export const UNKNOWN_BACKEND_VERSION = "unknown";

// The backend answers this literal when it has no BUILD_COMMIT (TEST-09).
export const UNKNOWN_BUILD_COMMIT = "unknown";

export type BackendVersion = {
  version: string | null;
  commit: string | null;
};

/**
 * Fetches the backend version and build commit. The version is null when the
 * backend answers without a usable one (empty or the unknown sentinel), the
 * commit is null when it is missing, not a string, empty or the unknown
 * sentinel; throws on a non-OK response or a body with no string version.
 */
export async function getBackendVersion(): Promise<BackendVersion> {
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

  if (typeof version !== "string") {
    throw new Error("Loading the version failed: response has no string version");
  }

  return {
    version:
      version === "" || version === UNKNOWN_BACKEND_VERSION ? null : version,
    commit:
      typeof commit === "string" && commit !== "" && commit !== UNKNOWN_BUILD_COMMIT
        ? commit
        : null,
  };
}
