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

/** Opens the landing page and waits for the mount `GET /api/notes` to settle. */
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
 * Holds every `POST /api/notes` until `release()` is called, and records each
 * one. Holding the request open makes "quickly" deterministic: both submit
 * events are dispatched while the first save is still in flight.
 */
async function holdCreateRequests(page: Page): Promise<{
  createRequests: Request[];
  release: () => void;
}> {
  const createRequests: Request[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      const request = route.request();
      if (!isNotesApiRequest(request, "POST")) {
        await route.continue();
        return;
      }
      createRequests.push(request);
      await released;
      await route.continue();
    },
  );

  return { createRequests, release };
}

/**
 * Releases the held save, then asserts the note was stored exactly once: one
 * POST, one list item, and still one list item after a reload.
 */
async function expectStoredOnce(
  page: Page,
  noteText: string,
  createRequests: Request[],
  release: () => void,
): Promise<void> {
  const createResponse = page.waitForResponse(
    (response) =>
      isNotesApiRequest(response.request(), "POST") && response.status() === 201,
  );
  release();
  await createResponse;

  const matchingItems = page
    .getByTestId(/^note-list-item-/)
    .filter({ hasText: noteText });

  await expect(matchingItems).toHaveCount(1);
  await expect(page.getByTestId("note-input")).toHaveValue("");
  expect(createRequests).toHaveLength(1);

  const reloadedNotes = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );
  await page.reload();
  await reloadedNotes;

  await expect(matchingItems).toHaveCount(1);
}

test.describe("BUG-04 double submit of the note form", () => {
  test("double-clicking Save note stores the note exactly once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const { createRequests, release } = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    await expectStoredOnce(page, noteText, createRequests, release);
  });

  test("pressing Enter twice quickly stores the note exactly once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter twice");
    await openLandingPage(page);
    const { createRequests, release } = await holdCreateRequests(page);

    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");
    await input.press("Enter");

    await expectStoredOnce(page, noteText, createRequests, release);
  });
});
