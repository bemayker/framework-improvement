// Client for GET /api/version: the footer reads the backend's version at runtime,
// so a frontend rebuilt against an older backend still reports the backend's own.

import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py, the
// backend's own answer when its package metadata is missing.
export const UNKNOWN_BACKEND_VERSION = "unknown";

// Mirrors UNKNOWN_COMMIT in backend/app/core/config.py, the backend's own
// answer when BUILD_COMMIT is unset or blank.
export const UNKNOWN_BACKEND_COMMIT = "unknown";

export type VersionInfo = { version: string; commit: string | null };

/**
 * Fetches the backend's version and build commit, returned as sent (the caller
 * decides display). A bad commit never fails the call: the version in the same
 * body is still good, so the commit becomes null instead.
 */
export async function getVersion(): Promise<VersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as { version?: unknown; commit?: unknown };

  if (typeof body.version !== "string" || body.version === "") {
    throw new Error("Unexpected version response");
  }

  const commit =
    typeof body.commit === "string" && body.commit !== "" ? body.commit : null;

  return { version: body.version, commit };
}
