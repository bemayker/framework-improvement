import { API_BASE_URL } from "./apiBaseUrl";

// Sentinel the backend answers when it cannot read its own package metadata
// (backend/app/services/version_service.py). It is not a version to display.
const BACKEND_UNKNOWN_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Fetches the backend's version from GET /api/version.
 *
 * Resolves to null when the backend reports no usable version (empty, blank or
 * its "unknown" sentinel). Throws on a non-OK response or a body without a
 * string `version`. Any other field in the body is ignored.
 */
export async function getBackendVersion(): Promise<string | null> {
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

  if (typeof version !== "string") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const trimmed = version.trim();
  return trimmed === "" || trimmed === BACKEND_UNKNOWN_VERSION ? null : trimmed;
}
