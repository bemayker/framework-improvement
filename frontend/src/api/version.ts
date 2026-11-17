import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type VersionInfo = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

const SHORT_COMMIT_LENGTH = 7;

// The backend answers this when its distribution metadata is missing
// (version_service.UNKNOWN_VERSION); it is not a real version to display.
const UNRESOLVED_BACKEND_VERSION = "unknown";

// The backend answers this when BUILD_COMMIT is unset
// (DEFAULT_BUILD_COMMIT); it is not a real commit to display.
const UNRESOLVED_BACKEND_COMMIT = "unknown";

function toShortCommit(commit: unknown): string | null {
  if (
    typeof commit !== "string" ||
    commit === "" ||
    commit === UNRESOLVED_BACKEND_COMMIT
  ) {
    return null;
  }

  return commit.slice(0, SHORT_COMMIT_LENGTH);
}

export async function getVersion(): Promise<VersionInfo | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Unexpected version response");
  }

  if (version === UNRESOLVED_BACKEND_VERSION) {
    return null;
  }

  return { version, commit: toShortCommit(body?.commit) };
}
