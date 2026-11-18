// Client for GET /api/version: the footer reads the backend's version at runtime,
// so a frontend rebuilt against an older backend still reports the backend's own.

import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py, the
// backend's own answer when its package metadata is missing.
export const UNKNOWN_BACKEND_VERSION = "unknown";

/** Fetches the backend's version string, returned as sent (the caller decides display). */
export async function getVersion(): Promise<string> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as { version?: unknown };

  if (typeof body.version !== "string" || body.version === "") {
    throw new Error("Unexpected version response");
  }

  return body.version;
}
