// Client for the backend's version endpoint. Components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers 200 with this value when it cannot resolve its own
// version; it is the backend saying "unknown", so the client reports absence.
const UNRESOLVED_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves `null` when the backend reports it
 * could not resolve one; throws on a network failure, a non-OK response or a
 * body without a non-empty string `version`. Other body fields are ignored.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "") {
    throw new Error("Loading the version failed: unexpected response");
  }

  return version === UNRESOLVED_VERSION ? null : version;
}
