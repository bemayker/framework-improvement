// Client for the backend's version endpoint. Components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

/** Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py. */
export const BACKEND_UNKNOWN_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Fetches the backend's version. Returns null when the backend reports its
 * unknown sentinel or a blank value; throws on a network error, a non-OK
 * response or a body without a string `version` field.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const version = body.version.trim();

  return version === "" || version === BACKEND_UNKNOWN_VERSION ? null : version;
}
