import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BuildInfo = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers with this literal when it cannot read its own package
// metadata (UNKNOWN_VERSION in backend/app/services/version_service.py) or
// when BUILD_COMMIT is unset (UNKNOWN_BUILD_COMMIT in backend/app/core/config.py).
// It means "no value", so the client treats it as unresolved.
const UNKNOWN_SENTINEL = "unknown";

/**
 * Fetches the backend's version and build commit in one request. Rejects
 * whenever the version cannot be resolved: network failure, non-2xx, a body
 * without a non-empty string `version`, or the backend's "unknown" sentinel.
 * An unusable commit (unknown, missing, empty or non-string) does not reject;
 * it resolves as `null`.
 */
export async function getBackendBuildInfo(): Promise<BuildInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: response has no version");
  }

  if (version === UNKNOWN_SENTINEL) {
    throw new Error("Loading the version failed: backend version is unknown");
  }

  const commit = body?.commit;
  const usableCommit =
    typeof commit === "string" && commit !== "" && commit !== UNKNOWN_SENTINEL;

  return { version, commit: usableCommit ? commit : null };
}
