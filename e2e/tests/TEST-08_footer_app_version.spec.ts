import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const backendVersionMatch = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(backendPyprojectPath, "utf-8"),
);
if (!backendVersionMatch) {
  throw new Error("backend/pyproject.toml has no version line");
}
const backendVersion = backendVersionMatch[1];

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the version reported by the running backend on the landing page", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows the app name alone when /api/version fails", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
  });
});
