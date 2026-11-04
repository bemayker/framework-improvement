import { readFileSync } from "node:fs";
import path from "node:path";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const frontendPackageJsonPath = path.resolve(__dirname, "../../frontend/package.json");

/** The version the backend serves at /api/version: `[project].version` in backend/pyproject.toml. */
export function readBackendVersion(): string {
  const toml = readFileSync(backendPyprojectPath, "utf-8");
  const projectTable = toml.split(/^\[(?!project\])/m)[0];
  const match = projectTable.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error("No [project] version found in backend/pyproject.toml");
  }
  return match[1];
}

/** The frontend package version, which the footer must not show. */
export function readFrontendVersion(): string {
  const { version } = JSON.parse(readFileSync(frontendPackageJsonPath, "utf-8")) as {
    version: string;
  };
  return version;
}
