// The one owner of the backend base URL, shared by every API client module
// (coding_standards.md Section 5: one value, one source).
// Override with VITE_API_BASE_URL; the documented default is the local backend.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
