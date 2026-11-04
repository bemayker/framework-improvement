import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = { version: string };

const VERSION_URL = `${API_BASE_URL}/api/version`;

// What the backend reports when it cannot resolve its own version.
const UNKNOWN_VERSION = "unknown";

/**
 * Reads the backend's version at runtime. Resolves null when the backend
 * reports it cannot resolve its own version; rejects on a network error, a
 * non-2xx status or a malformed body.
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
      ? (body as Partial<VersionResponse>).version
      : undefined;

  if (typeof version !== "string" || version.trim() === "") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const trimmed = version.trim();
  return trimmed === UNKNOWN_VERSION ? null : trimmed;
}
