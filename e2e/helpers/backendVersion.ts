import { readFileSync } from "node:fs";
import path from "node:path";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

/**
 * Reads `[project].version` from backend/pyproject.toml, the same value the
 * backend serves at GET /api/version. Only that one key is needed, so a
 * regular expression over the `[project]` table stands in for a TOML parser.
 */
export function readBackendVersion(): string {
  const toml = readFileSync(pyprojectPath, "utf-8");
  const projectTable = toml.match(/^\[project\]\s*\n((?:(?!^\[).*\n?)*)/m);
  const versionLine = projectTable?.[1].match(/^version\s*=\s*"([^"]+)"/m);
  if (!versionLine) {
    throw new Error(`No [project].version found in ${pyprojectPath}`);
  }
  return versionLine[1];
}
