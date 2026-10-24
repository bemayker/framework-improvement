// Client for the backend's GET /api/version (coding_standards.md Section 4:
// components never call fetch directly).

import { API_BASE_URL } from "./baseUrl";

type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers this sentinel (UNKNOWN_VERSION in
// backend/app/services/version_service.py) when its package metadata is not
// installed. It is not a version, so it must never reach the UI.
const UNRESOLVED_VERSION = "unknown";

/**
 * Resolves the backend's version, or null when it cannot be resolved for any
 * reason (network error, non-2xx, malformed body, empty or sentinel value).
 * Never throws, so callers handle a single shape.
 */
export async function fetchAppVersion(): Promise<string | null> {
  try {
    const response = await fetch(VERSION_URL);
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Partial<VersionResponse> | null;
    const version = body?.version;
    if (
      typeof version !== "string" ||
      version === "" ||
      version === UNRESOLVED_VERSION
    ) {
      return null;
    }
    return version;
  } catch {
    return null;
  }
}
