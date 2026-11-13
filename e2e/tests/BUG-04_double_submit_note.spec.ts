import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method.
 *
 * A substring check on "/api/notes" is not enough: Vite serves the frontend
 * module `src/api/notes.ts` from a URL that contains the same substring, so a
 * substring matcher catches the module fetch instead of the API call.
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
 * a test never interacts with a list that is still loading.
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

/** Collects every `POST /api/notes` the page issues from now on. */
function recordCreateRequests(page: Page): Request[] {
  const createRequests: Request[] = [];

  page.on("request", (request) => {
    if (isNotesApiRequest(request, "POST")) {
      createRequests.push(request);
    }
  });

  return createRequests;
}

/**
 * Holds every `POST /api/notes` until the returned `release` is called, then
 * lets it through to the real backend. Holding the first request keeps the
 * save "in progress" for as long as the test needs, with no fixed wait.
 */
async function holdCreateRequests(page: Page): Promise<() => void> {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await released;
      await route.continue();
    },
  );

  return release;
}

/** The list entries that show exactly `text`. */
function listEntries(page: Page, text: string) {
  return page.getByTestId("note-list").locator("li", { hasText: text });
}

test.describe("BUG-04 double submit stores a note once", () => {
  test("stores a double-clicked note only once", async ({ page }) => {
    const noteText = uniqueNoteText("double");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const releaseSave = await holdCreateRequests(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    // One dblclick dispatches both clicks back to back without Playwright's
    // actionability wait in between, so the second submit reaches the form
    // while the first save is still pending (its request is held above). Two
    // separate `click()` calls would wait for the button to become enabled
    // again and never exercise the guard.
    await page.getByTestId("note-submit").dblclick();
    releaseSave();
    await createResponse;

    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(listEntries(page, noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    // "Stored once" is a claim about the database: the mount GET after a
    // reload reads it back.
    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(listEntries(page, noteText)).toHaveCount(1);
  });

  test("saves a second distinct note after a double-clicked save", async ({
    page,
  }) => {
    const firstText = uniqueNoteText("first");
    const secondText = uniqueNoteText("second");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const releaseSave = await holdCreateRequests(page);

    const firstResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(firstText);
    await page.getByTestId("note-submit").dblclick();
    releaseSave();
    await firstResponse;
    await expect(listEntries(page, firstText)).toHaveCount(1);

    // The hold is released for good, so the next save goes straight through.
    const secondResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(secondText);
    await page.getByTestId("note-submit").click();
    await secondResponse;

    await expect(listEntries(page, firstText)).toHaveCount(1);
    await expect(listEntries(page, secondText)).toHaveCount(1);
    expect(createRequests).toHaveLength(2);
  });
});
