import { test, expect } from "@playwright/test";
import type { Page, Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";
const EMPTY_NOTE_MESSAGE = "Enter some text before saving a note.";
const NO_RELOAD_MARKER = "__test03NoReloadMarker";

/**
 * The notes table persists across specs and across runs, and the list renders
 * every stored note, so no spec may assert on list length, emptiness, or a
 * fixed row. Each spec instead works with text no other spec or run can
 * produce (testing_standards.md Section 1.3, deterministic data + isolation).
 */
function uniqueNoteText(label: string): string {
  return `TEST-03 ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * True only for a call to the backend notes endpoint. Matching on the exact
 * path rather than a substring matters: the Vite dev server serves the
 * frontend's own API client module at `/src/api/notes.ts`, which contains the
 * endpoint path as a substring and answers a reload with 304.
 */
function isNotesApiUrl(url: string): boolean {
  return new URL(url).pathname === NOTES_PATH;
}

/** Records every POST to the notes endpoint from the moment it is attached. */
function recordNoteCreateRequests(page: Page): Request[] {
  const requests: Request[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && isNotesApiUrl(request.url())) {
      requests.push(request);
    }
  });
  return requests;
}

/**
 * Marks the current document. A full page reload replaces the window, so the
 * marker disappearing is proof the page navigated.
 */
async function markCurrentDocument(page: Page): Promise<void> {
  await page.evaluate((marker) => {
    (window as unknown as Record<string, boolean>)[marker] = true;
  }, NO_RELOAD_MARKER);
}

async function currentDocumentIsUnchanged(page: Page): Promise<boolean> {
  return page.evaluate(
    (marker) => (window as unknown as Record<string, boolean>)[marker] === true,
    NO_RELOAD_MARKER,
  );
}

test.describe("TEST-03 simple note form", () => {
  test("AC1: submitting a non-empty note stores it and shows it in the list without a page reload", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("ac1");

    await page.goto("/");
    await markCurrentDocument(page);

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiUrl(response.url()) && response.request().method() === "POST",
    );

    await page.getByTestId("note-form-input").fill(noteText);
    await page.getByTestId("note-form-submit").click();

    // The note is stored: the backend answered the create call with 201.
    expect((await createResponse).status()).toBe(201);

    // The note appears in the on-page list...
    await expect(page.getByTestId("note-list")).toContainText(noteText);
    // ...and the document was never replaced, so no full page reload happened.
    expect(await currentDocumentIsUnchanged(page)).toBe(true);

    // A successful submit clears the input and surfaces no error.
    await expect(page.getByTestId("note-form-input")).toHaveValue("");
    await expect(page.getByTestId("note-form-error")).toHaveCount(0);
    await expect(page.getByTestId("notes-error")).toHaveCount(0);
  });

  test("AC2: submitting an empty note shows a validation message and fires no API call", async ({
    page,
  }) => {
    await page.goto("/");
    const createRequests = recordNoteCreateRequests(page);

    const listItems = page.getByTestId("note-list").locator("li");
    const itemsBefore = await listItems.count();

    await page.getByTestId("note-form-submit").click();

    const validationMessage = page.getByTestId("note-form-error");
    await expect(validationMessage).toBeVisible();
    await expect(validationMessage).toHaveText(EMPTY_NOTE_MESSAGE);

    // The submit handler either fires the create call or shows this message in
    // the same tick, so the message being present is the point at which the
    // absence of a request is decidable: no waiting on a timeout needed.
    expect(createRequests).toHaveLength(0);
    await expect(listItems).toHaveCount(itemsBefore);
    // No API call means no API failure, so the API error line must stay absent.
    await expect(page.getByTestId("notes-error")).toHaveCount(0);
  });

  test("AC3: a saved note is still listed after a page reload", async ({ page }) => {
    const noteText = uniqueNoteText("ac3");

    await page.goto("/");

    const createResponse = page.waitForResponse(
      (response) =>
        isNotesApiUrl(response.url()) && response.request().method() === "POST",
    );
    await page.getByTestId("note-form-input").fill(noteText);
    await page.getByTestId("note-form-submit").click();
    expect((await createResponse).status()).toBe(201);
    await expect(page.getByTestId("note-list")).toContainText(noteText);

    const listResponse = page.waitForResponse(
      (response) =>
        isNotesApiUrl(response.url()) && response.request().method() === "GET",
    );
    await page.reload();

    // The reloaded page holds nothing in memory: the note comes back from the
    // database through GET /api/notes.
    expect((await listResponse).status()).toBe(200);
    await expect(page.getByTestId("note-list")).toContainText(noteText);
  });

  test("edge case: a whitespace-only note is rejected exactly like an empty one", async ({
    page,
  }) => {
    await page.goto("/");
    const createRequests = recordNoteCreateRequests(page);

    const listItems = page.getByTestId("note-list").locator("li");
    const itemsBefore = await listItems.count();

    const input = page.getByTestId("note-form-input");
    await input.fill("   ");
    await page.getByTestId("note-form-submit").click();

    const validationMessage = page.getByTestId("note-form-error");
    await expect(validationMessage).toBeVisible();
    await expect(validationMessage).toHaveText(EMPTY_NOTE_MESSAGE);

    expect(createRequests).toHaveLength(0);
    await expect(listItems).toHaveCount(itemsBefore);
    // A rejected submit keeps what the user typed rather than clearing it.
    await expect(input).toHaveValue("   ");
  });
});
