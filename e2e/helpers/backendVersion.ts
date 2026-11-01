import { readFileSync } from "node:fs";
import path from "node:path";

const BACKEND_PYPROJECT_PATH = path.resolve(__dirname, "../../backend/pyproject.toml");

/**
 * The version the footer is expected to show: `[project].version` in
 * backend/pyproject.toml, the single source behind GET /api/version.
 *
 * One line is read with a regular expression rather than adding a TOML parser
 * dependency for it.
 */
export function readBackendVersion(): string {
  const projectTable = readFileSync(BACKEND_PYPROJECT_PATH, "utf-8").split(/^\[/m)
    .find((table) => table.startsWith("project]"));
  const match = projectTable?.match(/^version\s*=\s*"([^"]+)"/m);

  if (!match) {
    throw new Error(`No [project].version found in ${BACKEND_PYPROJECT_PATH}`);
  }

  return match[1];
}
