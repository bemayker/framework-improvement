import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

// The sandbox database is not reset between specs, so every note uses a
// unique text to keep specs independent and safe to run in parallel
// (testing_standards.md §1.3).
function uniqueNoteText(label: string): string {
  return `${label} ${randomUUID()}`;
}

test.describe("TEST-03 simple note form", () => {
  test("AC1: submitting a non-empty note stores it and shows it in the list without a full page reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("Buy milk");
    let navigationCount = 0;
    page.on("framenavigated", () => {
      navigationCount += 1;
    });

    await page.goto("/");
    navigationCount = 0; // reset after the initial load settles

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/notes") && response.request().method() === "POST",
    );

    await page.getByTestId("note-form-input").fill(noteText);
    await page.getByTestId("note-form-submit").click();

    const response = await responsePromise;
    expect(response.status()).toBe(201);
    await expect(page.getByTestId("note-list")).toContainText(noteText);
    expect(navigationCount).toBe(0);
  });

  test("AC2: submitting an empty note shows a validation message and makes no API call", async ({
    page,
  }) => {
    let postCount = 0;
    await page.route("**/api/notes", async (route) => {
      if (route.request().method() === "POST") {
        postCount += 1;
      }
      await route.continue();
    });

    await page.goto("/");
    await page.getByTestId("note-form-submit").click();

    await expect(page.getByTestId("note-form-error")).toBeVisible();
    expect(postCount).toBe(0);
  });

  test("AC3: saved notes persist across a page reload", async ({ page }) => {
    const noteText = uniqueNoteText("Call the dentist");

    await page.goto("/");
    await page.getByTestId("note-form-input").fill(noteText);
    await page.getByTestId("note-form-submit").click();
    await expect(page.getByTestId("note-list")).toContainText(noteText);

    await page.reload();

    await expect(page.getByTestId("note-list")).toContainText(noteText);
  });

  test("edge case: submitting a whitespace-only note shows a validation message and makes no API call", async ({
    page,
  }) => {
    let postCount = 0;
    await page.route("**/api/notes", async (route) => {
      if (route.request().method() === "POST") {
        postCount += 1;
      }
      await route.continue();
    });

    await page.goto("/");
    await page.getByTestId("note-form-input").fill("   ");
    await page.getByTestId("note-form-submit").click();

    await expect(page.getByTestId("note-form-error")).toBeVisible();
    expect(postCount).toBe(0);
  });
});
