import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const backendVersion = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(backendPyprojectPath, "utf-8"),
)?.[1];

if (!backendVersion) {
  throw new Error(`No version = "..." line found in ${backendPyprojectPath}`);
}

// A route-fulfilled cross-origin response still goes through the browser's CORS check.
const corsHeaders = { "access-control-allow-origin": "*" };

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the version the running backend reports in the landing page footer", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-version")).toHaveText(` v${backendVersion}`);
    await expect(page.getByTestId("app-footer")).toContainText(`Task Notes v${backendVersion}`);
  });

  test("shows the backend's version when it differs from the frontend bundle's", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ version: "9.9.9-partial" }),
      }),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText("Task Notes v9.9.9-partial");
    await expect(footer).not.toContainText("v0.0.0");
  });

  test("renders the footer with the app name alone when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) => route.abort());
    const versionRequestFailed = page.waitForEvent("requestfailed", (request) =>
      request.url().endsWith("/api/version"),
    );

    await page.goto("/");
    // Without this wait the assertions below could pass before the request settled.
    await versionRequestFailed;

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
