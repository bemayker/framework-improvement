import { readFileSync } from "node:fs";
import path from "node:path";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

// The backend reports its [project].version at runtime, so the expected value is read from the same file.
export function readBackendVersion(): string {
  const pyproject = readFileSync(pyprojectPath, "utf-8");
  const projectSection = pyproject.split(/^\[/m).find((section) => section.startsWith("project]"));
  const match = projectSection?.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error(`No [project] version found in ${pyprojectPath}`);
  }
  return match[1];
}
