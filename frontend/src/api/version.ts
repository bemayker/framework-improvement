import { API_BASE_URL } from "./notes";

type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Mirrors the sentinel backend/app/services/version_service.py returns when
// its package metadata is missing; it is not a real build version.
const UNKNOWN_BACKEND_VERSION = "unknown";

/** Fetches the backend's version, or null when the backend has none to report. */
export async function fetchBackendVersion(): Promise<string | null> {
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

  return body.version;
}
