// One source for the backend base URL, shared by every API client so they
// cannot drift apart. Override with VITE_API_BASE_URL; the default is the
// local backend port from docs/DEVELOPMENT.md.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
