import { randomUUID } from "node:crypto";
import { test, expect, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method, not a substring:
 * Vite serves `src/api/notes.ts` from a URL containing the same substring.
 */
function isNotesApiRequest(request: Request, method: "GET" | "POST"): boolean {
  return (
    request.method() === method && new URL(request.url()).pathname === NOTES_PATH
  );
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double click on Save note while the save is in flight stores one note", async ({
    page,
  }) => {
    const noteText = `BUG-04 double ${randomUUID().slice(0, 8)}`;
    let postCount = 0;
    let releaseSave: () => void = () => {};
    const saveHeld = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });

    // Holds every create request until the test releases it, so the save is
    // provably still in flight while the second click lands.
    await page.route("**/api/notes", async (route) => {
      if (!isNotesApiRequest(route.request(), "POST")) {
        await route.continue();
        return;
      }
      postCount += 1;
      await saveHeld;
      await route.continue();
    });

    const mountLoad = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.goto("/");
    await mountLoad;
    await expect(page.getByTestId("note-form")).toBeVisible();

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    // The first save is held, so the lock must be visible before the release.
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    releaseSave();
    await createResponse;

    const noteList = page.getByTestId("note-list");
    await expect(noteList.getByText(noteText, { exact: true })).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(postCount).toBe(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(noteList.getByText(noteText, { exact: true })).toHaveCount(1);
  });
});
