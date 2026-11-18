import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

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

/** Opens the landing page and waits for the mount list load to settle. */
async function openLandingPage(page: Page): Promise<void> {
  const mountLoad = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );

  await page.goto("/");

  await mountLoad;
  await expect(page.getByTestId("note-form")).toBeVisible();
  await expect(page.getByTestId("note-list")).toBeAttached();
}

/**
 * Holds every `POST /api/notes` until `release` is called, so the first save is
 * still pending when the second click lands. Returns the POSTs seen so far.
 */
async function holdCreateRequests(
  page: Page,
): Promise<{ posts: Request[]; release: () => void }> {
  const posts: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      posts.push(route.request());
      await released;
      await route.continue();
    },
  );

  return { posts, release };
}

test.describe("BUG-04 double submit of a note", () => {
  test("stores a double-clicked note only once", async ({ page }) => {
    const noteText = uniqueNoteText("double");
    await openLandingPage(page);
    const { posts, release } = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    // The button is disabled for the whole pending save.
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    release();
    await createResponse;

    const savedItems = page.getByTestId(/^note-list-item-/).filter({
      hasText: noteText,
    });
    await expect(savedItems).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(posts).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;
    await expect(savedItems).toHaveCount(1);
  });

  test("saves the same text again after the first save finished", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("again");
    await openLandingPage(page);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const createResponse = page.waitForResponse(
        (response) =>
          isNotesApiRequest(response.request(), "POST") &&
          response.status() === 201,
      );
      await page.getByTestId("note-input").fill(noteText);
      await page.getByTestId("note-submit").click();
      await createResponse;
      await expect(page.getByTestId("note-submit")).toBeEnabled();
    }

    await expect(
      page.getByTestId(/^note-list-item-/).filter({ hasText: noteText }),
    ).toHaveCount(2);
  });
});
