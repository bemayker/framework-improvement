// Single source for the backend base URL, shared by every API client.
// Deployment-dependent: override with VITE_API_BASE_URL, default is the
// docker compose backend port.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
