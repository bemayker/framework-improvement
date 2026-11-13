import { randomUUID } from "node:crypto";
import { test, expect, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method. A substring
 * check is not enough: Vite serves `src/api/notes.ts` from a URL containing
 * the same substring.
 */
function isNotesApiRequest(request: Request, method: "GET" | "POST"): boolean {
  return (
    request.method() === method && new URL(request.url()).pathname === NOTES_PATH
  );
}

test.describe("BUG-04 double submit of a note", () => {
  test("stores a note once when the save button is double-clicked", async ({
    page,
  }) => {
    const noteText = `BUG-04 double click ${randomUUID().slice(0, 8)}`;

    const mountLoad = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.goto("/");
    await mountLoad;
    await expect(page.getByTestId("note-form")).toBeVisible();

    // Holds the first POST until the test has sent both clicks, so the second
    // submit always arrives while the first save is still in flight. The gate
    // is released by the test itself, never by a timeout.
    let releaseFirstPost: () => void = () => undefined;
    const firstPostGate = new Promise<void>((resolve) => {
      releaseFirstPost = resolve;
    });
    let postCount = 0;

    await page.route(
      (url) => url.pathname === NOTES_PATH,
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        postCount += 1;
        if (postCount === 1) {
          await firstPostGate;
        }
        await route.continue();
      },
    );

    await page.getByTestId("note-input").fill(noteText);
    // Resolves once both clicks of the double-click have been dispatched.
    await page.getByTestId("note-submit").dblclick();
    releaseFirstPost();

    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByText(noteText)).toHaveCount(1);
    expect(postCount).toBe(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(page.getByText(noteText)).toHaveCount(1);
  });
});
