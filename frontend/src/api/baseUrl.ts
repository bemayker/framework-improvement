// One source for the backend's base URL, shared by every API client so the
// deployment-dependent value is never configured in two places.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
