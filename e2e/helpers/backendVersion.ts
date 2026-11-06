import { readFileSync } from "node:fs";
import path from "node:path";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

// The backend serves the version declared in its pyproject.toml, so the specs read
// the same declaration instead of typing a version string of their own.
export function readBackendVersion(): string {
  const match = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(pyprojectPath, "utf-8"));
  if (match === null) {
    throw new Error(`No version field found in ${pyprojectPath}`);
  }
  return match[1];
}
