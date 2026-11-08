// One source for the API base URL, shared by every client module so a
// deployment-dependent value is never configured in two places.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
