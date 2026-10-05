import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";
// Long enough that a second activation always lands while the first save is in
// flight, independent of how fast the backend answers.
const POST_DELAY_MS = 500;

/**
 * Matches the backend notes call on its exact path and method (a substring check
 * would also catch Vite's `src/api/notes.ts` module request).
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

/** Holds every `POST /api/notes` for a moment before letting it through. */
async function delayCreateRequests(page: Page): Promise<void> {
  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((resolve) => setTimeout(resolve, POST_DELAY_MS));
      }
      await route.continue();
    },
  );
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

function listedCopies(page: Page, text: string) {
  return page.getByTestId("note-list").getByText(text, { exact: true });
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double-click on Save note stores the note exactly once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("dblclick");
    await delayCreateRequests(page);
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();
    await createResponse;

    await expect(listedCopies(page, noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(listedCopies(page, noteText)).toHaveCount(1);
  });

  test("pressing Enter twice while the save is in flight stores the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter");
    await delayCreateRequests(page);
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    const input = page.getByTestId("note-input");
    await input.fill(noteText);
    await input.press("Enter");
    await input.press("Enter");
    await createResponse;

    await expect(listedCopies(page, noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);
  });
});
