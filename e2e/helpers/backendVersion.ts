import { readFileSync } from "node:fs";
import path from "node:path";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

// The backend serves [project].version from this file at GET /api/version, so
// reading it here gives specs the expected value without a TOML dependency.
export function readBackendVersion(): string {
  const pyproject = readFileSync(backendPyprojectPath, "utf-8");
  const projectSection = pyproject.split(/^\[project\]\s*$/m)[1] ?? "";
  const match = projectSection.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error(`No [project] version found in ${backendPyprojectPath}`);
  }
  return match[1];
}
