// Client for GET /api/stamp; components never call fetch directly.
import { API_BASE_URL } from "./config";

export type Stamp = {
  stamp: string;
  db: boolean;
};

const STAMP_URL = `${API_BASE_URL}/api/stamp`;

/** Fetches the stamp the backend reports, including whether its database answered. */
export async function getStamp(): Promise<Stamp> {
  const response = await fetch(STAMP_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the stamp failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as Stamp;
}
