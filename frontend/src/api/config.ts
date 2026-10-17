// One source for the backend base URL, shared by every API client module
// (coding_standards.md Section 5: one value, one source). Set VITE_API_BASE_URL
// to point the frontend at another backend; it defaults to the local one.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
