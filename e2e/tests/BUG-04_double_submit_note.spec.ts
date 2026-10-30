import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request, type Route } from "@playwright/test";

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
 * Holds every `POST /api/notes` open until `release()` is called, and counts
 * how many were sent.
 *
 * Without the hold, a fast localhost backend can answer the first POST between
 * the two user actions, which would pass the test even with no guard in place.
 * Holding the response makes the in-flight window deterministic.
 */
async function holdCreateRequests(page: Page): Promise<{
  postCount: () => number;
  firstPostSeen: Promise<void>;
  release: () => void;
}> {
  let sent = 0;
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markFirstPostSeen: () => void = () => {};
  const firstPostSeen = new Promise<void>((resolve) => {
    markFirstPostSeen = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route: Route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      sent += 1;
      markFirstPostSeen();
      await released;
      await route.continue();
    },
  );

  return { postCount: () => sent, firstPostSeen, release };
}

/** Asserts the note is stored exactly once: in the list, and again after a reload. */
async function expectStoredOnce(page: Page, noteText: string): Promise<void> {
  const matchingItems = page
    .getByTestId(/^note-list-item-/)
    .filter({ hasText: noteText });
  await expect(matchingItems).toHaveCount(1);

  const reloadedNotes = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );
  await page.reload();
  await reloadedNotes;

  await expect(matchingItems).toHaveCount(1);
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double-click on Save note sends one POST and stores one note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const create = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );
    await page.getByTestId("note-submit").dblclick();
    await create.firstPostSeen;

    create.release();
    await createResponse;

    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expectStoredOnce(page, noteText);
    expect(create.postCount()).toBe(1);
  });

  test("pressing Enter twice in the input sends one POST and stores one note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double enter");
    await openLandingPage(page);
    const create = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );
    await page.getByTestId("note-input").press("Enter");
    await create.firstPostSeen;
    // The first save is still held open: this second Enter lands in the window
    // the bug lives in.
    await page.getByTestId("note-input").press("Enter");

    create.release();
    await createResponse;

    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expectStoredOnce(page, noteText);
    expect(create.postCount()).toBe(1);
  });
});
