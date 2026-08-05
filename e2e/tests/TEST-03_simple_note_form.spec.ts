import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";
const NO_RELOAD_MARKER = "__test03NoReloadMarker";

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
  return `TEST-03 ${label} ${randomUUID().slice(0, 8)}`;
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
  // Attached rather than visible: an empty note list renders as a `<ul>` with no
  // layout box, which Playwright reports as hidden.
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

/** Submits `text` and returns the note the backend stored. */
async function submitNote(page: Page, text: string): Promise<CreatedNote> {
  const createResponse = page.waitForResponse(
    (response) =>
      isNotesApiRequest(response.request(), "POST") && response.status() === 201,
  );

  await page.getByTestId("note-input").fill(text);
  await page.getByTestId("note-submit").click();

  return (await (await createResponse).json()) as CreatedNote;
}

test.describe("TEST-03 simple note form", () => {
  test("stores a submitted note and shows it in the list without reloading the page", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("stores");
    await openLandingPage(page);

    // Survives only while this document does, so it proves no full page reload
    // happened between the submit and the note appearing.
    await page.evaluate(
      (marker) => Object.assign(window, { [marker]: true }),
      NO_RELOAD_MARKER,
    );

    const createdNote = await submitNote(page, noteText);
    expect(createdNote.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${createdNote.id}`)).toHaveText(
      noteText,
    );
    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByTestId("note-form-error")).toHaveCount(0);

    const documentSurvived = await page.evaluate(
      (marker) => (window as unknown as Record<string, unknown>)[marker] === true,
      NO_RELOAD_MARKER,
    );
    expect(documentSurvived).toBe(true);
  });

  test("rejects an empty note with a visible validation message and no API call", async ({
    page,
  }) => {
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    await page.getByTestId("note-submit").click();

    const validationMessage = page.getByTestId("note-form-error");
    await expect(validationMessage).toBeVisible();
    await expect(validationMessage).not.toBeEmpty();
    expect(createRequests).toHaveLength(0);
  });

  test("keeps a saved note after a page reload", async ({ page }) => {
    const noteText = uniqueNoteText("persists");
    await openLandingPage(page);

    const createdNote = await submitNote(page, noteText);
    const savedNoteItem = page.getByTestId(`note-list-item-${createdNote.id}`);
    await expect(savedNoteItem).toHaveText(noteText);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(savedNoteItem).toHaveText(noteText);
  });

  test("treats a whitespace-only note as empty and sends no API call", async ({
    page,
  }) => {
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);

    await page.getByTestId("note-input").fill("   ");
    await page.getByTestId("note-submit").click();

    const validationMessage = page.getByTestId("note-form-error");
    await expect(validationMessage).toBeVisible();
    await expect(validationMessage).not.toBeEmpty();
    expect(createRequests).toHaveLength(0);
  });
});
