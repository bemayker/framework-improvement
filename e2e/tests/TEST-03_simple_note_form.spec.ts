import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_ENDPOINT = "/api/notes";
const VALIDATION_MESSAGE = "Note text is required";

/**
 * A note text that no other spec — and no earlier run — can produce. The specs
 * run in parallel against a persistent database, so every assertion targets
 * this spec's own note instead of relying on the list being empty or on a
 * specific development database state.
 */
function uniqueNoteText(label: string): string {
  return `TEST-03 ${label} ${Date.now()}-${randomUUID().slice(0, 8)}`;
}

/**
 * Matches the API endpoint on the exact path. A substring match would also
 * catch the dev server's own module request for `/src/api/notes.ts`, which is
 * not an API call at all.
 */
function isNotesApiUrl(url: string): boolean {
  return new URL(url).pathname === NOTES_ENDPOINT;
}

function isCreateNoteRequest(request: Request): boolean {
  return request.method() === "POST" && isNotesApiUrl(request.url());
}

function isListNotesRequest(request: Request): boolean {
  return request.method() === "GET" && isNotesApiUrl(request.url());
}

/**
 * Opens the app and waits for the initial GET /api/notes to have settled: the
 * list replaces the loading placeholder, so later interactions are not racing
 * the first render.
 */
async function openNotesPage(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByTestId("note-list")).toBeVisible();
}

async function submitNote(page: Page, text: string): Promise<void> {
  await page.getByTestId("note-input").fill(text);
  await page.getByTestId("note-submit").click();
}

/** Collects every create-note request the page issues from now on. */
function trackCreateNoteRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (isCreateNoteRequest(request)) {
      requests.push(request.url());
    }
  });
  return requests;
}

test.describe("TEST-03 simple note form", () => {
  test("stores a submitted note and shows it in the list without reloading the page", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("criterion 1");
    await openNotesPage(page);

    // A full page reload would navigate the main frame, so an empty list of
    // main-frame navigations is the evidence that the list updated in place.
    const mainFrameNavigations: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        mainFrameNavigations.push(frame.url());
      }
    });

    const createResponse = page.waitForResponse((response) =>
      isCreateNoteRequest(response.request()),
    );
    await submitNote(page, noteText);
    expect((await createResponse).status()).toBe(201);

    await expect(page.getByTestId("note-list")).toContainText(noteText);
    await expect(page.getByTestId("note-input")).toHaveValue("");
    expect(mainFrameNavigations).toEqual([]);
  });

  test("rejects an empty note with a visible message and sends no create request", async ({
    page,
  }) => {
    await openNotesPage(page);
    const createRequests = trackCreateNoteRequests(page);

    const list = page.getByTestId("note-list");
    const listBeforeSubmit = await list.textContent();

    await page.getByTestId("note-submit").click();

    await expect(page.getByTestId("note-error")).toHaveText(VALIDATION_MESSAGE);
    expect(createRequests).toEqual([]);
    expect(await list.textContent()).toBe(listBeforeSubmit);
  });

  test("keeps a saved note in the list after a full page reload", async ({ page }) => {
    const noteText = uniqueNoteText("criterion 3");
    await openNotesPage(page);

    const createResponse = page.waitForResponse((response) =>
      isCreateNoteRequest(response.request()),
    );
    await submitNote(page, noteText);
    expect((await createResponse).status()).toBe(201);

    // The reloaded page reads the note back from PostgreSQL through
    // GET /api/notes rather than from any client-side state.
    const listResponse = page.waitForResponse((response) =>
      isListNotesRequest(response.request()),
    );
    await page.reload();
    expect((await listResponse).status()).toBe(200);

    await expect(page.getByTestId("note-list")).toContainText(noteText);
  });

  test("rejects a whitespace-only note with a visible message and sends no create request", async ({
    page,
  }) => {
    await openNotesPage(page);
    const createRequests = trackCreateNoteRequests(page);

    await submitNote(page, "   ");

    await expect(page.getByTestId("note-error")).toHaveText(VALIDATION_MESSAGE);
    expect(createRequests).toEqual([]);
  });
});
