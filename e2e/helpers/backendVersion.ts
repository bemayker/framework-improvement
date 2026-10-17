import { readFileSync } from "node:fs";
import path from "node:path";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

/**
 * Returns `[project].version` from backend/pyproject.toml, the value the
 * running backend reports from GET /api/version (its installed package metadata).
 */
export function readBackendVersion(): string {
  const projectSection = readFileSync(pyprojectPath, "utf-8").split(/^\[/m).find((section) =>
    section.startsWith("project]"),
  );
  const match = projectSection?.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error(`No [project].version found in ${pyprojectPath}`);
  }
  return match[1];
}
