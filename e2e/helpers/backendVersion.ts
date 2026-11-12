import { readFileSync } from "node:fs";
import path from "node:path";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

// The footer shows the backend's declared version, so the specs read the same
// source (`[project].version`) instead of repeating a literal.
export function readBackendVersion(): string {
  const pyproject = readFileSync(pyprojectPath, "utf-8");
  const projectSection = /^\[project\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/m.exec(pyproject);
  const versionMatch = projectSection
    ? /^version\s*=\s*"([^"]+)"/m.exec(projectSection[1])
    : null;
  if (!versionMatch) {
    throw new Error(`No [project].version found in ${pyprojectPath}`);
  }
  return versionMatch[1];
}
