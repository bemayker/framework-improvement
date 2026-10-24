import { API_BASE_URL } from "./baseUrl";

// Mirrors backend/app/schemas/version.py.
export type VersionResponse = {
  version: string;
  commit: string;
};

export type BackendVersion = {
  version: string;
  commit: string | null;
};

// Mirrors version_service.UNKNOWN_VERSION and config.DEFAULT_BUILD_COMMIT: the
// backend answers with this sentinel when its distribution metadata or build
// commit is missing, which is the absence of a value rather than an answer
// worth showing.
const BACKEND_UNKNOWN = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

function usableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" || trimmed === BACKEND_UNKNOWN ? null : trimmed;
}

/**
 * Reads the backend's version and build commit. Returns null when the backend
 * answered but could not resolve its version (blank or the "unknown"
 * sentinel); the commit is null when it is missing, not a string, blank or the
 * sentinel. Throws on an HTTP, network or response-shape failure.
 */
export async function getBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string") {
    throw new Error("Loading the version failed: unexpected response");
  }

  const version = usableText(body.version);
  if (version === null) {
    return null;
  }

  return { version, commit: usableText(body.commit) };
}
