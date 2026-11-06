import { readFileSync } from "node:fs";
import path from "node:path";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

// The backend serves [project].version from this file, so it is the one source
// E2E assertions compare the footer against.
export function readBackendVersion(): string {
  const pyproject = readFileSync(pyprojectPath, "utf-8");
  const projectSection = pyproject.split(/^\[(?!project\])/m)[0];
  const match = /^version\s*=\s*"([^"]+)"/m.exec(projectSection);
  if (!match) {
    throw new Error(`No [project].version found in ${pyprojectPath}`);
  }
  return match[1];
}
