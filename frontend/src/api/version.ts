// Client for the backend's version endpoint (TEST-05). Components never call
// fetch directly (coding_standards.md Section 4, applied to this project's own
// backend).

import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// backend/app/services/version_service.py answers this sentinel (UNKNOWN_VERSION)
// when its package metadata is missing. It is a version string only in form, so
// the client reports "not resolved" instead of letting the footer display it.
const BACKEND_UNKNOWN_VERSION = "unknown";

// backend/app/core/config.py DEFAULT_BUILD_COMMIT: the commit the backend
// answers when BUILD_COMMIT is unset. Like the version sentinel, it is a string
// only in form, so the client reports "no commit" instead.
const BACKEND_UNKNOWN_COMMIT = "unknown";

export type BackendVersion = {
  version: string | null;
  commit: string | null;
};

/**
 * Fetches the backend's version and build commit.
 *
 * Resolves `version` to the version string, or `null` when the backend reports
 * its `unknown` sentinel, and `commit` to the commit string, or `null` when it
 * is `unknown`, missing, empty or not a string. A malformed commit never
 * rejects, so it cannot hide a valid version. Rejects on a network error, a
 * non-OK status, or a body without a non-empty string `version`.
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
      ? (body as { version?: unknown; commit?: unknown })
      : {};
  const { version, commit } = fields;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: unexpected response");
  }

  const hasUsableCommit =
    typeof commit === "string" &&
    commit !== "" &&
    commit !== BACKEND_UNKNOWN_COMMIT;

  return {
    version: version === BACKEND_UNKNOWN_VERSION ? null : version,
    commit: hasUsableCommit ? commit : null,
  };
}
