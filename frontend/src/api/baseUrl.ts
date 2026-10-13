// Single source of the backend base URL, shared by every API client module
// (coding_standards.md Section 5: one deployment-dependent value, one source).

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
