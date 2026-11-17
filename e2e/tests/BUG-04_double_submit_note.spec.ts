import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its exact path and method.
 *
 * A substring check on "/api/notes" would also catch Vite's module fetch of
 * `src/api/notes.ts`, so the pathname is compared exactly.
 */
function isNotesApiRequest(request: Request, method: "GET" | "POST"): boolean {
  return (
    request.method() === method && new URL(request.url()).pathname === NOTES_PATH
  );
}

/** Unique per test, so specs stay independent and parallel-safe. */
function uniqueNoteText(label: string): string {
  return `BUG-04 ${label} ${randomUUID().slice(0, 8)}`;
}

/**
 * Opens the landing page and waits for the mount `GET /api/notes` to settle, so
 * the test never interacts with a list that is still loading.
 */
async function openLandingPage(page: Page): Promise<void> {
  const mountLoad = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );

  await page.goto("/");

  await mountLoad;
  await expect(page.getByTestId("note-form")).toBeVisible();
  await expect(page.getByTestId("note-list")).toBeAttached();
}

test.describe("BUG-04 double submit of a note", () => {
  test("stores a double-clicked note only once", async ({ page }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);

    const createRequests: Request[] = [];
    page.on("request", (request) => {
      if (isNotesApiRequest(request, "POST")) {
        createRequests.push(request);
      }
    });

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByText(noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(page.getByText(noteText)).toHaveCount(1);
  });
});
