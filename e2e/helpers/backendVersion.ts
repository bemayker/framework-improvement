import { readFileSync } from "node:fs";
import path from "node:path";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const TABLE_HEADER = /^\s*\[/;
const VERSION_LINE = /^\s*version\s*=\s*"([^"]+)"/;

// Reads [project].version from backend/pyproject.toml, the file the backend's
// GET /api/version reports from, so the E2E specs' expected value has one source.
export function readBackendVersion(): string {
  const lines = readFileSync(pyprojectPath, "utf-8").split(/\r?\n/);
  const projectStart = lines.findIndex((line) => line.trim() === "[project]");
  if (projectStart !== -1) {
    for (const line of lines.slice(projectStart + 1)) {
      if (TABLE_HEADER.test(line)) break;
      const match = VERSION_LINE.exec(line);
      if (match) return match[1];
    }
  }
  throw new Error("Could not read [project].version from backend/pyproject.toml");
}
