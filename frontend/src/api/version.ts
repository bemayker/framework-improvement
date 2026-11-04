import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = { version: string; commit?: string };

export type BackendVersion = { version: string | null; commit: string | null };

const VERSION_URL = `${API_BASE_URL}/api/version`;

// What the backend reports when it cannot resolve its own version or commit.
const UNKNOWN_VALUE = "unknown";

// The footer shows the conventional short sha; the backend sends up to 12 characters.
const COMMIT_DISPLAY_LENGTH = 7;

function toDisplayCommit(commit: unknown): string | null {
  if (typeof commit !== "string") return null;

  const trimmed = commit.trim();
  if (trimmed === "" || trimmed === UNKNOWN_VALUE) return null;

  return trimmed.slice(0, COMMIT_DISPLAY_LENGTH);
}

/**
 * Reads the backend's version and build commit at runtime. The version is null
 * when the backend reports it cannot resolve it; the commit is null when it is
 * missing, blank or unknown, and never causes a rejection. Rejects on a network
 * error, a non-2xx status or a malformed body.
 */
export async function fetchBackendVersion(): Promise<BackendVersion> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const fields =
    typeof body === "object" && body !== null
      ? (body as Partial<VersionResponse>)
      : undefined;
  const version = fields?.version;

  if (typeof version !== "string" || version.trim() === "") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const trimmed = version.trim();
  return {
    version: trimmed === UNKNOWN_VALUE ? null : trimmed,
    commit: toDisplayCommit(fields?.commit),
  };
}
