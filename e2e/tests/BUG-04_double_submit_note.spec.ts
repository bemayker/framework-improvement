import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method (a substring
 * check would also catch Vite's `src/api/notes.ts` module request, as in
 * TEST-03's spec).
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

/** Resolves once a successful `GET /api/notes` response arrives. */
function waitForNotesLoad(page: Page) {
  return page.waitForResponse(
    (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
  );
}

/** Resolves once the backend answers a create with 201. */
function waitForNoteCreated(page: Page) {
  return page.waitForResponse(
    (response) =>
      isNotesApiRequest(response.request(), "POST") && response.status() === 201,
  );
}

/** Waits for the mount `GET /api/notes` to settle before the test interacts. */
async function openLandingPage(page: Page): Promise<void> {
  const mountLoad = waitForNotesLoad(page);

  await page.goto("/");

  await mountLoad;
  await expect(page.getByTestId("note-form")).toBeVisible();
  await expect(page.getByTestId("note-list")).toBeAttached();
}

/**
 * Holds every `POST /api/notes` at the network layer until the returned
 * `release` is called, so the first save is provably still in flight while the
 * test submits a second time. Waiting on a gate instead of a timer keeps the
 * spec deterministic.
 */
async function holdCreateRequests(
  page: Page,
): Promise<{ release: () => void; createRequests: Request[] }> {
  const createRequests: Request[] = [];
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  page.on("request", (request) => {
    if (isNotesApiRequest(request, "POST")) {
      createRequests.push(request);
    }
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

  return { release, createRequests };
}

/** Asserts the note was stored once: listed once now and once after a reload. */
async function expectNoteListedOnce(page: Page, noteText: string): Promise<void> {
  const matchingItems = page
    .getByTestId("note-list")
    .getByRole("listitem")
    .filter({ hasText: noteText });

  await expect(matchingItems).toHaveCount(1);

  const reloadedNotes = waitForNotesLoad(page);
  await page.reload();
  await reloadedNotes;

  await expect(matchingItems).toHaveCount(1);
}

test.describe("BUG-04 double submit stores one note", () => {
  test("a double click on Save note while the save is in flight sends one request and stores one note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("dblclick");
    await openLandingPage(page);
    const { release, createRequests } = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();

    // The first save is still held, so the form must already refuse a submit.
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const createResponse = waitForNoteCreated(page);
    release();
    await createResponse;

    await expect(page.getByTestId("note-input")).toHaveValue("");
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(createRequests).toHaveLength(1);
    await expectNoteListedOnce(page, noteText);
  });

  test("pressing Enter twice in the note field while the save is in flight sends one request and stores one note", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("enter");
    await openLandingPage(page);
    const { release, createRequests } = await holdCreateRequests(page);

    const noteInput = page.getByTestId("note-input");
    await noteInput.fill(noteText);
    await noteInput.press("Enter");
    await expect(page.getByTestId("note-submit")).toBeDisabled();
    await noteInput.press("Enter");

    const createResponse = waitForNoteCreated(page);
    release();
    await createResponse;

    await expect(noteInput).toHaveValue("");
    expect(createRequests).toHaveLength(1);
    await expectNoteListedOnce(page, noteText);
  });
});
