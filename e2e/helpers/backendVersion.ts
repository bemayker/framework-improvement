import { readFileSync } from "node:fs";
import path from "node:path";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

// Reads `[project].version` from backend/pyproject.toml: the value GET /api/version serves.
export function readBackendVersion(): string {
  const toml = readFileSync(pyprojectPath, "utf-8");
  const projectTable = toml.match(/^\[project\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/m);
  const versionLine = projectTable?.[1].match(/^version\s*=\s*"([^"]+)"/m);
  if (!versionLine) {
    throw new Error(`No [project].version found in ${pyprojectPath}`);
  }
  return versionLine[1];
}
