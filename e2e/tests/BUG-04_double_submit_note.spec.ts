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
 * Holds every `POST /api/notes` at the browser until the returned function is
 * called, so the save is deterministically still in flight when the second
 * click of a double click lands, however fast the backend answers.
 */
async function holdCreateResponses(page: Page): Promise<() => void> {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() === "POST") {
        await gate;
      }
      await route.continue();
    },
  );

  return release;
}

function listItemsWithText(page: Page, text: string) {
  return page.getByTestId(/^note-list-item-/).filter({ hasText: text });
}

test.describe("BUG-04 double submit of a note", () => {
  test("double-clicking Save stores and lists the note exactly once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("once");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const releaseCreate = await holdCreateResponses(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();
    releaseCreate();

    const createdNote = (await (await createResponse).json()) as CreatedNote;
    expect(createdNote.text).toBe(noteText);

    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
  });

  test("sends a single create request when the form is submitted twice before the save finishes", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("single request");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const releaseCreate = await holdCreateResponses(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    );

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    // Both clicks are done and the response is still held: the form is busy.
    await expect(page.getByTestId("note-submit")).toBeDisabled();
    expect(createRequests).toHaveLength(1);

    releaseCreate();
    await createResponse;

    await expect(page.getByTestId("note-submit")).toBeEnabled();
    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);
  });
});
