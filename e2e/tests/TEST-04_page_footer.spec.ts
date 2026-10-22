import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// The footer shows the backend's version (TEST-08): [project].version in backend/pyproject.toml.
const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const projectSection = readFileSync(pyprojectPath, "utf-8").split(/^\[project\]\s*$/m)[1] ?? "";
const version = /^version\s*=\s*"([^"]+)"/m.exec(projectSection)?.[1];
if (!version) {
  throw new Error("Could not read [project].version from backend/pyproject.toml");
}

test.describe("TEST-04 page footer", () => {
  test("shows a footer with the app name and the version from backend/pyproject.toml", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(version);
  });

  test("exposes the footer as a contentinfo landmark", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("contentinfo")).toContainText(version);
  });

  test("leaves the existing landing-page heading and subtitle unchanged", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("landing-page")).toBeVisible();
    await expect(page.getByTestId("landing-title")).toHaveText("Task Notes");
    await expect(page.getByRole("heading", { name: "Task Notes" })).toBeVisible();
    await expect(
      page.getByText("A minimal task-notes app for keeping track of what needs doing."),
    ).toBeVisible();
  });

  test("keeps the footer visible on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(version);
  });
});
