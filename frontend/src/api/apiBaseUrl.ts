// The one place the backend origin is resolved. Both API client modules import
// it, so the deployment-dependent default exists exactly once
// (coding_standards.md Section 5, "one value, one source").

/** Used when the deployment supplies no VITE_API_BASE_URL (local dev stack). */
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
