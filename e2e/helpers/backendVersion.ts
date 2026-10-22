import { readFileSync } from "node:fs";
import path from "node:path";

// The backend's declared version: [project].version in backend/pyproject.toml.
// It differs from frontend/package.json's, so specs using it prove the footer's source.
const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");

export function readBackendVersion(): string {
  const projectSection = readFileSync(pyprojectPath, "utf-8").split(/^\[project\]\s*$/m)[1] ?? "";
  const version = /^version\s*=\s*"([^"]+)"/m.exec(projectSection)?.[1];
  if (!version) {
    throw new Error("Could not read [project].version from backend/pyproject.toml");
  }
  return version;
}
