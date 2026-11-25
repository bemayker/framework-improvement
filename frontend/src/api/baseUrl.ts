// The one backend base URL every API client imports, so a deployment sets it
// once through VITE_API_BASE_URL.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
