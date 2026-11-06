import { randomUUID } from "node:crypto";
import { test, expect, type Locator, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";
const NOTES_URL_PATTERN = `**${NOTES_PATH}`;

/**
 * Matches the backend notes call on its exact path and method.
 *
 * A substring check on "/api/notes" is not enough: Vite serves the frontend
 * module `src/api/notes.ts` from a URL that contains the same substring.
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
 * a late mount response never replaces a note added before it lands.
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

/** The list entries carrying exactly this note text. */
function listedNotes(page: Page, noteText: string): Locator {
  return page.getByTestId(/^note-list-item-/).filter({ hasText: noteText });
}

test.describe("BUG-04 saving a note twice quickly", () => {
  test("a double-click on Save note sends one request and stores the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    const seenPosts: Request[] = [];
    let releaseFirstPost: () => void = () => undefined;
    const firstPostMayContinue = new Promise<void>((resolve) => {
      releaseFirstPost = resolve;
    });

    // Holds the first POST until both clicks have landed (released by the test,
    // no fixed timeout), then forwards every POST to the real backend.
    await page.route(NOTES_URL_PATTERN, async (route) => {
      if (!isNotesApiRequest(route.request(), "POST")) {
        await route.continue();
        return;
      }
      seenPosts.push(route.request());
      if (seenPosts.length === 1) {
        await firstPostMayContinue;
      }
      await route.continue();
    });

    await openLandingPage(page);
    await page.getByTestId("note-input").fill(noteText);

    const created = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-submit").dblclick();
    releaseFirstPost();
    await created;

    await expect(listedNotes(page, noteText)).toHaveCount(1);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    expect(seenPosts).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(listedNotes(page, noteText)).toHaveCount(1);
  });

  test("a deliberate second save of the same text after the first completes stores a second note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("repeat save");
    await openLandingPage(page);

    for (const expectedCount of [1, 2]) {
      const created = page.waitForResponse(
        (response) =>
          isNotesApiRequest(response.request(), "POST") &&
          response.status() === 201,
      );
      await page.getByTestId("note-input").fill(noteText);
      await page.getByTestId("note-submit").click();
      await created;

      await expect(listedNotes(page, noteText)).toHaveCount(expectedCount);
      await expect(page.getByTestId("note-submit")).toBeEnabled();
    }
  });
});
