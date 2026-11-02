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
 * a test never interacts with a list that is still loading (a late mount
 * response replaces the whole notes state and would drop a note added first).
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

/** Resolves with the note the backend stored for the first successful create. */
function waitForCreatedNote(page: Page): Promise<CreatedNote> {
  return page
    .waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    )
    .then((response) => response.json() as Promise<CreatedNote>);
}

/** Reloads the page and waits until the notes list has been fetched again. */
async function reloadAndWaitForList(page: Page): Promise<void> {
  const reloadedNotes = page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );
  await page.reload();
  await reloadedNotes;
  await expect(page.getByTestId("note-list")).toBeAttached();
}

test.describe("BUG-04 double submit of a note", () => {
  test("a double click on Save note stores the note once, now and after a reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const createdNote = waitForCreatedNote(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    expect((await createdNote).text).toBe(noteText);

    const noteList = page.getByTestId("note-list");
    await expect(noteList.getByText(noteText)).toHaveCount(1);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    expect(createRequests).toHaveLength(1);

    await reloadAndWaitForList(page);

    await expect(noteList.getByText(noteText)).toHaveCount(1);
  });

  test("pressing Enter right after a click does not store the note a second time", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("click then enter");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const createdNote = waitForCreatedNote(page);

    const noteInput = page.getByTestId("note-input");
    await noteInput.fill(noteText);
    await page.getByTestId("note-submit").click();
    await noteInput.press("Enter");

    expect((await createdNote).text).toBe(noteText);

    const noteList = page.getByTestId("note-list");
    await expect(noteList.getByText(noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    await reloadAndWaitForList(page);

    await expect(noteList.getByText(noteText)).toHaveCount(1);
  });
});
