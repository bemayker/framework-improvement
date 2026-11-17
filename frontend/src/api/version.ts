import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers "unknown" when its package metadata is absent
// (backend/app/services/version_service.py UNKNOWN_VERSION) or when the build
// commit is unset. That is not a value a person should read in the footer, so
// it counts as unresolved.
const UNRESOLVED_VERSION_SENTINEL = "unknown";

const SHORT_COMMIT_LENGTH = 7;

export type AppVersionInfo = {
  version: string | null;
  commit: string | null;
};

function usableString(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value === "" ||
    value === UNRESOLVED_VERSION_SENTINEL
  ) {
    return null;
  }
  return value;
}

/**
 * Fetches the backend's version and short build commit; each is null when the
 * backend reports none usable. Non-OK responses and network errors reject.
 */
export async function getAppVersion(): Promise<AppVersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const fields =
    typeof body === "object" && body !== null
      ? (body as { version?: unknown; commit?: unknown })
      : {};
  const commit = usableString(fields.commit);

  return {
    version: usableString(fields.version),
    commit: commit === null ? null : commit.slice(0, SHORT_COMMIT_LENGTH),
  };
}
