import { readFileSync } from "node:fs";
import path from "node:path";

const PYPROJECT_PATH = path.resolve(__dirname, "../../backend/pyproject.toml");

/**
 * Reads `[project].version` from `backend/pyproject.toml`, the source the
 * backend's `GET /api/version` reports. A single regex over the `[project]`
 * table avoids adding a TOML parser dependency for one known key.
 */
export function backendVersion(): string {
  const pyproject = readFileSync(PYPROJECT_PATH, "utf-8");
  const projectTable = /^\[project\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/m.exec(pyproject);

  if (projectTable === null) {
    throw new Error(`No [project] table found in ${PYPROJECT_PATH}`);
  }

  const versionLine = /^version\s*=\s*"([^"]+)"\s*$/m.exec(projectTable[1]);

  if (versionLine === null) {
    throw new Error(`No [project].version found in ${PYPROJECT_PATH}`);
  }

  return versionLine[1];
}
