import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";

const NOTES_API_PATH = "/api/notes";
const DOCUMENT_MARKER = "TEST-03-document-marker";

/**
 * The dev database persists between runs and the specs run in parallel, so each
 * spec works with content no other spec or earlier run can have produced. That
 * is what keeps the specs independent of database state and of each other.
 */
function uniqueNoteContent(label: string): string {
  return `TEST-03 ${label} ${randomUUID()}`;
}

/** A marker on the current document: a full page load replaces it with undefined. */
interface MarkedWindow extends Window {
  __test03DocumentMarker?: string;
}

function isNoteCreation(method: string, url: string): boolean {
  return method === "POST" && new URL(url).pathname === NOTES_API_PATH;
}

function isNoteListFetch(method: string, url: string): boolean {
  return method === "GET" && new URL(url).pathname === NOTES_API_PATH;
}

/**
 * Opens the page and waits for the note list the page fetches on mount, so an
 * unreachable or misconfigured API fails here, named, instead of surfacing later
 * as an unexplained timeout on the note that was never created.
 */
async function openLandingPage(page: Page): Promise<void> {
  const noteListLoaded = page.waitForResponse(
    (response) =>
      isNoteListFetch(response.request().method(), response.url()) && response.status() === 200,
  );

  await page.goto("/");

  await noteListLoaded;
  await expect(page.getByTestId("note-form")).toBeVisible();
  await expect(page.getByTestId("notes-load-error")).toHaveCount(0);
}

/**
 * Submits the note through the form and returns the id the API assigned, so the
 * assertions can address the rendered note by its `data-testid` rather than by
 * matching text (locator precedence, testing_standards.md Section 1.3).
 */
async function addNoteThroughForm(page: Page, content: string): Promise<number> {
  const creation = page.waitForResponse((response) =>
    isNoteCreation(response.request().method(), response.url()),
  );

  await page.getByTestId("note-input").fill(content);
  await page.getByTestId("note-submit").click();

  const response = await creation;
  expect(response.status()).toBe(201);

  const createdNote = (await response.json()) as { id: number; content: string };
  expect(createdNote.content).toBe(content);
  return createdNote.id;
}

/** Records every note-creation request the page makes from this point on. */
async function trackNoteCreationRequests(page: Page): Promise<string[]> {
  const creationRequests: string[] = [];

  await page.route(`**${NOTES_API_PATH}`, async (route) => {
    const request = route.request();
    if (isNoteCreation(request.method(), request.url())) {
      creationRequests.push(request.url());
    }
    await route.continue();
  });

  return creationRequests;
}

test.describe("TEST-03 simple note form", () => {
  test.beforeEach(async ({ page }) => {
    await openLandingPage(page);
  });

  test("stores a submitted note and lists it without a full page reload", async ({ page }) => {
    await page.evaluate((marker) => {
      (window as MarkedWindow).__test03DocumentMarker = marker;
    }, DOCUMENT_MARKER);

    const content = uniqueNoteContent("stores");
    const noteId = await addNoteThroughForm(page, content);

    await expect(page.getByTestId(`note-list-item-${noteId}`)).toHaveText(content);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByTestId("note-validation-error")).toHaveCount(0);

    const markerAfterSubmit = await page.evaluate(
      () => (window as MarkedWindow).__test03DocumentMarker,
    );
    expect(markerAfterSubmit).toBe(DOCUMENT_MARKER);
  });

  test("rejects an empty note with a visible message and no API call", async ({ page }) => {
    const creationRequests = await trackNoteCreationRequests(page);
    const listedNotes = page.getByTestId("note-list").getByRole("listitem");
    const listedNotesBefore = await listedNotes.count();

    await page.getByTestId("note-submit").click();

    await expect(page.getByTestId("note-validation-error")).toBeVisible();
    expect(creationRequests).toEqual([]);
    await expect(listedNotes).toHaveCount(listedNotesBefore);
  });

  test("keeps a saved note after a page reload", async ({ page }) => {
    const content = uniqueNoteContent("persists");
    const noteId = await addNoteThroughForm(page, content);
    await expect(page.getByTestId(`note-list-item-${noteId}`)).toHaveText(content);

    await page.reload();

    await expect(page.getByTestId(`note-list-item-${noteId}`)).toHaveText(content);
  });

  test("rejects a whitespace-only note with a visible message and no API call", async ({ page }) => {
    const creationRequests = await trackNoteCreationRequests(page);

    await page.getByTestId("note-input").fill("   ");
    await page.getByTestId("note-submit").click();

    await expect(page.getByTestId("note-validation-error")).toBeVisible();
    expect(creationRequests).toEqual([]);
    // The typed text survives the rejection, so nothing the user wrote is lost.
    await expect(page.getByTestId("note-input")).toHaveValue("   ");
  });
});
