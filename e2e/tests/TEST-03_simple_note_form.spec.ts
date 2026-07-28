import { test, expect } from "@playwright/test";

/** A unique note text per test run so specs stay independent and parallel-safe
 * against a persistent database (no reliance on an empty list, no strict-mode
 * collisions between concurrently-run specs). */
function uniqueNoteText(label: string): string {
  return `TEST-03 note ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test.describe("TEST-03 simple note form", () => {
  test("submitting a non-empty note stores it and it appears in the list without a full page reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("create");
    let navigated = false;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        navigated = true;
      }
    });

    await page.goto("/");
    navigated = false; // ignore the initial goto navigation itself

    await page.getByTestId("note-input").fill(noteText);
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/notes") && res.request().method() === "POST",
      ),
      page.getByTestId("note-submit").click(),
    ]);

    await expect(page.getByTestId("note-list")).toContainText(noteText);
    expect(navigated).toBe(false);
  });

  test("submitting an empty note shows a validation message and issues no API call", async ({
    page,
  }) => {
    const postRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/notes") && request.method() === "POST") {
        postRequests.push(request.url());
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("note-input")).toHaveValue("");

    await page.getByTestId("note-submit").click();

    await expect(page.getByTestId("note-error")).toBeVisible();
    await expect(page.getByTestId("note-error")).toHaveText("Note text is required.");
    expect(postRequests).toHaveLength(0);
  });

  test("saved notes persist across a page reload", async ({ page }) => {
    const noteText = uniqueNoteText("persist");

    await page.goto("/");
    await page.getByTestId("note-input").fill(noteText);
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/notes") && res.request().method() === "POST",
      ),
      page.getByTestId("note-submit").click(),
    ]);
    await response;
    await expect(page.getByTestId("note-list")).toContainText(noteText);

    await page.reload();

    await page.waitForResponse(
      (res) => res.url().includes("/api/notes") && res.request().method() === "GET",
    );
    await expect(page.getByTestId("note-list")).toContainText(noteText);
  });

  test("submitting whitespace-only text shows the validation message and issues no API call (edge case)", async ({
    page,
  }) => {
    const postRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/notes") && request.method() === "POST") {
        postRequests.push(request.url());
      }
    });

    await page.goto("/");
    await page.getByTestId("note-input").fill("   ");
    await page.getByTestId("note-submit").click();

    await expect(page.getByTestId("note-error")).toBeVisible();
    expect(postRequests).toHaveLength(0);
  });
});
