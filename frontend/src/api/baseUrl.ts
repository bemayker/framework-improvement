// The one place the backend base URL is resolved, so every API client shares
// a single deployment-dependent value instead of each declaring its own copy.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
