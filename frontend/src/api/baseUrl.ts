// One source for the backend base URL, shared by every API client so a
// deployment-dependent value is never defined twice.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
