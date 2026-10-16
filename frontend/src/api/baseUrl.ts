// Single source of the backend origin, shared by every API client so they
// cannot disagree (coding_standards.md Section 5). Override with
// VITE_API_BASE_URL; the default matches the compose backend port.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
