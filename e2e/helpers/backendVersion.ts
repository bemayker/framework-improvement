import { readFileSync } from "node:fs";
import path from "node:path";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

// Reads the `version = "..."` line under `[project]`. One line needs no TOML parser.
export function readBackendVersion(): string {
  const toml = readFileSync(pyprojectPath, "utf-8");
  const projectSection = toml.match(/^\[project\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/m);
  const versionLine = projectSection?.[1].match(/^version\s*=\s*"([^"]+)"/m);
  if (!versionLine) {
    throw new Error(`No [project] version found in ${pyprojectPath}`);
  }
  return versionLine[1];
}

export const backendVersion = readBackendVersion();
