import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

type CreatedNote = {
  id: number;
  text: string;
};

/**
 * Matches the backend notes call on its exact path and method (a substring
 * check would also catch Vite's `src/api/notes.ts` module request).
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
 * Holds every `POST /api/notes` at the browser until `release` is called, which
 * keeps the first save in flight while the test submits again.
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
        await route.continue();
        return;
      }
      await released;
      await route.continue();
    },
  );

  return release;
}

/** Waits for the stored note's 201 response and returns the note. */
function waitForCreatedNote(page: Page): Promise<CreatedNote> {
  return page
    .waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") &&
        response.status() === 201,
    )
    .then((response) => response.json() as Promise<CreatedNote>);
}

function noteItemsWithText(page: Page, text: string) {
  return page.getByTestId(/^note-list-item-/).filter({ hasText: text });
}

test.describe("BUG-04 double submit stores the note once", () => {
  test("a double-click on Save note while the save is pending sends one request and lists the note once", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const release = await holdCreateRequests(page);
    const createdNote = waitForCreatedNote(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();
    release();

    const stored = await createdNote;
    expect(stored.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${stored.id}`)).toHaveText(
      noteText,
    );
    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
  });

  test("pressing Enter in the field right after clicking Save note while the save is pending sends one request", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("click then enter");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const release = await holdCreateRequests(page);
    const createdNote = waitForCreatedNote(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").click();
    await page.getByTestId("note-input").press("Enter");
    release();

    const stored = await createdNote;
    expect(stored.text).toBe(noteText);

    await expect(page.getByTestId(`note-list-item-${stored.id}`)).toHaveText(
      noteText,
    );
    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(noteItemsWithText(page, noteText)).toHaveCount(1);
  });
});
