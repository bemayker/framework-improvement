// One source for the API base URL, shared by every API client
// (coding_standards.md Section 5). Override with VITE_API_BASE_URL.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
