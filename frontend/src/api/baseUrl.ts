// Single source of the backend base URL, shared by every API client.
// Deployment-dependent, so it is read from the environment with a documented
// default for local development.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
