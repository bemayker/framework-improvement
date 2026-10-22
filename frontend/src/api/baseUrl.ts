// The one place the backend's base URL is resolved, shared by every API client
// (coding_standards.md Section 5: one value, one source).

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
