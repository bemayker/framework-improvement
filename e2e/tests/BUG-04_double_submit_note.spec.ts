import { randomUUID } from "node:crypto";
import { test, expect, type Page, type Request } from "@playwright/test";

const NOTES_PATH = "/api/notes";

/**
 * Matches the backend notes call on its exact path and method.
 *
 * A substring check on "/api/notes" is not enough: Vite serves the frontend
 * module `src/api/notes.ts` from a URL that contains the same substring.
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

type HeldCreate = {
  /** Resolves once the first `POST /api/notes` has reached the route handler. */
  firstRequestHeld: Promise<void>;
  /** Lets every held `POST /api/notes` continue to the real backend. */
  release: () => void;
};

/**
 * Holds every `POST /api/notes` on a promise gate, so a second submit lands
 * while the first save is provably still in flight. No fixed timeout: the
 * request is released only when the test calls `release`.
 */
async function holdCreateRequests(page: Page): Promise<HeldCreate> {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markHeld: () => void = () => {};
  const firstRequestHeld = new Promise<void>((resolve) => {
    markHeld = resolve;
  });

  await page.route(
    (url) => url.pathname === NOTES_PATH,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      markHeld();
      await gate;
      await route.continue();
    },
  );

  return { firstRequestHeld, release };
}

/** Counts the list items showing exactly `text`. */
function listItemsWithText(page: Page, text: string) {
  return page.getByTestId("note-list").getByText(text, { exact: true });
}

test.describe("BUG-04 double submit stores a note once", () => {
  test("stores a note only once when Save note is double-clicked", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double click");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const held = await holdCreateRequests(page);

    await page.getByTestId("note-input").fill(noteText);
    await page.getByTestId("note-submit").dblclick();
    await held.firstRequestHeld;
    await expect(page.getByTestId("note-submit")).toBeDisabled();

    const savedResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    held.release();
    await savedResponse;

    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
    await expect(page.getByTestId("note-submit")).toBeEnabled();
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
  });

  test("stores a note only once when Enter is pressed twice quickly", async ({
    page,
  }) => {
    const noteText = uniqueNoteText("double enter");
    await openLandingPage(page);
    const createRequests = recordCreateRequests(page);
    const held = await holdCreateRequests(page);

    const noteInput = page.getByTestId("note-input");
    await noteInput.fill(noteText);
    await noteInput.press("Enter");
    await held.firstRequestHeld;
    await noteInput.press("Enter");

    const savedResponse = page.waitForResponse(
      (response) =>
        isNotesApiRequest(response.request(), "POST") && response.status() === 201,
    );
    held.release();
    await savedResponse;

    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
    expect(createRequests).toHaveLength(1);

    const reloadedNotes = page.waitForResponse(
      (response) => isNotesApiRequest(response.request(), "GET") && response.ok(),
    );
    await page.reload();
    await reloadedNotes;

    await expect(listItemsWithText(page, noteText)).toHaveCount(1);
  });
});
