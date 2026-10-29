// Client for the backend's GET /api/version. The footer is supplementary, so
// every unresolved outcome is a rejection the caller maps to "no version".
import { API_BASE_URL } from "./baseUrl";

type VersionResponse = { version: string; commit: string };

export type BackendVersion = { version: string; commit: string | null };

const VERSION_URL = `${API_BASE_URL}/api/version`;
const VERSION_REQUEST_TIMEOUT_MS = 5000;
// The backend answers this when its package metadata is missing.
const UNRESOLVED_BACKEND_VERSION = "unknown";

/**
 * Resolves the backend's version and build commit, or rejects when the version
 * cannot be determined. A missing or unusable commit is not a failure: the
 * version is still valid, so the commit resolves to null.
 */
export async function fetchBackendVersion(): Promise<BackendVersion> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VERSION_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(VERSION_URL, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(
        `Loading the backend version failed: ${response.status} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as Partial<VersionResponse> | null;
    const version = body?.version;

    if (typeof version !== "string" || version === "") {
      throw new Error("Loading the backend version failed: unexpected response shape");
    }

    if (version === UNRESOLVED_BACKEND_VERSION) {
      throw new Error("Loading the backend version failed: backend version unresolved");
    }

    const commit = body?.commit;

    return {
      version,
      commit: typeof commit === "string" && commit !== "" ? commit : null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
